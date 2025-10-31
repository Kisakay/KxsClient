import type { EventType } from "../types/baseStructure";

export const event: EventType = {
	name: "gameStarted",
	handler: (kxs, data: any) => {
		kxs.logger.log("gameStarted", data);
	}
}