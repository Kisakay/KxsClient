import { PlayerStats } from "../types/types";
class StatsParser {
	private static cleanNumber(str: string): number {
		return parseInt(str.replace(/[^\d.-]/g, "")) || 0;
	}

	/**
	 * Extract the full duration string including the unit
	 */
	private static extractDuration(str: string): string {
		const match = str.match(/(\d+\s*[smh])/i);
		return match ? match[1].trim() : "0s";
	}

	public static parse(statsText: string, rankContent: string): PlayerStats {
		let stats: PlayerStats = {
			username: "Player",
			kills: 0,
			damageDealt: 0,
			damageTaken: 0,
			duration: "",
			position: "#unknown",
		};

		// Handle developer format
		const devPattern =
			/Developer.*?Kills(\d+).*?Damage Dealt(\d+).*?Damage Taken(\d+).*?Survived(\d+\s*[smh])/i;
		const devMatch = statsText.match(devPattern);
		if (devMatch) {
			return {
				username: "Player",
				kills: this.cleanNumber(devMatch[1]),
				damageDealt: this.cleanNumber(devMatch[2]),
				damageTaken: this.cleanNumber(devMatch[3]),
				duration: devMatch[4].trim(), // Keep the full duration string with unit
				position: rankContent.replace("##", "#"),
			};
		}

		// Handle template format
		const templatePattern =
			/%username%.*?Kills%kills_number%.*?Dealt%number_dealt%.*?Taken%damage_taken%.*?Survived%duration%/;
		const templateMatch = statsText.match(templatePattern);
		if (templateMatch) {
			const parts = statsText.split(/Kills|Dealt|Taken|Survived/);
			if (parts.length >= 5) {
				return {
					username: parts[0].trim(),
					kills: this.cleanNumber(parts[1]),
					damageDealt: this.cleanNumber(parts[2]),
					damageTaken: this.cleanNumber(parts[3]),
					duration: this.extractDuration(parts[4]), // Extract full duration with unit
					position: rankContent.replace("##", "#"),
				};
			}
		}

		// Generic parsing as fallback
		const usernameMatch = statsText.match(/^([^0-9]+)/);
		if (usernameMatch) {
			stats.username = usernameMatch[1].trim();
		}

		const killsMatch = statsText.match(/Kills[^0-9]*(\d+)/i);
		if (killsMatch) {
			stats.kills = this.cleanNumber(killsMatch[1]);
		}

		const dealtMatch = statsText.match(/Dealt[^0-9]*(\d+)/i);
		if (dealtMatch) {
			stats.damageDealt = this.cleanNumber(dealtMatch[1]);
		}

		const takenMatch = statsText.match(/Taken[^0-9]*(\d+)/i);
		if (takenMatch) {
			stats.damageTaken = this.cleanNumber(takenMatch[1]);
		}

		// Extract survival time with unit
		const survivalMatch = statsText.match(/Survived[^0-9]*(\d+\s*[smh])/i);
		if (survivalMatch) {
			stats.duration = survivalMatch[1].trim();
		}

		stats.position = rankContent.replace("##", "#");
		return stats;
	}
}

export { StatsParser };
