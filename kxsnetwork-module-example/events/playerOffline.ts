import type { EventType } from "../types/baseStructure";

export const event: EventType = {
	name: "offlinePlayer",
	handler: (kxs, data) => {
		kxs.logger.log("Player is offline:", data);
	}
}