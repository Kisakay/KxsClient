import type { EventType } from "../types/baseStructure";

export const event: EventType = {
	name: "connected",
	handler: (kxs) => {
		console.log("✅ Successfully connected to the server");

		kxs.identify();
	}
}
