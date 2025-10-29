import type { Client, WebSocketEvents } from "kxs.rip";

export interface CommandType {
	name: string;
	description: string;
	execute: (kxs: Client, data: any, args: string[]) => void;
}

export interface EventType {
	name: keyof WebSocketEvents;
	handler: (kxs: Client, data: any) => void;
}
