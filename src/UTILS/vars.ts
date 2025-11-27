import { SimplifiedDatabase } from "../DATABASE/simplified";
import { ClientConfig } from "../types/clientType";
import config from "../../config.json";

// @ts-ignore
import Kxs_O from '../assets/onboarding.html?raw';
// @ts-ignore
import Kxz_O from '../assets/onboarding_kxz.html?raw';
// @ts-ignore
import Kxc_O from '../assets/onboarding_kxc.html?raw';
// @ts-ignore
import Kxr_O from '../assets/onboarding_kxr.html?raw';

const CLIENT_REGISTRY: Record<string, ClientConfig> = {
	kxz: {
		name: "KxzClient",
		acronym_upper: "KXZ",
		acronym_start_upper: "Kxz",
		application_id: "1425487439547334808",
		rpc_assets: "mp:avatars/1425487439547334808/22119f9c9881a9543159952f481a89be?size=512",
		domains: ["zurviv.io", "eu-comp.zurviv.io"],
		full_logo: config.base_url + "/assets/KxzLogoFull.png",
		icon_logo: config.base_url + "/assets/KxzClientLogo.png",
		welcome_sound: "https://kxs.rip/assets/o_z_sound.mp3",
		options: {
			is_custom_background_enabled: false,
			is_dollar_sub_category_enable: false,
			is_background_music_enabled: false,
			is_game_history_enabled: false,
			is_counters_enable: false,
			is_waepon_border_enable: false,
			is_focus_mode_emable: false,
			is_health_bar_enable: false,
			is_discord_related_things_enable: true,
			is_spotify_player_enable: false,
			is_custom_crosshair_enabled: false,
			is_chroma_thingy_enabled: false,
			is_import_thingy_enabled: false,
			is_developer_options: false,
			is_friends_detector_enable: false,
			is_kill_leader_tracking_enable: true,
			is_brightness_enable: false
		},
		htmlCode: Kxz_O
	},
	kxc: {
		name: "KxcClient",
		acronym_upper: "KXC",
		acronym_start_upper: "Kxc",
		application_id: "1429750717450686535",
		rpc_assets: "mp:avatars/1429750717450686535/7cdebef07a65680c8b8e2de22e38ac51?size=512",
		domains: ["cursev.io"],
		full_logo: config.base_url + "/assets/KxcLogoFull.png",
		icon_logo: config.base_url + "/assets/KxcClientLogo.png",
		welcome_sound: "https://kxs.rip/assets/o_c_sound.mp3",
		options: {
			is_custom_background_enabled: false,
			is_dollar_sub_category_enable: true,
			is_background_music_enabled: false,
			is_game_history_enabled: true,
			is_counters_enable: true,
			is_waepon_border_enable: true,
			is_focus_mode_emable: true,
			is_health_bar_enable: true,
			is_discord_related_things_enable: true,
			is_spotify_player_enable: true,
			is_custom_crosshair_enabled: true,
			is_chroma_thingy_enabled: true,
			is_import_thingy_enabled: true,
			is_developer_options: true,
			is_friends_detector_enable: true,
			is_kill_leader_tracking_enable: true,
			is_brightness_enable: true
		},
		htmlCode: Kxc_O
	},
	kxs: {
		name: "KxsClient",
		acronym_upper: "KXS",
		acronym_start_upper: "Kxs",
		application_id: "1321193265533550602",
		rpc_assets: "mp:app-icons/1321193265533550602/bccd2479ec56ed7d4e69fa2fdfb47197.png?size=512",
		domains: true,
		full_logo: config.base_url + "/assets/KysClient.gif",
		icon_logo: config.base_url + "/assets/KysClientLogo.png",
		welcome_sound: "https://kxs.rip/assets/o_sound.mp3",
		options: {
			is_custom_background_enabled: true,
			is_dollar_sub_category_enable: true,
			is_background_music_enabled: true,
			is_game_history_enabled: true,
			is_counters_enable: true,
			is_waepon_border_enable: true,
			is_focus_mode_emable: true,
			is_health_bar_enable: true,
			is_discord_related_things_enable: true,
			is_spotify_player_enable: true,
			is_custom_crosshair_enabled: true,
			is_chroma_thingy_enabled: true,
			is_import_thingy_enabled: true,
			is_developer_options: true,
			is_friends_detector_enable: true,
			is_kill_leader_tracking_enable: true,
			is_brightness_enable: true
		},
		htmlCode: Kxs_O
	},
	kxr: {
		name: "KxrClient",
		acronym_upper: "KXR",
		acronym_start_upper: "Kxr",
		application_id: "1443348644580298842",
		rpc_assets: "mp:app-icons/1443348644580298842/686b62c3843ad74516ca81728ac50e6f.png?size=512",
		domains: ["resurviv.biz"],
		full_logo: config.base_url + "/assets/KxrLogoFull.png",
		icon_logo: config.base_url + "/assets/KxrClientLogo.png",
		welcome_sound: "https://kxs.rip/assets/o_r_sound.mp3",
		options: {
			is_custom_background_enabled: true,
			is_dollar_sub_category_enable: true,
			is_background_music_enabled: true,
			is_game_history_enabled: true,
			is_counters_enable: true,
			is_waepon_border_enable: true,
			is_focus_mode_emable: true,
			is_health_bar_enable: true,
			is_discord_related_things_enable: true,
			is_spotify_player_enable: true,
			is_custom_crosshair_enabled: true,
			is_chroma_thingy_enabled: true,
			is_import_thingy_enabled: true,
			is_developer_options: true,
			is_friends_detector_enable: true,
			is_kill_leader_tracking_enable: true,
			is_brightness_enable: true
		},
		htmlCode: Kxr_O
	},
};

function detectClientFromUrl(): ClientConfig {
	const href = window.location.href;
	let defaultClient: ClientConfig | null = null;

	// Extract the hostname from the URL
	const hostname = new URL(href).hostname;

	// First pass: look for clients with specific domains
	for (const config of Object.values(CLIENT_REGISTRY)) {
		// Identify the default client but don't return it yet
		if (config.domains === true) {
			defaultClient = config;
			continue; // Skip to next without returning
		}

		// Check if the hostname matches any of the specific domains
		if (Array.isArray(config.domains) && config.domains.some(domain => hostname.includes(domain))) {
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
export const kxs_logo = client.icon_logo;
export const full_logo = client.full_logo;
export const background_image = config.base_url + "/assets/background.jpg";
export const win_sound = config.base_url + "/assets/win.m4a";
export const death_sound = config.base_url + "/assets/dead.m4a";

export const survev_settings = new SimplifiedDatabase({
	database: "surviv_config",
});

export const kxs_settings = new SimplifiedDatabase({
	database: "userSettings"
});