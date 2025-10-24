export interface GameResult {
	username: string,
	kills: string | number,
	damageDealt: number,
	damageTaken: number,
	duration: string,
	position: string,
	isWin: boolean,
	stuff?: Stuffs
}

export interface Stuffs {
	main_weapon: string,
	secondary_weapon: string,
	soda: string,
	melees: string,
	grenades: string,
	medkit: string,
	bandage: string,
	pills: string,
	backpack: string,
	chest: string,
	helmet: string
}

export interface DiscordWebhookMessage {
	username: string;
	content: string;
	embeds?: DiscordAPIEmbedStructure[]
	avatar_url: string;
}

export interface DiscordAPIEmbedStructure {
	title: string;
	description: string;
	color: number;
	fields: DiscordAPIEmbedField[];
}

export interface DiscordAPIEmbedField {
	name: string;
	value: string;
	inline?: boolean;
}