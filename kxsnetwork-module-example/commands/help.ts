import { sleep } from "bun";
import type { CommandType } from "../types/baseStructure";

export const command: CommandType = {
	name: "help",
	description: "Show help message",
	execute: async (kxs, data, args) => {
		kxs.sendChatMessage("Here are the available commands:");

		for (const command of kxs.commands.values()) {
			await sleep(1000);
			kxs.sendChatMessage(`${kxs.config.BOT_PREFIX}${command.name} - ${command.description}`);
		}
	}
}