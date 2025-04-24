// import { KxsMainClientMenu } from "./ClientMainMenu";
import { intercept } from "./MECHANIC/intercept";

import KxsClient from "./KxsClient";
import { LoadingScreen } from "./HUD/MOD/LoadingScreen";

import packageInfo from "../package.json";
import config from "../config.json";

export const background_song = config.base_url + "/assets/Stranger_Things_Theme_Song_C418_REMIX.mp3";
export const kxs_logo = config.base_url + "/assets/KysClientLogo.png";
export const full_logo = config.base_url + "/assets/KysClient.gif";
export const background_image = config.base_url + "/assets/background.jpg";
export const win_sound = config.base_url + "/assets/win.m4a";
export const death_sound = config.base_url + "/assets/dead.m4a";

const loadingScreen = new LoadingScreen(kxs_logo);
loadingScreen.show();

const backgroundElement = document.getElementById("background");
if (backgroundElement) backgroundElement.style.backgroundImage = `url("${background_image}")`;

const favicon = document.createElement('link');
favicon.rel = 'icon';
favicon.type = 'image/png';
favicon.href = kxs_logo
document.head.appendChild(favicon);
document.title = "KxsClient";

intercept("audio/ambient/menu_music_01.mp3", background_song);
intercept('img/survev_logo_full.png', full_logo);

const uiStatsLogo = document.querySelector('#ui-stats-logo') as HTMLElement | null;
if (uiStatsLogo) {
	uiStatsLogo.style.backgroundImage = `url('${full_logo}')`;
}
const newChangelogUrl = config.base_url;
const startBottomMiddle = document.getElementById("start-bottom-middle");

if (startBottomMiddle) {
	const links = startBottomMiddle.getElementsByTagName("a");

	for (let i = 0; i < links.length; i++) {
		const link = links[i];

		if (link.href.includes("changelogRec.html") || link.href.includes("changelog.html")) {
			link.href = newChangelogUrl;
			link.textContent = packageInfo.version;
		}
		if (i === 1) {
			link.remove();
		}
	}
}


const kxsClient = new KxsClient();
// const mainMenu = new KxsMainClientMenu(kxsClient);

setInterval(() => {
	loadingScreen.hide();
}, 1400);