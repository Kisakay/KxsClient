import type { CommandType } from "../types/baseStructure";
import { execSync } from "child_process";
import fs from "node:fs";
import path from "node:path";

export const command: CommandType = {
	name: "play",
	description: "Play a YouTube video's audio in voice chat",
	execute: (kxs, data, args) => {
		if (args.length === 0) {
			kxs.sendChatMessage("Please provide a YouTube URL or search term");
			return;
		}

		const query = args.join(" ");
		const is_url = query.startsWith("http");
		
		// Create music directory if it doesn't exist
		const music_dir = path.join(process.cwd(), "music");
		if (!fs.existsSync(music_dir)) {
			fs.mkdirSync(music_dir, { recursive: true });
		}

		// Generate a unique filename based on timestamp
		const timestamp = Date.now();
		const output_file = path.join(music_dir, `${timestamp}.m4a`);

		// Notify that download is starting
		kxs.sendChatMessage(`🔍 ${is_url ? "Downloading" : "Searching for"} audio...`);

		try {
			// Prepare yt-dlp command
			let yt_dlp_command = `yt-dlp --extract-audio --audio-format m4a --audio-quality 0 --output "${output_file}" --no-playlist --no-warnings`;
			
			// If it's not a URL, treat it as a search term
			if (!is_url) {
				yt_dlp_command += ` "ytsearch1:${query}"`; // Get first search result
			} else {
				yt_dlp_command += ` "${query}"`; // Use the URL directly
			}

			// Execute yt-dlp synchronously
			const output = execSync(yt_dlp_command, { encoding: 'utf8' });
			
			// Try to extract the video title from yt-dlp output
			let video_title = "Audio";
			const title_match = output.match(/(?:\[download\]|Destination:)\s+(.+?)(?:\s+\[|$)/);
			if (title_match && title_match[1]) {
				video_title = title_match[1].trim();
			}

			// Download successful
			kxs.sendChatMessage(`🎵 Now playing: ${video_title}`);
			
			// Play the downloaded file
			kxs.playFile(output_file);
			
			// Optional: Delete the file after playing (uncomment if needed)
			// setTimeout(() => {
			//     if (fs.existsSync(output_file)) {
			//         fs.unlinkSync(output_file);
			//     }
			// }, 300000); // Delete after 5 minutes
		} catch (error) {
			// Download failed
			console.error("yt-dlp error:", error);
			kxs.sendChatMessage("❌ Failed to download audio. Please check the URL or try a different video.");
		}
	}
}