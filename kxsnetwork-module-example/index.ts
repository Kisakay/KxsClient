import KxsNetwork from "kxs.rip";
import config from './config.json';
import fs from "node:fs";
import type { EventType } from "./types/baseStructure";
import { Logger } from "../src/FUNC/Logger";

export const kxs = new KxsNetwork({
	wsUrl: `wss://${config.KXS_NETWORK_URL}`,
	apiUrl: `https://${config.KXS_NETWORK_URL}`,
	username: config.BOT_NAME,
	enableVoiceChat: config.BOT_VOICE_ENABLED,
	exchangeKey: config.KXS_NETWORK_EXCHANGE_KEY
});

kxs.commands = new Map();
kxs.config = config;
kxs.logger = new Logger();

fs.readdirSync("./events").forEach(async (file: string) => {
	if (file.endsWith(".ts")) {
		try {
			const e = await import(`./events/${file}`);
			const event = e.event as EventType;
			kxs.on(event.name as any, (data: any) => event.handler(kxs, data))
		} catch (error) {
			kxs.logger.error(error)
		}
	}
})

fs.readdirSync("./commands").forEach(async (file: string) => {
	if (file.endsWith(".ts")) {
		try {
			const { command } = await import(`./commands/${file}`);
			kxs.commands.set(command.name, command);
		} catch (error) {
			kxs.logger.error(`Error loading command ${file}:`, error);
		}
	}
});

kxs.connect();