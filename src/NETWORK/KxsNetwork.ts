import KxsClient from "../KxsClient";

class KxsNetwork {
	private ws: WebSocket | null = null;
	private heartbeatInterval: number = 0;
	private isAuthenticated: boolean = false;
	private kxsClient: KxsClient;
	private uuid: string | undefined;

	constructor(kxsClient: KxsClient) {
		this.kxsClient = kxsClient;
	}

	connect() {

		this.ws = new WebSocket("ws://127.0.0.1:4560")

		this.ws.onopen = () => {
			this.kxsClient.logger.log('[KxsNetwork] WebSocket connection established');
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
		};
	}

	private getUsername() {
		return JSON.parse(localStorage.getItem("surviv_config") || "{}").playerName;
	}

	// private 
	private identify() {
		const payload = {
			op: 2,
			d: {
				username: this.getUsername(),
			}
		};
		this.send(payload);
	}

	private handleMessage(data: any) {
		switch (data.op) {
			case 10: // Hello
				const { heartbeat_interval } = data.d;
				this.startHeartbeat(heartbeat_interval);
				this.identify();
				break;

			case 2: // Dispatch
				if (data?.d?.uuid) {
					this.isAuthenticated = true;
					this.uuid = data.d.uuid;
				}
				break;
		}
	}

	private startHeartbeat(interval: number) {
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

	disconnect() {
		if (this.ws) {
			clearInterval(this.heartbeatInterval);
			this.ws.close();
		}
	}

	public sendGameInfoToWebSocket(gameId: string) {
		if (!this.isAuthenticated || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
			console.log('Cannot send game info: WebSocket not ready or not authenticated');
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
			console.log('[KxsNetwork] Game info sent to WebSocket');
		} catch (error) {
			console.error('Error sending game info to WebSocket:', error);
		}
	}
}

export {
	KxsNetwork
}