import { SimplifiedDatabase } from "../DATABASE/simplified";
import { Client, ClientType } from "../types/clientType";
import config from "../../config.json";

export const client: Client = {
	type: window.location.href.includes("zurviv.io/") ? ClientType.KxzClient : ClientType.KxsClient,
	name: window.location.href.includes("zurviv.io/") ? "KxzClient" : "KxsClient",
	acronym_upper: window.location.href.includes("zurviv.io/") ? "KXZ" : "KXS",
	acronym_start_upper: window.location.href.includes("zurviv.io/") ? "Kxz" : "Kxs",
}

global.client = client;

export const background_song = config.base_url + "/assets/Stranger_Things_Theme_Song_C418_REMIX.mp3";
export const gbl_sound = config.base_url + "/assets/blacklisted.m4a";
export const kxs_logo = client.type === 1 ? config.base_url + "/assets/KysClientLogo.png" : "https://media.discordapp.net/attachments/1361376996898242730/1425164786580193291/78noTIE.png?ex=68e697a3&is=68e54623&hm=b9ff65c4d4f841217323b35c8df2abc85a87dd0b271b0c951b9469898025154c&=&format=webp&quality=lossless&width=933&height=933"
export const full_logo = client.type === 1 ? config.base_url + "/assets/KysClient.gif" : 'https://media.discordapp.net/attachments/1361376996898242730/1425164787041570856/27ECTQl.png?ex=68e697a3&is=68e54623&hm=4c7b02110fce7c613f770533002172c36dd8120f63218eb1f554082c9a9e021f&=&format=webp&quality=lossless&width=1707&height=820'
export const background_image = config.base_url + "/assets/background.jpg";
export const win_sound = config.base_url + "/assets/win.m4a";
export const death_sound = config.base_url + "/assets/dead.m4a";

export const survev_settings = new SimplifiedDatabase({
	database: "surviv_config",
});

export const kxs_settings = new SimplifiedDatabase({
	database: "userSettings"
});