import type { EventType } from "../types/baseStructure";

export const event: EventType = {
	name: "identified",
	handler: (kxs, data) => {
		console.log("🆔 Identified with UUID:", data.uuid);
	}
}