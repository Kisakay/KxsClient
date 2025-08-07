import type { CommandType } from "../types/baseStructure";

export const command: CommandType = {
	name: "stop",
	description: "Stop the audio in voice chat",
	execute: (kxs, data, args) => {
		kxs.stopAudioSending();

		kxs.sendChatMessage("🎵 Stopped audio...");
	}
}