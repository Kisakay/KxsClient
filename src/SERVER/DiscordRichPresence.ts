import KxsClient from "../KxsClient";
import { client } from "../UTILS/vars";

class DiscordWebSocket {
	private ws: WebSocket | null = null;
	private heartbeatInterval: number = 0;
	private sequence: number | null = null;
	private isAuthenticated: boolean = false;
	kxsClient: KxsClient;

	constructor(kxsClient: KxsClient, token: string | null) {
		this.kxsClient = kxsClient;
	}

	connect() {
		if (this.kxsClient.discordToken === ""
			|| this.kxsClient.discordToken === null
			|| this.kxsClient.discordToken === undefined
		) {
			return;
		}

		this.ws = new WebSocket('wss://gateway.discord.gg/?v=9&encoding=json');

		this.ws.onopen = () => { };

		this.ws.onmessage = (event) => {
			const data = JSON.parse(event.data);
			this.handleMessage(data);
		};

		this.ws.onerror = (error) => { };

		this.ws.onclose = () => {
			clearInterval(this.heartbeatInterval);
			this.isAuthenticated = false;
		};
	}

	private identify() {
		const payload = {
			op: 2,
			d: {
				token: this.kxsClient.discordToken,
				properties: {
					$os: 'linux',
					$browser: 'chrome',
					$device: 'chrome'
				},
				presence: {
					activities: [{
						name: client.name,
						type: 0,
						application_id: client.application_id,
						assets: {
							large_image: client.rpc_assets,
							large_text: client.name + " v" + this.kxsClient.pkg.version,
						}
					}],
					status: 'online',
					afk: false
				}
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

			case 11: // Heartbeat ACK
				this.kxsClient.logger.log('[RichPresence] Heartbeat acknowledged');
				break;

			case 0: // Dispatch
				this.sequence = data.s;
				if (data.t === 'READY') {
					this.isAuthenticated = true;
					this.kxsClient.nm.showNotification('Started Discord RPC', 'success', 3000);
				}
				break;
		}
	}

	private startHeartbeat(interval: number) {
		this.heartbeatInterval = setInterval(() => {
			this.send({
				op: 1,
				d: this.sequence
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
}

export {
	DiscordWebSocket
}