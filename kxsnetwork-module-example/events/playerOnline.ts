import type { EventType } from "../types/baseStructure";

export const event: EventType = {
	name: "onlinePlayer",
	handler: (kxs, data) => {
		kxs.logger.log("Player is now online:", data);
	}
}