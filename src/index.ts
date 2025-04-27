import "./UTILS/websocket-hook";

import { background_song, kxs_logo, full_logo, background_image } from "./UTILS/vars";
import { intercept } from "./MECHANIC/intercept";

import KxsClient from "./KxsClient";
import { LoadingScreen } from "./HUD/MOD/LoadingScreen";

import packageInfo from "../package.json";
import config from "../config.json";

intercept("audio/ambient/menu_music_01.mp3", background_song);
intercept('img/survev_logo_full.png', full_logo);

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

setTimeout(() => {
	loadingScreen.hide();
	const kxsClient = new KxsClient();
}, 1400);