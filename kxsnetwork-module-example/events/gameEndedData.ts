import type { GameResult } from "kxs.rip";
import type { EventType } from "../types/baseStructure";

export const event: EventType = {
	name: "gameEndData",
	handler: (kxs, data: GameResult) => {
		kxs.logger.log("GameEndedData", data);
	}
}