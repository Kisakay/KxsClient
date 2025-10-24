class PingTest {
	private ptcDataBuf: ArrayBuffer;
	private ping: number = 0;
	private ws: WebSocket | null = null;
	private sendTime: number = 0;
	private retryCount: number = 0;
	private isConnecting: boolean = false;
	private url: string = "";
	private hasPing: boolean = false;
	private reconnectTimer: NodeJS.Timeout | null = null;
	private keepAliveTimer: NodeJS.Timeout | null = null;
	private connectionCheckTimer: NodeJS.Timeout | null = null;

	constructor() {
		this.ptcDataBuf = new ArrayBuffer(1);
		this.waitForServerSelectElements();
		this.startKeepAlive();
	}

	private startKeepAlive() {
		// Annuler l'ancien timer si existant
		if (this.keepAliveTimer) {
			clearInterval(this.keepAliveTimer);
		}

		this.keepAliveTimer = setInterval(() => {
			if (this.ws?.readyState === WebSocket.OPEN) {
				this.ws.send(this.ptcDataBuf);
			} else if (this.ws?.readyState === WebSocket.CLOSED || this.ws?.readyState === WebSocket.CLOSING) {
				// Redémarrer la connexion si elle est fermée
				this.restart();
			}
		}, 5000); // envoie toutes les 5s
	}

	private waitForServerSelectElements() {
		const checkInterval = setInterval(() => {
			const teamSelect = document.getElementById("team-server-select") as HTMLSelectElement | null;
			const mainSelect = document.getElementById("server-select-main") as HTMLSelectElement | null;

			const selectedValue = teamSelect?.value || mainSelect?.value;

			if ((teamSelect || mainSelect) && selectedValue) {
				clearInterval(checkInterval);
			}
		}, 100); // Vérifie toutes les 100ms
	}

	public setServerFromWebsocketHooking(host: string) {
		this.url = `wss://${host}/ptc`;
		console.log("URL WEBSOCKET -----------------", this.url)
		this.start();
	}

	public start() {
		console.log("is connecting", this.isConnecting)
		if (this.isConnecting) return;
		this.isConnecting = true;
		this.startWebSocketPing();

		// Vérifier régulièrement l'état de la connexion
		this.startConnectionCheck();
	}

	private startConnectionCheck() {
		// Annuler l'ancien timer si existant
		if (this.connectionCheckTimer) {
			clearInterval(this.connectionCheckTimer);
		}

		// Vérifier l'état de la connexion toutes les 10 secondes
		this.connectionCheckTimer = setInterval(() => {
			// Si on n'a pas de ping valide ou que la connexion est fermée, on tente de reconnecter
			if (!this.hasPing || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
				this.restart();
			}
		}, 10000);
	}

	private startWebSocketPing() {
		if (this.ws || !this.url) return;

		const ws = new WebSocket(this.url);
		ws.binaryType = "arraybuffer";

		ws.onopen = () => {
			this.ws = ws;
			this.retryCount = 0;
			this.isConnecting = false;
			this.sendPing();

			setTimeout(() => {
				if (this.ws?.readyState !== WebSocket.OPEN) {
					this.restart();
				}
			}, 3000); // 3s pour sécuriser
		};

		ws.onmessage = () => {
			this.hasPing = true;
			const elapsed = (Date.now() - this.sendTime) / 1e3;
			this.ping = Math.round(elapsed * 1000);
			setTimeout(() => this.sendPing(), 1000);
		};

		ws.onerror = (error) => {
			this.ping = 0;
			this.hasPing = false;
			this.retryCount++;

			// Tentative immédiate mais avec backoff exponentiel
			const retryDelay = Math.min(1000 * Math.pow(2, this.retryCount - 1), 10000);

			// Annuler tout timer de reconnexion existant
			if (this.reconnectTimer) {
				clearTimeout(this.reconnectTimer);
			}

			this.reconnectTimer = setTimeout(() => {
				this.ws = null; // S'assurer que l'ancienne connexion est effacée
				this.startWebSocketPing();
			}, retryDelay);
		};

		ws.onclose = (event) => {
			this.hasPing = false;
			this.ws = null;
			this.isConnecting = false;

			// Tentative de reconnexion après une fermeture
			if (this.reconnectTimer) {
				clearTimeout(this.reconnectTimer);
			}

			this.reconnectTimer = setTimeout(() => {
				this.start();
			}, 2000); // Attendre 2 secondes avant de reconnecter
		};
	}

	private sendPing() {
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			this.sendTime = Date.now();
			this.ws.send(this.ptcDataBuf);
		} else if (this.ws?.readyState === WebSocket.CLOSED || this.ws?.readyState === WebSocket.CLOSING) {
			// Si la WebSocket est fermée au moment d'envoyer le ping, on tente de reconnecter
			this.restart();
		}
	}

	public stop() {
		// Annuler tous les timers
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}

		if (this.keepAliveTimer) {
			clearInterval(this.keepAliveTimer);
			this.keepAliveTimer = null;
		}

		if (this.connectionCheckTimer) {
			clearInterval(this.connectionCheckTimer);
			this.connectionCheckTimer = null;
		}

		if (this.ws) {
			this.ws.onclose = null;
			this.ws.onerror = null;
			this.ws.onmessage = null;
			this.ws.onopen = null;
			this.ws.close();
			this.ws = null;
		}
		this.isConnecting = false;
		this.retryCount = 0;
		this.hasPing = false;
	}

	public restart() {
		this.stop();
		this.start();
	}

	/**
	 * Retourne le ping actuel. Ne touche jamais à la websocket ici !
	 * Si le ping n'est pas dispo, retourne -1 (jamais null).
	 * La reconnexion doit être gérée ailleurs (timer, event, etc).
	 */
	public getPingResult() {
		if (this.ws && this.ws.readyState === WebSocket.OPEN && this.hasPing) {
			return {
				ping: this.ping,
			};
		} else {
			// Si on détecte un problème ici, planifier une reconnexion
			if (!this.reconnectTimer && (!this.ws || this.ws.readyState !== WebSocket.CONNECTING)) {
				this.reconnectTimer = setTimeout(() => this.restart(), 1000);
			}

			return {
				ping: -1, // -1 indique que le ping n'est pas dispo, mais jamais null
			};
		}
	}
}

export { PingTest };