import KxsClient from "../KxsClient";
import { KxsNetwork } from "../NETWORK/KxsNetwork";

interface VoiceChatUser {
	username: string;
	isActive: boolean;
	lastActivity: number;
	audioLevel: number;
}

class KxsVoiceChat {
	private kxsClient: KxsClient;
	private kxsNetwork: KxsNetwork;
	private audioCtx: AudioContext | null = null;
	private micStream: MediaStream | null = null;
	private micSource: MediaStreamAudioSourceNode | null = null;
	private processor: ScriptProcessorNode | null = null;

	// Overlay elements
	private overlayContainer: HTMLElement | null = null;
	private activeUsers: Map<string, VoiceChatUser> = new Map();
	private activityCheckInterval: number | null = null;
	private isOverlayVisible: boolean = true;

	constructor(kxsClient: KxsClient, kxsNetwork: KxsNetwork) {
		this.kxsClient = kxsClient;
		this.kxsNetwork = kxsNetwork;

		// Create overlay container
		this.createOverlayContainer();
	}

	public async startVoiceChat() {
		if (!this.kxsClient.isVoiceChatEnabled) return;
		this.cleanup();
		this.showOverlay();
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

			// --- ENVOI AUDIO ---
			this.processor.onaudioprocess = (e) => {
				if (!this.kxsNetwork.ws || this.kxsNetwork.ws.readyState !== WebSocket.OPEN) return;
				const input = e.inputBuffer.getChannelData(0);
				const int16 = new Int16Array(input.length);
				for (let i = 0; i < input.length; i++) {
					int16[i] = Math.max(-32768, Math.min(32767, input[i] * 32767));
				}
				this.kxsNetwork.ws!.send(JSON.stringify({ op: 99, d: Array.from(int16) }));
			};

			// --- RECEPTION & LECTURE ---
			this.kxsNetwork.ws!.addEventListener('message', (msg) => {
				let parsed: any;
				try {
					parsed = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
				} catch {
					return;
				}
				if (!parsed || parsed.op !== 99 || !parsed.d || !parsed.u) return;
				try {
					const int16Data = new Int16Array(parsed.d);
					const floatData = new Float32Array(int16Data.length);

					// Calculate audio level for visualization
					let audioLevel = 0;
					for (let i = 0; i < int16Data.length; i++) {
						floatData[i] = int16Data[i] / 32767;
						// Calculate RMS (Root Mean Square) for audio level
						audioLevel += floatData[i] * floatData[i];
					}
					audioLevel = Math.sqrt(audioLevel / int16Data.length);

					// Update user activity in the overlay
					this.updateUserActivity(parsed.u, audioLevel);

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

			this.kxsNetwork.ws!.onopen = () => {
				this.kxsClient.nm.showNotification('Chat vocal connecté ✓', 'success', 3000);
			};

			this.kxsNetwork.ws!.onclose = () => {
				this.kxsClient.nm.showNotification('Chat vocal déconnecté X', 'error', 3000);
				this.cleanup();
			};

		} catch (error: any) {
			console.error("Erreur d'initialisation du chat vocal:", error);
			alert("Impossible d'initialiser le chat vocal: " + error.message);
			this.cleanup();
		}
	}

	public stopVoiceChat() {
		this.cleanup();
		this.hideOverlay();
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

		// Clear activity check interval
		if (this.activityCheckInterval) {
			window.clearInterval(this.activityCheckInterval);
			this.activityCheckInterval = null;
		}
	}

	public toggleVoiceChat() {
		if (this.kxsClient.isVoiceChatEnabled) {
			this.kxsNetwork.ws?.send(JSON.stringify({
				op: 98,
				d: {
					isVoiceChat: true
				}
			}));
			this.startVoiceChat();
		} else {
			this.stopVoiceChat();
			this.kxsNetwork.ws?.send(JSON.stringify({
				op: 98,
				d: {
					isVoiceChat: false
				}
			}));
		}

	}

	// Create the overlay container for voice chat users
	private createOverlayContainer() {
		// Create overlay container if it doesn't exist
		if (!this.overlayContainer) {
			this.overlayContainer = document.createElement('div');
			this.overlayContainer.id = 'kxs-voice-chat-overlay';
			this.overlayContainer.style.position = 'absolute';
			this.overlayContainer.style.top = '10px';
			this.overlayContainer.style.right = '10px';
			this.overlayContainer.style.width = '200px';
			this.overlayContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
			this.overlayContainer.style.color = 'white';
			this.overlayContainer.style.padding = '10px';
			this.overlayContainer.style.borderRadius = '5px';
			this.overlayContainer.style.zIndex = '1000';
			this.overlayContainer.style.fontFamily = 'Arial, sans-serif';
			this.overlayContainer.style.fontSize = '14px';
			this.overlayContainer.style.display = 'none';

			// Add title
			const title = document.createElement('div');
			title.textContent = 'Voice Chat';
			title.style.fontWeight = 'bold';
			title.style.marginBottom = '5px';
			title.style.borderBottom = '1px solid rgba(255, 255, 255, 0.3)';
			title.style.paddingBottom = '5px';
			this.overlayContainer.appendChild(title);

			// Container for users
			const usersContainer = document.createElement('div');
			usersContainer.id = 'kxs-voice-chat-users';
			this.overlayContainer.appendChild(usersContainer);

			// Add to document body
			document.body.appendChild(this.overlayContainer);

			// Start checking for inactive users
			this.startActivityCheck();
		}
	}

	// Show the voice chat overlay
	private showOverlay() {
		if (this.overlayContainer) {
			this.overlayContainer.style.display = 'block';
			this.isOverlayVisible = true;

			// Start checking for inactive users if not already started
			if (!this.activityCheckInterval) {
				this.startActivityCheck();
			}
		}
	}

	// Hide the voice chat overlay
	private hideOverlay() {
		if (this.overlayContainer) {
			this.overlayContainer.style.display = 'none';
			this.isOverlayVisible = false;
		}
	}

	// Toggle the visibility of the overlay
	public toggleOverlay() {
		if (this.isOverlayVisible) {
			this.hideOverlay();
		} else {
			this.showOverlay();
		}
		return this.isOverlayVisible;
	}

	// Update activity of a user when they send audio
	private updateUserActivity(username: string, audioLevel: number) {
		const now = Date.now();
		const isActive = audioLevel > 0.01; // Consider active if audio level is above threshold

		// Get or create user
		let user = this.activeUsers.get(username);
		if (!user) {
			user = {
				username,
				isActive: isActive,
				lastActivity: now,
				audioLevel: audioLevel
			};
			this.activeUsers.set(username, user);
		} else {
			// Update existing user
			user.isActive = isActive;
			user.lastActivity = now;
			user.audioLevel = audioLevel;
		}

		// Update UI
		this.updateOverlayUI();
	}

	// Start the interval to check for inactive users
	private startActivityCheck() {
		// Check every 500ms for inactive users (no audio for more than 2 seconds)
		this.activityCheckInterval = window.setInterval(() => {
			const now = Date.now();
			let updated = false;

			this.activeUsers.forEach((user, username) => {
				// If last activity was more than 2 seconds ago, set inactive
				if (now - user.lastActivity > 2000 && user.isActive) {
					user.isActive = false;
					updated = true;
				}

				// Remove users who have been inactive for more than 30 seconds
				if (now - user.lastActivity > 30000) {
					this.activeUsers.delete(username);
					updated = true;
				}
			});

			if (updated) {
				this.updateOverlayUI();
			}
		}, 500);
	}

	// Update the overlay UI with current users
	private updateOverlayUI() {
		if (!this.overlayContainer || !this.isOverlayVisible) return;

		const usersContainer = document.getElementById('kxs-voice-chat-users');
		if (!usersContainer) return;

		// Clear existing users
		usersContainer.innerHTML = '';

		// Add users
		if (this.activeUsers.size === 0) {
			const noUsers = document.createElement('div');
			noUsers.textContent = 'Aucun utilisateur actif';
			noUsers.style.color = 'rgba(255, 255, 255, 0.6)';
			noUsers.style.fontStyle = 'italic';
			noUsers.style.textAlign = 'center';
			noUsers.style.padding = '5px';
			usersContainer.appendChild(noUsers);
		} else {
			this.activeUsers.forEach((user) => {
				const userElement = document.createElement('div');
				userElement.className = 'kxs-voice-chat-user';
				userElement.style.display = 'flex';
				userElement.style.alignItems = 'center';
				userElement.style.margin = '3px 0';
				userElement.style.padding = '3px';
				userElement.style.borderRadius = '3px';
				userElement.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';

				// Status indicator
				const indicator = document.createElement('div');
				indicator.style.width = '10px';
				indicator.style.height = '10px';
				indicator.style.borderRadius = '50%';
				indicator.style.marginRight = '8px';

				// Set color based on activity
				if (user.isActive) {
					// Green indicator when active
					indicator.style.backgroundColor = '#2ecc71';

					// Pulsating effect based on audio level
					const scale = 1 + Math.min(user.audioLevel * 3, 1); // Max scale 2x
					indicator.style.transform = `scale(${scale})`;
					indicator.style.boxShadow = `0 0 5px #2ecc71`;
					indicator.style.transition = 'transform 0.1s ease-in-out';
				} else {
					// Gray indicator when inactive
					indicator.style.backgroundColor = '#7f8c8d';
				}

				// Username label
				const usernameLabel = document.createElement('span');
				usernameLabel.textContent = user.username;
				usernameLabel.style.flexGrow = '1';
				usernameLabel.style.whiteSpace = 'nowrap';
				usernameLabel.style.overflow = 'hidden';
				usernameLabel.style.textOverflow = 'ellipsis';

				userElement.appendChild(indicator);
				userElement.appendChild(usernameLabel);
				usersContainer.appendChild(userElement);
			});
		}
	}
}

export {
	KxsVoiceChat
}