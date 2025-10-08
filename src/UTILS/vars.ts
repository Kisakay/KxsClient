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