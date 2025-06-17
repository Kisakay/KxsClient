import KxsClient from "../KxsClient";
import config from "../../config.json";

export class ExchangeManager {
	private kxsClient: KxsClient;
	private HOST_URL = config.api_url;

	constructor(kxsClient: KxsClient) {
		this.kxsClient = kxsClient;
	}

	public sendGameInfo(gameId: string) {
		if (!this.kxsClient.kxsDeveloperOptions.enableGameIDExchange) return;
		fetch(this.HOST_URL + "/exchange/joined/" + gameId + "/" + this.kxsClient.kxsDeveloperOptions.exchange.password, {
			method: "GET",
		})
			.catch(error => {
				this.kxsClient.logger.error(error);
			});
	}
}