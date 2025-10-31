import type { EventType } from "../types/baseStructure";

export const event: EventType = {
	name: "heartbeat",
	handler: (kxs, data: any) => {
		kxs.logger.log("heartbeat", data);
	}
}