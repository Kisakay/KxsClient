import { SimplifiedDatabase } from "../DATABASE/simplified";
import { Client, ClientType } from "../types/clientType";
import config from "../../config.json";

let href = window.location.href;
let is_z = href.includes("zurviv.io");

export const client: Client = {
	type: is_z ? ClientType.KxzClient : ClientType.KxsClient,
	name: is_z ? "KxzClient" : "KxsClient",
	acronym_upper: is_z ? "KXZ" : "KXS",
	acronym_start_upper: is_z ? "Kxz" : "Kxs",
	application_id: is_z ? "1425487439547334808" : "1321193265533550602",
	rpc_assets: is_z ? "mp:avatars/1425487439547334808/22119f9c9881a9543159952f481a89be?size=512" : "mp:app-icons/1321193265533550602/bccd2479ec56ed7d4e69fa2fdfb47197.png?size=512"
}

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