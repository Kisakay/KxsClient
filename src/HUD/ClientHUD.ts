import KxsClient from "../KxsClient";
import { DesignSystem } from "./DesignSystem";

export interface HealthChangeAnimation {
	element: HTMLElement;
	startTime: number;
	duration: number;
	value: number;
}

class KxsClientHUD {
	private animatedCursorImg?: HTMLImageElement;
	private _mousemoveHandler?: (e: MouseEvent) => void;
	frameCount: number;
	fps: number;
	kills: number;
	isMenuVisible: boolean;
	kxsClient: KxsClient;
	private healthAnimations: HealthChangeAnimation[] = [];
	private lastHealthValue: number = 100;
	private customCursorObserver?: MutationObserver;
	private hudOpacityObservers: MutationObserver[] = [];
	private weaponBorderObservers: MutationObserver[] = [];
	private ctrlFocusTimer: number | null = null;
	private allDivToHide: string[];

	constructor(kxsClient: KxsClient) {
		this.kxsClient = kxsClient;
		this.frameCount = 0;
		this.fps = 0;
		this.kills = 0;
		this.isMenuVisible = true;
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

		this.updateCountersDraggableState();

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
		// Déterminer la plateforme une seule fois à l'initialisation
		const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);

		// Utiliser un flag pour suivre l'état des touches
		let modifierKeyPressed = false;

		document.addEventListener('keydown', (e) => {
			// Détecter si la touche modificatrice est pressée (Command sur macOS, Ctrl sur Windows/Linux)
			if ((isMac && e.key === 'Meta') || (!isMac && e.key === 'Control')) {
				modifierKeyPressed = true;
			}

			// Activer le mode focus seulement si F est pressé pendant que la touche modificatrice est déjà enfoncée
			if (modifierKeyPressed && e.code === 'KeyF' && this.kxsClient.isFocusModeEnabled) {
				e.preventDefault(); // Empêcher le comportement par défaut (recherche)
				this.kxsClient.currentFocusModeState = !this.kxsClient.currentFocusModeState;
				this.kxsClient.hud.toggleFocusMode();
				this.kxsClient.nm.showNotification("Focus mode toggled", "info", 1200);
			}
		});

		// Réinitialiser le flag quand la touche modificatrice est relâchée
		document.addEventListener('keyup', (e) => {
			if ((isMac && e.key === 'Meta') || (!isMac && e.key === 'Control')) {
				modifierKeyPressed = false;
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
		if (this.kxsClient.currentFocusModeState) {
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

		// Pour les images statiques aussi : masquer le curseur natif et utiliser une image qui suit la souris
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

		// Créer l'image du curseur personnalisé
		const cursorImg = document.createElement('img');
		cursorImg.src = url;
		cursorImg.style.position = 'fixed';
		cursorImg.style.pointerEvents = 'none';
		cursorImg.style.zIndex = '99999';
		cursorImg.style.left = '0px';
		cursorImg.style.top = '0px';

		// Précharger l'image pour obtenir ses dimensions
		const img = new window.Image();
		img.onload = () => {
			// Définir la taille de l'image du curseur (par défaut utiliser les dimensions de l'image)
			// Ou limiter à une taille raisonnable si trop grande
			const maxSize = 64; // Taille maximale recommandée pour un curseur
			let width = img.width;
			let height = img.height;

			if (width > maxSize || height > maxSize) {
				// Redimensionner en conservant le ratio
				if (width > height) {
					height = (height * maxSize) / width;
					width = maxSize;
				} else {
					width = (width * maxSize) / height;
					height = maxSize;
				}
			}

			cursorImg.style.width = `${width}px`;
			cursorImg.style.height = `${height}px`;

			// Stocker la référence à l'image
			this.animatedCursorImg = cursorImg as HTMLImageElement;
			document.body.appendChild(cursorImg);

			// Créer le handler pour suivre la souris
			this._mousemoveHandler = (e: MouseEvent) => {
				if (this.animatedCursorImg) {
					// Ajuster la position pour centrer le curseur sur la position de la souris
					const offsetX = width / 2;
					const offsetY = height / 2;
					this.animatedCursorImg.style.left = `${e.clientX - offsetX}px`;
					this.animatedCursorImg.style.top = `${e.clientY - offsetY}px`;
				}
			};

			document.addEventListener('mousemove', this._mousemoveHandler);
		};

		img.onerror = () => {
			this.kxsClient.logger.warn('Impossible de charger le curseur personnalisé:', url);
			// Si l'image ne charge pas, supprimer le style qui cache le curseur
			if (hideCursorStyle) hideCursorStyle.remove();
		};

		img.src = url;
	}

	private escapeMenu() {
		// Détermine si le mode glassmorphism est activé
		const is_glassmorphism_enabled = this.kxsClient.isGlassmorphismEnabled;

		// Style pour mobile avec prise en charge du toggle glassmorphism
		const customStylesMobile = `
    .ui-game-menu-desktop {
        ${is_glassmorphism_enabled ? `
        background: rgba(30, 35, 50, 0.15) !important;
        backdrop-filter: blur(10px) !important;
        -webkit-backdrop-filter: blur(10px) !important;
        border: 1px solid rgba(60, 70, 90, 0.3) !important;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(80, 90, 110, 0.2) !important;` : `
        background: rgba(50, 50, 50, 0.95) !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        border: 1px solid #555 !important;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4) !important;`}
        will-change: transform, opacity !important;
        border-radius: ${is_glassmorphism_enabled ? '16px' : '8px'} !important;
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
	${is_glassmorphism_enabled ? `
	background: rgba(25, 30, 45, 0.12) !important;
	backdrop-filter: blur(12px) !important;
	-webkit-backdrop-filter: blur(12px) !important;
	border: 1px solid rgba(55, 65, 85, 0.25) !important;
	border-radius: 20px !important;
	box-shadow: 0 16px 64px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(75, 85, 105, 0.2), 0 0 0 1px rgba(45, 55, 75, 0.1) !important;` : `
	background: rgba(45, 45, 45, 0.95) !important;
	backdrop-filter: none !important;
	-webkit-backdrop-filter: none !important;
	border: 1px solid #555 !important;
	border-radius: 12px !important;
	box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4) !important;`}
	will-change: transform, opacity !important;
	padding: 20px !important;
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
	background: ${is_glassmorphism_enabled ? 'rgba(25, 25, 35, 0.5)' : 'rgba(40, 40, 40, 0.9)'} !important;
	border-radius: ${is_glassmorphism_enabled ? '10px' : '6px'} !important;
}
.ui-game-menu-desktop::-webkit-scrollbar-thumb {
	background-color: ${is_glassmorphism_enabled ? '#7f8c8d' : '#555'} !important;
	border-radius: ${is_glassmorphism_enabled ? '10px' : '6px'} !important;
	border: ${is_glassmorphism_enabled ? '2px solid rgba(25, 25, 35, 0.5)' : '1px solid #444'} !important;
}
.ui-game-menu-desktop::-webkit-scrollbar-thumb:hover {
	background-color: ${is_glassmorphism_enabled ? '#95a5a6' : '#666'} !important;
}

.ui-game-menu-desktop {
	scrollbar-width: thin !important;
	scrollbar-color: ${is_glassmorphism_enabled ? '#7f8c8d rgba(25, 25, 35, 0.5)' : '#555 rgba(40, 40, 40, 0.9)'} !important;
}

.kxs-header {
	display: flex;
	align-items: center;
	justify-content: flex-start;
	margin-bottom: 20px;
	padding: 15px;
	border-bottom: 1px solid ${is_glassmorphism_enabled ? 'rgba(55, 65, 85, 0.2)' : '#444'};
	background: ${is_glassmorphism_enabled ? 'rgba(20, 25, 40, 0.08)' : 'rgba(40, 40, 40, 0.95)'};
	${is_glassmorphism_enabled ? 'backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);' : ''}
	border-radius: ${is_glassmorphism_enabled ? '12px' : '8px'};
	box-shadow: ${is_glassmorphism_enabled ? 'inset 0 1px 0 rgba(70, 80, 100, 0.15)' : '0 2px 6px rgba(0, 0, 0, 0.3)'};
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
	text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6), 0 0 20px rgba(70, 80, 120, 0.4);
	font-family: 'Arial', sans-serif;
	letter-spacing: 2px;
	filter: drop-shadow(0 0 10px rgba(60, 70, 100, 0.3));
}

.kxs-title span {
	color: #6b7db0;
}
	

.btn-game-menu {
	${is_glassmorphism_enabled ? `
	background: linear-gradient(135deg, rgba(45, 55, 75, 0.15) 0%, rgba(35, 45, 65, 0.25) 100%) !important;
	backdrop-filter: blur(16px) saturate(180%) !important;
	-webkit-backdrop-filter: blur(16px) saturate(180%) !important;
	border: 1px solid rgba(255, 255, 255, 0.18) !important;
	border-radius: 14px !important;
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
	` : `
	background: linear-gradient(135deg, rgba(60, 60, 60, 0.9) 0%, rgba(45, 45, 45, 1) 100%) !important;
	backdrop-filter: none !important;
	-webkit-backdrop-filter: none !important;
	border: 1px solid #555 !important;
	border-radius: 8px !important;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25) !important;
	`}
	color: #ffffff !important;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
	margin: 8px 0 !important;
	padding: 14px 18px !important;
	font-family: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
	font-weight: 500 !important;
	font-size: 14px !important;
	letter-spacing: 0.3px !important;
	width: 100% !important;
	text-align: center !important;
	display: block !important;
	box-sizing: border-box !important;
	line-height: 1.4 !important;
	position: relative !important;
	overflow: hidden !important;
	text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
}

.btn-game-menu::before {
	content: '' !important;
	position: absolute !important;
	top: 0 !important;
	left: -100% !important;
	width: 100% !important;
	height: 100% !important;
	background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent) !important;
	transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1) !important;
	z-index: 1 !important;
}

.btn-game-menu:hover::before {
	left: 100% !important;
}

.btn-game-menu:hover {
	${is_glassmorphism_enabled ? `
	background: linear-gradient(135deg, rgba(55, 65, 85, 0.25) 0%, rgba(45, 55, 75, 0.35) 100%) !important;
	transform: translateY(-3px) scale(1.02) !important;
	box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1) !important;
	border-color: rgba(255, 255, 255, 0.25) !important;
	backdrop-filter: blur(10px) saturate(150%) !important;
	-webkit-backdrop-filter: blur(10px) saturate(150%) !important;
	` : `
	background: linear-gradient(135deg, rgba(70, 70, 70, 0.9) 0%, rgba(50, 50, 50, 1) 100%) !important;
	transform: translateY(-2px) !important;
	box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35) !important;
	border-color: #666 !important;
	`}
	will-change: transform !important;
}

.slider-container {
	${is_glassmorphism_enabled ? `
	background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%) !important;
	backdrop-filter: blur(10px) saturate(150%) !important;
	-webkit-backdrop-filter: blur(10px) saturate(150%) !important;
	border: 1px solid rgba(255, 255, 255, 0.15) !important;
	border-radius: 16px !important;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05) !important;
	` : `
	background: linear-gradient(135deg, rgba(55, 55, 55, 0.95) 0%, rgba(45, 45, 45, 0.95) 100%) !important;
	backdrop-filter: none !important;
	-webkit-backdrop-filter: none !important;
	border: 1px solid #555 !important;
	border-radius: 8px !important;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25) !important;
	`}
	will-change: transform, opacity !important;
	padding: 16px 20px !important;
	margin: 12px 0 !important;
	width: 100% !important;
	box-sizing: border-box !important;
	position: relative !important;
	overflow: hidden !important;
}

.slider-container::before {
	content: '' !important;
	position: absolute !important;
	top: 0 !important;
	left: -100% !important;
	width: 100% !important;
	height: 100% !important;
	background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent) !important;
	animation: containerShine 6s ease-in-out infinite !important;
	will-change: transform !important;
	z-index: 0 !important;
}

@keyframes containerShine {
	0% { left: -100%; }
	50% { left: 100%; }
	100% { left: 100%; }
}

.slider-text {
	color: #ffffff !important;
	font-size: 15px !important;
	font-weight: 600 !important;
	margin-bottom: 12px !important;
	text-align: center !important;
	text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4) !important;
	letter-spacing: 0.5px !important;
	position: relative !important;
	z-index: 1 !important;
}

.slider {
	-webkit-appearance: none !important;
	width: 100% !important;
	height: 8px !important;
	border-radius: ${is_glassmorphism_enabled ? '12px' : '8px'} !important;
	background: ${is_glassmorphism_enabled ?
				'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(51, 65, 85, 0.8) 100%)' :
				'linear-gradient(135deg, rgba(40, 40, 40, 0.8) 0%, rgba(50, 50, 50, 1) 100%)'} !important;
	outline: none !important;
	margin: 12px 0 !important;
	${is_glassmorphism_enabled ? `
	backdrop-filter: blur(8px) !important;
	-webkit-backdrop-filter: blur(8px) !important;
	border: 1px solid rgba(255, 255, 255, 0.08) !important;` : `
	backdrop-filter: none !important;
	-webkit-backdrop-filter: none !important;
	border: 1px solid #444 !important;`}
	box-shadow: ${is_glassmorphism_enabled ?
				'inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(255, 255, 255, 0.1)' :
				'inset 0 1px 3px rgba(0, 0, 0, 0.4)'} !important;
	position: relative !important;
	z-index: 1 !important;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.slider:hover {
	background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(51, 65, 85, 1) 100%) !important;
	box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(255, 255, 255, 0.15), 0 0 16px rgba(59, 130, 246, 0.2) !important;
}

.slider::-webkit-slider-thumb {
	-webkit-appearance: none !important;
	width: 24px !important;
	height: 24px !important;
	border-radius: 50% !important;
	background: ${is_glassmorphism_enabled ?
				'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.8) 100%)' :
				'linear-gradient(135deg, rgba(180, 180, 180, 0.95) 0%, rgba(140, 140, 140, 1) 100%)'} !important;
	${is_glassmorphism_enabled ? `
	backdrop-filter: blur(12px) saturate(180%) !important;
	-webkit-backdrop-filter: blur(12px) saturate(180%) !important;` : ``}
	border: 2px solid rgba(59, 130, 246, 0.6) !important;
	cursor: grab !important;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
	box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3), 0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8) !important;
	position: relative !important;
}

.slider::-webkit-slider-thumb:hover {
	transform: scale(1.1) !important;
	background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.9) 100%) !important;
	box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4), 0 3px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 0 0 4px rgba(59, 130, 246, 0.2) !important;
	border: 2px solid rgba(59, 130, 246, 0.8) !important;
}

.slider::-webkit-slider-thumb:active {
	cursor: grabbing !important;
	transform: scale(1.05) !important;
	box-shadow: 0 3px 12px rgba(59, 130, 246, 0.5), 0 1px 6px rgba(0, 0, 0, 0.25), inset 0 2px 4px rgba(0, 0, 0, 0.1) !important;
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
			title.innerHTML = `<span>${client.acronym_start_upper}</span> CLIENT`;
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

						// Use CSS transition instead of setTimeout for better performance
						element.style.transition = 'opacity 0.3s ease';
						// Schedule fade out using requestAnimationFrame with delay
						const startTime = performance.now();
						const fadeOut = (currentTime: number) => {
							if (currentTime - startTime >= 5000) {
								element.style.opacity = '0';
							} else {
								requestAnimationFrame(fadeOut);
							}
						};
						requestAnimationFrame(fadeOut);
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

		// Get glassmorphism setting
		const isGlassmorphismEnabled = this.kxsClient.isGlassmorphismEnabled;

		if (this.kxsClient.isKillFeedBlint) {
			// Rainbow text effect with either glassmorphism or classic background
			customStyles.innerHTML = `
           @import url('https://fonts.googleapis.com/css2?family=Oxanium:wght@600&display=swap');
 
           .killfeed-div {
               position: absolute !important;
               padding: 5px 10px !important;
               ${isGlassmorphismEnabled ? `
               background: rgba(0, 0, 0, 0.5) !important;
               backdrop-filter: blur(8px) !important;
               -webkit-backdrop-filter: blur(8px) !important;
               border: 1px solid rgba(255, 255, 255, 0.2) !important;
               ` : `
               background: rgba(50, 50, 50, 0.9) !important;
               border: 1px solid #555 !important;
               `}
               border-radius: ${isGlassmorphismEnabled ? '8px' : '5px'} !important;
               transition: all 0.3s ease !important;
               box-shadow: ${isGlassmorphismEnabled ?
					'0 4px 15px rgba(0, 0, 0, 0.2)' :
					'0 2px 5px rgba(0, 0, 0, 0.3)'} !important;
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
               animation: glint 6s linear infinite;
			will-change: background-position;
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
            ${isGlassmorphismEnabled ? `
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            ` : `
            background: rgba(50, 50, 50, 0.95);
            border: 1px solid #555;
            `}
            border-radius: ${isGlassmorphismEnabled ? '8px' : '5px'};
            transition: all 0.3s ease;
            box-shadow: ${isGlassmorphismEnabled ?
					'0 4px 12px rgba(0, 0, 0, 0.2)' :
					'0 2px 5px rgba(0, 0, 0, 0.3)'};
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

	startUpdateLoop() {
		const now = performance.now();
		const delta = now - this.kxsClient.lastFrameTime;

		this.frameCount++;

		if (delta >= 1000) {
			const previousFps = this.fps;
			const previousKills = this.kills;
			const previousPing = this.kxsClient.pingManager ? this.kxsClient.pingManager.getPingResult().ping : 0;

			this.fps = Math.round((this.frameCount * 1000) / delta);
			this.frameCount = 0;
			this.kxsClient.lastFrameTime = now;

			this.kills = this.kxsClient.getKills();

			// Vérifie et crée les compteurs s'ils n'existent pas encore mais sont activés
			if (this.kxsClient.isFpsVisible && !this.kxsClient.counters.fps) {
				this.initCounter("fps", "FPS", "60");
			}
			if (this.kxsClient.isKillsVisible && !this.kxsClient.counters.kills) {
				this.initCounter("kills", "Kills", "0");
			}
			if (this.kxsClient.isPingVisible && !this.kxsClient.counters.ping) {
				this.initCounter("ping", "Ping", "45ms");
			}

			// Met à jour les valeurs des compteurs visibles
			if (this.kxsClient.isFpsVisible && this.kxsClient.counters.fps) {
				const valueElement = this.kxsClient.counters.fps.querySelector('span:last-child') as HTMLElement;
				if (valueElement) {
					valueElement.textContent = `${this.fps}`;

					// Add a visual pulse effect when value changes (fixed logic)
					if (this.fps !== previousFps) {
						valueElement.style.animation = 'none';
						requestAnimationFrame(() => {
							valueElement.style.animation = `${DesignSystem.animation.pulse} 0.5s ease`;
						});
					}
				}
			}

			if (this.kxsClient.isKillsVisible && this.kxsClient.counters.kills) {
				const valueElement = this.kxsClient.counters.kills.querySelector('span:last-child') as HTMLElement;
				if (valueElement) {
					valueElement.textContent = `${this.kills}`;

					// Add a visual pulse effect when value changes (fixed logic)
					if (this.kills !== previousKills) {
						valueElement.style.animation = 'none';
						requestAnimationFrame(() => {
							valueElement.style.animation = `${DesignSystem.animation.pulse} 0.5s ease`;
						});
					}
				}
			}

			if (
				this.kxsClient.isPingVisible &&
				this.kxsClient.counters.ping &&
				this.kxsClient.pingManager
			) {
				const result = this.kxsClient.pingManager.getPingResult();
				const valueElement = this.kxsClient.counters.ping.querySelector('span:last-child') as HTMLElement;
				if (valueElement) {
					valueElement.textContent = `${result.ping} ms`;

					// Add a visual pulse effect when value changes (fixed logic)
					if (result.ping !== previousPing) {
						valueElement.style.animation = 'none';
						requestAnimationFrame(() => {
							valueElement.style.animation = `${DesignSystem.animation.pulse} 0.5s ease`;
						});
					}

					// Change color based on ping value
					if (result.ping < 50) {
						valueElement.style.color = DesignSystem.colors.success;
					} else if (result.ping < 100) {
						valueElement.style.color = DesignSystem.colors.warning;
					} else {
						valueElement.style.color = DesignSystem.colors.danger;
					}
				}
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
		if (!client.options.is_counters_enable) return;
		// Ensure design system fonts are loaded
		DesignSystem.injectFonts();

		// Vérifier si le compteur existe déjà et le supprimer si c'est le cas
		this.removeCounter(name);

		const counter = document.createElement("div");
		counter.id = `${name}Counter`;
		const counterContainer = document.createElement("div");
		counterContainer.id = `${name}CounterContainer`;
		counterContainer.dataset.counterName = name;

		Object.assign(counterContainer.style, {
			position: "absolute",
			left: `${this.kxsClient.defaultPositions[name].left}px`,
			top: `${this.kxsClient.defaultPositions[name].top}px`,
			zIndex: "10000",
			transition: `all ${DesignSystem.animation.normal} ease`,
		});

		// Check if glassmorphism is enabled
		const isGlassmorphismEnabled = this.kxsClient.isGlassmorphismEnabled;

		// Apply appropriate styling based on the glassmorphism toggle
		if (isGlassmorphismEnabled) {
			// Glassmorphism style
			counter.style.backgroundColor = "rgba(255, 255, 255, 0.15)";
			counter.style.backdropFilter = "blur(8px)";
			// Apply webkit prefix for Safari compatibility
			(counter.style as any)['-webkit-backdrop-filter'] = "blur(8px)";
			counter.style.border = "1px solid rgba(255, 255, 255, 0.2)";
			counter.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
			counter.style.borderRadius = "8px";
		} else {
			// Classic style - solid gray background without blur
			counter.style.backgroundColor = "rgba(75, 75, 75, 0.95)";
			counter.style.backdropFilter = "none";
			(counter.style as any)['-webkit-backdrop-filter'] = "none";
			counter.style.border = "1px solid #555";
			counter.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.2)";
			counter.style.borderRadius = "6px";
		}
		counter.style.color = "#ffffff";
		counter.style.fontFamily = DesignSystem.fonts.secondary;
		counter.style.fontWeight = "500";
		counter.style.padding = "8px 12px";
		counter.style.pointerEvents = "none";
		counter.style.cursor = "default";
		counter.style.display = "flex";
		counter.style.alignItems = "center";
		counter.style.justifyContent = "center";
		counter.style.textAlign = "center";
		counter.style.resize = "both";
		counter.style.overflow = "hidden";
		counter.style.textShadow = "0 1px 2px rgba(0, 0, 0, 0.5)";
		counter.style.transition = `all ${DesignSystem.animation.normal} ease`;

		// Set initial size based on default positions or the last saved size
		const savedSize = JSON.parse(localStorage.getItem(`${name}CounterSize`) || '{}');
		// Check if savedSize contains width/height with or without 'px' suffix
		if (savedSize.width) {
			// Check if width is a string or number
			const width_is_string = typeof savedSize.width === 'string';
			counter.style.width = width_is_string && savedSize.width.includes('px') ?
				savedSize.width : `${savedSize.width}px`;
		} else {
			counter.style.width = `${this.kxsClient.defaultSizes[name].width}px`;
		}

		if (savedSize.height) {
			// Check if height is a string or number
			const height_is_string = typeof savedSize.height === 'string';
			counter.style.height = height_is_string && savedSize.height.includes('px') ?
				savedSize.height : `${savedSize.height}px`;
		} else {
			counter.style.height = `${this.kxsClient.defaultSizes[name].height}px`;
		}

		// Create a label element with clean styling
		const labelElement = document.createElement("span");
		labelElement.style.fontWeight = "600";
		labelElement.style.marginRight = "6px";
		labelElement.style.color = "#ffffff";
		labelElement.textContent = `${label}:`;

		// Create a value element with clean styling
		const valueElement = document.createElement("span");
		valueElement.style.fontWeight = "500";
		valueElement.textContent = initialText;

		// Clear counter and append new elements
		counter.innerHTML = "";
		counter.appendChild(labelElement);
		counter.appendChild(valueElement);
		counterContainer.appendChild(counter);

		const uiTopLeft = document.getElementById("ui-top-left");
		if (uiTopLeft) {
			uiTopLeft.appendChild(counterContainer);
		}

		// Add subtle hover effect based on glassmorphism toggle
		counterContainer.addEventListener("mouseenter", () => {
			counter.style.transform = "scale(1.05)";
			if (this.kxsClient.isGlassmorphismEnabled) {
				counter.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.3)";
			} else {
				counter.style.boxShadow = "0 5px 15px rgba(0, 0, 0, 0.25)";
			}
		});

		counterContainer.addEventListener("mouseleave", () => {
			counter.style.transform = "scale(1)";
			if (this.kxsClient.isGlassmorphismEnabled) {
				counter.style.boxShadow = DesignSystem.glass.dark.shadow;
			} else {
				counter.style.boxShadow = DesignSystem.classic.dark.shadow;
			}
		});

		const adjustFontSize = () => {
			const { width, height } = counter.getBoundingClientRect();
			const size = Math.min(width, height) * 0.4;
			labelElement.style.fontSize = `${size}px`;
			valueElement.style.fontSize = `${size}px`;
			// Store the numeric values without 'px' suffix to avoid duplication
			const width_value = parseInt(counter.style.width) || counter.offsetWidth;
			const height_value = parseInt(counter.style.height) || counter.offsetHeight;
			localStorage.setItem(`${name}CounterSize`, JSON.stringify({
				width: width_value,
				height: height_value
			}));
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

		this.kxsClient.gridSystem.registerCounter(name, counterContainer);

		const savedPosition = localStorage.getItem(`${name}CounterPosition`);
		if (savedPosition) {
			const { x, y } = JSON.parse(savedPosition);
			counterContainer.style.left = `${x}px`;
			counterContainer.style.top = `${y}px`;
		}
	}

	/**
	 * Supprime un compteur du DOM et de la référence dans kxsClient.counters
	 * @param name Nom du compteur à supprimer (fps, kills, ping)
	 */
	removeCounter(name: string) {
		// Supprime l'élément du DOM s'il existe
		const counterContainer = document.getElementById(`${name}CounterContainer`);
		if (counterContainer) {
			counterContainer.remove();
		}

		// Supprime la référence dans kxsClient.counters
		if (this.kxsClient.counters[name]) {
			// Utilise delete pour supprimer la propriété au lieu de l'affecter à null
			delete this.kxsClient.counters[name];
		}

		this.kxsClient.gridSystem.registerCounter(name, null);
	}

	/**
	 * Gère l'affichage ou le masquage d'un compteur en fonction de son état
	 * @param name Nom du compteur (fps, kills, ping)
	 * @param visible État de visibilité souhaité
	 * @param label Libellé du compteur
	 * @param initialText Texte initial à afficher
	 */
	toggleCounter(name: string, visible: boolean, label: string, initialText: string) {
		if (visible) {
			// Si le compteur doit être visible mais n'existe pas, on le crée
			if (!this.kxsClient.counters[name]) {
				this.initCounter(name, label, initialText);
			}
		} else {
			// Si le compteur ne doit pas être visible mais existe, on le supprime
			this.removeCounter(name);
		}
	}

	resetCounter(name: string, label: string, initialText: string) {
		const counter = this.kxsClient.counters[name];
		const container = document.getElementById(`${name}CounterContainer`);

		if (!counter || !container) return;

		// Reset only this counter's position and size
		Object.assign(container.style, {
			left: `${this.kxsClient.defaultPositions[name].left}px`,
			top: `${this.kxsClient.defaultPositions[name].top}px`,
			transition: `all ${DesignSystem.animation.normal} ease`,
		});

		// Apply simple white glassmorphism effect to counter
		counter.style.backgroundColor = "rgba(255, 255, 255, 0.15)";
		counter.style.backdropFilter = "blur(8px)";
		// Apply webkit prefix for Safari compatibility
		(counter.style as any)['-webkit-backdrop-filter'] = "blur(8px)";
		counter.style.border = "1px solid rgba(255, 255, 255, 0.2)";
		counter.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
		counter.style.borderRadius = "8px";
		counter.style.color = "#ffffff";
		counter.style.fontFamily = DesignSystem.fonts.secondary;
		counter.style.fontWeight = "500";
		counter.style.padding = "8px 12px";
		counter.style.pointerEvents = "none";
		counter.style.cursor = "default";
		counter.style.width = `${this.kxsClient.defaultSizes[name].width}px`;
		counter.style.height = `${this.kxsClient.defaultSizes[name].height}px`;
		counter.style.display = "flex";
		counter.style.alignItems = "center";
		counter.style.justifyContent = "center";
		counter.style.textAlign = "center";
		counter.style.resize = "both";
		counter.style.overflow = "hidden";
		counter.style.textShadow = "0 1px 2px rgba(0, 0, 0, 0.5)";
		counter.style.transition = `all ${DesignSystem.animation.normal} ease`;

		// Reset the counter value
		const labelElement = counter.querySelector('span:first-child');
		const valueElement = counter.querySelector('span:last-child');

		if (labelElement && valueElement) {
			labelElement.textContent = `${label}:`;
			valueElement.textContent = initialText;

			// Ensure label styling is consistent
			(labelElement as HTMLElement).style.fontWeight = "600";
			(labelElement as HTMLElement).style.marginRight = "6px";
			(labelElement as HTMLElement).style.color = "#ffffff";

			// Ensure value styling is consistent
			(valueElement as HTMLElement).style.fontWeight = "500";
		} else {
			// Fallback if the spans don't exist
			counter.innerHTML = "";

			// Create new label and value elements
			const newLabelElement = document.createElement("span");
			newLabelElement.style.fontWeight = "700";
			newLabelElement.style.marginRight = DesignSystem.spacing.sm;
			newLabelElement.style.color = DesignSystem.colors.primary;
			newLabelElement.textContent = `${label}:`;

			const newValueElement = document.createElement("span");
			newValueElement.style.fontWeight = "500";
			newValueElement.textContent = initialText;

			counter.appendChild(newLabelElement);
			counter.appendChild(newValueElement);
		}

		// Clear the saved position for this counter only
		localStorage.removeItem(`${name}CounterPosition`);
	}

	updateBoostBars() {
		if (!client.options.is_counters_enable) return;

		const boostCounter = document.querySelector("#ui-boost-counter");
		if (boostCounter) {
			// Si les indicateurs sont désactivés, on supprime les éléments personnalisés
			if (!this.kxsClient.isHealBarIndicatorEnabled) {
				this.cleanBoostDisplay(boostCounter);
				return;
			}

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
		// Get all weapon containers
		const weaponContainers = Array.from(
			document.getElementsByClassName("ui-weapon-switch"),
		);

		// Get all weapon names
		const weaponNames = Array.from(
			document.getElementsByClassName("ui-weapon-name"),
		);

		// Clear any existing observers
		this.clearWeaponBorderObservers();

		if (this.kxsClient.isGunOverlayColored) {
			// Apply initial border colors
			weaponContainers.forEach((container) => {
				if (container.id === "ui-weapon-id-4") {
					(container as HTMLElement).style.border = "3px solid #2f4032";
				} else {
					(container as HTMLElement).style.border = "3px solid #FFFFFF";
				}
			});

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
				BROWN: '#64411f',
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

			// Set up observers for dynamic color changes
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

				// Store the observer for later cleanup
				this.weaponBorderObservers = this.weaponBorderObservers || [];
				this.weaponBorderObservers.push(observer);
			});
		} else {
			// If the feature is disabled, reset all weapon borders to default
			weaponContainers.forEach((container) => {
				// Reset to game's default border style
				(container as HTMLElement).style.border = "";
			});
		}
	}

	// Helper method to clear weapon border observers
	private clearWeaponBorderObservers() {
		if (this.weaponBorderObservers && this.weaponBorderObservers.length > 0) {
			this.weaponBorderObservers.forEach(observer => {
				observer.disconnect();
			});
			this.weaponBorderObservers = [];
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
	animation: kxs-rainbow 6s linear infinite, kxs-glint 4s ease-in-out infinite, kxs-bg-rainbow 12s linear infinite;
	will-change: border-image, background-position;
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

			// Reapply regular colored borders if that feature is enabled
			if (this.kxsClient.isGunOverlayColored) {
				this.toggleWeaponBorderHandler();
			}
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

	// Nettoie l'affichage boost personnalisé
	cleanBoostDisplay(boostCounter: Element) {
		const boostDisplay = boostCounter.querySelector(".boost-display");
		if (boostDisplay) {
			boostDisplay.remove();
		}
	}

	// Nettoie l'affichage santé personnalisé
	cleanHealthDisplay(container: Element) {
		const percentageText = container.querySelector(".health-text");
		if (percentageText) {
			percentageText.remove();
		}

		const healthChangeElements = container.querySelectorAll(".health-change");
		healthChangeElements.forEach(el => el.remove());
	}

	updateHealthBars() {
		if (!client.options.is_counters_enable) return;

		const healthBars = document.querySelectorAll("#ui-health-container");
		healthBars.forEach((container) => {
			// Si les indicateurs sont désactivés, on supprime les éléments personnalisés
			if (!this.kxsClient.isHealBarIndicatorEnabled) {
				this.cleanHealthDisplay(container);
				return;
			}

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
		if (!client.options.is_counters_enable) return;

		const healthContainer = container as HTMLElement;

		if (!healthContainer || !this.kxsClient.isHealBarIndicatorEnabled) return;

		// Create animation element
		const animationElement = document.createElement("div");
		animationElement.classList.add("health-change");
		const isPositive = change > 0;

		Object.assign(animationElement.style, {
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
			animationElement.textContent = `${isPositive ? "+" : ""}${change} HP`;
		} else {
			// Skip showing animation if change is NaN
			return;
		}

		container.appendChild(animationElement);

		this.healthAnimations.push({
			element: animationElement,
			startTime: performance.now(),
			duration: 1500, // Animation duration in milliseconds
			value: change,
		});
	}

	private updateCountersDraggableState() {
		const countersVisibility = {
			fps: this.kxsClient.isFpsVisible,
			ping: this.kxsClient.isPingVisible,
			kills: this.kxsClient.isKillsVisible,
		};

		Object.entries(countersVisibility).forEach(([name, visible]) => {
			const label = name.charAt(0).toUpperCase() + name.slice(1);
			const initialText = name === "fps" ? "60" : name === "ping" ? "45ms" : "0";
			this.toggleCounter(name, visible, label, initialText);
		});

		const isMenuOpen = this.kxsClient.secondaryMenu?.getMenuVisibility() || false;
		const counterNames = ['fps', 'kills', 'ping'];

		counterNames.forEach(name => {
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
