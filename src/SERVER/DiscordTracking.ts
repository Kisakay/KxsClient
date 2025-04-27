import { kxs_logo } from "../UTILS/vars";
import KxsClient from "../KxsClient";

interface GameResult {
	username: string;
	isWin: boolean;
	kills: number;
	damageDealt?: number;
	damageTaken?: number;
	duration: string;
	position: string;
	stuff?: {
		main_weapon: string | null | undefined;
		secondary_weapon: string | null | undefined;
		grenades: string | null | undefined;
		melees: string | null | undefined
		soda: string | null | undefined;
		medkit: string | null | undefined;
		bandage: string | null | undefined;
		pills: string | null | undefined;
		backpack: string | null | undefined;
		chest: string | null | undefined;
		helmet: string | null | undefined;
	};
}

interface DiscordWebhookMessage {
	username: string;
	content: string;
	embeds?: Array<{
		title: string;
		description: string;
		color: number;
		fields: Array<{
			name: string;
			value: string;
			inline?: boolean;
		}>;
	}>;
	avatar_url: string;
}

const stuff_emojis = {
	main_weapon: "🔫",
	secondary_weapon: "🔫",
	grenades: "💣",
	melees: "🔪",
	soda: "🥤",
	medkit: "🩹",
	bandage: "🩹",
	pills: "💊",
	backpack: "🎒",
	chest: "📦",
	helmet: "⛑️"
}

class WebhookValidator {

	public static isValidWebhookUrl(url: string): boolean {
		return url.startsWith("https://")
	}

	public static async isWebhookAlive(webhookUrl: string): Promise<boolean> {
		try {
			// First check if the URL format is valid
			if (!this.isValidWebhookUrl(webhookUrl)) {
				throw new Error("Invalid webhook URL format");
			}

			// Test the webhook with a GET request (Discord allows GET on webhooks)
			const response = await fetch(webhookUrl, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			});

			// Discord returns 200 for valid webhooks
			return response.status === 200;
		} catch (error) {
			return false;
		}
	}

	public static async testWebhook(webhookUrl: string): Promise<{
		isValid: boolean;
		message: string;
	}> {
		try {
			if (!webhookUrl) {
				return {
					isValid: false,
					message: "Please enter a webhook URL",
				};
			}

			if (!this.isValidWebhookUrl(webhookUrl)) {
				return {
					isValid: false,
					message: "Invalid Discord webhook URL format",
				};
			}

			const isAlive = await this.isWebhookAlive(webhookUrl);

			return {
				isValid: isAlive,
				message: isAlive
					? "Webhook is valid and working!"
					: "Webhook is not responding or has been deleted",
			};
		} catch (error) {
			return {
				isValid: false,
				message: "Error testing webhook connection",
			};
		}
	}
}

class DiscordTracking {
	private webhookUrl: string;
	kxsClient: KxsClient;

	constructor(kxsClient: KxsClient, webhookUrl: string) {
		this.kxsClient = kxsClient;
		this.webhookUrl = webhookUrl;
	}

	public setWebhookUrl(webhookUrl: string): void {
		this.webhookUrl = webhookUrl;
	}

	public async validateCurrentWebhook(): Promise<boolean> {
		return WebhookValidator.isWebhookAlive(this.webhookUrl);
	}

	private async sendWebhookMessage(
		message: DiscordWebhookMessage,
	): Promise<void> {
		if (!WebhookValidator.isValidWebhookUrl(this.webhookUrl)) {
			return;
		}

		this.kxsClient.nm.showNotification("Sending Discord message...", "info", 2300);
		try {
			const response = await fetch(this.webhookUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(message),
			});

			if (!response.ok) {
				throw new Error(`Discord Webhook Error: ${response.status}`);
			}
		} catch (error) {
			this.kxsClient.logger.error("Error sending Discord message:", error);
		}
	}

	private getEmbedColor(isWin: boolean): number {
		return isWin ? 0x2ecc71 : 0xe74c3c; // Green for victory, red for defeat
	}

	public async trackGameEnd(result: GameResult): Promise<void> {
		const title = result.isWin
			? "🏆 VICTORY ROYALE!"
			: `${result.position} - Game Over`;

		const embed = {
			title,
			description: `${result.username}'s Match`,
			color: this.getEmbedColor(result.isWin),
			fields: [
				{
					name: "💀 Eliminations",
					value: result.kills.toString(),
					inline: true,
				},
			],
		};

		if (result.duration) {
			embed.fields.push({
				name: "⏱️ Duration",
				value: result.duration,
				inline: true,
			});
		}

		if (result.damageDealt) {
			embed.fields.push({
				name: "💥 Damage Dealt",
				value: Math.round(result.damageDealt).toString(),
				inline: true,
			});
		}

		if (result.damageTaken) {
			embed.fields.push({
				name: "💢 Damage Taken",
				value: Math.round(result.damageTaken).toString(),
				inline: true,
			});
		}

		if (result.username) {
			embed.fields.push({
				name: "📝 Username",
				value: result.username,
				inline: true,
			});
		}

		if (result.stuff) {
			for (const [key, value] of Object.entries(result.stuff) as [keyof typeof stuff_emojis, string | null | undefined][]) {
				if (value) {
					embed.fields.push({
						name: `${stuff_emojis[key]} ${key.replace("_", " ").toUpperCase()}`,
						value,
						inline: true,
					});
				}
			}
		}

		const message: DiscordWebhookMessage = {
			username: "KxsClient",
			avatar_url: kxs_logo,
			content: result.isWin ? "🎉 New Victory!" : "Match Ended",
			embeds: [embed],
		};

		await this.sendWebhookMessage(message);
	}
}

export { DiscordTracking, type GameResult, WebhookValidator };
