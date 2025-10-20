import { SimplifiedDatabase } from "../DATABASE/simplified";
import { ClientConfig, ClientType } from "../types/clientType";
import config from "../../config.json";

const CLIENT_REGISTRY: Record<string, ClientConfig> = {
	kxz: {
		type: ClientType.KxzClient,
		name: "KxzClient",
		acronym_upper: "KXZ",
		acronym_start_upper: "Kxz",
		application_id: "1425487439547334808",
		rpc_assets: "mp:avatars/1425487439547334808/22119f9c9881a9543159952f481a89be?size=512",
		domains: ["zurviv.io"]
	},
	kxc: {
		type: ClientType.KxcClient,
		name: "KxcClient",
		acronym_upper: "KXC",
		acronym_start_upper: "Kxc",
		application_id: "1429750717450686535",
		rpc_assets: "mp:avatars/1429750717450686535/fa4d8b71aa1ecd6518ad6fbc456f63ee?size=512",
		domains: ["cursev.io"]
	},
	kxs: {
		type: ClientType.KxsClient,
		name: "KxsClient",
		acronym_upper: "KXS",
		acronym_start_upper: "Kxs",
		application_id: "1321193265533550602",
		rpc_assets: "mp:app-icons/1321193265533550602/bccd2479ec56ed7d4e69fa2fdfb47197.png?size=512",
		domains: true
	},
};

function detectClientFromUrl(): ClientConfig {
	const href = window.location.href;
	let defaultClient: ClientConfig | null = null;

	// First pass: look for clients with specific domains
	for (const config of Object.values(CLIENT_REGISTRY)) {
		// Identify the default client but don't return it yet
		if (config.domains === true) {
			defaultClient = config;
			continue; // Skip to next without returning
		}

		// Check if the URL matches any of the specific domains
		if (Array.isArray(config.domains) && config.domains.some(domain => href.includes(domain))) {
			return config; // Return immediately if a domain matches
		}
	}

	// Second pass: if no specific domain matches, use the default
	if (defaultClient) {
		return defaultClient;
	}

	// If no default client is configured
	throw new Error("No client configured as default (domains: true)");
}

export const client = detectClientFromUrl();

global.client = client;

export const background_song = config.base_url + "/assets/Stranger_Things_Theme_Song_C418_REMIX.mp3";
export const gbl_sound = config.base_url + "/assets/blacklisted.m4a";
export const kxs_logo = client.type === 1 ? config.base_url + "/assets/KysClientLogo.png" : config.base_url + "/assets/KxzClientLogo.png"
export const full_logo = client.type === 1 ? config.base_url + "/assets/KysClient.gif" : config.base_url + "/assets/KxzLogoFull.png"
export const background_image = config.base_url + "/assets/background.jpg";
export const win_sound = config.base_url + "/assets/win.m4a";
export const death_sound = config.base_url + "/assets/dead.m4a";

export const survev_settings = new SimplifiedDatabase({
	database: "surviv_config",
});

export const kxs_settings = new SimplifiedDatabase({
	database: "userSettings"
});