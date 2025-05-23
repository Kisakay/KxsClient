import "./UTILS/websocket-hook";

import { background_song, kxs_logo, full_logo, background_image, survev_settings, kxs_settings } from "./UTILS/vars";
import { intercept } from "./MECHANIC/intercept";

import KxsClient from "./KxsClient";
import { LoadingScreen } from "./HUD/MOD/LoadingScreen";

import packageInfo from "../package.json";
import config from "../config.json";
import { EasterEgg } from "./HUD/EasterEgg";


if (window.location.href === "https://kxs.rip/") {
	/*
		- Injecting Easter Egg
	*/
	const easterEgg = new EasterEgg();
} else if (window.location.pathname === "/") {
	/*
		- Avoiding intercepting another page as the root page
	*/

	intercept("audio/ambient/menu_music_01.mp3", background_song);
	if (kxs_settings.get("isKxsClientLogoEnable") === true) {
		intercept('img/survev_logo_full.png', full_logo)
	};

	survev_settings.set("language", "en");

	const kxsClient = new KxsClient();

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

		if (links.length > 0) {
			const firstLink = links[0];
			firstLink.href = newChangelogUrl;
			firstLink.textContent = packageInfo.version;

			while (links.length > 1) {
				links[1].remove();
			}
		}
	}

	setTimeout(() => {
		loadingScreen.hide();

	}, 1400);
}