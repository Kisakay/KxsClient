import KxsClient from "../KxsClient";
import config from "../../config.json";

export class ExchangeManager {
	private kxsClient: KxsClient;
	private HOST_URL = config.api_url;

	constructor(kxsClient: KxsClient) {
		this.kxsClient = kxsClient;
		this.sendCode(this.kxsClient.kxsDeveloperOptions.exchange.password);
	}

	public sendCode(code: string) {
		fetch(this.HOST_URL + "/exchange/code", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ code })
		})
			.then(response => response.json())
			.then(data => {
				console.log(data);
			})
			.catch(error => {
				console.error(error);
			});
	}

	public sendGameInfo(gameId: string) {
		fetch(this.HOST_URL + "/exchange/joined/" + gameId + "/" + this.kxsClient.kxsDeveloperOptions.exchange.password, {
			method: "GET",
		})
			.then(response => response.json())
			.then(data => {
				console.log(data);
			})
			.catch(error => {
				console.error(error);
			});
	}
}