import KxsClient from "../KxsClient";
import config from "../../config.json";
import { BroadcastHUD } from "../HUD/MOD/BroadcastHUD";
import { GameResult } from "../types/GameResult";

interface KxsNetworkSettings {
	nickname_anonymized: boolean;
}

class KxsNetwork {
	private currentGamePlayers: string[] = [];
	public ws: WebSocket | null = null;
	private heartbeatInterval: number = 0;
	private kxsClient: KxsClient;
	private HOST: string = config.api_url;
	private reconnectAttempts: number = 0;
	private maxReconnectAttempts: number = 3;
	private reconnectTimeout: number = 0;
	private reconnectDelay: number = 15000;
	private kxsUsers: number = 0;
	private privateUsername: string = this.generateRandomUsername();
	private kxs_users: string[] = [];
	public 0x1: boolean = false;
	public connected: boolean = false;
	public actualGameId: string | null = null;

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
			this.connected = true;

			// Try to reconnect
			this.attemptReconnect();
		};
	}

	private attemptReconnect() {
		if ((this.reconnectAttempts < this.maxReconnectAttempts) && this.kxsClient.kxsNetwork["1"] === false) {
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
			this.kxsClient.logger.log(this[1] ? '[KxsNetwork] Blacklisted' : '[KxsNetwork] Maximum reconnection attempts reached');
			this.kxsClient.nm.showNotification(this[1] ? 'You are blacklisted' : 'Failed to reconnect after multiple attempts', 'error', 2000);
		}
	}

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

	private generateRandomUsername() {
		let char = 'abcdefghijklmnopqrstuvwxyz0123456789';
		let username = '';
		for (let i = 0; i < 6; i++) {
			username += char[Math.floor(Math.random() * char.length)];
		}
		return "kxs_" + username;
	}

	public getUsername() {
		return this.kxsClient.kxsNetworkSettings.nickname_anonymized ?
			this.privateUsername
			:
			this.kxsClient.getUsername()
	}

	private capitalizeFirstLetter(str: string) {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}

	private identify() {
		const payload = {
			op: 2,
			d: {
				username: this.getUsername(),
				isVoiceChat: this.kxsClient.isVoiceChatEnabled,
				v: this.capitalizeFirstLetter(global.client.name) + "@" + this.kxsClient.pkg.version,
				exchangeKey: this.kxsClient.kxsDeveloperOptions.exchange.password || null,
				isMobile: this.kxsClient.isMobile(),
				isSecure: this.kxsClient.ContextIsSecure
			}
		};
		this.send(payload);
	}

	private handleMessage(_data: any) {
		const { op, d } = _data;
		switch (op) {
			case 1: //Heart
				{
					if (d?.count) this.kxsUsers = d.count;
					if (d?.players) this.kxs_users = d.players;
				}
				break;
			case 2: // Dispatch
				{
					if (d?.uuid) {
						this.connected = true;
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
							if (this.kxsClient.isKxsChatEnabled) {
								this.kxsClient.chat.addSystemMessage(`${newPlayer} joined the game as a ${client.acronym_start_upper} player`);
							} else {
								this.kxsClient.nm.showNotification(`🎉 ${newPlayer} is a ${client.acronym_start_upper} player!`, 'info', 3500);
							}
						}
						this.currentGamePlayers = currentPlayers;
					}
				}
				break;

			case 7: // Global chat message
				{
					if (d && d.user && d.text) {
						this.kxsClient.chat.addChatMessage(d.user, d.text);
					} else if (d && d.error && !d.user) {
						this.kxsClient.chat.addErrorMessage(d.error);
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
			case 24: // Handle gbl
				{
					let { error, reason, timestamp, ign } = d;
					if (!error || !reason || !timestamp || !ign) return;
					this.kxsClient.handleGBL(error, reason, timestamp, ign);
				}
				break;
			case 98: // VOICE CHAT UPDATE
				{
					if (d && !d.isVoiceChat && d.user) {
						this.kxsClient.voiceChat.removeUserFromVoice(d.user);
					}
				}
				break;
			case 87: // BROADCAST MESSAGE
				{
					if (d && d.msg) {
						// Get the broadcast HUD instance and show the message
						const broadcastHUD = BroadcastHUD.getInstance(this.kxsClient);
						broadcastHUD.showMessage(d.msg, d.duration || 8000);
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
		if (!this.connected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
			return;
		}
		try {
			const payload = {
				op: 3, // Custom operation code for game info
				d: {
					type: 'find_game_response',
					gameId,
					user: this.getUsername()
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

	public getKxsUsers() {
		return this.kxs_users;
	}

	public gameEnded() {
		this.ws?.send(JSON.stringify({ op: 4, d: {} }));
	}

	public gameEnded_ExchangeKey(body: GameResult) {
		this.ws?.send(JSON.stringify({ op: 16, d: { data: body } }));
	}

	public PlayerAlive_ExchangeKey(count: string) {
		this.ws?.send(JSON.stringify({ op: 15, d: { alive: count } }));
	}

}

export {
	KxsNetwork,
	KxsNetworkSettings
}
