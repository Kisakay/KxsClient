import { SimplifiedSteganoDB } from "stegano.db/lib/simplified_browser";
import config from "../../config.json";

export const background_song = config.base_url + "/assets/Stranger_Things_Theme_Song_C418_REMIX.mp3";
export const gbl_sound = config.base_url + "/assets/blacklisted.m4a";
export const kxs_logo = config.base_url + "/assets/KysClientLogo.png";
export const full_logo = config.base_url + "/assets/KysClient.gif";
export const background_image = config.base_url + "/assets/background.jpg";
export const win_sound = config.base_url + "/assets/win.m4a";
export const death_sound = config.base_url + "/assets/dead.m4a";

export const survev_settings = new SimplifiedSteganoDB({
	database: "surviv_config",
});

export const kxs_settings = new SimplifiedSteganoDB({
	database: "userSettings"
});