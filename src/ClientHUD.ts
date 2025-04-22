import KxsClient from "./KxsClient";
import { PingTest } from "./Ping";

interface HealthChangeAnimation {
	element: HTMLElement;
	startTime: number;
	duration: number;
	value: number;
}

interface CounterPosition {
	left: number;
	top: number;
}

class KxsClientHUD {
	private animatedCursorImg?: HTMLImageElement;
	private _mousemoveHandler?: (e: MouseEvent) => void;
	frameCount: number;
	fps: number;
	kills: number;
	private pingManager: PingTest;
	isMenuVisible: boolean;
	kxsClient: KxsClient;
	private healthAnimations: HealthChangeAnimation[] = [];
	private lastHealthValue: number = 100;
	private customCursorObserver?: MutationObserver;
	private hudOpacityObservers: MutationObserver[] = [];
	private ctrlFocusTimer: number | null = null;
	private allDivToHide: string[];

	constructor(kxsClient: KxsClient) {
		this.kxsClient = kxsClient;
		this.frameCount = 0;
		this.fps = 0;
		this.kills = 0;
		this.isMenuVisible = true;
		this.pingManager = new PingTest();
		this.allDivToHide = [
			'#ui-medical-interactive > div',
			'#ui-ammo-interactive > div',
			'#ui-weapon-container .ui-weapon-switch',
			'#ui-killfeed',
			'#ui-killfeed-contents',
			'.killfeed-div',
			'.killfeed-text',
			'#ui-kill-leader-container',
			'#ui-kill-leader-wrapper',
			'#ui-kill-leader-name',
			'#ui-kill-leader-icon',
			'#ui-kill-leader-count',
			'#ui-leaderboard-wrapper',
			'#ui-leaderboard',
			'#ui-leaderboard-alive',
			'#ui-leaderboard-alive-faction',
			'.ui-leaderboard-header',
			'#ui-kill-counter-wrapper',
			'#ui-kill-counter',
			'.ui-player-kills',
			'.ui-kill-counter-header',
			'#ui-bottom-center-right',
			'#ui-armor-helmet',
			'#ui-armor-chest',
			'#ui-armor-backpack',
			'.ui-armor-counter',
			'.ui-armor-counter-inner',
			'.ui-armor-level',
			'.ui-armor-image',
			'.ui-loot-image',
		];

		if (this.kxsClient.isPingVisible) {
			this.initCounter("ping", "Ping", "45ms");
		}
		if (this.kxsClient.isFpsVisible) {
			this.initCounter("fps", "FPS", "60");
		}
		if (this.kxsClient.isKillsVisible) {
			this.initCounter("kills", "Kills", "0");
		}

		if (this.kxsClient.isGunOverlayColored) {
			this.toggleWeaponBorderHandler();
		}

		this.startUpdateLoop();
		this.escapeMenu();
		this.initFriendDetector();

		if (this.kxsClient.isKillFeedBlint) {
			if (document.readyState === 'loading') {
				document.addEventListener('DOMContentLoaded', this.initKillFeed);
			} else {
				this.initKillFeed()
			}
		}

		if (this.kxsClient.customCrosshair !== null) {
			this.loadCustomCrosshair();
		}

		this.setupCtrlFocusModeListener();
	}

	private setupCtrlFocusModeListener() {
		document.addEventListener('keydown', (e) => {
			if (e.code === 'ControlLeft' && !this.ctrlFocusTimer) {
				this.ctrlFocusTimer = window.setTimeout(() => {
					this.kxsClient.isFocusModeEnabled = !this.kxsClient.isFocusModeEnabled;
					this.kxsClient.hud.toggleFocusMode();
					this.kxsClient.nm.showNotification("Focus mode toggled", "info", 1200)
				}, 1000);
			}
		});

		document.addEventListener('keyup', (e) => {
			if (e.code === 'ControlLeft' && this.ctrlFocusTimer) {
				clearTimeout(this.ctrlFocusTimer);
				this.ctrlFocusTimer = null;
			}
		});
	}

	private initFriendDetector() {
		// Initialize friends list
		let all_friends = this.kxsClient.all_friends.split(',') || [];

		if (all_friends.length >= 1) {
			// Create a cache for detected friends
			// Structure will be: { "friendName": timestamp }
			const friendsCache = {};
			// Cache duration in milliseconds (4 minutes = 240000 ms)
			const cacheDuration = 4 * 60 * 1000;

			// Select the element containing kill feeds
			const killfeedContents = document.querySelector('#ui-killfeed-contents');

			if (killfeedContents) {
				// Keep track of last seen content for each div
				const lastSeenContent = {
					"ui-killfeed-0": "",
					"ui-killfeed-1": "",
					"ui-killfeed-2": "",
					"ui-killfeed-3": "",
					"ui-killfeed-4": "",
					"ui-killfeed-5": ""
				};

				// Function to check if a friend is in the text with cache management
				const checkForFriends = (text: string, divId: string) => {
					// If the text is identical to the last seen, ignore
					// @ts-ignore
					if (text === lastSeenContent[divId]) return;

					// Update the last seen content
					// @ts-ignore
					lastSeenContent[divId] = text;

					// Ignore empty messages
					if (!text.trim()) return;

					// Current timestamp
					const currentTime = Date.now();

					// Check if a friend is mentioned
					for (let friend of all_friends) {
						if (friend !== "" && text.includes(friend)) {
							// Check if the friend is in the cache and if the cache is still valid
							// @ts-ignore
							const lastSeen = friendsCache[friend];
							if (!lastSeen || (currentTime - lastSeen > cacheDuration)) {
								// Update the cache
								// @ts-ignore
								friendsCache[friend] = currentTime;

								// Display notification
								this.kxsClient.nm.showNotification(
									`[FriendDetector] ${friend} is in this game`,
									"info",
									2300
								);
							}
							break;
						}
					}
				};

				// Function to check all kill feeds
				const checkAllKillfeeds = () => {
					all_friends = this.kxsClient.all_friends.split(',') || [];

					for (let i = 0; i <= 5; i++) {
						const divId = `ui-killfeed-${i}`;
						const killDiv = document.getElementById(divId);

						if (killDiv) {
							const textElement = killDiv.querySelector('.killfeed-text');
							if (textElement && textElement.textContent) {
								checkForFriends(textElement.textContent, divId);
							}
						}
					}
				};

				// Observe style or text changes in the entire container
				const observer = new MutationObserver(() => {
					checkAllKillfeeds();
				});

				// Start observing with a configuration that detects all changes
				observer.observe(killfeedContents, {
					childList: true,    // Observe changes to child elements
					subtree: true,      // Observe the entire tree
					characterData: true, // Observe text changes
					attributes: true    // Observe attribute changes (like style/opacity)
				});

				// Check current content immediately
				checkAllKillfeeds();
			} else {
				this.kxsClient.logger.error("Killfeed-contents element not found");
			}
		}
	}

	private initKillFeed() {
		this.applyCustomStyles();
		this.setupObserver();
	}

	public toggleKillFeed() {
		if (this.kxsClient.isKillFeedBlint) {
			this.initKillFeed(); // <-- injecte le CSS custom et observer
		} else {
			this.resetKillFeed(); // <-- supprime styles et contenu
		}
	}
	/**
	 * Réinitialise le Kill Feed à l'état par défaut (vide)
	 */
	/**
	 * Supprime tous les styles custom KillFeed injectés par applyCustomStyles
	 */
	private resetKillFeedStyles() {
		// Supprime tous les <style> contenant .killfeed-div ou .killfeed-text
		const styles = Array.from(document.head.querySelectorAll('style'));
		styles.forEach(style => {
			if (style.textContent &&
				(style.textContent.includes('.killfeed-div') || style.textContent.includes('.killfeed-text'))
			) {
				style.remove();
			}
		});
	}

	public observeHudOpacity(opacity: number) {
		// Nettoie d'abord les observers existants
		this.hudOpacityObservers.forEach(obs => obs.disconnect());
		this.hudOpacityObservers = [];

		this.allDivToHide.forEach(sel => {
			const elements = document.querySelectorAll(sel);
			elements.forEach(el => {
				(el as HTMLElement).style.opacity = String(opacity);

				// Applique aussi l'opacité à tous les descendants
				const descendants = (el as HTMLElement).querySelectorAll('*');
				descendants.forEach(child => {
					(child as HTMLElement).style.opacity = String(opacity);
				});

				// Observer pour le parent
				const observer = new MutationObserver(mutations => {
					mutations.forEach(mutation => {
						if (
							mutation.type === "attributes" &&
							mutation.attributeName === "style"
						) {
							const currentOpacity = (el as HTMLElement).style.opacity;
							if (currentOpacity !== String(opacity)) {
								(el as HTMLElement).style.opacity = String(opacity);
							}
							// Vérifie aussi les enfants
							const descendants = (el as HTMLElement).querySelectorAll('*');
							descendants.forEach(child => {
								if ((child as HTMLElement).style.opacity !== String(opacity)) {
									(child as HTMLElement).style.opacity = String(opacity);
								}
							});
						}
					});
				});
				observer.observe(el, { attributes: true, attributeFilter: ["style"] });
				this.hudOpacityObservers.push(observer);

				// Observer pour chaque enfant (optionnel mais robuste)
				descendants.forEach(child => {
					const childObserver = new MutationObserver(mutations => {
						mutations.forEach(mutation => {
							if (
								mutation.type === "attributes" &&
								mutation.attributeName === "style"
							) {
								if ((child as HTMLElement).style.opacity !== String(opacity)) {
									(child as HTMLElement).style.opacity = String(opacity);
								}
							}
						});
					});
					childObserver.observe(child, { attributes: true, attributeFilter: ["style"] });
					this.hudOpacityObservers.push(childObserver);
				});
			});
		});


	}


	public toggleFocusMode() {
		if (this.kxsClient.isFocusModeEnabled) {
			this.observeHudOpacity(0.05);
		} else {
			// 1. Stoppe tous les observers
			this.hudOpacityObservers.forEach(obs => obs.disconnect());
			this.hudOpacityObservers = [];

			this.allDivToHide.forEach(sel => {
				const elements = document.querySelectorAll(sel);
				elements.forEach(el => {
					(el as HTMLElement).style.removeProperty('opacity');
					// Supprime aussi sur tous les enfants
					const descendants = (el as HTMLElement).querySelectorAll('*');
					descendants.forEach(child => {
						(child as HTMLElement).style.removeProperty('opacity');
					});
				});
			});
		}
	}


	public resetKillFeed() {
		// Supprime les styles custom KillFeed
		this.resetKillFeedStyles();

		// Sélectionne le container du killfeed
		const killfeedContents = document.getElementById('ui-killfeed-contents');
		if (killfeedContents) {
			// Vide tous les killfeed-div et killfeed-text
			killfeedContents.querySelectorAll('.killfeed-div').forEach(div => {
				const text = div.querySelector('.killfeed-text');
				if (text) (text as HTMLElement).textContent = '';
				(div as HTMLElement).style.opacity = '0';
			});
		}
	}

	public loadCustomCrosshair() {
		const url = this.kxsClient.customCrosshair;

		// Supprime l'ancienne règle si elle existe
		const styleId = 'kxs-custom-cursor-style';
		const oldStyle = document.getElementById(styleId);
		if (oldStyle) oldStyle.remove();

		// Débranche l'ancien observer s'il existe
		if (this.customCursorObserver) {
			this.customCursorObserver.disconnect();
			this.customCursorObserver = undefined;
		}

		// Réinitialise le curseur si pas d'URL
		if (!url) {
			// Supprime l'image animée si présente
			if (this.animatedCursorImg) {
				this.animatedCursorImg.remove();
				this.animatedCursorImg = undefined;
			}

			// Supprime le style CSS qui cache le curseur natif
			const hideCursorStyle = document.getElementById('kxs-hide-cursor-style');
			if (hideCursorStyle) hideCursorStyle.remove();

			// Supprime le style CSS du curseur personnalisé
			const customCursorStyle = document.getElementById('kxs-custom-cursor-style');
			if (customCursorStyle) customCursorStyle.remove();

			// Retire l'eventListener mousemove si défini
			if (this._mousemoveHandler) {
				document.removeEventListener('mousemove', this._mousemoveHandler);
				this._mousemoveHandler = undefined;
			}

			document.body.style.cursor = '';
			return;
		}

		// Curseur animé JS : gestion d'un GIF
		const isGif = url.split('?')[0].toLowerCase().endsWith('.gif');
		// Nettoyage si on repasse sur un non-GIF
		if (this.animatedCursorImg) {
			this.animatedCursorImg.remove();
			this.animatedCursorImg = undefined;
		}
		if (this._mousemoveHandler) {
			document.removeEventListener('mousemove', this._mousemoveHandler);
			this._mousemoveHandler = undefined;
		}
		if (isGif) {
			// Ajoute une règle CSS globale pour cacher le curseur natif partout
			let hideCursorStyle = document.getElementById('kxs-hide-cursor-style') as HTMLStyleElement | null;
			if (!hideCursorStyle) {
				hideCursorStyle = document.createElement('style');
				hideCursorStyle.id = 'kxs-hide-cursor-style';
				hideCursorStyle.innerHTML = `
			* { cursor: none !important; }
			*:hover { cursor: none !important; }
			*:active { cursor: none !important; }
			*:focus { cursor: none !important; }
			input, textarea { cursor: none !important; }
			a, button, [role="button"], [onclick] { cursor: none !important; }
			[draggable="true"] { cursor: none !important; }
			[style*="cursor: pointer"] { cursor: none !important; }
			[style*="cursor: text"] { cursor: none !important; }
			[style*="cursor: move"] { cursor: none !important; }
			[style*="cursor: crosshair"] { cursor: none !important; }
			[style*="cursor: ew-resize"] { cursor: none !important; }
			[style*="cursor: ns-resize"] { cursor: none !important; }
		`;
				document.head.appendChild(hideCursorStyle);
			}
			const animatedImg = document.createElement('img');
			animatedImg.src = url;
			animatedImg.style.position = 'fixed';
			animatedImg.style.pointerEvents = 'none';
			animatedImg.style.zIndex = '99999';
			animatedImg.style.width = '38px';
			animatedImg.style.height = '38px';
			animatedImg.style.left = '0px';
			animatedImg.style.top = '0px';
			this.animatedCursorImg = animatedImg;
			document.body.appendChild(animatedImg);
			this._mousemoveHandler = (e: MouseEvent) => {
				if (this.animatedCursorImg) {
					this.animatedCursorImg.style.left = `${e.clientX}px`;
					this.animatedCursorImg.style.top = `${e.clientY}px`;
				}
			};
			document.addEventListener('mousemove', this._mousemoveHandler);
			return;
		}

		// Nettoie la règle cursor:none si on repasse sur un curseur natif
		const hideCursorStyle = document.getElementById('kxs-hide-cursor-style');
		if (hideCursorStyle) hideCursorStyle.remove();

		// Sinon, méthode classique : précharge l'image, puis applique le curseur natif
		const img = new window.Image();
		img.onload = () => {
			const style = document.createElement('style');
			style.id = styleId;
			style.innerHTML = `
			* { cursor: url('${url}'), auto !important; }
			*:hover { cursor: url('${url}'), pointer !important; }
			*:active { cursor: url('${url}'), pointer !important; }
			*:focus { cursor: url('${url}'), text !important; }
			input, textarea { cursor: url('${url}'), text !important; }
			a, button, [role="button"], [onclick] { cursor: url('${url}'), pointer !important; }
			[draggable="true"] { cursor: url('${url}'), move !important; }
			[style*="cursor: pointer"] { cursor: url('${url}'), pointer !important; }
			[style*="cursor: text"] { cursor: url('${url}'), text !important; }
			[style*="cursor: move"] { cursor: url('${url}'), move !important; }
			[style*="cursor: crosshair"] { cursor: url('${url}'), crosshair !important; }
			[style*="cursor: ew-resize"] { cursor: url('${url}'), ew-resize !important; }
			[style*="cursor: ns-resize"] { cursor: url('${url}'), ns-resize !important; }
		`;
			document.head.appendChild(style);
		};
		img.onerror = () => {
			document.body.style.cursor = '';
			this.kxsClient.logger.warn('Impossible de charger le curseur personnalisé:', url);
		};
		img.src = url;


		// --- MutationObserver pour forcer le curseur même si le jeu le réécrit ---
		this.customCursorObserver = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
					const node = mutation.target as HTMLElement;
					if (node.style && node.style.cursor && !node.style.cursor.includes(url)) {
						node.style.cursor = `url('${url}'), auto`;
					}
				}
			}
		});
		// Observe tous les changements de style sur tout le body et sur #game-touch-area
		const gameTouchArea = document.getElementById('game-touch-area');
		if (gameTouchArea) {
			this.customCursorObserver.observe(gameTouchArea, {
				attributes: true,
				attributeFilter: ['style'],
				subtree: true
			});
		}
		this.customCursorObserver.observe(document.body, {
			attributes: true,
			attributeFilter: ['style'],
			subtree: true
		});
	}

	private escapeMenu() {
		const customStylesMobile = `
    .ui-game-menu-desktop {
        background: linear-gradient(135deg, rgba(25, 25, 35, 0.95) 0%, rgba(15, 15, 25, 0.98) 100%) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        border-radius: 4px !important;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
        padding: 2px 2px !important;
        max-width: 45vw !important;
        width: 45vw !important;
        max-height: 28vh !important;
        min-width: unset !important;
        min-height: unset !important;
        font-size: 9px !important;
        margin: 0 auto !important;
        box-sizing: border-box !important;
        overflow-y: auto !important;
    }
    .ui-game-menu-desktop button, .ui-game-menu-desktop .btn, .ui-game-menu-desktop input, .ui-game-menu-desktop select {
        font-size: 9px !important;
        padding: 2px 3px !important;
        margin: 1px 0 !important;
        border-radius: 3px !important;
    }
    .ui-game-menu-desktop .kxs-header, .ui-game-menu-desktop h1, .ui-game-menu-desktop h2, .ui-game-menu-desktop h3, .ui-game-menu-desktop label, .ui-game-menu-desktop span {
        font-size: 9px !important;
    }
    .ui-game-menu-desktop img, .ui-game-menu-desktop svg {
        width: 10px !important;
        height: 10px !important;
    }
    .ui-game-menu-desktop .mode-btn {
        min-height: 12px !important;
        font-size: 8px !important;
        padding: 2px 3px !important;
    }
    /* Style pour les boutons de mode de jeu qui ont une image de fond */
    .btn-mode-cobalt,
    [style*="background: url("] {
        background-repeat: no-repeat !important;
        background-position: right center !important;
        background-size: auto 70% !important;
        position: relative !important;
        padding-right: 8px !important;
    }
    #btn-start-mode-0 {
        background-repeat: initial !important;
        background-position: initial !important;
        background-size: initial !important;
        padding-right: initial !important;
    }
`;

		const customStylesDesktop = `
.ui-game-menu-desktop {
	background: linear-gradient(135deg, rgba(25, 25, 35, 0.95) 0%, rgba(15, 15, 25, 0.98) 100%) !important;
	border: 1px solid rgba(255, 255, 255, 0.1) !important;
	border-radius: 12px !important;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
	padding: 20px !important;
	backdrop-filter: blur(10px) !important;
	max-width: 350px !important;
	/* max-height: 80vh !important; */ /* Optional: Limit the maximum height */
	margin: auto !important;
	box-sizing: border-box !important;
	overflow-y: auto !important; /* Allow vertical scrolling if necessary */
}

/* Style pour les boutons de mode de jeu qui ont une image de fond */
.btn-mode-cobalt,
[style*="background: url("] {
	background-repeat: no-repeat !important;
	background-position: right center !important;
	background-size: auto 80% !important;
	position: relative !important;
	padding-right: 40px !important;
}

/* Ne pas appliquer ce style aux boutons standards comme Play Solo */
#btn-start-mode-0 {
	background-repeat: initial !important;
	background-position: initial !important;
	background-size: initial !important;
	padding-right: initial !important;
}

.ui-game-menu-desktop::-webkit-scrollbar {
	width: 8px !important;
}
.ui-game-menu-desktop::-webkit-scrollbar-track {
	background: rgba(25, 25, 35, 0.5) !important;
	border-radius: 10px !important;
}
.ui-game-menu-desktop::-webkit-scrollbar-thumb {
	background-color: #4287f5 !important;
	border-radius: 10px !important;
	border: 2px solid rgba(25, 25, 35, 0.5) !important;
}
.ui-game-menu-desktop::-webkit-scrollbar-thumb:hover {
	background-color: #5a9eff !important;
}

.ui-game-menu-desktop {
	scrollbar-width: thin !important;
	scrollbar-color: #4287f5 rgba(25, 25, 35, 0.5) !important;
}

.kxs-header {
	display: flex;
	align-items: center;
	justify-content: flex-start;
	margin-bottom: 20px;
	padding: 10px;
	border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.kxs-logo {
	width: 30px;
	height: 30px;
	margin-right: 10px;
	border-radius: 6px;
}

.kxs-title {
	font-size: 20px;
	font-weight: 700;
	color: #ffffff;
	text-transform: uppercase;
	text-shadow: 0 0 10px rgba(66, 135, 245, 0.5);
	font-family: 'Arial', sans-serif;
	letter-spacing: 2px;
}

.kxs-title span {
	color: #4287f5;
}
	

.btn-game-menu {
	background: linear-gradient(135deg, rgba(66, 135, 245, 0.1) 0%, rgba(66, 135, 245, 0.2) 100%) !important;
	border: 1px solid rgba(66, 135, 245, 0.3) !important;
	border-radius: 8px !important;
	color: #ffffff !important;
	transition: all 0.3s ease !important;
	margin: 5px 0 !important;
	padding: 12px !important;
	font-weight: 600 !important;
	width: 100% !important;
	text-align: center !important;
	display: block !important;
	box-sizing: border-box !important;
	line-height: 15px !important;
}

.btn-game-menu:hover {
	background: linear-gradient(135deg, rgba(66, 135, 245, 0.2) 0%, rgba(66, 135, 245, 0.3) 100%) !important;
	transform: translateY(-2px) !important;
	box-shadow: 0 4px 12px rgba(66, 135, 245, 0.2) !important;
}

.slider-container {
	background: rgba(66, 135, 245, 0.1) !important;
	border-radius: 8px !important;
	padding: 10px 15px !important;
	margin: 10px 0 !important;
	width: 100% !important;
	box-sizing: border-box !important;
}

.slider-text {
	color: #ffffff !important;
	font-size: 14px !important;
	margin-bottom: 8px !important;
	text-align: center !important;
}

.slider {
	-webkit-appearance: none !important;
	width: 100% !important;
	height: 6px !important;
	border-radius: 3px !important;
	background: rgba(66, 135, 245, 0.3) !important;
	outline: none !important;
	margin: 10px 0 !important;
}

.slider::-webkit-slider-thumb {
	-webkit-appearance: none !important;
	width: 16px !important;
	height: 16px !important;
	border-radius: 50% !important;
	background: #4287f5 !important;
	cursor: pointer !important;
	transition: all 0.3s ease !important;
}

.slider::-webkit-slider-thumb:hover {
	transform: scale(1.2) !important;
	box-shadow: 0 0 10px rgba(66, 135, 245, 0.5) !important;
}

.btns-game-double-row {
	display: flex !important;
	justify-content: center !important;
	gap: 10px !important;
	margin-bottom: 10px !important;
	width: 100% !important;
}

.btn-game-container {
	flex: 1 !important;
}

#btn-touch-styles,
#btn-game-aim-line {
	display: none !important;
	pointer-events: none !important;
	visibility: hidden !important;
}
`;

		const addCustomStyles = (): void => {
			const styleElement = document.createElement('style');
			styleElement.textContent = this.kxsClient.isMobile() ? customStylesMobile : customStylesDesktop;
			document.head.appendChild(styleElement);
		};

		const addKxsHeader = (): void => {
			const menuContainer = document.querySelector('#ui-game-menu') as HTMLElement;
			if (!menuContainer) return;

			const header = document.createElement('div');
			header.className = 'kxs-header';

			const title = document.createElement('span');
			title.className = 'kxs-title';
			title.innerHTML = '<span>Kxs</span> CLIENT';
			header.appendChild(title);
			menuContainer.insertBefore(header, menuContainer.firstChild);
		};

		const disableUnwantedButtons = (): void => {
			const touchStyles = document.getElementById('btn-touch-styles');
			const aimLine = document.getElementById('btn-game-aim-line');

			if (touchStyles) {
				touchStyles.style.display = 'none';
				touchStyles.style.pointerEvents = 'none';
				touchStyles.style.visibility = 'hidden';
			}

			if (aimLine) {
				aimLine.style.display = 'none';
				aimLine.style.pointerEvents = 'none';
				aimLine.style.visibility = 'hidden';
			}
		};

		if (document.querySelector('#ui-game-menu')) {
			addCustomStyles();
			addKxsHeader();
			if (!this.kxsClient.isMobile()) {
				disableUnwantedButtons();
			}

			// Désactiver uniquement le slider Music Volume
			const sliders = document.querySelectorAll('.slider-container.ui-slider-container');
			sliders.forEach(slider => {
				const label = slider.querySelector('p.slider-text[data-l10n="index-music-volume"]');
				if (label) {
					(slider as HTMLElement).style.display = 'none';
				}
			});

			// Ajout du bouton Toggle Right Shift Menu
			const menuContainer = document.querySelector('#ui-game-menu') as HTMLElement;
			if (menuContainer) {
				const toggleRightShiftBtn = document.createElement('button');
				toggleRightShiftBtn.textContent = 'Toggle Right Shift Menu';
				toggleRightShiftBtn.className = 'btn-game-menu';
				toggleRightShiftBtn.style.marginTop = '10px';
				toggleRightShiftBtn.onclick = () => {
					if (this.kxsClient.secondaryMenu && typeof this.kxsClient.secondaryMenu.toggleMenuVisibility === 'function') {
						this.kxsClient.secondaryMenu.toggleMenuVisibility();
					}
				};
				menuContainer.appendChild(toggleRightShiftBtn);
			}
		}
	}

	private handleMessage(element: Element) {
		if (element instanceof HTMLElement && element.classList.contains('killfeed-div')) {
			const killfeedText = element.querySelector('.killfeed-text');
			if (killfeedText instanceof HTMLElement) {
				if (killfeedText.textContent && killfeedText.textContent.trim() !== '') {
					if (!killfeedText.hasAttribute('data-glint')) {
						killfeedText.setAttribute('data-glint', 'true');

						element.style.opacity = '1';

						setTimeout(() => {
							element.style.opacity = '0';
						}, 5000);
					}
				} else {
					element.style.opacity = '0';
				}
			}
		}
	}

	private killFeedObserver: MutationObserver | null = null;

	private setupObserver() {
		const killfeedContents = document.getElementById('ui-killfeed-contents');
		if (killfeedContents) {
			// Détruit l'ancien observer s'il existe
			if (this.killFeedObserver) {
				this.killFeedObserver.disconnect();
			}
			this.killFeedObserver = new MutationObserver((mutations) => {
				mutations.forEach((mutation) => {
					if (mutation.target instanceof HTMLElement &&
						mutation.target.classList.contains('killfeed-text')) {
						const parentDiv = mutation.target.closest('.killfeed-div');
						if (parentDiv) {
							this.handleMessage(parentDiv);
						}
					}
					mutation.addedNodes.forEach((node) => {
						if (node instanceof HTMLElement) {
							this.handleMessage(node);
						}
					});
				});
			});

			this.killFeedObserver.observe(killfeedContents, {
				childList: true,
				subtree: true,
				characterData: true,
				attributes: true,
				attributeFilter: ['style', 'class']
			});

			killfeedContents.querySelectorAll('.killfeed-div').forEach(this.handleMessage);
		}
	}

	/**
	 * Détruit l'observer du killfeed s'il existe
	 */
	public disableKillFeedObserver() {
		if (this.killFeedObserver) {
			this.killFeedObserver.disconnect();
			this.killFeedObserver = null;
		}
	}

	private applyCustomStyles() {
		const customStyles = document.createElement('style');
		if (this.kxsClient.isKillFeedBlint) {
			customStyles.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Oxanium:wght@600&display=swap');
  
        .killfeed-div {
            position: absolute !important;
            padding: 5px 10px !important;
            background: rgba(0, 0, 0, 0.7) !important;
            border-radius: 5px !important;
            transition: opacity 0.5s ease-out !important;
        }
  
        .killfeed-text {
            font-family: 'Oxanium', sans-serif !important;
            font-weight: bold !important;
            font-size: 16px !important;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5) !important;
            background: linear-gradient(90deg, 
                rgb(255, 0, 0), 
                rgb(255, 127, 0), 
                rgb(255, 255, 0), 
                rgb(0, 255, 0), 
                rgb(0, 0, 255), 
                rgb(75, 0, 130), 
                rgb(148, 0, 211), 
                rgb(255, 0, 0));
            background-size: 200%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: glint 3s linear infinite;
        }
  
        @keyframes glint {
            0% {
                background-position: 200% 0;
            }
            100% {
                background-position: -200% 0;
            }
        }
  
        .killfeed-div .killfeed-text:empty {
            display: none !important;
        }
      `;
		} else {
			customStyles.innerHTML = `
        .killfeed-div {
            position: absolute;
            padding: 5px 10px;
            background: rgba(0, 0, 0, 0.7);
            border-radius: 5px;
            transition: opacity 0.5s ease-out;
        }
  
        .killfeed-text {
            font-family: inherit;
            font-weight: normal;
            font-size: inherit;
            color: inherit;
            text-shadow: none;
            background: none;
        }
  
        .killfeed-div .killfeed-text:empty {
            display: none;
        }
      `;
		}
		document.head.appendChild(customStyles);
	}


	private handleResize() {
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;

		for (const name of ['fps', 'kills', 'ping']) {
			const counterContainer = document.getElementById(`${name}CounterContainer`);
			if (!counterContainer) continue;

			const counter = this.kxsClient.counters[name];
			if (!counter) continue;

			const rect = counterContainer.getBoundingClientRect();
			const savedPosition = this.getSavedPosition(name);

			let newPosition = this.calculateSafePosition(
				savedPosition,
				rect.width,
				rect.height,
				viewportWidth,
				viewportHeight
			);

			this.applyPosition(counterContainer, newPosition);
			this.savePosition(name, newPosition);
		}
	}

	private calculateSafePosition(
		currentPosition: CounterPosition,
		elementWidth: number,
		elementHeight: number,
		viewportWidth: number,
		viewportHeight: number
	): CounterPosition {
		let { left, top } = currentPosition;

		if (left + elementWidth > viewportWidth) {
			left = viewportWidth - elementWidth;
		}
		if (left < 0) {
			left = 0;
		}

		if (top + elementHeight > viewportHeight) {
			top = viewportHeight - elementHeight;
		}
		if (top < 0) {
			top = 0;
		}

		return { left, top };
	}

	private getSavedPosition(name: string): CounterPosition {
		const savedPosition = localStorage.getItem(`${name}CounterPosition`);
		if (savedPosition) {
			try {
				return JSON.parse(savedPosition);
			} catch {
				return this.kxsClient.defaultPositions[name];
			}
		}
		return this.kxsClient.defaultPositions[name];
	}

	private applyPosition(element: HTMLElement, position: CounterPosition) {
		element.style.left = `${position.left}px`;
		element.style.top = `${position.top}px`;
	}

	private savePosition(name: string, position: CounterPosition) {
		localStorage.setItem(`${name}CounterPosition`, JSON.stringify(position));
	}

	startUpdateLoop() {
		const now = performance.now();
		const delta = now - this.kxsClient.lastFrameTime;

		this.frameCount++;

		if (delta >= 1000) {
			this.fps = Math.round((this.frameCount * 1000) / delta);
			this.frameCount = 0;
			this.kxsClient.lastFrameTime = now;

			this.kills = this.kxsClient.getKills();

			if (this.kxsClient.isFpsVisible && this.kxsClient.counters.fps) {
				this.kxsClient.counters.fps.textContent = `FPS: ${this.fps}`;
			}

			if (this.kxsClient.isKillsVisible && this.kxsClient.counters.kills) {
				this.kxsClient.counters.kills.textContent = `Kills: ${this.kills}`;
			}

			if (
				this.kxsClient.isPingVisible &&
				this.kxsClient.counters.ping &&
				this.pingManager
			) {
				const result = this.pingManager.getPingResult();
				this.kxsClient.counters.ping.textContent = `PING: ${result.ping} ms`;
			}
		}

		if (this.kxsClient.animationFrameCallback) {
			this.kxsClient.animationFrameCallback(() => this.startUpdateLoop());
		}
		this.updateUiElements();
		this.updateBoostBars();
		this.updateHealthBars();
		this.kxsClient.kill_leader?.update(this.kills);
	}

	initCounter(name: string, label: string, initialText: string) {
		const counter = document.createElement("div");
		counter.id = `${name}Counter`;
		const counterContainer = document.createElement("div");
		counterContainer.id = `${name}CounterContainer`;

		Object.assign(counterContainer.style, {
			position: "absolute",
			left: `${this.kxsClient.defaultPositions[name].left}px`,
			top: `${this.kxsClient.defaultPositions[name].top}px`,
			zIndex: "10000",
		});

		Object.assign(counter.style, {
			color: "white",
			backgroundColor: "rgba(0, 0, 0, 0.2)",
			borderRadius: "5px",
			fontFamily: "Arial, sans-serif",
			padding: "5px 10px",
			pointerEvents: "none",
			cursor: "default",
			width: `${this.kxsClient.defaultSizes[name].width}px`,
			height: `${this.kxsClient.defaultSizes[name].height}px`,
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			textAlign: "center",
			resize: "both",
			overflow: "hidden",
		});

		counter.textContent = `${label}: ${initialText}`;
		counterContainer.appendChild(counter);

		const uiTopLeft = document.getElementById("ui-top-left");
		if (uiTopLeft) {
			uiTopLeft.appendChild(counterContainer);
		}

		const adjustFontSize = () => {
			const { width, height } = counter.getBoundingClientRect();
			const size = Math.min(width, height) * 0.4;
			counter.style.fontSize = `${size}px`;
		};

		new ResizeObserver(adjustFontSize).observe(counter);

		counter.addEventListener("mousedown", (event) => {
			if (event.button === 1) {
				this.resetCounter(name, label, initialText);
				event.preventDefault();
			}
		});

		this.kxsClient.makeDraggable(counterContainer, `${name}CounterPosition`);
		this.kxsClient.counters[name] = counter;
	}

	resetCounter(name: string, label: string, initialText: string) {
		const counter = this.kxsClient.counters[name];
		const container = document.getElementById(`${name}CounterContainer`);

		if (!counter || !container) return;

		// Reset only this counter's position and size
		Object.assign(container.style, {
			left: `${this.kxsClient.defaultPositions[name].left}px`,
			top: `${this.kxsClient.defaultPositions[name].top}px`,
		});

		Object.assign(counter.style, {
			width: `${this.kxsClient.defaultSizes[name].width}px`,
			height: `${this.kxsClient.defaultSizes[name].height}px`,
			fontSize: "18px",
		});

		counter.textContent = `${label}: ${initialText}`;

		// Clear the saved position for this counter only
		localStorage.removeItem(`${name}CounterPosition`);
	}

	updateBoostBars() {
		const boostCounter = document.querySelector("#ui-boost-counter");
		if (boostCounter) {
			const boostBars = boostCounter.querySelectorAll(
				".ui-boost-base .ui-bar-inner",
			);

			let totalBoost = 0;
			const weights = [25, 25, 40, 10];

			boostBars.forEach((bar, index) => {
				const width = parseFloat((bar as HTMLElement).style.width);
				if (!isNaN(width)) {
					totalBoost += width * (weights[index] / 100);
				}
			});

			const averageBoost = Math.round(totalBoost);
			let boostDisplay = boostCounter.querySelector(".boost-display");

			if (!boostDisplay) {
				boostDisplay = document.createElement("div");
				boostDisplay.classList.add("boost-display");
				Object.assign((boostDisplay as HTMLElement).style, {
					position: "absolute",
					bottom: "75px",
					right: "335px",
					color: "#FF901A",
					backgroundColor: "rgba(0, 0, 0, 0.4)",
					padding: "5px 10px",
					borderRadius: "5px",
					fontFamily: "Arial, sans-serif",
					fontSize: "14px",
					zIndex: "10",
					textAlign: "center",
				});

				boostCounter.appendChild(boostDisplay);
			}

			boostDisplay.textContent = `AD: ${averageBoost}%`;
		}
	}

	toggleWeaponBorderHandler() {
		if (this.kxsClient.isGunOverlayColored && !this.kxsClient.isGunBorderChromatic) {
			const weaponContainers = Array.from(
				document.getElementsByClassName("ui-weapon-switch"),
			);
			weaponContainers.forEach((container) => {
				if (container.id === "ui-weapon-id-4") {
					(container as HTMLElement).style.border = "3px solid #2f4032";
				} else {
					(container as HTMLElement).style.border = "3px solid #FFFFFF";
				}
			});

			const weaponNames = Array.from(
				document.getElementsByClassName("ui-weapon-name"),
			);

			type ColorKey = 'ORANGE' | 'BLUE' | 'GREEN' | 'RED' | 'BLACK' | 'OLIVE' | 'ORANGE_RED' | 'PURPLE' | 'TEAL' | 'BROWN' | 'PINK' | 'DEFAULT';

			const WEAPON_COLORS: Record<ColorKey, string> = {
				ORANGE: '#FFAE00',
				BLUE: '#007FFF',
				GREEN: '#0f690d',
				RED: '#FF0000',
				BLACK: '#000000',
				OLIVE: '#808000',
				ORANGE_RED: '#FF4500',
				PURPLE: '#800080',
				TEAL: '#008080',
				BROWN: '#A52A2A',
				PINK: '#FFC0CB',
				DEFAULT: '#FFFFFF'
			};

			const WEAPON_COLOR_MAPPING: Record<ColorKey, string[]> = {
				ORANGE: ['CZ-3A1', 'G18C', 'M9', 'M93R', 'MAC-10', 'MP5', 'P30L', 'DUAL P30L', 'UMP9', 'VECTOR', 'VSS', 'FLAMETHROWER'],
				BLUE: ['AK-47', 'OT-38', 'OTS-38', 'M39 EMR', 'DP-28', 'MOSIN-NAGANT', 'SCAR-H', 'SV-98', 'M1 GARAND', 'PKP PECHENEG', 'AN-94', 'BAR M1918', 'BLR 81', 'SVD-63', 'M134', 'WATER GUN', 'GROZA', 'GROZA-S'],
				GREEN: ['FAMAS', 'M416', 'M249', 'QBB-97', 'MK 12 SPR', 'M4A1-S', 'SCOUT ELITE', 'L86A2'],
				RED: ['M870', 'MP220', 'SAIGA-12', 'SPAS-12', 'USAS-12', 'SUPER 90', 'LASR GUN', 'M1100'],
				BLACK: ['DEAGLE 50', 'RAINBOW BLASTER'],
				OLIVE: ['AWM-S', 'MK 20 SSR'],
				ORANGE_RED: ['FLARE GUN'],
				PURPLE: ['MODEL 94', 'PEACEMAKER', 'VECTOR (.45 ACP)', 'M1911', 'M1A1', 'MK45G'],
				TEAL: ['M79'],
				BROWN: ['POTATO CANNON', 'SPUD GUN'],
				PINK: ['HEART CANNON'],
				DEFAULT: []
			};

			weaponNames.forEach((weaponNameElement) => {
				const weaponContainer = weaponNameElement.closest(".ui-weapon-switch");

				const observer = new MutationObserver(() => {
					const weaponName = weaponNameElement.textContent?.trim()?.toUpperCase() || '';

					let colorKey: ColorKey = 'DEFAULT';

					// Do a hack for "VECTOR" gun (because can be 2 weapons: yellow or purple)
					if (weaponName === "VECTOR") {
						// Get the weapon container and image element
						const weaponContainer = weaponNameElement.closest(".ui-weapon-switch");
						const weaponImage = weaponContainer?.querySelector(".ui-weapon-image") as HTMLImageElement;

						if (weaponImage && weaponImage.src) {
							// Check the image source to determine which Vector it is
							if (weaponImage.src.includes("-acp") || weaponImage.src.includes("45")) {
								colorKey = 'PURPLE';
							} else {
								colorKey = 'ORANGE';
							}
						} else {
							// Default to orange if we can't determine the type
							colorKey = 'ORANGE';
						}
					} else {
						colorKey = (Object.entries(WEAPON_COLOR_MAPPING)
							.find(([_, weapons]) => weapons.includes(weaponName))?.[0] || 'DEFAULT') as ColorKey;
					}

					if (weaponContainer && weaponContainer.id !== "ui-weapon-id-4") {
						(weaponContainer as HTMLElement).style.border = `3px solid ${WEAPON_COLORS[colorKey]}`;
					}
				});

				observer.observe(weaponNameElement, { childList: true, characterData: true, subtree: true });
			});
		}
	}

	toggleChromaticWeaponBorder() {
		const borderClass = 'kxs-chromatic-border';
		const styleId = 'kxs-chromatic-border-style';
		const weaponIds = [1, 2, 3, 4];
		if (this.kxsClient.isGunBorderChromatic) {
			// Inject CSS if not already present
			if (!document.getElementById(styleId)) {
				const style = document.createElement('style');
				style.id = styleId;
				style.innerHTML = `
@keyframes kxs-rainbow {
	0% { border-image: linear-gradient(120deg, #ff004c, #fffa00, #00ff90, #004cff, #ff004c) 1; }
	100% { border-image: linear-gradient(480deg, #ff004c, #fffa00, #00ff90, #004cff, #ff004c) 1; }
}
@keyframes kxs-glint {
	0% { box-shadow: 0 0 8px 2px #fff2; }
	50% { box-shadow: 0 0 24px 6px #fff8; }
	100% { box-shadow: 0 0 8px 2px #fff2; }
}
@keyframes kxs-bg-rainbow {
	0% { background-position: 0% 50%; }
	50% { background-position: 100% 50%; }
	100% { background-position: 0% 50%; }
}
.kxs-chromatic-border {
	border: 3px solid transparent !important;
	border-image: linear-gradient(120deg, #ff004c, #fffa00, #00ff90, #004cff, #ff004c) 1;
	animation: kxs-rainbow 3s linear infinite, kxs-glint 2s ease-in-out infinite, kxs-bg-rainbow 8s linear infinite;
	border-radius: 8px !important;
	background: linear-gradient(270deg, #ff004c, #fffa00, #00ff90, #004cff, #ff004c);
	background-size: 1200% 1200%;
	background-position: 0% 50%;
	background-clip: padding-box;
	-webkit-background-clip: padding-box;
	filter: brightness(1.15) saturate(1.4);
	transition: background 0.5s;
}
`;
				document.head.appendChild(style);
			}
			weaponIds.forEach(id => {
				const el = document.getElementById(`ui-weapon-id-${id}`);
				if (el) {
					el.classList.add(borderClass);
				}
			});
		} else {
			// Remove chromatic border and style
			weaponIds.forEach(id => {
				const el = document.getElementById(`ui-weapon-id-${id}`);
				if (el) {
					el.classList.remove(borderClass);
					el.style.border = '';
				}
			});
			const style = document.getElementById(styleId);
			if (style) style.remove();
		}
	}

	updateUiElements() {
		// Réapplique l'effet chromatique si activé (corrige le bug d'affichage après un changement de page ou entrée en game)
		if (this.kxsClient.isGunBorderChromatic) {
			this.toggleChromaticWeaponBorder();
		}

		const currentUrl = window.location.href;

		const isSpecialUrl = /\/#\w+/.test(currentUrl);

		const playerOptions = document.getElementById("player-options");
		const teamMenuContents = document.getElementById("team-menu-contents");
		const startMenuContainer = document.querySelector(
			"#start-menu .play-button-container",
		);

		// Update counters draggable state based on LSHIFT menu visibility
		this.updateCountersDraggableState();

		if (!playerOptions) return;

		if (
			isSpecialUrl &&
			teamMenuContents &&
			playerOptions.parentNode !== teamMenuContents
		) {
			teamMenuContents.appendChild(playerOptions);
		} else if (
			!isSpecialUrl &&
			startMenuContainer &&
			playerOptions.parentNode !== startMenuContainer
		) {
			const firstChild = startMenuContainer.firstChild;
			startMenuContainer.insertBefore(playerOptions, firstChild);
		}
		const teamMenu = document.getElementById("team-menu");
		if (teamMenu) {
			teamMenu.style.height = "355px";
		}
		const menuBlocks = document.querySelectorAll(".menu-block");
		menuBlocks.forEach((block) => {
			(block as HTMLElement).style.maxHeight = "355px";
		});
		//scalable?
	}

	updateMenuButtonText() {
		const hideButton = document.getElementById("hideMenuButton")!;
		hideButton.textContent = this.isMenuVisible
			? "Hide Menu [P]"
			: "Show Menu [P]";
	}

	updateHealthBars() {
		const healthBars = document.querySelectorAll("#ui-health-container");
		healthBars.forEach((container) => {
			const bar = container.querySelector("#ui-health-actual");
			if (bar) {
				const currentHealth = Math.round(parseFloat((bar as HTMLElement).style.width));
				let percentageText = container.querySelector(".health-text");

				// Create or update percentage text
				if (!percentageText) {
					percentageText = document.createElement("span");
					percentageText.classList.add("health-text");
					Object.assign((percentageText as HTMLElement).style, {
						width: "100%",
						textAlign: "center",
						marginTop: "5px",
						color: "#333",
						fontSize: "20px",
						fontWeight: "bold",
						position: "absolute",
						zIndex: "10",
					});
					container.appendChild(percentageText);
				}

				// Check for health change
				if (currentHealth !== this.lastHealthValue) {
					const healthChange = currentHealth - this.lastHealthValue;
					if (healthChange !== 0) {
						this.showHealthChangeAnimation(container as HTMLElement, healthChange);
					}
					this.lastHealthValue = currentHealth;
				}

				if (this.kxsClient.isHealthWarningEnabled) {
					this.kxsClient.healWarning?.update(currentHealth);
				} else {
					this.kxsClient.healWarning?.hide();
				}
				percentageText.textContent = `${currentHealth}%`;

				// Update animations
				this.updateHealthAnimations();
			}
		});
	}

	private showHealthChangeAnimation(container: HTMLElement, change: number) {
		const animation = document.createElement("div");
		const isPositive = change > 0;

		Object.assign(animation.style, {
			position: "absolute",
			color: isPositive ? "#2ecc71" : "#e74c3c",
			fontSize: "24px",
			fontWeight: "bold",
			fontFamily: "Arial, sans-serif",
			textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
			pointerEvents: "none",
			zIndex: "100",
			opacity: "1",
			top: "50%",
			right: "-80px", // Position à droite de la barre de vie
			transform: "translateY(-50%)", // Centre verticalement
			whiteSpace: "nowrap", // Empêche le retour à la ligne
		});

		// Check if change is a valid number before displaying it
		if (!isNaN(change)) {
			animation.textContent = `${isPositive ? "+" : ""}${change} HP`;
		} else {
			// Skip showing animation if change is NaN
			return;
		}

		container.appendChild(animation);

		this.healthAnimations.push({
			element: animation,
			startTime: performance.now(),
			duration: 1500, // Animation duration in milliseconds
			value: change,
		});
	}

	private updateCountersDraggableState() {
		const isMenuOpen = this.kxsClient.secondaryMenu?.getMenuVisibility() || false;
		const counters = ['fps', 'kills', 'ping'];

		counters.forEach(name => {
			const counter = document.getElementById(`${name}Counter`);
			if (counter) {
				// Mise à jour des propriétés de draggabilité
				counter.style.pointerEvents = isMenuOpen ? 'auto' : 'none';
				counter.style.cursor = isMenuOpen ? 'move' : 'default';

				// Mise à jour de la possibilité de redimensionnement
				counter.style.resize = isMenuOpen ? 'both' : 'none';
			}
		});
	}

	private updateHealthAnimations() {
		const currentTime = performance.now();

		this.healthAnimations = this.healthAnimations.filter(animation => {
			const elapsed = currentTime - animation.startTime;
			const progress = Math.min(elapsed / animation.duration, 1);

			if (progress < 1) {
				// Update animation position and opacity
				// Maintenant l'animation se déplace horizontalement vers la droite
				const translateX = progress * 20; // Déplacement horizontal
				Object.assign(animation.element.style, {
					transform: `translateY(-50%) translateX(${translateX}px)`,
					opacity: String(1 - progress),
				});
				return true;
			} else {
				// Remove completed animation
				animation.element.remove();
				return false;
			}
		});
	}
}

export { KxsClientHUD };
