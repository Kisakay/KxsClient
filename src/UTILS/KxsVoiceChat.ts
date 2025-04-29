import KxsClient from "../KxsClient";
import { KxsNetwork } from "../NETWORK/KxsNetwork";

interface VoiceChatUser {
	username: string;
	isActive: boolean;
	lastActivity: number;
	audioLevel: number;
	isMuted: boolean;
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
	private mutedUsers: Set<string> = new Set();
	private activityCheckInterval: number | null = null;
	private isOverlayVisible: boolean = true;
	private isLocalMuted: boolean = false;
	private localMuteButton: HTMLButtonElement | null = null;

	// Constants
	private readonly ACTIVITY_THRESHOLD = 0.01;
	private readonly INACTIVITY_TIMEOUT = 2000;
	private readonly REMOVAL_TIMEOUT = 30000;
	private readonly ACTIVITY_CHECK_INTERVAL = 500;

	constructor(kxsClient: KxsClient, kxsNetwork: KxsNetwork) {
		this.kxsClient = kxsClient;
		this.kxsNetwork = kxsNetwork;
		this.createOverlayContainer();
	}

	/**
	 * Remove a user from voice chat (e.g., when muted)
	 */
	public removeUserFromVoice(username: string): void {
		if (this.activeUsers.has(username)) {
			this.activeUsers.delete(username);
			this.updateOverlayUI();
		}
	}

	public async startVoiceChat(): Promise<void> {
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

			// Set up audio processing
			this.setupAudioProcessing();
			this.setupWebSocketListeners();

		} catch (error: any) {
			console.error("Voice chat initialization error:", error);
			alert("Unable to initialize voice chat: " + error.message);
			this.cleanup();
		}
	}

	private setupAudioProcessing(): void {
		if (!this.processor) return;

		this.processor.onaudioprocess = (e) => {
			if (!this.kxsNetwork.ws || this.kxsNetwork.ws.readyState !== WebSocket.OPEN) return;

			// Ne pas envoyer les données audio si l'utilisateur local est muté
			if (this.isLocalMuted) return;

			const input = e.inputBuffer.getChannelData(0);
			const int16 = new Int16Array(input.length);

			for (let i = 0; i < input.length; i++) {
				int16[i] = Math.max(-32768, Math.min(32767, input[i] * 32767));
			}

			this.kxsNetwork.ws.send(JSON.stringify({ op: 99, d: Array.from(int16) }));
		};
	}

	private setupWebSocketListeners(): void {
		if (!this.kxsNetwork.ws) return;

		this.kxsNetwork.ws.addEventListener('message', this.handleAudioMessage.bind(this));
	}

	private handleAudioMessage(msg: MessageEvent): void {
		let parsed: any;
		try {
			parsed = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
		} catch {
			return;
		}

		if (!parsed || parsed.op !== 99 || !parsed.d || !parsed.u) return;

		try {
			// Skip if user is muted
			if (this.mutedUsers.has(parsed.u)) return;

			const int16Data = new Int16Array(parsed.d);
			const floatData = new Float32Array(int16Data.length);

			// Calculate audio level for visualization
			let audioLevel = 0;
			for (let i = 0; i < int16Data.length; i++) {
				floatData[i] = int16Data[i] / 32767;
				audioLevel += floatData[i] * floatData[i];
			}
			audioLevel = Math.sqrt(audioLevel / int16Data.length);

			// Update user activity in the overlay
			this.updateUserActivity(parsed.u, audioLevel);

			// Play the audio
			this.playAudio(floatData);

		} catch (error) {
			console.error("Audio processing error:", error);
		}
	}

	private playAudio(floatData: Float32Array): void {
		if (!this.audioCtx) return;

		const buffer = this.audioCtx.createBuffer(1, floatData.length, this.audioCtx.sampleRate);
		buffer.getChannelData(0).set(floatData);

		const source = this.audioCtx.createBufferSource();
		source.buffer = buffer;
		source.connect(this.audioCtx.destination);
		source.start();
	}

	public stopVoiceChat(): void {
		this.cleanup();
		this.hideOverlay();
	}

	private cleanup(): void {
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

		if (this.activityCheckInterval) {
			window.clearInterval(this.activityCheckInterval);
			this.activityCheckInterval = null;
		}
	}

	public toggleVoiceChat(): void {
		if (this.kxsClient.isVoiceChatEnabled) {
			this.kxsNetwork.ws?.send(JSON.stringify({
				op: 98,
				d: { isVoiceChat: true }
			}));
			this.startVoiceChat();
		} else {
			this.stopVoiceChat();
			this.kxsNetwork.ws?.send(JSON.stringify({
				op: 98,
				d: { isVoiceChat: false }
			}));
		}
	}

	private createOverlayContainer(): void {
		if (this.overlayContainer) return;

		this.overlayContainer = document.createElement('div');
		this.overlayContainer.id = 'kxs-voice-chat-overlay';

		Object.assign(this.overlayContainer.style, {
			position: 'absolute',
			top: '10px',
			right: '10px',
			width: '200px',
			backgroundColor: 'rgba(0, 0, 0, 0.7)',
			color: 'white',
			padding: '10px',
			borderRadius: '5px',
			zIndex: '1000',
			fontFamily: 'Arial, sans-serif',
			fontSize: '14px',
			display: 'none'
		});

		// Add title and controls container (for title and mute button)
		const controlsContainer = document.createElement('div');
		Object.assign(controlsContainer.style, {
			display: 'flex',
			justifyContent: 'space-between',
			alignItems: 'center',
			marginBottom: '5px',
			borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
			paddingBottom: '5px'
		});

		// Title
		const title = document.createElement('div');
		title.textContent = 'Voice Chat';
		Object.assign(title.style, {
			fontWeight: 'bold'
		});

		// Create local mute button
		this.localMuteButton = this.createLocalMuteButton();

		// Add elements to controls container
		controlsContainer.appendChild(title);
		controlsContainer.appendChild(this.localMuteButton);

		this.overlayContainer.appendChild(controlsContainer);

		// Container for users
		const usersContainer = document.createElement('div');
		usersContainer.id = 'kxs-voice-chat-users';
		this.overlayContainer.appendChild(usersContainer);

		document.body.appendChild(this.overlayContainer);
		this.startActivityCheck();
	}

	private showOverlay(): void {
		if (!this.overlayContainer) return;

		this.overlayContainer.style.display = 'block';
		this.isOverlayVisible = true;

		if (!this.activityCheckInterval) {
			this.startActivityCheck();
		}
	}

	private hideOverlay(): void {
		if (!this.overlayContainer) return;

		this.overlayContainer.style.display = 'none';
		this.isOverlayVisible = false;
	}

	public toggleOverlay(): boolean {
		if (this.isOverlayVisible) {
			this.hideOverlay();
		} else {
			this.showOverlay();
		}
		return this.isOverlayVisible;
	}

	private updateUserActivity(username: string, audioLevel: number): void {
		const now = Date.now();
		const isActive = audioLevel > this.ACTIVITY_THRESHOLD;

		let user = this.activeUsers.get(username);

		if (!user) {
			user = {
				username,
				isActive,
				lastActivity: now,
				audioLevel,
				isMuted: this.mutedUsers.has(username)
			};
			this.activeUsers.set(username, user);
		} else {
			user.isActive = isActive;
			user.lastActivity = now;
			user.audioLevel = audioLevel;
			user.isMuted = this.mutedUsers.has(username);
		}

		this.updateOverlayUI();
	}

	private startActivityCheck(): void {
		this.activityCheckInterval = window.setInterval(() => {
			const now = Date.now();
			let updated = false;

			this.activeUsers.forEach((user, username) => {
				// Set inactive if no activity for the specified timeout
				if (now - user.lastActivity > this.INACTIVITY_TIMEOUT && user.isActive) {
					user.isActive = false;
					updated = true;
				}

				// Remove users inactive for longer period
				if (now - user.lastActivity > this.REMOVAL_TIMEOUT) {
					this.activeUsers.delete(username);
					updated = true;
				}
			});

			if (updated) {
				this.updateOverlayUI();
			}
		}, this.ACTIVITY_CHECK_INTERVAL);
	}

	private updateOverlayUI(): void {
		if (!this.overlayContainer || !this.isOverlayVisible) return;

		const usersContainer = document.getElementById('kxs-voice-chat-users');
		if (!usersContainer) return;

		// Clear existing users
		usersContainer.innerHTML = '';

		// Add users or show "no users" message
		if (this.activeUsers.size === 0) {
			this.renderNoUsersMessage(usersContainer);
		} else {
			this.activeUsers.forEach(user => {
				this.renderUserElement(usersContainer, user);
			});
		}
	}

	private renderNoUsersMessage(container: HTMLElement): void {
		const noUsers = document.createElement('div');
		noUsers.textContent = 'No active users';

		Object.assign(noUsers.style, {
			color: 'rgba(255, 255, 255, 0.6)',
			fontStyle: 'italic',
			textAlign: 'center',
			padding: '5px'
		});

		container.appendChild(noUsers);
	}

	private renderUserElement(container: HTMLElement, user: VoiceChatUser): void {
		const userElement = document.createElement('div');
		userElement.className = 'kxs-voice-chat-user';

		Object.assign(userElement.style, {
			display: 'flex',
			alignItems: 'center',
			margin: '3px 0',
			padding: '3px',
			borderRadius: '3px',
			backgroundColor: 'rgba(255, 255, 255, 0.1)'
		});

		// Status indicator
		const indicator = this.createStatusIndicator(user);

		// Username label
		const usernameLabel = document.createElement('span');
		usernameLabel.textContent = user.username;

		Object.assign(usernameLabel.style, {
			flexGrow: '1',
			whiteSpace: 'nowrap',
			overflow: 'hidden',
			textOverflow: 'ellipsis'
		});

		// Mute button - FIX: Create this element properly
		const muteButton = this.createMuteButton(user);

		// Add elements to container
		userElement.appendChild(indicator);
		userElement.appendChild(usernameLabel);
		userElement.appendChild(muteButton);
		container.appendChild(userElement);
	}

	private createStatusIndicator(user: VoiceChatUser): HTMLElement {
		const indicator = document.createElement('div');

		Object.assign(indicator.style, {
			width: '14px',
			height: '14px',
			borderRadius: '50%',
			marginRight: '8px',
			cursor: 'pointer'
		});

		indicator.title = user.isMuted ? 'Unmute' : 'Mute';

		if (user.isActive) {
			const scale = 1 + Math.min(user.audioLevel * 3, 1);

			Object.assign(indicator.style, {
				backgroundColor: '#2ecc71',
				transform: `scale(${scale})`,
				boxShadow: '0 0 5px #2ecc71',
				transition: 'transform 0.1s ease-in-out'
			});

		} else {
			indicator.style.backgroundColor = '#7f8c8d';
		}

		return indicator;
	}

	private createMuteButton(user: VoiceChatUser): HTMLButtonElement {
		const muteButton = document.createElement('button');
		muteButton.type = 'button'; // Important: specify type to prevent form submission behavior
		muteButton.textContent = user.isMuted ? 'UNMUTE' : 'MUTE';

		Object.assign(muteButton.style, {
			backgroundColor: user.isMuted ? '#e74c3c' : '#7f8c8d',
			color: 'white',
			border: 'none',
			borderRadius: '3px',
			padding: '2px 5px',
			marginLeft: '5px',
			cursor: 'pointer',
			fontSize: '11px',
			fontWeight: 'bold',
			minWidth: '40px'
		});

		muteButton.addEventListener('mouseover', () => {
			muteButton.style.opacity = '0.8';
		});

		muteButton.addEventListener('mouseout', () => {
			muteButton.style.opacity = '1';
		});

		const handleMuteToggle = (e: Event) => {
			e.stopImmediatePropagation();
			e.stopPropagation();
			e.preventDefault();

			const newMutedState = !user.isMuted;
			user.isMuted = newMutedState;

			if (newMutedState) {
				this.mutedUsers.add(user.username);
			} else {
				this.mutedUsers.delete(user.username);
			}

			this.sendMuteState(user.username, newMutedState);

			this.updateOverlayUI();
			return false;
		};

		['click', 'mousedown', 'pointerdown'].forEach(eventType => {
			muteButton.addEventListener(eventType, handleMuteToggle, true);
		});

		muteButton.onclick = (e: MouseEvent) => {
			e.stopImmediatePropagation();
			e.stopPropagation();
			e.preventDefault();

			const newMutedState = !user.isMuted;
			user.isMuted = newMutedState;

			if (newMutedState) {
				this.mutedUsers.add(user.username);
			} else {
				this.mutedUsers.delete(user.username);
			}

			this.sendMuteState(user.username, newMutedState);
			this.updateOverlayUI();
			return false;
		};

		return muteButton;
	}

	private sendMuteState(username: string, isMuted: boolean): void {
		if (!this.kxsNetwork.ws || this.kxsNetwork.ws.readyState !== WebSocket.OPEN) {
			console.warn('WebSocket not available or not open');
			return;
		}

		this.kxsNetwork.ws.send(JSON.stringify({
			op: 100,
			d: {
				user: username,
				isMuted: isMuted
			}
		}));
	}

	private createLocalMuteButton(): HTMLButtonElement {
		const muteButton = document.createElement('button');
		muteButton.type = 'button';
		muteButton.textContent = this.isLocalMuted ? 'UNMUTE' : 'MUTE';
		muteButton.id = 'kxs-voice-chat-local-mute';

		Object.assign(muteButton.style, {
			backgroundColor: this.isLocalMuted ? '#e74c3c' : '#3498db',
			color: 'white',
			border: 'none',
			borderRadius: '3px',
			padding: '2px 5px',
			cursor: 'pointer',
			fontSize: '11px',
			fontWeight: 'bold',
			minWidth: '55px'
		});

		muteButton.addEventListener('mouseover', () => {
			muteButton.style.opacity = '0.8';
		});

		muteButton.addEventListener('mouseout', () => {
			muteButton.style.opacity = '1';
		});

		// Utiliser un gestionnaire d'événement unique plus simple avec une vérification pour éviter les multiples déclenchements
		muteButton.onclick = (e: MouseEvent) => {
			// Arrêter complètement la propagation de l'événement
			e.stopImmediatePropagation();
			e.stopPropagation();
			e.preventDefault();

			// Basculer l'état de mute
			this.toggleLocalMute();
			return false;
		};

		return muteButton;
	}

	public toggleLocalMute(): void {
		// Inverser l'état
		this.isLocalMuted = !this.isLocalMuted;

		// Mettre à jour l'apparence du bouton si présent
		if (this.localMuteButton) {
			// Définir clairement le texte et la couleur du bouton en fonction de l'état
			this.localMuteButton.textContent = this.isLocalMuted ? 'UNMUTE' : 'MUTE';
			this.localMuteButton.style.backgroundColor = this.isLocalMuted ? '#e74c3c' : '#3498db';
		}

		// Type de notification en fonction de si nous sommes sur error, info ou success
		const notificationType = this.isLocalMuted ? 'error' : 'success';

		// Notification de changement d'état
		const message = this.isLocalMuted ? 'You are muted' : 'You are unmuted';
		this.kxsClient.nm.showNotification(message, notificationType, 2000);
	}
}

export { KxsVoiceChat };