import KxsClient from "../KxsClient";
import config from "../../config.json";

class KxsNetwork {
	private currentGamePlayers: string[] = [];
	public sendGlobalChatMessage(text: string) {
		if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
		const payload = {
			op: 7,
			d: {
				user: this.getUsername(),
				text
			}
		};
		this.send(payload);
	}

	public ws: WebSocket | null = null;
	private heartbeatInterval: number = 0;
	private isAuthenticated: boolean = false;
	private kxsClient: KxsClient;
	private HOST: string = config.api_url;
	private reconnectAttempts: number = 0;
	private maxReconnectAttempts: number = 3;
	private reconnectTimeout: number = 0;
	private reconnectDelay: number = 15000; // Initial reconnect delay of 1 second
	private kxsUsers: number = 0;

	constructor(kxsClient: KxsClient) {
		this.kxsClient = kxsClient;
	}

	connect() {
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			this.kxsClient.logger.log('[KxsNetwork] WebSocket already connected');
			return;
		}

		this.ws = new WebSocket(this.getWebSocketURL());

		this.ws.onopen = () => {
			this.kxsClient.logger.log('[KxsNetwork] WebSocket connection established');
			// Reset reconnect attempts on successful connection
			this.reconnectAttempts = 0;
			this.reconnectDelay = 1000;
		}

		this.ws.onmessage = (event) => {
			const data = JSON.parse(event.data);
			this.handleMessage(data);
		};

		this.ws.onerror = (error) => {
			this.kxsClient.nm.showNotification('WebSocket error: ' + error.type, 'error', 900);
		};

		this.ws.onclose = () => {
			this.kxsClient.nm.showNotification('Disconnected from KxsNetwork', 'info', 1100);
			clearInterval(this.heartbeatInterval);
			this.isAuthenticated = false;

			// Try to reconnect
			this.attemptReconnect();
		};
	}

	private attemptReconnect() {
		if (this.reconnectAttempts < this.maxReconnectAttempts) {
			this.reconnectAttempts++;

			// Use exponential backoff for reconnection attempts
			const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);

			this.kxsClient.logger.log(`[KxsNetwork] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);

			// Clear any existing timeout
			if (this.reconnectTimeout) {
				clearTimeout(this.reconnectTimeout);
			}

			// Set timeout for reconnection
			this.reconnectTimeout = setTimeout(() => {
				this.connect();
			}, delay) as unknown as number;
		} else {
			this.kxsClient.logger.log('[KxsNetwork] Maximum reconnection attempts reached');
			this.kxsClient.nm.showNotification('Failed to reconnect after multiple attempts', 'error', 2000);
		}
	}

	public getUsername() {
		return JSON.parse(localStorage.getItem("surviv_config") || "{}").playerName;
	}

	private identify() {
		const payload = {
			op: 2,
			d: {
				username: this.getUsername(),
				isVoiceChat: this.kxsClient.isVoiceChatEnabled
			}
		};
		this.send(payload);
	}

	private handleMessage(_data: any) {
		const { op, d } = _data;
		switch (op) {
			case 1: //Heart
				{
					if (d?.count) {
						this.kxsUsers = d.count;
					}
				}
				break;
			case 3: // Kxs user join game
				{
					if (d && Array.isArray(d.players)) {
						const myName = this.getUsername();
						const previousPlayers = this.currentGamePlayers;
						const currentPlayers = d.players.filter((name: string) => name !== myName);

						// Détecter les nouveaux joueurs (hors soi-même)
						const newPlayers = currentPlayers.filter((name: string) => !previousPlayers.includes(name));
						for (const newPlayer of newPlayers) {
							this.kxsClient.nm.showNotification(`🎉 ${newPlayer} is a Kxs player!`, 'info', 3500);
						}
						this.currentGamePlayers = currentPlayers;
					}
				}
				break;

			case 7: // Global chat message
				{
					if (d && d.user && d.text) {
						this.kxsClient.chat.addChatMessage(d.user, d.text);
					}
				}
				break;
			case 10: // Hello
				{
					const { heartbeat_interval } = d;
					this.startHeartbeat(heartbeat_interval);
					this.identify();
				}
				break;
			case 2: // Dispatch
				{
					if (d?.uuid) {
						this.isAuthenticated = true;
					}
				}
				break;
			case 98: // VOICE CHAT UPDATE
				{
					console.log("j'ai bien reçcu un truc enculer mdr ");
					if (d && d.isVoiceChat && d.user) {
						this.kxsClient.voiceChat.removeUserFromVoice(d.user);
					}
				}
				break;
		}
	}

	private startHeartbeat(interval: number) {
		// Clear existing interval if it exists
		if (this.heartbeatInterval) {
			clearInterval(this.heartbeatInterval);
		}

		this.heartbeatInterval = setInterval(() => {
			this.send({
				op: 1,
				d: {}
			});
		}, interval) as unknown as number;
	}

	private send(data: any) {
		if (this.ws?.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify(data));
		}
	}

	public disconnect() {
		if (this.ws) {
			// Clear all timers
			clearInterval(this.heartbeatInterval);
			clearTimeout(this.reconnectTimeout);

			// Reset reconnection state
			this.reconnectAttempts = 0;

			// Close the connection
			this.ws.close();
		}
	}

	public reconnect() {
		this.disconnect();
		this.connect();
	}

	public sendGameInfoToWebSocket(gameId: string) {
		if (!this.isAuthenticated || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
			return;
		}
		try {
			const payload = {
				op: 3, // Custom operation code for game info
				d: {
					type: 'find_game_response',
					gameId
				}
			};
			this.send(payload);
		} catch (error) {
		}
	}

	public getWebSocketURL() {
		let isSecured = this.HOST.startsWith("https://");
		let protocols = isSecured ? "wss://" : "ws://";
		return protocols + this.HOST.split("/")[2];
	}

	public getHTTPURL() {
		return this.HOST;
	}

	public getOnlineCount() {
		return this.kxsUsers;
	}

	public gameEnded() {
		this.ws?.send(JSON.stringify({ op: 4, d: {} }));
	}

}

export {
	KxsNetwork
}