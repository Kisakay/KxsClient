import { HealthWarning } from "./HealthWarning";
import { KillLeaderTracker } from "./KillLeaderTracking";
import { GridSystem } from "./GridSystem";
import { DiscordTracking } from "./DiscordTracking";
import { StatsParser } from "./StatsParser";
import { PlayerStats } from "./types/types";
import { Config } from "./types/configtype";
import { UpdateChecker } from "./UpdateChecker";
import { DiscordWebSocket } from "./DiscordRichPresence";
import { NotificationManager } from "./NotificationManager";
import { KxsClientSecondaryMenu } from "./ClientSecondaryMenuRework";
import { KxsLegacyClientSecondaryMenu } from "./ClientSecondaryMenu";
import { SoundLibrary } from "./types/SoundLibrary";
import { background_song, death_sound, full_logo, win_sound } from ".";
import { KxsClientHUD } from "./ClientHUD";
import { Logger } from "./Logger";

export default class KxsClient {
	lastFrameTime: DOMHighResTimeStamp;

	// configuration
	isFpsUncapped: boolean;
	isFpsVisible: boolean;
	isPingVisible: boolean;
	isKillsVisible: boolean;
	isDeathSoundEnabled: boolean;
	isWinSoundEnabled: boolean;
	isHealthWarningEnabled: boolean;
	isAutoUpdateEnabled: boolean;
	isWinningAnimationEnabled: boolean;
	isKillLeaderTrackerEnabled: boolean;
	isLegaySecondaryMenu: boolean;
	isKillFeedBlint: boolean;
	isSpotifyPlayerEnabled: boolean;
	isMainMenuCleaned: boolean;
	isNotifyingForToggleMenu: boolean;
	isGunOverlayColored: boolean;
	isGunBorderChromatic: boolean;
	isFocusModeEnabled: boolean;
	all_friends: string;
	customCrosshair: string | null;

	currentServer: string | null | undefined;
	discordRPC: DiscordWebSocket
	healWarning: HealthWarning | undefined;
	kill_leader: KillLeaderTracker | undefined;
	discordTracker: DiscordTracking;
	updater: UpdateChecker;
	gridSystem: GridSystem;
	discordWebhookUrl: string | undefined;
	counters: Record<string, HTMLElement>;
	defaultPositions: Record<string, { left: number; top: number }>;
	defaultSizes: Record<string, { width: number; height: number }>;
	config: Config;
	discordToken: string | null;
	secondaryMenu: KxsClientSecondaryMenu | KxsLegacyClientSecondaryMenu;
	nm: NotificationManager;
	private deathObserver: MutationObserver | null = null;
	soundLibrary: SoundLibrary;
	hud: KxsClientHUD;
	logger: Logger;

	protected menu: HTMLElement;
	animationFrameCallback:
		| ((callback: FrameRequestCallback) => void)
		| undefined;

	constructor() {
		this.logger = new Logger();
		this.config = require("../config.json");
		this.menu = document.createElement("div");
		this.lastFrameTime = performance.now();
		this.isFpsUncapped = false;
		this.isFpsVisible = true;
		this.isPingVisible = true;
		this.isKillsVisible = true;
		this.isDeathSoundEnabled = true;
		this.isWinSoundEnabled = true;
		this.isHealthWarningEnabled = true;
		this.isAutoUpdateEnabled = true;
		this.isWinningAnimationEnabled = true;
		this.isKillLeaderTrackerEnabled = true;
		this.isLegaySecondaryMenu = false;
		this.isKillFeedBlint = false;
		this.isSpotifyPlayerEnabled = false;
		this.discordToken = null;
		this.counters = {};
		this.all_friends = '';
		this.isMainMenuCleaned = false;
		this.isNotifyingForToggleMenu = true;
		this.isGunOverlayColored = true;
		this.customCrosshair = null;
		this.isGunBorderChromatic = false;

		this.isFocusModeEnabled = false;
		this.defaultPositions = {
			fps: { left: 20, top: 160 },
			ping: { left: 20, top: 220 },
			kills: { left: 20, top: 280 },
			lowHpWarning: { left: 285, top: 742 },
		};
		this.defaultSizes = {
			fps: { width: 100, height: 30 },
			ping: { width: 100, height: 30 },
			kills: { width: 100, height: 30 },
		};

		this.soundLibrary = {
			win_sound_url: win_sound,
			death_sound_url: death_sound,
			background_sound_url: background_song,
		};

		this.gridSystem = new GridSystem();

		// Before all, load local storage
		this.loadLocalStorage();
		this.changeSurvevLogo();

		this.nm = NotificationManager.getInstance();
		this.discordRPC = new DiscordWebSocket(this, this.parseToken(this.discordToken));
		this.updater = new UpdateChecker(this);
		this.kill_leader = new KillLeaderTracker(this);
		this.healWarning = new HealthWarning(this);

		this.setAnimationFrameCallback();
		this.loadBackgroundFromLocalStorage();
		this.initDeathDetection();
		this.discordRPC.connect();
		this.hud = new KxsClientHUD(this);

		if (this.isLegaySecondaryMenu) {
			this.secondaryMenu = new KxsLegacyClientSecondaryMenu(this);
		} else {
			this.secondaryMenu = new KxsClientSecondaryMenu(this);
		}

		this.discordTracker = new DiscordTracking(this, this.discordWebhookUrl!);

		if (this.isSpotifyPlayerEnabled) {
			this.createSimpleSpotifyPlayer();
		}

		this.MainMenuCleaning();
	}

	parseToken(token: string | null): string | null {
		if (token) {
			return token.replace(/^(["'`])(.+)\1$/, '$2');
		}
		return null;
	}

	getPlayerName() {
		let config = localStorage.getItem("surviv_config");
		if (config) {
			let configObject = JSON.parse(config);
			return configObject.playerName;
		}
	}

	private changeSurvevLogo() {
		var startRowHeader = document.querySelector("#start-row-header");

		if (startRowHeader) {
			(startRowHeader as HTMLElement).style.backgroundImage =
				`url("${full_logo}")`;
		}
	}


	private detectDeviceType(): "mobile" | "tablet" | "desktop" {
		const ua = navigator.userAgent;

		if (/Mobi|Android/i.test(ua)) {
			if (/Tablet|iPad/i.test(ua)) {
				return "tablet";
			}
			return "mobile";
		}

		if (/iPad|Tablet/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) {
			return "tablet";
		}

		return "desktop";
	}

	public isMobile(): boolean {
		return this.detectDeviceType() !== "desktop";
	}

	updateLocalStorage() {
		localStorage.setItem(
			"userSettings",
			JSON.stringify({
				isFpsVisible: this.isFpsVisible,
				isPingVisible: this.isPingVisible,
				isFpsUncapped: this.isFpsUncapped,
				isKillsVisible: this.isKillsVisible,
				discordWebhookUrl: this.discordWebhookUrl,
				isDeathSoundEnabled: this.isDeathSoundEnabled,
				isWinSoundEnabled: this.isWinSoundEnabled,
				isHealthWarningEnabled: this.isHealthWarningEnabled,
				isAutoUpdateEnabled: this.isAutoUpdateEnabled,
				isWinningAnimationEnabled: this.isWinningAnimationEnabled,
				discordToken: this.discordToken,
				isKillLeaderTrackerEnabled: this.isKillLeaderTrackerEnabled,
				isLegaySecondaryMenu: this.isLegaySecondaryMenu,
				isKillFeedBlint: this.isKillFeedBlint,
				all_friends: this.all_friends,
				isSpotifyPlayerEnabled: this.isSpotifyPlayerEnabled,
				isMainMenuCleaned: this.isMainMenuCleaned,
				isNotifyingForToggleMenu: this.isNotifyingForToggleMenu,
				soundLibrary: this.soundLibrary,
				customCrosshair: this.customCrosshair,
				isGunOverlayColored: this.isGunOverlayColored,
				isGunBorderChromatic: this.isGunBorderChromatic
			}),
		);
	};

	private initDeathDetection(): void {
		const config = {
			childList: true,
			subtree: true,
			attributes: false,
			characterData: false,
		};

		this.deathObserver = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (mutation.addedNodes.length) {
					this.checkForDeathScreen(mutation.addedNodes);
				}
			}
		});

		this.deathObserver.observe(document.body, config);
	}

	private checkForDeathScreen(nodes: NodeList): void {
		let loseArray = [
			"died",
			"eliminated",
			"was"
		];

		let winArray = [
			"Winner",
			"Victory",
			"dinner",
		];

		nodes.forEach((node) => {
			if (node instanceof HTMLElement) {
				const deathTitle = node.querySelector(".ui-stats-header-title");
				if (loseArray.some((word) => deathTitle?.textContent?.toLowerCase().includes(word))) {
					this.handlePlayerDeath();
				} else if (winArray.some((word) => deathTitle?.textContent?.toLowerCase().includes(word))) {
					this.handlePlayerWin();
				}
			}
		});
	}

	private async handlePlayerDeath(): Promise<void> {
		try {
			if (this.isDeathSoundEnabled) {
				const audio = new Audio(
					this.soundLibrary.death_sound_url,
				);
				audio.volume = 0.3;
				audio.play().catch((err) => false);
			}
		} catch (error) {
			this.logger.error("Reading error:", error);
		}

		const stats = this.getPlayerStats(false);

		await this.discordTracker.trackGameEnd({
			username: stats.username,
			kills: stats.kills,
			damageDealt: stats.damageDealt,
			damageTaken: stats.damageTaken,
			duration: stats.duration,
			position: stats.position,
			isWin: false,
		});
	}

	private async handlePlayerWin(): Promise<void> {
		if (this.isWinningAnimationEnabled) {
			this.felicitation();
		}

		const stats = this.getPlayerStats(true);

		await this.discordTracker.trackGameEnd({
			username: stats.username,
			kills: stats.kills,
			damageDealt: stats.damageDealt,
			damageTaken: stats.damageTaken,
			duration: stats.duration,
			position: stats.position,
			isWin: true,
			stuff: {
				main_weapon: document.querySelector('#ui-weapon-id-1 .ui-weapon-name')?.textContent,
				secondary_weapon: document.querySelector('#ui-weapon-id-2 .ui-weapon-name')?.textContent,
				soda: document.querySelector("#ui-loot-soda .ui-loot-count")?.textContent,
				melees: document.querySelector('#ui-weapon-id-3 .ui-weapon-name')?.textContent,
				grenades: document.querySelector(`#ui-weapon-id-4 .ui-weapon-name`)?.textContent,
				medkit: document.querySelector("#ui-loot-healthkit .ui-loot-count")?.textContent,
				bandage: document.querySelector("#ui-loot-bandage .ui-loot-count")?.textContent,
				pills: document.querySelector("#ui-loot-painkiller .ui-loot-count")?.textContent,
				backpack: document.querySelector("#ui-armor-backpack .ui-armor-level")?.textContent,
				chest: document.querySelector("#ui-armor-chest .ui-armor-level")?.textContent,
				helmet: document.querySelector("#ui-armor-helmet .ui-armor-level")?.textContent,
			}
		});
	}

	felicitation() {
		const goldText = document.createElement("div");
		goldText.textContent = "#1";
		goldText.style.position = "fixed";
		goldText.style.top = "50%";
		goldText.style.left = "50%";
		goldText.style.transform = "translate(-50%, -50%)";
		goldText.style.fontSize = "80px";
		goldText.style.color = "gold";
		goldText.style.textShadow = "2px 2px 4px rgba(0,0,0,0.3)";
		goldText.style.zIndex = "10000";
		document.body.appendChild(goldText);

		function createConfetti() {
			const colors = [
				"#ff0000",
				"#00ff00",
				"#0000ff",
				"#ffff00",
				"#ff00ff",
				"#00ffff",
				"gold",
			];
			const confetti = document.createElement("div");

			confetti.style.position = "fixed";
			confetti.style.width = Math.random() * 10 + 5 + "px";
			confetti.style.height = Math.random() * 10 + 5 + "px";
			confetti.style.backgroundColor =
				colors[Math.floor(Math.random() * colors.length)];
			confetti.style.borderRadius = "50%";
			confetti.style.zIndex = "9999";

			confetti.style.left = Math.random() * 100 + "vw";
			confetti.style.top = "-20px";

			document.body.appendChild(confetti);

			let posY = -20;
			let posX = parseFloat(confetti.style.left);
			let rotation = 0;
			let speedY = Math.random() * 2 + 1;
			let speedX = Math.random() * 2 - 1;

			function fall() {
				posY += speedY;
				posX += speedX;
				rotation += 5;

				confetti.style.top = posY + "px";
				confetti.style.left = posX + "vw";
				confetti.style.transform = `rotate(${rotation}deg)`;

				if (posY < window.innerHeight) {
					requestAnimationFrame(fall);
				} else {
					confetti.remove();
				}
			}

			fall();
		}

		const confettiInterval = setInterval(() => {
			for (let i = 0; i < 5; i++) {
				createConfetti();
			}
		}, 100);

		if (this.isWinSoundEnabled) {
			const audio = new Audio(
				this.soundLibrary.win_sound_url,
			);
			audio.play().catch((err) => this.logger.error("Erreur lecture:", err));
		}

		setTimeout(() => {
			clearInterval(confettiInterval);
			goldText.style.transition = "opacity 1s";
			goldText.style.opacity = "0";
			setTimeout(() => goldText.remove(), 1000);
		}, 5000);
	}

	public cleanup(): void {
		if (this.deathObserver) {
			this.deathObserver.disconnect();
			this.deathObserver = null;
		}
	}

	private getUsername(): string {
		const configKey = "surviv_config";
		const savedConfig = localStorage.getItem(configKey)!;

		const config = JSON.parse(savedConfig);

		if (config.playerName) {
			return config.playerName;
		} else {
			return "Player";
		}
	}

	private getPlayerStats(win: boolean): PlayerStats {
		const statsInfo = win
			? document.querySelector(".ui-stats-info-player")
			: document.querySelector(".ui-stats-info-player.ui-stats-info-status");
		const rank = document.querySelector(".ui-stats-header-value");

		if (!statsInfo?.textContent || !rank?.textContent) {
			return {
				username: this.getUsername(),
				kills: 0,
				damageDealt: 0,
				damageTaken: 0,
				duration: "0s",
				position: "#unknown",
			};
		}

		const parsedStats = StatsParser.parse(
			statsInfo.textContent,
			rank?.textContent,
		);
		parsedStats.username = this.getUsername();

		return parsedStats;
	}

	setAnimationFrameCallback() {
		this.animationFrameCallback = this.isFpsUncapped
			? (callback) => setTimeout(callback, 1)
			: window.requestAnimationFrame.bind(window);
	}

	makeResizable(element: HTMLDivElement, storageKey: string) {
		let isResizing = false;
		let startX: number, startY: number, startWidth: number, startHeight: number;

		// Add a resize area in the bottom right
		const resizer = document.createElement("div");
		Object.assign(resizer.style, {
			width: "10px",
			height: "10px",
			backgroundColor: "white",
			position: "absolute",
			right: "0",
			bottom: "0",
			cursor: "nwse-resize",
			zIndex: "10001",
		});
		element.appendChild(resizer);

		resizer.addEventListener("mousedown", (event) => {
			isResizing = true;
			startX = event.clientX;
			startY = event.clientY;
			startWidth = element.offsetWidth;
			startHeight = element.offsetHeight;
			event.stopPropagation(); // Empêche l'activation du déplacement
		});

		window.addEventListener("mousemove", (event) => {
			if (isResizing) {
				const newWidth = startWidth + (event.clientX - startX);
				const newHeight = startHeight + (event.clientY - startY);

				element.style.width = `${newWidth}px`;
				element.style.height = `${newHeight}px`;

				// Sauvegarde de la taille
				localStorage.setItem(
					storageKey,
					JSON.stringify({
						width: newWidth,
						height: newHeight,
					}),
				);
			}
		});

		window.addEventListener("mouseup", () => {
			isResizing = false;
		});

		const savedSize = localStorage.getItem(storageKey);
		if (savedSize) {
			const { width, height } = JSON.parse(savedSize);
			element.style.width = `${width}px`;
			element.style.height = `${height}px`;
		} else {
			element.style.width = "150px"; // Taille par défaut
			element.style.height = "50px";
		}
	}

	makeDraggable(element: HTMLElement, storageKey: string) {
		let isDragging = false;
		let dragOffset = { x: 0, y: 0 };

		element.addEventListener("mousedown", (event) => {
			if (event.button === 0) {
				// Left click only
				isDragging = true;
				this.gridSystem.toggleGrid(); // Afficher la grille quand on commence à déplacer
				dragOffset = {
					x: event.clientX - element.offsetLeft,
					y: event.clientY - element.offsetTop,
				};
				element.style.cursor = "grabbing";
			}
		});

		window.addEventListener("mousemove", (event) => {
			if (isDragging) {
				const rawX = event.clientX - dragOffset.x;
				const rawY = event.clientY - dragOffset.y;

				// Get snapped coordinates from grid system
				const snapped = this.gridSystem.snapToGrid(element, rawX, rawY);

				// Prevent moving off screen
				const maxX = window.innerWidth - element.offsetWidth;
				const maxY = window.innerHeight - element.offsetHeight;

				element.style.left = `${Math.max(0, Math.min(snapped.x, maxX))}px`;
				element.style.top = `${Math.max(0, Math.min(snapped.y, maxY))}px`;

				// Highlight nearest grid lines while dragging
				this.gridSystem.highlightNearestGridLine(rawX, rawY);

				// Save position
				localStorage.setItem(
					storageKey,
					JSON.stringify({
						x: parseInt(element.style.left),
						y: parseInt(element.style.top),
					}),
				);
			}
		});

		window.addEventListener("mouseup", () => {
			if (isDragging) {
				isDragging = false;
				this.gridSystem.toggleGrid(); // Masquer la grille quand on arrête de déplacer
				element.style.cursor = "move";
			}
		});

		// Load saved position
		const savedPosition = localStorage.getItem(storageKey);
		if (savedPosition) {
			const { x, y } = JSON.parse(savedPosition);
			const snapped = this.gridSystem.snapToGrid(element, x, y);
			element.style.left = `${snapped.x}px`;
			element.style.top = `${snapped.y}px`;
		}
	}

	getKills() {
		const killElement = document.querySelector(
			".ui-player-kills.js-ui-player-kills",
		);
		if (killElement) {
			const kills = parseInt(killElement.textContent || "", 10);
			return isNaN(kills) ? 0 : kills;
		}
		return 0;
	}

	getRegionFromLocalStorage() {
		let config = localStorage.getItem("surviv_config");
		if (config) {
			let configObject = JSON.parse(config);
			return configObject.region;
		}
		return null;
	}

	saveBackgroundToLocalStorage(image: string | File) {
		if (typeof image === "string") {
			localStorage.setItem("lastBackgroundUrl", image);
		}

		if (typeof image === "string") {
			localStorage.setItem("lastBackgroundType", "url");
			localStorage.setItem("lastBackgroundValue", image);
		} else {
			localStorage.setItem("lastBackgroundType", "local");
			const reader = new FileReader();
			reader.onload = () => {
				localStorage.setItem("lastBackgroundValue", reader.result as string);
			};
			reader.readAsDataURL(image);
		}
	}

	loadBackgroundFromLocalStorage() {
		const backgroundType = localStorage.getItem("lastBackgroundType");
		const backgroundValue = localStorage.getItem("lastBackgroundValue");

		const backgroundElement = document.getElementById("background");
		if (backgroundElement && backgroundType && backgroundValue) {
			if (backgroundType === "url") {
				backgroundElement.style.backgroundImage = `url(${backgroundValue})`;
			} else if (backgroundType === "local") {
				backgroundElement.style.backgroundImage = `url(${backgroundValue})`;
			}
		}
	}

	loadLocalStorage() {
		const savedSettings = localStorage.getItem("userSettings")
			? JSON.parse(localStorage.getItem("userSettings")!)
			: null;
		if (savedSettings) {
			this.isFpsVisible = savedSettings.isFpsVisible ?? this.isFpsVisible;
			this.isPingVisible = savedSettings.isPingVisible ?? this.isPingVisible;
			this.isFpsUncapped = savedSettings.isFpsUncapped ?? this.isFpsUncapped;
			this.isKillsVisible = savedSettings.isKillsVisible ?? this.isKillsVisible;
			this.discordWebhookUrl = savedSettings.discordWebhookUrl ?? this.discordWebhookUrl;
			this.isHealthWarningEnabled = savedSettings.isHealthWarningEnabled ?? this.isHealthWarningEnabled;
			this.isAutoUpdateEnabled = savedSettings.isAutoUpdateEnabled ?? this.isAutoUpdateEnabled;
			this.isWinningAnimationEnabled = savedSettings.isWinningAnimationEnabled ?? this.isWinningAnimationEnabled;
			this.discordToken = savedSettings.discordToken ?? this.discordToken;
			this.isKillLeaderTrackerEnabled = savedSettings.isKillLeaderTrackerEnabled ?? this.isKillLeaderTrackerEnabled;
			this.isLegaySecondaryMenu = savedSettings.isLegaySecondaryMenu ?? this.isLegaySecondaryMenu
			this.isKillFeedBlint = savedSettings.isKillFeedBlint ?? this.isKillFeedBlint;
			this.all_friends = savedSettings.all_friends ?? this.all_friends;
			this.isSpotifyPlayerEnabled = savedSettings.isSpotifyPlayerEnabled ?? this.isSpotifyPlayerEnabled;
			this.isMainMenuCleaned = savedSettings.isMainMenuCleaned ?? this.isMainMenuCleaned;
			this.isNotifyingForToggleMenu = savedSettings.isNotifyingForToggleMenu ?? this.isNotifyingForToggleMenu;
			this.customCrosshair = savedSettings.customCrosshair ?? this.customCrosshair;
			this.isGunOverlayColored = savedSettings.isGunOverlayColored ?? this.isGunOverlayColored;
			this.isGunBorderChromatic = savedSettings.isGunBorderChromatic ?? this.isGunBorderChromatic;

			if (savedSettings.soundLibrary) {
				// Check if the sound value exists
				if (savedSettings.soundLibrary.win_sound_url) {
					this.soundLibrary.win_sound_url = savedSettings.soundLibrary.win_sound_url;
				}
				if (savedSettings.soundLibrary.death_sound_url) {
					this.soundLibrary.death_sound_url = savedSettings.soundLibrary.death_sound_url;
				}
				if (savedSettings.soundLibrary.background_sound_url) {
					this.soundLibrary.background_sound_url = savedSettings.soundLibrary.background_sound_url;
				}
			}
		}

		this.updateKillsVisibility();
		this.updateFpsVisibility();
		this.updatePingVisibility();
	}

	updateFpsVisibility() {
		if (this.counters.fps) {
			this.counters.fps.style.display = this.isFpsVisible ? "block" : "none";
			this.counters.fps.style.backgroundColor = this.isFpsVisible
				? "rgba(0, 0, 0, 0.2)"
				: "transparent";
		}
	}

	updatePingVisibility() {
		if (this.counters.ping) {
			this.counters.ping.style.display = this.isPingVisible ? "block" : "none";
		}
	}

	updateKillsVisibility() {
		if (this.counters.kills) {
			this.counters.kills.style.display = this.isKillsVisible
				? "block"
				: "none";
			this.counters.kills.style.backgroundColor = this.isKillsVisible
				? "rgba(0, 0, 0, 0.2)"
				: "transparent";
		}
	}

	createSimpleSpotifyPlayer() {
		// Ajouter une règle CSS globale pour supprimer toutes les bordures et améliorer le redimensionnement
		const styleElement = document.createElement('style');
		styleElement.textContent = `
			#spotify-player-container, 
			#spotify-player-container *, 
			#spotify-player-iframe, 
			.spotify-resize-handle {
				border: none !important;
				outline: none !important;
				box-sizing: content-box !important;
			}
			#spotify-player-iframe {
				padding-bottom: 0 !important;
				margin-bottom: 0 !important;
			}
			.spotify-resize-handle {
				touch-action: none;
				backface-visibility: hidden;
			}
			.spotify-resizing {
				user-select: none !important;
				pointer-events: none !important;
			}
			.spotify-resizing .spotify-resize-handle {
				pointer-events: all !important;
			}
		`;
		document.head.appendChild(styleElement);

		// Main container
		const container = document.createElement('div');
		container.id = 'spotify-player-container';
		// Récupérer la position sauvegardée si disponible
		const savedLeft = localStorage.getItem('kxsSpotifyPlayerLeft');
		const savedTop = localStorage.getItem('kxsSpotifyPlayerTop');

		Object.assign(container.style, {
			position: 'fixed',
			width: '320px',
			backgroundColor: '#121212',
			borderRadius: '0px',
			boxShadow: 'none',
			overflow: 'hidden',
			zIndex: '10000',
			fontFamily: 'Montserrat, Arial, sans-serif',
			transition: 'transform 0.3s ease, opacity 0.3s ease',
			transform: 'translateY(0)',
			opacity: '1'
		});

		// Appliquer la position sauvegardée ou la position par défaut
		if (savedLeft && savedTop) {
			container.style.left = savedLeft;
			container.style.top = savedTop;
			container.style.right = 'auto';
			container.style.bottom = 'auto';
		} else {
			container.style.right = '20px';
			container.style.bottom = '20px';
		}

		// Player header
		const header = document.createElement('div');
		Object.assign(header.style, {
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'space-between',
			padding: '12px 16px',
			backgroundColor: '#070707',
			color: 'white',
			borderBottom: 'none',
			position: 'relative' // For absolute positioning of the button
		});

		// Spotify logo
		const logo = document.createElement('div');
		logo.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="#1DB954" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>`;

		const title = document.createElement('span');
		title.textContent = 'Spotify Player';
		title.style.marginLeft = '8px';
		title.style.fontWeight = 'bold';

		const logoContainer = document.createElement('div');
		logoContainer.style.display = 'flex';
		logoContainer.style.alignItems = 'center';
		logoContainer.appendChild(logo);
		logoContainer.appendChild(title);

		// Control buttons
		const controls = document.createElement('div');
		controls.style.display = 'flex';
		controls.style.alignItems = 'center';

		// Minimize button
		const minimizeBtn = document.createElement('button');
		Object.assign(minimizeBtn.style, {
			background: 'none',
			border: 'none',
			color: '#aaa',
			cursor: 'pointer',
			fontSize: '18px',
			padding: '0',
			marginLeft: '10px',
			width: '24px',
			height: '24px',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center'
		});
		minimizeBtn.innerHTML = '−';
		minimizeBtn.title = 'Minimize';

		// Close button
		const closeBtn = document.createElement('button');
		Object.assign(closeBtn.style, {
			background: 'none',
			border: 'none',
			color: '#aaa',
			cursor: 'pointer',
			fontSize: '18px',
			padding: '0',
			marginLeft: '10px',
			width: '24px',
			height: '24px',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center'
		});
		closeBtn.innerHTML = '×';
		closeBtn.title = 'Close';

		controls.appendChild(minimizeBtn);
		controls.appendChild(closeBtn);

		header.appendChild(logoContainer);
		header.appendChild(controls);

		// Album cover image
		const albumArt = document.createElement('div');
		Object.assign(albumArt.style, {
			width: '50px',
			height: '50px',
			backgroundColor: '#333',
			backgroundSize: 'cover',
			backgroundPosition: 'center',
			borderRadius: '4px',
			flexShrink: '0'
		});
		albumArt.style.backgroundImage = `url('https://i.scdn.co/image/ab67616d00001e02fe24b9ffeb3c3fdb4f9abbe9')`;

		// Track information
		const trackInfo = document.createElement('div');
		Object.assign(trackInfo.style, {
			flex: '1',
			overflow: 'hidden'
		});
		// Player content
		const content = document.createElement('div');
		content.style.padding = '0';

		// Spotify iframe
		const iframe = document.createElement('iframe');
		iframe.id = 'spotify-player-iframe';
		iframe.src = 'https://open.spotify.com/embed/playlist/37i9dQZEVXcJZyENOWUFo7?utm_source=generator&theme=1';
		iframe.width = '100%';
		iframe.height = '152px';
		iframe.frameBorder = '0';
		iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
		iframe.style.border = 'none';
		iframe.style.margin = '0';
		iframe.style.padding = '0';
		iframe.style.boxSizing = 'content-box';
		iframe.style.display = 'block'; // Forcer display block pour éviter les problèmes d'espacement
		iframe.setAttribute('frameBorder', '0');
		iframe.setAttribute('allowtransparency', 'true');
		iframe.setAttribute('scrolling', 'no'); // Désactiver le défilement interne

		content.appendChild(iframe);

		// Playlist change button integrated in the header
		const changePlaylistContainer = document.createElement('div');
		Object.assign(changePlaylistContainer.style, {
			display: 'flex',
			alignItems: 'center',
			marginRight: '10px'
		});

		// Square button to enter a playlist ID
		const changePlaylistBtn = document.createElement('button');
		Object.assign(changePlaylistBtn.style, {
			width: '24px',
			height: '24px',
			backgroundColor: '#1DB954',
			color: 'white',
			border: 'none',
			borderRadius: '4px',
			fontSize: '14px',
			fontWeight: 'bold',
			cursor: 'pointer',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			margin: '0 8px 0 0'
		});
		changePlaylistBtn.innerHTML = `
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M12 5V19M5 12H19" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		`;

		changePlaylistBtn.addEventListener('click', () => {
			const id = prompt('Enter the Spotify playlist ID:', '37i9dQZEVXcJZyENOWUFo7');
			if (id) {
				iframe.src = `https://open.spotify.com/embed/playlist/${id}?utm_source=generator&theme=0`;
				localStorage.setItem('kxsSpotifyPlaylist', id);


				// Simulate an album cover based on the playlist ID
				albumArt.style.backgroundImage = `url('https://i.scdn.co/image/ab67706f00000002${id.substring(0, 16)}')`;
			}
		});

		changePlaylistContainer.appendChild(changePlaylistBtn);

		// Load saved playlist
		const savedPlaylist = localStorage.getItem('kxsSpotifyPlaylist');
		if (savedPlaylist) {
			iframe.src = `https://open.spotify.com/embed/playlist/${savedPlaylist}?utm_source=generator&theme=0`;

			// Simulate an album cover based on the playlist ID
			albumArt.style.backgroundImage = `url('https://i.scdn.co/image/ab67706f00000002${savedPlaylist.substring(0, 16)}')`;
		}

		// Integrate the playlist change button into the controls
		controls.insertBefore(changePlaylistContainer, minimizeBtn);

		// Assemble the elements
		container.appendChild(header);
		container.appendChild(content);

		// Add a title to the button for accessibility
		changePlaylistBtn.title = "Change playlist";

		// Add to document
		document.body.appendChild(container);

		// Ajouter un bord redimensionnable au lecteur
		const resizeHandle = document.createElement('div');
		resizeHandle.className = 'spotify-resize-handle';
		Object.assign(resizeHandle.style, {
			position: 'absolute',
			bottom: '0',
			right: '0',
			width: '30px',
			height: '30px',
			cursor: 'nwse-resize',
			background: 'rgba(255, 255, 255, 0.1)',
			zIndex: '10001',
			pointerEvents: 'all'
		});

		// Ajouter un indicateur visuel de redimensionnement plus visible
		resizeHandle.innerHTML = `
			<svg width="14" height="14" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" style="position: absolute; bottom: 4px; right: 4px;">
				<path d="M9 9L5 9L9 5L9 9Z" fill="white"/>
				<path d="M5 9L1 9L9 1L9 5L5 9Z" fill="white"/>
				<path d="M1 9L1 5L5 1L9 1L1 9Z" fill="white"/>
				<path d="M1 5L1 1L5 1L1 5Z" fill="white"/>
			</svg>
		`;

		// Logique de redimensionnement
		let isResizing = false;
		let startX = 0, startY = 0;
		let startWidth = 0, startHeight = 0;

		resizeHandle.addEventListener('mousedown', (e) => {
			// Arrêter la propagation pour éviter que d'autres éléments interceptent l'événement
			e.stopPropagation();
			e.preventDefault();

			isResizing = true;
			startX = e.clientX;
			startY = e.clientY;
			startWidth = container.offsetWidth;
			startHeight = container.offsetHeight;

			// Ajouter une classe spéciale pendant le redimensionnement
			container.classList.add('spotify-resizing');

			// Appliquer le style pendant le redimensionnement
			container.style.transition = 'none';
			container.style.border = 'none';
			container.style.outline = 'none';
			iframe.style.border = 'none';
			iframe.style.outline = 'none';
			document.body.style.userSelect = 'none';

			// Ajouter un overlay de redimensionnement temporairement
			const resizeOverlay = document.createElement('div');
			resizeOverlay.id = 'spotify-resize-overlay';
			resizeOverlay.style.position = 'fixed';
			resizeOverlay.style.top = '0';
			resizeOverlay.style.left = '0';
			resizeOverlay.style.width = '100%';
			resizeOverlay.style.height = '100%';
			resizeOverlay.style.zIndex = '9999';
			resizeOverlay.style.cursor = 'nwse-resize';
			resizeOverlay.style.background = 'transparent';
			document.body.appendChild(resizeOverlay);
		});

		document.addEventListener('mousemove', (e) => {
			if (!isResizing) return;

			// Calculer les nouvelles dimensions
			const newWidth = startWidth + (e.clientX - startX);
			const newHeight = startHeight + (e.clientY - startY);

			// Limiter les dimensions minimales
			const minWidth = 320; // Largeur minimale
			const minHeight = 200; // Hauteur minimale

			// Appliquer les nouvelles dimensions si elles sont supérieures aux minimums
			if (newWidth >= minWidth) {
				container.style.width = newWidth + 'px';
				iframe.style.width = '100%';
			}

			if (newHeight >= minHeight) {
				container.style.height = newHeight + 'px';
				iframe.style.height = (newHeight - 50) + 'px'; // Ajuster la hauteur de l'iframe en conséquence
			}

			// Empêcher la sélection pendant le drag
			e.preventDefault();
		});

		document.addEventListener('mouseup', () => {
			if (isResizing) {
				isResizing = false;
				container.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
				container.style.border = 'none';
				container.style.outline = 'none';
				iframe.style.border = 'none';
				iframe.style.outline = 'none';
				document.body.style.userSelect = '';

				// Supprimer l'overlay de redimensionnement
				const overlay = document.getElementById('spotify-resize-overlay');
				if (overlay) overlay.remove();

				// Supprimer la classe de redimensionnement
				container.classList.remove('spotify-resizing');

				// Sauvegarder les dimensions pour la prochaine fois
				localStorage.setItem('kxsSpotifyPlayerWidth', container.style.width);
				localStorage.setItem('kxsSpotifyPlayerHeight', container.style.height);
			}
		});

		// Ajouter la poignée de redimensionnement au conteneur
		container.appendChild(resizeHandle);

		// Player states
		let isMinimized = false;

		// Events
		minimizeBtn.addEventListener('click', () => {
			if (isMinimized) {
				content.style.display = 'block';
				changePlaylistContainer.style.display = 'block';
				container.style.transform = 'translateY(0)';
				minimizeBtn.innerHTML = '−';
			} else {
				content.style.display = 'none';
				changePlaylistContainer.style.display = 'none';
				container.style.transform = 'translateY(0)';
				minimizeBtn.innerHTML = '+';
			}
			isMinimized = !isMinimized;
		});

		closeBtn.addEventListener('click', () => {
			container.style.transform = 'translateY(150%)';
			container.style.opacity = '0';
			setTimeout(() => {
				container.style.display = 'none';
				showButton.style.display = 'flex';
				showButton.style.alignItems = 'center';
				showButton.style.justifyContent = 'center';
			}, 300);
		});

		// Make the player draggable
		let isDragging = false;
		let offsetX: number = 0;
		let offsetY: number = 0;

		header.addEventListener('mousedown', (e) => {
			isDragging = true;
			offsetX = e.clientX - container.getBoundingClientRect().left;
			offsetY = e.clientY - container.getBoundingClientRect().top;
			container.style.transition = 'none';
		});

		document.addEventListener('mousemove', (e) => {
			if (isDragging) {
				container.style.right = 'auto';
				container.style.bottom = 'auto';
				container.style.left = (e.clientX - offsetX) + 'px';
				container.style.top = (e.clientY - offsetY) + 'px';
			}
		});

		document.addEventListener('mouseup', () => {
			if (isDragging) {
				isDragging = false;
				container.style.transition = 'transform 0.3s ease, opacity 0.3s ease';

				// Sauvegarder la position pour la prochaine fois
				localStorage.setItem('kxsSpotifyPlayerLeft', container.style.left);
				localStorage.setItem('kxsSpotifyPlayerTop', container.style.top);
			}
		});

		// Button to show the player again
		const showButton = document.createElement('button');
		showButton.id = 'spotify-float-button';
		Object.assign(showButton.style, {
			position: 'fixed',
			bottom: '20px',
			right: '20px',
			width: '50px',
			height: '50px',
			borderRadius: '50%',
			backgroundColor: '#1DB954',
			color: 'white',
			border: 'none',
			boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
			cursor: 'pointer',
			zIndex: '9999',
			fontSize: '24px',
			transition: 'transform 0.2s ease',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center'
		});
		showButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="white" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>`;

		document.body.appendChild(showButton);

		showButton.addEventListener('mouseenter', () => {
			showButton.style.transform = 'scale(1.1)';
		});

		showButton.addEventListener('mouseleave', () => {
			showButton.style.transform = 'scale(1)';
		});

		showButton.addEventListener('click', () => {
			container.style.display = 'block';
			container.style.transform = 'translateY(0)';
			container.style.opacity = '1';
			showButton.style.display = 'none';
		});

		return container;
	}

	toggleSpotifyMenu() {
		if (this.isSpotifyPlayerEnabled) {
			this.createSimpleSpotifyPlayer();
		} else {
			this.removeSimpleSpotifyPlayer();
		}
	}

	private adBlockObserver: MutationObserver | null = null;

	applyCustomMainMenuStyle() {
		// Sélectionner le menu principal
		const startMenu = document.getElementById('start-menu');
		const playButtons = document.querySelectorAll('.btn-green, #btn-help, .btn-team-option');
		const playerOptions = document.getElementById('player-options');
		const serverSelect = document.getElementById('server-select-main');
		const nameInput = document.getElementById('player-name-input-solo');
		const helpSection = document.getElementById('start-help');

		if (startMenu) {
			// Apply styles to the main container
			Object.assign(startMenu.style, {
				background: 'linear-gradient(135deg, rgba(25, 25, 35, 0.95) 0%, rgba(15, 15, 25, 0.98) 100%)',
				border: '1px solid rgba(255, 255, 255, 0.1)',
				borderRadius: '12px',
				boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
				padding: '15px',
				backdropFilter: 'blur(10px)',
				margin: '0 auto'
			});
		}

		// Style the buttons
		playButtons.forEach(button => {
			if (button instanceof HTMLElement) {
				if (button.classList.contains('btn-green')) {
					// Boutons Play
					Object.assign(button.style, {
						background: 'linear-gradient(135deg, #4287f5 0%, #3b76d9 100%)',
						borderRadius: '8px',
						border: '1px solid rgba(255, 255, 255, 0.2)',
						boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
						transition: 'all 0.2s ease',
						color: 'white',
						fontWeight: 'bold'
					});
				} else {
					// Autres boutons
					Object.assign(button.style, {
						background: 'rgba(40, 45, 60, 0.7)',
						borderRadius: '8px',
						border: '1px solid rgba(255, 255, 255, 0.1)',
						transition: 'all 0.2s ease',
						color: 'white'
					});
				}

				// Hover effect for all buttons
				button.addEventListener('mouseover', () => {
					button.style.transform = 'translateY(-2px)';
					button.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3)';
					button.style.filter = 'brightness(1.1)';
				});

				button.addEventListener('mouseout', () => {
					button.style.transform = 'translateY(0)';
					button.style.boxShadow = button.classList.contains('btn-green') ?
						'0 4px 12px rgba(0, 0, 0, 0.2)' : 'none';
					button.style.filter = 'brightness(1)';
				});
			}
		});

		// Styliser le sélecteur de serveur
		if (serverSelect instanceof HTMLSelectElement) {
			Object.assign(serverSelect.style, {
				background: 'rgba(30, 35, 50, 0.8)',
				borderRadius: '8px',
				border: '1px solid rgba(255, 255, 255, 0.1)',
				color: 'white',
				padding: '8px 12px',
				outline: 'none'
			});
		}

		// Styliser l'input du nom
		if (nameInput instanceof HTMLInputElement) {
			Object.assign(nameInput.style, {
				background: 'rgba(30, 35, 50, 0.8)',
				borderRadius: '8px',
				border: '1px solid rgba(255, 255, 255, 0.1)',
				color: 'white',
				padding: '8px 12px',
				outline: 'none'
			});

			// Focus style
			nameInput.addEventListener('focus', () => {
				nameInput.style.border = '1px solid #4287f5';
				nameInput.style.boxShadow = '0 0 8px rgba(66, 135, 245, 0.5)';
			});

			nameInput.addEventListener('blur', () => {
				nameInput.style.border = '1px solid rgba(255, 255, 255, 0.1)';
				nameInput.style.boxShadow = 'none';
			});
		}

		// Styliser la section d'aide
		if (helpSection) {
			Object.assign(helpSection.style, {
				background: 'rgba(20, 25, 40, 0.7)',
				borderRadius: '8px',
				padding: '15px',
				margin: '15px 0',
				maxHeight: '300px',
				overflowY: 'auto',
				scrollbarWidth: 'thin',
				scrollbarColor: '#4287f5 rgba(25, 25, 35, 0.5)'
			});

			// Style the help section titles
			const helpTitles = helpSection.querySelectorAll('h1');
			helpTitles.forEach(title => {
				if (title instanceof HTMLElement) {
					Object.assign(title.style, {
						color: '#4287f5',
						fontSize: '18px',
						marginTop: '15px',
						marginBottom: '8px'
					});
				}
			});

			// Style the paragraphs
			const helpParagraphs = helpSection.querySelectorAll('p');
			helpParagraphs.forEach(p => {
				if (p instanceof HTMLElement) {
					p.style.color = 'rgba(255, 255, 255, 0.8)';
					p.style.fontSize = '14px';
					p.style.marginBottom = '8px';
				}
			});

			// Style the action terms and controls
			const actionTerms = helpSection.querySelectorAll('.help-action');
			actionTerms.forEach(term => {
				if (term instanceof HTMLElement) {
					term.style.color = '#ffc107'; // Yellow
					term.style.fontWeight = 'bold';
				}
			});

			const controlTerms = helpSection.querySelectorAll('.help-control');
			controlTerms.forEach(term => {
				if (term instanceof HTMLElement) {
					term.style.color = '#4287f5'; // Bleu
					term.style.fontWeight = 'bold';
				}
			});
		}

		// Apply specific style to double buttons
		const btnsDoubleRow = document.querySelector('.btns-double-row');
		if (btnsDoubleRow instanceof HTMLElement) {
			btnsDoubleRow.style.display = 'flex';
			btnsDoubleRow.style.gap = '10px';
			btnsDoubleRow.style.marginTop = '10px';
		}
	}

	MainMenuCleaning() {
		// Déconnecter l'observateur précédent s'il existe
		if (this.adBlockObserver) {
			this.adBlockObserver.disconnect();
			this.adBlockObserver = null;
		}

		// Select elements to hide/show
		const newsWrapper = document.getElementById('news-wrapper');
		const adBlockLeft = document.getElementById('ad-block-left');
		const socialLeft = document.getElementById('social-share-block-wrapper');
		const leftCollun = document.getElementById('left-column');

		const elementsToMonitor = [
			{ element: newsWrapper, id: 'news-wrapper' },
			{ element: adBlockLeft, id: 'ad-block-left' },
			{ element: socialLeft, id: 'social-share-block-wrapper' },
			{ element: leftCollun, id: 'left-column' }
		];

		// Appliquer le style personnalisé au menu principal
		this.applyCustomMainMenuStyle();

		if (this.isMainMenuCleaned) {
			// Clean mode: hide elements
			elementsToMonitor.forEach(item => {
				if (item.element) item.element.style.display = 'none';
			});

			// Create an observer to prevent the site from redisplaying elements
			this.adBlockObserver = new MutationObserver((mutations) => {
				let needsUpdate = false;

				mutations.forEach(mutation => {
					if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
						const target = mutation.target as HTMLElement;

						// Check if the element is one of those we are monitoring
						if (elementsToMonitor.some(item => item.id === target.id && target.style.display !== 'none')) {
							target.style.display = 'none';
							needsUpdate = true;
						}
					}
				});

				// If the site tries to redisplay an advertising element, we prevent it
				if (needsUpdate) {
					this.logger.log('Detection of attempt to redisplay ads - Forced hiding');
				}
			});

			// Observe style changes on elements
			elementsToMonitor.forEach(item => {
				if (item.element && this.adBlockObserver) {
					this.adBlockObserver.observe(item.element, {
						attributes: true,
						attributeFilter: ['style']
					});
				}
			});

			// Vérifier également le document body pour de nouveaux éléments ajoutés
			const bodyObserver = new MutationObserver(() => {
				// Réappliquer notre nettoyage après un court délai
				setTimeout(() => {
					if (this.isMainMenuCleaned) {
						elementsToMonitor.forEach(item => {
							const element = document.getElementById(item.id);
							if (element && element.style.display !== 'none') {
								element.style.display = 'none';
							}
						});
					}
				}, 100);
			});

			// Observe changes in the DOM
			bodyObserver.observe(document.body, { childList: true, subtree: true });

		} else {
			// Mode normal: rétablir l'affichage
			elementsToMonitor.forEach(item => {
				if (item.element) item.element.style.display = 'block';
			});
		}
	}

	removeSimpleSpotifyPlayer() {
		// Supprimer le conteneur principal du lecteur
		const container = document.getElementById('spotify-player-container');
		if (container) {
			container.remove();
		}

		// Supprimer aussi le bouton flottant grâce à son ID
		const floatButton = document.getElementById('spotify-float-button');
		if (floatButton) {
			floatButton.remove();
		}
	}

}
