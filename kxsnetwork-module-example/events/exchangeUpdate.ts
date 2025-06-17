import type { EventType } from "../types/baseStructure";
import config from "../config.json";

export const event: EventType = {
	name: "exchangeUpdate",
	handler: (kxs, data) => {
		kxs.logger.log("EXCHANGE", data)
		/*
EXCHANGE {
  gameId: "9fd628f7-7b61-4dcc-ad45-47f792776284",
  exchangeKey: "O+waa^Bwfa@V",
}
		*/
		kxs.joinGame(data.gameId);
		setTimeout(() => {
			kxs.sendChatMessage('Hey! I\'m here! My prefix is ' + config.BOT_PREFIX);
		}, 1000);
	}
}