import type { KxsRip } from "kxs.rip";

export interface CommandType {
	name: string;
	description: string;
	execute: (kxs: KxsRip, data: any, args: string[]) => void;
}

export interface EventType {
	name: keyof WebSocketEvents;
	handler: (kxs: KxsRip, data: any) => void;
}
