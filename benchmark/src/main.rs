use futures::{future, StreamExt};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tokio::sync::mpsc;
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};
use url::Url;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::sync::atomic::{AtomicUsize, Ordering};
use env_logger;
use log::{info, error, warn};

// Structure pour les options du benchmark
#[derive(Clone)]
struct BenchmarkOptions {
    url: String,
    connections: usize,
    requests_per_connection: usize,
    request_interval_ms: u64,
    message_type: i32,
    message_data: Value,
    ramp_up_time_ms: u64,
}

// Structure pour les résultats du benchmark
#[derive(Serialize, Deserialize, Clone)]
struct BenchmarkResults {
    total_requests: usize,
    successful_requests: usize,
    failed_requests: usize,
    average_latency_ms: f64,
    min_latency_ms: f64,
    max_latency_ms: f64,
    requests_per_second: f64,
    total_time_ms: f64,
    error_rates: HashMap<String, usize>,
}

// Structure pour suivre les requêtes en attente
struct PendingRequest {
    timestamp: Instant,
    responded: bool,
}

// Structure principale du benchmark
struct WebSocketBenchmark {
    options: BenchmarkOptions,
    results: Arc<Mutex<BenchmarkResults>>,
    active_connections: Arc<AtomicUsize>,
    completed_connections: Arc<AtomicUsize>,
    pending_responses: Arc<Mutex<HashMap<String, PendingRequest>>>,
    latencies: Arc<Mutex<Vec<f64>>>,
    errors: Arc<Mutex<HashMap<String, usize>>>,
    start_time: Arc<Mutex<Option<Instant>>>,
    end_time: Arc<Mutex<Option<Instant>>>,
    message_id: Arc<AtomicUsize>,
}

impl WebSocketBenchmark {
    fn new(options: BenchmarkOptions) -> Self {
        let results = BenchmarkResults {
            total_requests: 0,
            successful_requests: 0,
            failed_requests: 0,
            average_latency_ms: 0.0,
            min_latency_ms: f64::INFINITY,
            max_latency_ms: 0.0,
            requests_per_second: 0.0,
            total_time_ms: 0.0,
            error_rates: HashMap::new(),
        };

        WebSocketBenchmark {
            options,
            results: Arc::new(Mutex::new(results)),
            active_connections: Arc::new(AtomicUsize::new(0)),
            completed_connections: Arc::new(AtomicUsize::new(0)),
            pending_responses: Arc::new(Mutex::new(HashMap::new())),
            latencies: Arc::new(Mutex::new(Vec::new())),
            errors: Arc::new(Mutex::new(HashMap::new())),
            start_time: Arc::new(Mutex::new(None)),
            end_time: Arc::new(Mutex::new(None)),
            message_id: Arc::new(AtomicUsize::new(0)),
        }
    }

    async fn run(&self) -> BenchmarkResults {
        info!("Starting benchmark with {} connections and {} requests per connection", 
              self.options.connections, self.options.requests_per_connection);
        
        // Enregistrer le temps de départ
        {
            let mut start = self.start_time.lock().unwrap();
            *start = Some(Instant::now());
        }

        // Calcul pour le ramp-up
        let connections_per_batch = (self.options.connections + 9) / 10;
        let batch_delay_ms = self.options.ramp_up_time_ms / 10;

        // Rapport de progression périodique
        let active_connections = self.active_connections.clone();
        let completed_connections = self.completed_connections.clone();
        let total_connections = self.options.connections;
        
        let progress_handle = tokio::spawn(async move {
            let mut last_reported = 0;
            loop {
                tokio::time::sleep(Duration::from_secs(2)).await;
                let current_active = active_connections.load(Ordering::Relaxed);
                let completed = completed_connections.load(Ordering::Relaxed);
                let new_connections = current_active.saturating_sub(last_reported);
                
                info!("Active connections: {} (+{}), Completed: {}/{}", 
                     current_active, new_connections, completed, total_connections);
                
                last_reported = current_active;
                
                if completed >= total_connections {
                    break;
                }
            }
        });

        // Créer des connexions par lots
        let mut batch_futures = Vec::new();
        for i in 0..self.options.connections {
            let conn_future = self.create_connection(i);
            batch_futures.push(conn_future);
            
            // Si c'est la fin d'un lot ou la dernière connexion
            if (i + 1) % connections_per_batch == 0 || i == self.options.connections - 1 {
                // Lancer le lot en parallèle
                let batch_clone = batch_futures.clone();
                tokio::spawn(async move {
                    future::join_all(batch_clone).await;
                });
                
                batch_futures.clear();
                
                // Attendre avant de lancer le prochain lot (sauf pour le dernier)
                if i < self.options.connections - 1 {
                    tokio::time::sleep(Duration::from_millis(batch_delay_ms)).await;
                }
            }
        }

        // Attendre que toutes les connexions soient terminées
        let completed_connections = self.completed_connections.clone();
        let total_connections = self.options.connections;
        let end_time = self.end_time.clone();

        while completed_connections.load(Ordering::Relaxed) < total_connections {
            tokio::time::sleep(Duration::from_millis(100)).await;
        }

        // Enregistrer le temps de fin
        {
            let mut end = end_time.lock().unwrap();
            *end = Some(Instant::now());
        }

        // Calculer les résultats
        self.calculate_results();
        progress_handle.abort();

        // Retourner une copie des résultats
        self.results.lock().unwrap().clone()
    }

    async fn create_connection(&self, connection_id: usize) -> Result<(), Box<dyn std::error::Error>> {
        let ws_url = Url::parse(&self.options.url)?;
        let active_connections = self.active_connections.clone();
        let completed_connections = self.completed_connections.clone();
        let pending_responses = self.pending_responses.clone();
        let latencies = self.latencies.clone();
        let errors = self.errors.clone();
        let results = self.results.clone();
        let message_id = self.message_id.clone();
        let options = self.options.clone();

        // Créer un canal pour communiquer entre les différentes parties du traitement de WebSocket
        let (tx, mut rx) = mpsc::channel::<Message>(100);
        let tx_clone = tx.clone();

        tokio::spawn(async move {
            // Connexion au serveur WebSocket
            let connection = match connect_async(ws_url).await {
                Ok((ws_stream, _)) => {
                    active_connections.fetch_add(1, Ordering::SeqCst);
                    ws_stream
                },
                Err(e) => {
                    error!("Connection {} error: {}", connection_id, e);
                    Self::record_error(errors.clone(), "ConnectionError");
                    completed_connections.fetch_add(1, Ordering::SeqCst);
                    return;
                }
            };

            // Diviser le flux WebSocket en lecteur et écriveur
            let (mut write, mut read) = connection.split();

            // Message d'identification
            let identify_msg = json!({
                "op": 2,
                "d": {
                    "username": format!("benchmark_user_{}", connection_id),
                    "isVoiceChat": false
                }
            });

            // Envoyer le message d'identification
            if let Err(e) = write.send(Message::Text(identify_msg.to_string())).await {
                error!("Failed to send identify message: {}", e);
                Self::record_error(errors.clone(), "SendError");
                completed_connections.fetch_add(1, Ordering::SeqCst);
                return;
            }

            // Gestion des messages reçus
            let mut is_authenticated = false;
            let mut messages_received = 0;
            let read_handle = tokio::spawn(async move {
                while let Some(msg_result) = read.next().await {
                    match msg_result {
                        Ok(msg) => {
                            if let Message::Text(text) = msg {
                                match serde_json::from_str::<Value>(&text) {
                                    Ok(json_msg) => {
                                        let op = json_msg["op"].as_i64().unwrap_or(0);
                                        
                                        match op {
                                            10 => { // Hello
                                                if let Some(heartbeat_interval) = json_msg["d"]["heartbeat_interval"].as_u64() {
                                                    // Configurer le heartbeat
                                                    let tx_hb = tx_clone.clone();
                                                    tokio::spawn(async move {
                                                        loop {
                                                            let heartbeat = json!({
                                                                "op": 1,
                                                                "d": {}
                                                            });
                                                            
                                                            if tx_hb.send(Message::Text(heartbeat.to_string())).await.is_err() {
                                                                break;
                                                            }
                                                            
                                                            tokio::time::sleep(Duration::from_millis(heartbeat_interval)).await;
                                                        }
                                                    });
                                                }
                                            },
                                            2 => { // Authentication response
                                                if json_msg["d"]["uuid"].is_string() {
                                                    is_authenticated = true;
                                                    
                                                    // Commencer à envoyer les messages de benchmark
                                                    Self::start_sending_benchmark_messages(
                                                        tx_clone.clone(), 
                                                        connection_id, 
                                                        message_id.clone(),
                                                        pending_responses.clone(),
                                                        results.clone(),
                                                        options.clone()
                                                    ).await;
                                                }
                                            },
                                            _ => {
                                                // Traiter la réponse
                                                Self::process_response(
                                                    json_msg, 
                                                    pending_responses.clone(),
                                                    latencies.clone(),
                                                    results.clone()
                                                );
                                                
                                                messages_received += 1;
                                                
                                                // Vérifier si cette connexion a terminé son travail
                                                if messages_received >= options.requests_per_connection {
                                                    break;
                                                }
                                            }
                                        }
                                    },
                                    Err(_) => {
                                        Self::record_error(errors.clone(), "MessageParseError");
                                    }
                                }
                            }
                        },
                        Err(e) => {
                            error!("Error reading message: {}", e);
                            Self::record_error(errors.clone(), "ReadError");
                            break;
                        }
                    }
                }
            });

            // Gestionnaire d'envoi de messages
            let write_handle = tokio::spawn(async move {
                while let Some(msg) = rx.recv().await {
                    if let Err(e) = write.send(msg).await {
                        error!("Error sending message: {}", e);
                        Self::record_error(errors.clone(), "SendError");
                        break;
                    }
                }
            });

            // Attendre la fin des tâches
            let _ = tokio::join!(read_handle, write_handle);
            
            // Marquer cette connexion comme terminée
            active_connections.fetch_sub(1, Ordering::SeqCst);
            completed_connections.fetch_add(1, Ordering::SeqCst);
        });

        Ok(())
    }

    async fn start_sending_benchmark_messages(
        tx: mpsc::Sender<Message>, 
        connection_id: usize, 
        message_id: Arc<AtomicUsize>,
        pending_responses: Arc<Mutex<HashMap<String, PendingRequest>>>,
        results: Arc<Mutex<BenchmarkResults>>,
        options: BenchmarkOptions
    ) {
        let mut sent_count = 0;
        
        while sent_count < options.requests_per_connection {
            // Créer un ID de message unique pour le suivi
            let msg_id = format!("{}_{}", connection_id, message_id.fetch_add(1, Ordering::SeqCst));
            
            // Créer le message de benchmark
            let message = json!({
                "op": options.message_type,
                "d": {
                    "user": options.message_data["user"],
                    "text": options.message_data["text"],
                    "benchmarkId": msg_id,
                    "timestamp": chrono::Utc::now().timestamp_millis()
                }
            });
            
            // Suivre quand le message a été envoyé
            {
                let mut pending = pending_responses.lock().unwrap();
                pending.insert(msg_id.clone(), PendingRequest {
                    timestamp: Instant::now(),
                    responded: false,
                });
            }
            
            // Envoyer le message
            match tx.send(Message::Text(message.to_string())).await {
                Ok(_) => {
                    sent_count += 1;
                    {
                        let mut r = results.lock().unwrap();
                        r.total_requests += 1;
                    }
                },
                Err(e) => {
                    error!("Failed to send benchmark message: {}", e);
                    // Record error
                    Self::record_error(Arc::new(Mutex::new(HashMap::new())), "SendError");
                    break;
                }
            }
            
            // Attendre avant d'envoyer le message suivant
            tokio::time::sleep(Duration::from_millis(options.request_interval_ms)).await;
        }
    }

    fn process_response(
        response: Value, 
        pending_responses: Arc<Mutex<HashMap<String, PendingRequest>>>,
        latencies: Arc<Mutex<Vec<f64>>>,
        results: Arc<Mutex<BenchmarkResults>>
    ) {
        // Vérifier si c'est une réponse à l'un de nos messages de benchmark
        if let Some(benchmark_id) = response["d"]["benchmarkId"].as_str() {
            let mut pending = pending_responses.lock().unwrap();
            
            if let Some(req) = pending.get_mut(benchmark_id) {
                if !req.responded {
                    let latency = req.timestamp.elapsed().as_secs_f64() * 1000.0;
                    
                    // Ajouter la latence à notre liste
                    {
                        let mut lat = latencies.lock().unwrap();
                        lat.push(latency);
                    }
                    
                    // Incrémenter le nombre de requêtes réussies
                    {
                        let mut r = results.lock().unwrap();
                        r.successful_requests += 1;
                    }
                    
                    req.responded = true;
                }
            }
        }
    }

    fn record_error(errors: Arc<Mutex<HashMap<String, usize>>>, error_type: &str) {
        let mut errs = errors.lock().unwrap();
        *errs.entry(error_type.to_string()).or_insert(0) += 1;
    }

    fn calculate_results(&self) {
        let start = self.start_time.lock().unwrap();
        let end = self.end_time.lock().unwrap();
        let latencies = self.latencies.lock().unwrap();
        let errors = self.errors.lock().unwrap();
        
        let mut results = self.results.lock().unwrap();
        
        if let (Some(start_time), Some(end_time)) = (*start, *end) {
            results.total_time_ms = end_time.duration_since(start_time).as_secs_f64() * 1000.0;
            results.requests_per_second = (results.successful_requests as f64) / (results.total_time_ms / 1000.0);
        }
        
        if !latencies.is_empty() {
            results.average_latency_ms = latencies.iter().sum::<f64>() / latencies.len() as f64;
            results.min_latency_ms = *latencies.iter().min_by(|a, b| a.partial_cmp(b).unwrap()).unwrap_or(&0.0);
            results.max_latency_ms = *latencies.iter().max_by(|a, b| a.partial_cmp(b).unwrap()).unwrap_or(&0.0);
        } else {
            results.min_latency_ms = 0.0;
        }
        
        results.error_rates = errors.clone();
        
        info!("Benchmark completed:");
        info!("- Total requests: {}", results.total_requests);
        info!("- Successful: {}", results.successful_requests);
        info!("- Failed: {}", results.failed_requests);
        info!("- Average latency: {:.2} ms", results.average_latency_ms);
        info!("- Min/Max latency: {:.2} / {:.2} ms", results.min_latency_ms, results.max_latency_ms);
        info!("- Requests per second: {:.2}", results.requests_per_second);
        info!("- Total time: {:.2} ms", results.total_time_ms);
        info!("- Error breakdown: {:?}", results.error_rates);
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    env_logger::init();
    
    // Configuration du benchmark
    let benchmark_options = BenchmarkOptions {
        url: "wss://network.kxs.rip/".to_string(),
        connections: 5000,                // Nombre de connexions simultanées
        requests_per_connection: 100,     // Requêtes par connexion
        request_interval_ms: 200,         // Temps entre les requêtes (ms)
        message_type: 7,                  // Code d'opération du message de chat
        message_data: json!({
            "user": "benchmark_user",
            "text": "Benchmark test message"
        }),
        ramp_up_time_ms: 30000            // Monter en charge sur 30 secondes
    };
    
    // Créer et exécuter le benchmark
    let benchmark = WebSocketBenchmark::new(benchmark_options);
    let results = benchmark.run().await;
    
    // Afficher les résultats au format JSON
    println!("{}", serde_json::to_string_pretty(&results)?);
    
    Ok(())
}