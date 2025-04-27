import KxsClient from "../KxsClient";

class KxsVoiceChat {
	private kxsClient: KxsClient;
	private ws: WebSocket | null = null;
	private audioCtx: AudioContext | null = null;
	private micStream: MediaStream | null = null;
	private micSource: MediaStreamAudioSourceNode | null = null;
	private processor: ScriptProcessorNode | null = null;
	private isActive: boolean = false;

	constructor(kxsClient: KxsClient) {
		this.kxsClient = kxsClient;
	}

	public async startVoiceChat(wsUrl: string) {
		if (this.isActive) return;
		this.isActive = true;
		try {
			this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
			this.micStream = await navigator.mediaDevices.getUserMedia({
				audio: {
					sampleRate: 48000,
					channelCount: 1,
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true
				}
			});
			this.micSource = this.audioCtx.createMediaStreamSource(this.micStream);
			this.processor = this.audioCtx.createScriptProcessor(2048, 1, 1);

			this.micSource.connect(this.processor);
			this.processor.connect(this.audioCtx.destination);

			this.ws = new WebSocket(wsUrl);

			// --- ENVOI AUDIO ---
			this.processor.onaudioprocess = (e) => {
				if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
				const input = e.inputBuffer.getChannelData(0);
				const int16 = new Int16Array(input.length);
				for (let i = 0; i < input.length; i++) {
					int16[i] = Math.max(-32768, Math.min(32767, input[i] * 32767));
				}
				this.ws.send(JSON.stringify({ op: 98, d: Array.from(int16) }));
			};

			// --- RECEPTION & LECTURE ---
			this.ws.addEventListener('message', (msg) => {
				let parsed: any;
				try {
					parsed = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
				} catch {
					return;
				}
				if (!parsed || parsed.op !== 99 || !parsed.d) return;
				try {
					const int16Data = new Int16Array(parsed.d);
					const floatData = new Float32Array(int16Data.length);
					for (let i = 0; i < int16Data.length; i++) {
						floatData[i] = int16Data[i] / 32767;
					}
					const buffer = this.audioCtx!.createBuffer(1, floatData.length, this.audioCtx!.sampleRate);
					buffer.getChannelData(0).set(floatData);
					const source = this.audioCtx!.createBufferSource();
					source.buffer = buffer;
					source.connect(this.audioCtx!.destination);
					source.start();
				} catch (error) {
					console.error("Erreur lors du traitement audio:", error);
				}
			});

			this.ws.onopen = () => {
				console.log("WebSocket connecté, flux audio actif");
				this.showNotification('Chat vocal connecté ✓');
			};

			this.ws.onclose = () => {
				console.log("WebSocket fermé");
				this.cleanup();
			};

		} catch (error: any) {
			console.error("Erreur d'initialisation du chat vocal:", error);
			alert("Impossible d'initialiser le chat vocal: " + error.message);
			this.cleanup();
		}
	}

	public stopVoiceChat() {
		this.isActive = false;
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
		this.cleanup();
	}

	private cleanup() {
		if (this.processor) {
			this.processor.disconnect();
			this.processor = null;
		}
		if (this.micSource) {
			this.micSource.disconnect();
			this.micSource = null;
		}
		if (this.micStream) {
			this.micStream.getTracks().forEach(track => track.stop());
			this.micStream = null;
		}
		if (this.audioCtx) {
			this.audioCtx.close();
			this.audioCtx = null;
		}
	}

	private showNotification(message: string) {
		const notification = document.createElement('div');
		notification.style.position = 'fixed';
		notification.style.bottom = '20px';
		notification.style.right = '20px';
		notification.style.padding = '10px';
		notification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
		notification.style.color = 'white';
		notification.style.borderRadius = '5px';
		notification.style.zIndex = '9999';
		notification.textContent = message;
		document.body.appendChild(notification);
		setTimeout(() => {
			notification.style.opacity = '0';
			notification.style.transition = 'opacity 1s';
			setTimeout(() => notification.remove(), 1000);
		}, 5000);
	}
}

