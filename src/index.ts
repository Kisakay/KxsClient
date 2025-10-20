let href = window.location.href;

import "./UTILS/websocket-hook";
import "./HUD/KxsClientLogoReplacer";

import { background_song, kxs_logo, full_logo, background_image, survev_settings, kxs_settings } from "./UTILS/vars";
import { setFavicon } from "./UTILS/favicon";
import { intercept } from "./MECHANIC/intercept";

import { LoadingScreen } from "./HUD/MOD/LoadingScreen";
import { EasterEgg } from "./HUD/EasterEgg";

import { OnboardingModal } from './FUNC/Onboarding';
import KxsClient from "./KxsClient";

import { openCreditsWindow, showClickMeAnimation } from "./UTILS/credits-helper";
import { client } from "./UTILS/vars";

function loadKxs() {
	if (client.name == "KxzClient") localStorage.setItem("popupHidden", String(true));

	if (href === "https://kxs.rip/") {
		/*
			- Injecting Easter Egg
		*/
		const easterEgg = new EasterEgg();
	} else if (window.location.pathname === "/") {
		/*
			- Avoiding intercepting another page as the root page
		*/

		intercept("audio/ambient/menu_music_01.mp3", kxs_settings.get("soundLibrary.background_sound_url") || background_song);

		survev_settings.set("language", "en");

		if (localStorage.getItem("on_boarding_complete") !== "yes") {
			window.addEventListener('load', () => {
				queueMicrotask(() => {
					requestAnimationFrame(() => {
						const onboardingModal = new OnboardingModal();
						onboardingModal.show();
					});
				});
			});
		}

		const loadingScreen = new LoadingScreen(kxs_logo);
		loadingScreen.show();

		const backgroundElement = document.getElementById("background");

		if (backgroundElement && (
			!kxs_settings.has("isCustomBackgroundEnabled") ||
			kxs_settings.get("isCustomBackgroundEnabled") === true
			&& client.options.is_custom_background_enabled
		)
		) {
			setTimeout(() => {
				backgroundElement.style.backgroundImage = `url("${background_image}")`
			}, 2900);
		}

		setFavicon(kxs_logo);

		try {
			const kxsClient = new KxsClient();
		} catch {
		}

		document.title = global.client.name;

		const uiStatsLogo = document.querySelector('#ui-stats-logo') as HTMLElement | null;
		if (uiStatsLogo && kxs_settings.get("isKxsClientLogoEnable") === true) {
			uiStatsLogo.style.backgroundImage = `url('${full_logo}')`;
		}

		const startBottomMiddle = document.getElementById("start-bottom-middle");
		if (startBottomMiddle) {
			const links = startBottomMiddle.getElementsByTagName("a");

			if (links.length > 0) {
				const firstLink = links[0];
				firstLink.removeAttribute('href');
				firstLink.style.cursor = 'pointer';
				firstLink.textContent = kxsClient.pkg.version;

				firstLink.addEventListener('click', (e) => {
					e.preventDefault();
					openCreditsWindow();
					// Hide the animation when clicked
					const animation = document.getElementById('click-me-animation');
					if (animation) {
						animation.style.animation = 'fadeOut 0.3s ease-in forwards';
						setTimeout(() => {
							if (animation.parentNode) {
								animation.parentNode.removeChild(animation);
							}
						}, 300);
					}
				});

				// Remove additional links
				while (links.length > 1) {
					links[1].remove();
				}
			}
		}

		setTimeout(() => {
			loadingScreen.hide();

			setTimeout(() => {
				showClickMeAnimation();
			}, 500);
		}, 1400);
	}
}

loadKxs()