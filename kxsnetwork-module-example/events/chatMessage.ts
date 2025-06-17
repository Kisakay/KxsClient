import type { EventType } from "../types/baseStructure";

export const event: EventType = {
	name: "chatMessage",
	handler: (kxs, data) => {
		// Skip processing our own messages
		if (data.ok === true) return;
		// Skip processing if the message is not a command
		if (!data.text || !data.text.startsWith(kxs.config.BOT_PREFIX)) return;
		// Skip processing if the message author is me
		if (data.user === kxs.currentUsername) return;

		// Check if the message is a command (starts with prefix)
		if (data.text && data.text.startsWith(kxs.config.BOT_PREFIX)) {
			const args = data.text.slice(kxs.config.BOT_PREFIX.length).trim().split(/\s+/);
			const command_name = args.shift().toLowerCase();

			if (kxs.commands.has(command_name)) {
				const command = kxs.commands.get(command_name);
				try {
					command?.execute(kxs, data, args);
				} catch (error) {
					kxs.logger.error(`Error executing command ${command_name}:`, error);
					kxs.sendChatMessage(`Error executing command ${command_name}`);
				}
			}
		}

		// kxs.logger.log("Chat message:", data);
		/*
Chat message: {
  user: "kxs.rip",
  text: "wesh",
  timestamp: 1749824841520,
}
		*/
	}
}