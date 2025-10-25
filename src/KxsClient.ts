import { HealthWarning } from "./HUD/MOD/HealthWarning";
import { KillLeaderTracker } from "./MECHANIC/KillLeaderTracking";
import { GridSystem } from "./HUD/GridSystem";
import { DiscordTracking, GameResult } from "./SERVER/DiscordTracking";
import { StatsParser } from "./FUNC/StatsParser";
import { PlayerStats } from "./types/types";
import { Config } from "./types/configtype";
import { UpdateChecker } from "./FUNC/UpdateChecker";
import { DiscordWebSocket } from "./SERVER/DiscordRichPresence";
import { NotificationManager } from "./HUD/MOD/NotificationManager";
import { KxsClientSecondaryMenu } from "./HUD/ClientSecondaryMenu";
import { SoundLibrary } from "./types/SoundLibrary";
import { background_song, gbl_sound, death_sound, full_logo, win_sound, survev_settings } from "./UTILS/vars";
import { KxsClientHUD } from "./HUD/ClientHUD";
import { Logger } from "./FUNC/Logger";
import { Browser2Database } from "./DATABASE/browser2";
import config from "../config.json";
import { GameHistoryMenu } from "./HUD/HistoryManager";
import { KxsNetwork, KxsNetworkSettings } from "./NETWORK/KxsNetwork";
import { KxsChat } from "./UTILS/KxsChat";
import { KxsVoiceChat } from "./UTILS/KxsVoiceChat";
import pkg from "../package.json";
import { KxsDeveloperOptions } from "./types/KxsDeveloperOptions";
import { ExchangeManager } from "./SERVER/exchangeManager";
import { felicitation } from "./FUNC/Felicitations";
import { PingTest } from "./SERVER/Ping";
import { PlayersAliveMonitor } from "./UTILS/aliveplayer";

export default class KxsClient {
	private onlineMenuElement: HTMLDivElement | null = null;
	private onlineMenuInterval: number | null = null;
	private deathObserver: MutationObserver | null = null;
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
	isKillFeedBlint: boolean;
	isSpotifyPlayerEnabled: boolean;
	isMainMenuCleaned: boolean;
	isNotifyingForToggleMenu: boolean;
	isGunOverlayColored: boolean;
	isGunBorderChromatic: boolean;
	isFocusModeEnabled: boolean;
	isVoiceChatEnabled: boolean;
	isKxsChatEnabled: boolean;
	isHealBarIndicatorEnabled: boolean;
	isKxsClientLogoEnable: boolean;
	isGlassmorphismEnabled: boolean;
	isCustomBackgroundEnabled: boolean;
	used: boolean;
	brightness: number;
	currentFocusModeState: boolean;

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
	secondaryMenu: KxsClientSecondaryMenu;
	nm: NotificationManager;
	soundLibrary: SoundLibrary;
	hud: KxsClientHUD;
	logger: Logger;
	db: Browser2Database;
	historyManager: GameHistoryMenu;
	kxsNetwork: KxsNetwork;
	chat: KxsChat;
	voiceChat: KxsVoiceChat;
	kxsNetworkSettings: KxsNetworkSettings;
	pkg: typeof pkg;
	ContextIsSecure: boolean;
	pingManager: PingTest;

	protected menu: HTMLElement;
	animationFrameCallback:
		| ((callback: FrameRequestCallback) => void)
		| undefined;

	kxsDeveloperOptions: KxsDeveloperOptions;
	exchangeManager: ExchangeManager;
	aliveplayer: PlayersAliveMonitor;

	constructor() {
		globalThis.kxsClient = this;
		this.pkg = pkg;

		this.logger = new Logger();
		this.config = config;
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
		this.isKxsChatEnabled = true;
		this.isVoiceChatEnabled = false;
		this.isHealBarIndicatorEnabled = true;
		this.brightness = 50;
		this.isKxsClientLogoEnable = true;
		this.isFocusModeEnabled = true;
		this.currentFocusModeState = false;
		this.isGlassmorphismEnabled = true;
		this.isCustomBackgroundEnabled = true;
		this.used = true;
		this.ContextIsSecure = window.location.protocol.startsWith("https");
		this.kxsDeveloperOptions = {
			enableGameIDExchange: false,
			exchange: {
				password: "",
			}
		};

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
		this.kxsNetworkSettings = {
			nickname_anonymized: false,
		}


		this.soundLibrary = {
			win_sound_url: win_sound,
			death_sound_url: death_sound,
			background_sound_url: background_song,
		};

		this.gridSystem = new GridSystem();
		this.db = new Browser2Database({ database: global.client.name, tableName: "gameplay_history" });
		// Before all, load local storage
		this.loadLocalStorage();
		this.updateLocalStorage();
		this.changeSurvevLogo();

		this.nm = NotificationManager.getInstance();
		this.discordRPC = new DiscordWebSocket(this, this.parseToken(this.discordToken));
		this.updater = new UpdateChecker(this);
		this.kill_leader = new KillLeaderTracker(this);
		this.secondaryMenu = new KxsClientSecondaryMenu(this);
		this.healWarning = new HealthWarning(this);
		this.historyManager = new GameHistoryMenu(this);
		this.kxsNetwork = new KxsNetwork(this);
		this.exchangeManager = new ExchangeManager(this);
		this.aliveplayer = new PlayersAliveMonitor();

		this.setAnimationFrameCallback();
		this.loadBackgroundFromLocalStorage();
		this.initDeathDetection();
		this.discordRPC.connect();
		this.pingManager = new PingTest();
		this.hud = new KxsClientHUD(this);

		this.discordTracker = new DiscordTracking(this, this.discordWebhookUrl!);
		this.chat = new KxsChat(this);
		this.voiceChat = new KxsVoiceChat(this, this.kxsNetwork);

		if (this.isSpotifyPlayerEnabled) {
			this.createSimpleSpotifyPlayer();
		}

		this.MainMenuCleaning();
		this.kxsNetwork.connect();
		this.createOnlineMenu();

		this.voiceChat.startVoiceChat();
	}

	parseToken(token: string | null): string | null {
		if (token) {
			return token.replace(/^(["'`])(.+)\1$/, '$2');
		}
		return null;
	}

	private changeSurvevLogo() {
		var startRowHeader = document.querySelector("#start-row-header");

		if (startRowHeader) {
			(startRowHeader as HTMLElement).style.backgroundImage =
				`url("${full_logo}")`;
		}
	}

	private createOnlineMenu() {
		const overlay = document.getElementById('start-overlay');
		if (!overlay) return;

		const menu = document.createElement('div');
		menu.id = 'kxs-online-menu';

		// Appliquer les styles de base
		const baseStyles = {
			position: 'absolute',
			top: '18px',
			left: '18px',
			color: '#fff',
			padding: '8px 18px',
			fontSize: '15px',
			zIndex: '999',
			userSelect: 'none',
			pointerEvents: 'auto',
			fontFamily: 'inherit',
			display: 'flex',
			alignItems: 'center'
		};

		// Appliquer les styles conditionnels selon le toggle glassmorphism
		const is_glassmorphism_enabled = this.isGlassmorphismEnabled;

		if (is_glassmorphism_enabled) {
			// Style glassmorphism
			Object.assign(baseStyles, {
				background: 'rgba(255, 255, 255, 0.1)',
				border: '1px solid rgba(255, 255, 255, 0.2)',
				borderRadius: '16px',
				boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
			});

			// Appliquer les styles à l'élément
			Object.assign(menu.style, baseStyles);

			// Appliquer le backdropFilter séparément (car il y a une duplication dans l'original)
			menu.style.backdropFilter = 'blur(20px) saturate(180%)';
			(menu.style as any)['-webkit-backdrop-filter'] = 'blur(20px) saturate(180%)';
		} else {
			// Style classique
			Object.assign(baseStyles, {
				background: 'rgba(50, 50, 50, 0.95)',
				border: '1px solid #555',
				borderRadius: '10px',
				boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)'
			});

			// Appliquer les styles à l'élément
			Object.assign(menu.style, baseStyles);
		}
		menu.style.cursor = 'pointer';
		menu.innerHTML = `
		  <span id="kxs-online-dot" style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#3fae2a;margin-right:10px;box-shadow:0 0 8px #3fae2a;animation:kxs-pulse 1s infinite alternate;"></span>
		  <b></b> <span id="kxs-online-count">...</span>
		`;

		const userListMenu = document.createElement('div');
		userListMenu.id = 'kxs-online-users-menu';

		// Styles communs pour le menu utilisateurs
		const userListStyles = {
			position: 'absolute',
			top: '100%',
			left: '0',
			marginTop: '8px',
			color: '#fff',
			padding: '10px',
			fontSize: '14px',
			zIndex: '1000',
			userSelect: 'none',
			width: '260px',
			maxHeight: '400px',
			overflowY: 'auto',
			display: 'none',
			flexDirection: 'column',
			gap: '6px'
		};

		// Appliquer les styles selon le toggle glassmorphism
		if (is_glassmorphism_enabled) {
			// Style glassmorphism
			Object.assign(userListStyles, {
				background: 'rgba(255, 255, 255, 0.08)',
				border: '1px solid rgba(255, 255, 255, 0.15)',
				borderRadius: '14px',
				boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
			});

			// Appliquer les styles à l'élément
			Object.assign(userListMenu.style, userListStyles);

			// Appliquer le backdropFilter séparément
			userListMenu.style.backdropFilter = 'blur(25px) saturate(180%)';
			(userListMenu.style as any)['-webkit-backdrop-filter'] = 'blur(25px) saturate(180%)';
		} else {
			// Style classique
			Object.assign(userListStyles, {
				background: 'rgba(45, 45, 45, 0.95)',
				border: '1px solid #444',
				borderRadius: '8px',
				boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35)'
			});

			// Appliquer les styles à l'élément
			Object.assign(userListMenu.style, userListStyles);
		}

		// Contenu du menu utilisateurs
		userListMenu.innerHTML = '<div style="text-align:center;padding:5px;">Chargement...</div>';

		// Ajouter le menu utilisateurs au menu principal
		menu.appendChild(userListMenu);

		if (!document.getElementById('kxs-online-style')) {
			const style = document.createElement('style');
			style.id = 'kxs-online-style';
			style.innerHTML = `
			@keyframes kxs-pulse {
			  0% { box-shadow:0 0 8px #3fae2a; opacity: 1; }
			  100% { box-shadow:0 0 16px #3fae2a; opacity: 0.6; }
			}
			
			/* Glassmorphism scrollbar styles */
			#kxs-online-users-menu {
			  /* Firefox scrollbar */
			  scrollbar-width: thin;
			  scrollbar-color: rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.05);
			}
			
			/* Webkit browsers (Chrome, Safari, Edge) */
			#kxs-online-users-menu::-webkit-scrollbar {
			  width: 8px;
			}
			
			#kxs-online-users-menu::-webkit-scrollbar-track {
			  background: rgba(255, 255, 255, 0.05);
			  border-radius: 10px;
			  backdrop-filter: blur(10px);
			  border: 1px solid rgba(255, 255, 255, 0.1);
			}
			
			#kxs-online-users-menu::-webkit-scrollbar-thumb {
			  background: rgba(255, 255, 255, 0.2);
			  border-radius: 10px;
			  backdrop-filter: blur(15px);
			  border: 1px solid rgba(255, 255, 255, 0.3);
			  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.4);
			  transition: all 0.3s ease;
			}
			
			#kxs-online-users-menu::-webkit-scrollbar-thumb:hover {
			  background: rgba(255, 255, 255, 0.3);
			  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.5);
			  transform: scale(1.1);
			}
			
			#kxs-online-users-menu::-webkit-scrollbar-thumb:active {
			  background: rgba(255, 255, 255, 0.4);
			  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.6);
			}
			
			/* Scrollbar corner */
			#kxs-online-users-menu::-webkit-scrollbar-corner {
			  background: rgba(255, 255, 255, 0.05);
			  border-radius: 10px;
			}
		  `;
			document.head.appendChild(style);
		}

		menu.addEventListener('click', (e) => {
			e.stopPropagation();
			if (userListMenu) {
				const isVisible = userListMenu.style.display === 'flex';
				userListMenu.style.display = isVisible ? 'none' : 'flex';

				if (userListMenu.style.display === 'flex') {
					setTimeout(() => {
						const closeMenuOnClickOutside = (event: MouseEvent) => {
							if (!menu.contains(event.target as Node) && !userListMenu.contains(event.target as Node)) {
								userListMenu.style.display = 'none';
								document.removeEventListener('click', closeMenuOnClickOutside);
							}
						};

						document.addEventListener('click', closeMenuOnClickOutside);
					}, 0);
				}
			}
		});

		userListMenu.addEventListener('click', (e) => {
			e.stopPropagation();
		});

		overlay.appendChild(menu);
		this.onlineMenuElement = menu;
		this.updateOnlineMenu();
		// Optimisé: augmenter l'intervalle pour réduire la charge
		this.onlineMenuInterval = window.setInterval(() => this.updateOnlineMenu(), 5000);
	}

	private async updateOnlineMenu() {
		if (!this.onlineMenuElement) return;
		const countEl = this.onlineMenuElement.querySelector('#kxs-online-count');
		const dot = this.onlineMenuElement.querySelector('#kxs-online-dot') as HTMLElement;
		const userListMenu = this.onlineMenuElement.querySelector('#kxs-online-users-menu');

		try {
			if (!this.kxsNetwork.connected) throw "KxsNetwork not connected"

			if (this.kxsNetwork["1"] === true) {
				if (countEl) countEl.textContent = atob("WW91ciBpcCBoYXMgYmVlbiBiYW5uZWQgZnJvbSB1c2luZyBLeHNOZXR3b3Jr");
				if (dot) {
					dot.style.background = '#888';
					dot.style.boxShadow = 'none';
					dot.style.animation = '';
				}
				if (userListMenu) {
					userListMenu.innerHTML = `<div style="text-align:center;padding:5px;">${atob("WW91ciBpcCBoYXMgYmVlbiBiYW5uZWQgZnJvbSB1c2luZyBLeHNOZXR3b3Jr")}</div>`;
				}
				return;
			}

			const res = this.kxsNetwork.getOnlineCount();
			const count = typeof res === 'number' ? res : '?';
			if (countEl) countEl.textContent = `${count} ${client.acronym_start_upper} users`;
			if (dot) {
				dot.style.background = '#3fae2a';
				dot.style.boxShadow = '0 0 8px #3fae2a';
				dot.style.animation = 'kxs-pulse 1s infinite alternate';
			}

			if (userListMenu) {
				const users = this.kxsNetwork.getKxsUsers();
				if (users && Array.isArray(users) && users.length > 0) {
					let userListHTML = '';

					userListHTML += '<div style="text-align:center;font-weight:bold;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.3);margin-bottom:8px;background:rgba(255,255,255,0.05);border-radius:6px;padding:8px;">Online users</div>';

					users.forEach(user => {
						userListHTML += `<div style="padding:6px 10px;border-radius:8px;background:rgba(255,255,255,0.1);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.1);transition:all 0.2s ease;">
							<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#3fae2a;margin-right:8px;box-shadow:0 0 6px rgba(63,174,42,0.6);"></span>
							${user}
						</div>`;
					});

					userListMenu.innerHTML = userListHTML;
				} else {
					userListMenu.innerHTML = '<div style="text-align:center;padding:5px;">No users online</div>';
				}
			}
		} catch (e) {
			if (countEl) countEl.textContent = 'API offline';
			if (dot) {
				dot.style.background = '#888';
				dot.style.boxShadow = 'none';
				dot.style.animation = '';
			}
			if (userListMenu) {
				userListMenu.innerHTML = '<div style="text-align:center;padding:5px;">API offline</div>';
			}
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
				isKillFeedBlint: this.isKillFeedBlint,
				all_friends: this.all_friends,
				isSpotifyPlayerEnabled: this.isSpotifyPlayerEnabled,
				isMainMenuCleaned: this.isMainMenuCleaned,
				isNotifyingForToggleMenu: this.isNotifyingForToggleMenu,
				soundLibrary: this.soundLibrary,
				customCrosshair: this.customCrosshair,
				isGunOverlayColored: this.isGunOverlayColored,
				isGunBorderChromatic: this.isGunBorderChromatic,
				isVoiceChatEnabled: this.isVoiceChatEnabled,
				isKxsChatEnabled: this.isKxsChatEnabled,
				kxsNetworkSettings: this.kxsNetworkSettings,
				isHealBarIndicatorEnabled: this.isHealBarIndicatorEnabled,
				brightness: this.brightness,
				isKxsClientLogoEnable: this.isKxsClientLogoEnable,
				isFocusModeEnabled: this.isFocusModeEnabled,
				kxsDeveloperOptions: this.kxsDeveloperOptions,
				isGlassmorphismEnabled: this.isGlassmorphismEnabled,
				isCustomBackgroundEnabled: this.isCustomBackgroundEnabled,
				used: this.used
			}),
		);
	};

	applyBrightness(value: number) {
		this.brightness = value;
		const brightnessValue = value / 50;
		document.documentElement.style.filter = `brightness(${brightnessValue})`;
		this.updateLocalStorage();
	}

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
					let isWin = this.isCurrentGameWin(mutation.addedNodes);

					if (isWin) {
						this.kxsNetwork.gameEnded();
						this.handlePlayerWin();
					} else {
						this.kxsNetwork.gameEnded();
						this.handlePlayerDeath();
					}
				}
			}
		});

		this.deathObserver.observe(document.body, config);
	}

	public isCurrentGameWin(nodes: NodeList): boolean {
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

		for (let node of nodes) {
			if (node instanceof HTMLElement) {
				const deathTitle = node.querySelector(".ui-stats-header-title");
				const deathTitle_2 = node.querySelector(".ui-stats-title");

				if (loseArray.some((word) => deathTitle?.textContent?.toLowerCase().includes(word))) {
					return false;
				} else if (winArray.some((word) => deathTitle?.textContent?.toLowerCase().includes(word))) {
					return true;
				} else if (deathTitle_2?.textContent?.toLowerCase().includes("result")) {
					return false;
				}
			}
		}
		return false;
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

		const body = this.getFinalGameBody();

		await this.discordTracker.trackGameEnd(body);
		this.db.set(new Date().toISOString(), body);
	}

	public getFinalGameBody(): GameResult {
		const stats = this.getPlayerStats(true);

		const body: GameResult = {
			username: stats.username,
			kills: stats.kills,
			damageDealt: stats.damageDealt,
			damageTaken: stats.damageTaken,
			duration: stats.duration,
			position: stats.position,
			isWin: false,
			stuff: {
				main_weapon: document.querySelector('#ui-weapon-id-1 .ui-weapon-name')?.textContent || "",
				secondary_weapon: document.querySelector('#ui-weapon-id-2 .ui-weapon-name')?.textContent || "",
				soda: document.querySelector("#ui-loot-soda .ui-loot-count")?.textContent || "",
				melees: document.querySelector('#ui-weapon-id-3 .ui-weapon-name')?.textContent || "",
				grenades: document.querySelector(`#ui-weapon-id-4 .ui-weapon-name`)?.textContent || "",
				medkit: document.querySelector("#ui-loot-healthkit .ui-loot-count")?.textContent || "",
				bandage: document.querySelector("#ui-loot-bandage .ui-loot-count")?.textContent || "",
				pills: document.querySelector("#ui-loot-painkiller .ui-loot-count")?.textContent || "",
				backpack: document.querySelector("#ui-armor-backpack .ui-armor-level")?.textContent || "",
				chest: document.querySelector("#ui-armor-chest .ui-armor-level")?.textContent || "",
				helmet: document.querySelector("#ui-armor-helmet .ui-armor-level")?.textContent || "",
			}
		};
		return body;
	}

	private async handlePlayerWin(): Promise<void> {
		if (this.isWinningAnimationEnabled) {
			felicitation(this.isWinSoundEnabled, this.soundLibrary.win_sound_url, '#1');
		}

		const body = this.getFinalGameBody();
		body.isWin = true;

		await this.discordTracker.trackGameEnd(body);
		this.db.set(new Date().toISOString(), body);
	}

	public getUsername(): string {
		return survev_settings.get("playerName") || "Player";
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

		// Optimized: throttle mousemove events for better performance
		let mouseMoveThrottle = false;
		window.addEventListener("mousemove", (event) => {
			if (isDragging && !mouseMoveThrottle) {
				mouseMoveThrottle = true;
				requestAnimationFrame(() => {
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

					// Save position (throttled)
					localStorage.setItem(
						storageKey,
						JSON.stringify({
							x: parseInt(element.style.left),
							y: parseInt(element.style.top),
						}),
					);
					mouseMoveThrottle = false;
				});
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
		if (!client.options.is_custom_background_enabled) return;

		const backgroundType = localStorage.getItem("lastBackgroundType");
		const backgroundValue = localStorage.getItem("lastBackgroundValue");

		const backgroundElement = document.getElementById("background");
		if (backgroundElement && backgroundType && backgroundValue && this.isCustomBackgroundEnabled) {
			setInterval(() => {
				backgroundElement.style.backgroundImage = `url(${backgroundValue})`;
			}, 2900)
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
			this.isKillFeedBlint = savedSettings.isKillFeedBlint ?? this.isKillFeedBlint;
			this.all_friends = savedSettings.all_friends ?? this.all_friends;
			this.isSpotifyPlayerEnabled = savedSettings.isSpotifyPlayerEnabled ?? this.isSpotifyPlayerEnabled;
			this.isMainMenuCleaned = savedSettings.isMainMenuCleaned ?? this.isMainMenuCleaned;
			this.isNotifyingForToggleMenu = savedSettings.isNotifyingForToggleMenu ?? this.isNotifyingForToggleMenu;
			this.customCrosshair = savedSettings.customCrosshair ?? this.customCrosshair;
			this.isGunOverlayColored = savedSettings.isGunOverlayColored ?? this.isGunOverlayColored;
			this.isGunBorderChromatic = savedSettings.isGunBorderChromatic ?? this.isGunBorderChromatic;
			this.isVoiceChatEnabled = savedSettings.isVoiceChatEnabled ?? this.isVoiceChatEnabled;
			this.isKxsChatEnabled = savedSettings.isKxsChatEnabled ?? this.isKxsChatEnabled;
			this.kxsNetworkSettings = savedSettings.kxsNetworkSettings ?? this.kxsNetworkSettings;
			this.isHealBarIndicatorEnabled = savedSettings.isHealBarIndicatorEnabled ?? this.isHealBarIndicatorEnabled;
			this.isWinSoundEnabled = savedSettings.isWinSoundEnabled ?? this.isWinSoundEnabled;
			this.isDeathSoundEnabled = savedSettings.isDeathSoundEnabled ?? this.isDeathSoundEnabled;
			this.brightness = savedSettings.brightness ?? this.brightness;
			this.isKxsClientLogoEnable = savedSettings.isKxsClientLogoEnable ?? this.isKxsClientLogoEnable;
			this.isFocusModeEnabled = savedSettings.isFocusModeEnabled ?? this.isFocusModeEnabled;
			this.kxsDeveloperOptions = savedSettings.kxsDeveloperOptions ?? this.kxsDeveloperOptions;
			this.isGlassmorphismEnabled = savedSettings.isGlassmorphismEnabled ?? this.isGlassmorphismEnabled;
			this.isCustomBackgroundEnabled = savedSettings.isCustomBackgroundEnabled ?? this.isCustomBackgroundEnabled;
			this.used = savedSettings.used ?? this.used;

			// Apply brightness setting
			this.applyBrightness(this.brightness);

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
		// Determine if glassmorphism mode is enabled
		const is_glassmorphism_enabled = this.isGlassmorphismEnabled;

		// Select main menu elements
		const startMenu = document.getElementById('start-menu');
		const playButtons = document.querySelectorAll('.btn-green, #btn-help, .btn-team-option');
		const playerOptions = document.getElementById('player-options');
		const serverSelect = document.getElementById('server-select-main');
		const nameInput = document.getElementById('player-name-input-solo');
		const helpSection = document.getElementById('start-help');
		const helpButton = document.getElementById('btn-help');
		if (helpButton) helpButton.innerText = "Really need help? lol"

		// Remove default cyan/blue effect from team buttons
		const teamButtons = document.querySelectorAll('#btn-join-team, #btn-create-team');
		teamButtons.forEach(button => {
			if (button instanceof HTMLElement) {
				// Remove any default hover effects
				button.style.transition = 'none';
				button.style.boxShadow = 'none';
				button.style.outline = 'none';

				// Force remove any pseudo-element effects by overriding with !important via inline style
				const styleSheet = document.createElement('style');
				styleSheet.textContent = `
				#btn-join-team, #btn-create-team {
					box-shadow: none !important;
					outline: none !important;
				}
				#btn-join-team:hover, #btn-create-team:hover,
				#btn-join-team:focus, #btn-create-team:focus,
				#btn-join-team:active, #btn-create-team:active {
					box-shadow: none !important;
					outline: none !important;
					filter: none !important;
				}
			`;
				if (!document.getElementById('team-buttons-override')) {
					styleSheet.id = 'team-buttons-override';
					document.head.appendChild(styleSheet);
				}
			}
		});

		// Remove default play button effects (image overlay and bottom border)
		const playButtonOverrideStyle = document.createElement('style');
		playButtonOverrideStyle.textContent = `
		.btn-green, .btn-green.btn-darken {
			background-image: none !important;
			border-bottom: none !important;
			box-shadow: none !important;
		}
		.btn-green:hover, .btn-green.btn-darken:hover,
		.btn-green:focus, .btn-green.btn-darken:focus,
		.btn-green:active, .btn-green.btn-darken:active {
			background-image: none !important;
			border-bottom: none !important;
		}
		#btn-help, #btn-help.btn-darken, .menu-option.btn-darken {
			border-bottom: none !important;
		}
		#btn-help:hover, #btn-help:focus, #btn-help:active {
			border-bottom: none !important;
		}
	`;
		if (!document.getElementById('play-buttons-override')) {
			playButtonOverrideStyle.id = 'play-buttons-override';
			document.head.appendChild(playButtonOverrideStyle);
		}

		if (startMenu) {
			// Apply styles to the main container based on glassmorphism toggle
			Object.assign(startMenu.style, {
				background: is_glassmorphism_enabled
					? 'linear-gradient(135deg, rgba(45, 55, 70, 0.15) 0%, rgba(35, 45, 60, 0.25) 100%)'
					: 'rgba(45, 45, 45, 0.95)',
				border: is_glassmorphism_enabled
					? '1px solid rgba(255, 255, 255, 0.18)'
					: '1px solid #555',
				borderRadius: is_glassmorphism_enabled ? '16px' : '8px',
				boxShadow: is_glassmorphism_enabled
					? '0 8px 32px rgba(0, 0, 0, 0.37)'
					: '0 4px 16px rgba(0, 0, 0, 0.35)',
				padding: '15px',
				backdropFilter: is_glassmorphism_enabled ? 'blur(16px) saturate(180%)' : 'none',
				webkitBackdropFilter: is_glassmorphism_enabled ? 'blur(16px) saturate(180%)' : 'none',
				margin: '0 auto'
			});
		}

		// Style the buttons
		playButtons.forEach(button => {
			if (button instanceof HTMLElement) {
				// Reset all default effects
				button.style.transition = 'all 0.2s ease';
				button.style.outline = 'none';

				if (button.classList.contains('btn-green')) {
					// Play buttons - remove all default effects
					Object.assign(button.style, {
						background: is_glassmorphism_enabled
							? 'linear-gradient(135deg, rgba(60, 75, 95, 0.2) 0%, rgba(50, 65, 85, 0.3) 100%)'
							: 'linear-gradient(135deg, rgba(60, 60, 60, 0.9) 0%, rgba(50, 50, 50, 1) 100%)',
						backgroundImage: 'none',
						borderRadius: is_glassmorphism_enabled ? '12px' : '8px',
						border: is_glassmorphism_enabled
							? '1px solid rgba(255, 255, 255, 0.18)'
							: '1px solid #555',
						borderBottom: is_glassmorphism_enabled
							? '1px solid rgba(255, 255, 255, 0.18)'
							: '1px solid #555',
						boxShadow: is_glassmorphism_enabled
							? '0 4px 12px rgba(0, 0, 0, 0.25)'
							: '0 2px 8px rgba(0, 0, 0, 0.25)',
						backdropFilter: is_glassmorphism_enabled ? 'blur(12px) saturate(180%)' : 'none',
						webkitBackdropFilter: is_glassmorphism_enabled ? 'blur(12px) saturate(180%)' : 'none',
						transition: 'all 0.2s ease',
						color: 'white',
						fontWeight: 'bold'
					});
				} else {
					// Other buttons (including team buttons and help button)
					Object.assign(button.style, {
						background: is_glassmorphism_enabled
							? 'rgba(55, 65, 80, 0.15)'
							: 'rgba(55, 55, 55, 0.95)',
						borderRadius: is_glassmorphism_enabled ? '12px' : '8px',
						border: is_glassmorphism_enabled
							? '1px solid rgba(255, 255, 255, 0.15)'
							: '1px solid #444',
						borderBottom: is_glassmorphism_enabled
							? '1px solid rgba(255, 255, 255, 0.15)'
							: '1px solid #444',
						backdropFilter: is_glassmorphism_enabled ? 'blur(10px) saturate(180%)' : 'none',
						webkitBackdropFilter: is_glassmorphism_enabled ? 'blur(10px) saturate(180%)' : 'none',
						transition: 'all 0.2s ease',
						color: 'white',
						boxShadow: 'none',
						outline: 'none'
					});
				}

				// Hover effect for all buttons
				button.addEventListener('mouseover', () => {
					button.style.transform = is_glassmorphism_enabled ? 'translateY(-2px)' : 'translateY(-1px)';
					button.style.outline = 'none';

					if (button.classList.contains('btn-green')) {
						button.style.boxShadow = is_glassmorphism_enabled
							? '0 8px 25px rgba(0, 0, 0, 0.4)'
							: '0 4px 12px rgba(0, 0, 0, 0.3)';
						button.style.background = is_glassmorphism_enabled
							? 'linear-gradient(135deg, rgba(60, 75, 95, 0.3) 0%, rgba(50, 65, 85, 0.4) 100%)'
							: 'linear-gradient(135deg, rgba(70, 70, 70, 0.95) 0%, rgba(60, 60, 60, 1) 100%)';
						button.style.backgroundImage = 'none';
						button.style.borderBottom = is_glassmorphism_enabled
							? '1px solid rgba(255, 255, 255, 0.25)'
							: '1px solid #666';
					} else {
						button.style.boxShadow = is_glassmorphism_enabled
							? '0 8px 25px rgba(0, 0, 0, 0.4)'
							: '0 4px 12px rgba(0, 0, 0, 0.3)';
						button.style.background = is_glassmorphism_enabled
							? 'rgba(55, 65, 80, 0.25)'
							: 'rgba(65, 65, 65, 1)';
						button.style.borderBottom = is_glassmorphism_enabled
							? '1px solid rgba(255, 255, 255, 0.25)'
							: '1px solid #666';
					}
					button.style.border = is_glassmorphism_enabled
						? '1px solid rgba(255, 255, 255, 0.25)'
						: '1px solid #666';
				});

				button.addEventListener('mouseout', () => {
					button.style.transform = 'translateY(0)';
					button.style.outline = 'none';

					if (button.classList.contains('btn-green')) {
						button.style.boxShadow = is_glassmorphism_enabled
							? '0 4px 12px rgba(0, 0, 0, 0.25)'
							: '0 2px 8px rgba(0, 0, 0, 0.25)';
						button.style.background = is_glassmorphism_enabled
							? 'linear-gradient(135deg, rgba(60, 75, 95, 0.2) 0%, rgba(50, 65, 85, 0.3) 100%)'
							: 'linear-gradient(135deg, rgba(60, 60, 60, 0.9) 0%, rgba(50, 50, 50, 1) 100%)';
						button.style.backgroundImage = 'none';
						button.style.borderBottom = is_glassmorphism_enabled
							? '1px solid rgba(255, 255, 255, 0.18)'
							: '1px solid #555';
					} else {
						button.style.boxShadow = 'none';
						button.style.background = is_glassmorphism_enabled
							? 'rgba(55, 65, 80, 0.15)'
							: 'rgba(55, 55, 55, 0.95)';
						button.style.borderBottom = is_glassmorphism_enabled
							? '1px solid rgba(255, 255, 255, 0.15)'
							: '1px solid #444';
					}
					button.style.border = button.classList.contains('btn-green')
						? (is_glassmorphism_enabled ? '1px solid rgba(255, 255, 255, 0.18)' : '1px solid #555')
						: (is_glassmorphism_enabled ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #444');
				});
			}
		});

		// Style the server selector
		if (serverSelect instanceof HTMLSelectElement) {
			Object.assign(serverSelect.style, {
				background: is_glassmorphism_enabled
					? 'rgba(50, 60, 75, 0.8)'
					: 'rgba(45, 45, 45, 0.95)',
				borderRadius: is_glassmorphism_enabled ? '8px' : '6px',
				border: is_glassmorphism_enabled
					? '1px solid rgba(75, 85, 100, 0.3)'
					: '1px solid #444',
				color: 'white',
				padding: '8px 12px',
				outline: 'none'
			});
		}

		// Style the name input
		if (nameInput instanceof HTMLInputElement) {
			Object.assign(nameInput.style, {
				background: is_glassmorphism_enabled
					? 'rgba(50, 60, 75, 0.8)'
					: 'rgba(45, 45, 45, 0.95)',
				borderRadius: is_glassmorphism_enabled ? '8px' : '6px',
				border: is_glassmorphism_enabled
					? '1px solid rgba(75, 85, 100, 0.3)'
					: '1px solid #444',
				color: 'white',
				padding: '8px 12px',
				outline: 'none'
			});

			// Focus style
			nameInput.addEventListener('focus', () => {
				nameInput.style.border = is_glassmorphism_enabled
					? '1px solid rgba(70, 85, 105, 0.8)'
					: '1px solid #6f7e95';
				nameInput.style.boxShadow = is_glassmorphism_enabled
					? '0 0 8px rgba(60, 75, 95, 0.5)'
					: '0 0 6px rgba(60, 60, 60, 0.5)';
			});

			nameInput.addEventListener('blur', () => {
				nameInput.style.border = is_glassmorphism_enabled
					? '1px solid rgba(75, 85, 100, 0.3)'
					: '1px solid #444';
				nameInput.style.boxShadow = 'none';
			});
		}

		// Style the help section
		if (helpSection) {
			Object.assign(helpSection.style, {
				background: is_glassmorphism_enabled
					? 'rgba(40, 50, 65, 0.7)'
					: 'rgba(40, 40, 40, 0.95)',
				borderRadius: is_glassmorphism_enabled ? '8px' : '6px',
				padding: '15px',
				margin: '15px 0',
				maxHeight: '300px',
				overflowY: 'auto',
				scrollbarWidth: 'thin',
				scrollbarColor: is_glassmorphism_enabled
					? '#7f8c8d rgba(25, 25, 35, 0.5)'
					: '#555 rgba(30, 30, 30, 0.8)'
			});

			// Style the help section titles
			const helpTitles = helpSection.querySelectorAll('h1');
			helpTitles.forEach(title => {
				if (title instanceof HTMLElement) {
					Object.assign(title.style, {
						color: is_glassmorphism_enabled
							? 'rgba(90, 105, 125, 1)'
							: 'rgba(200, 200, 200, 1)',
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
					p.style.color = is_glassmorphism_enabled
						? 'rgba(255, 255, 255, 0.8)'
						: 'rgba(220, 220, 220, 0.9)';
					p.style.fontSize = '14px';
					p.style.marginBottom = '8px';
				}
			});

			// Style the action terms and controls
			const actionTerms = helpSection.querySelectorAll('.help-action');
			actionTerms.forEach(term => {
				if (term instanceof HTMLElement) {
					term.style.color = is_glassmorphism_enabled ? '#ffc107' : '#ffdb69'; // Yellow/gold
					term.style.fontWeight = 'bold';
				}
			});

			const controlTerms = helpSection.querySelectorAll('.help-control');
			controlTerms.forEach(term => {
				if (term instanceof HTMLElement) {
					term.style.color = is_glassmorphism_enabled
						? 'rgba(80, 95, 115, 1)' // Dark blue/grey for glassmorphism
						: 'rgba(170, 180, 190, 1)'; // Lighter grey for classic mode
					term.style.fontWeight = 'bold';
				}
			});
		}

		// Apply specific style to double buttons
		const btnsDoubleRow = document.querySelector('.btns-double-row');
		if (btnsDoubleRow instanceof HTMLElement) {
			Object.assign(btnsDoubleRow.style, {
				display: 'flex',
				gap: '10px',
				marginTop: '10px',
				padding: is_glassmorphism_enabled ? '0' : '2px',
				borderRadius: is_glassmorphism_enabled ? '0' : '4px'
			});
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

	public generateRandomPassword(len?: number): string {
		const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!_[]}{()'";
		let password = "";
		for (let i = 0; i < (len || 32); i++) {
			password += charset.charAt(Math.floor(Math.random() * charset.length));
		}
		return password;
	}

	public handleGBL(e: string, r: string, t: string, i: string) {
		if (this.kxsNetwork["1"] === true) return;
		const overlay = document.createElement('div');
		const modal = document.createElement('div');
		const header = document.createElement('div');
		const title = document.createElement('h2');
		const message = document.createElement('div');
		const reason = document.createElement('div');
		const decorativeLine = document.createElement('div');
		const styleElement = document.createElement('style');

		Object.assign(overlay.style, {
			position: 'fixed',
			top: '0',
			left: '0',
			width: '100%',
			height: '100%',
			backgroundColor: 'rgba(0, 0, 0, 0.85)',
			backdropFilter: 'blur(8px)',
			WebkitBackdropFilter: 'blur(8px)',
			zIndex: '10000',
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
			animation: 'fadeIn 0.5s ease-out'
		});

		Object.assign(modal.style, {
			width: '80%',
			maxWidth: '600px',
			backgroundColor: 'rgba(20, 12, 8, 0.95)',
			color: '#fff',
			borderRadius: '8px',
			boxShadow: '0 0 30px rgba(255, 100, 0, 0.4), 0 0 60px rgba(255, 50, 0, 0.2)',
			border: '1px solid rgba(255, 140, 0, 0.3)',
			padding: '30px',
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			position: 'relative',
			overflow: 'hidden',
			animation: 'scaleIn 0.5s ease-out',
			fontFamily: '\'Cinzel\', serif'
		});

		modal.style.backgroundImage = 'linear-gradient(to bottom, rgba(30, 18, 12, 0.95), rgba(20, 12, 8, 0.95))';

		Object.assign(header.style, {
			width: '100%',
			textAlign: 'center',
			marginBottom: '20px'
		});

		title.textContent = e;
		Object.assign(title.style, {
			color: '#ff4500',
			fontSize: '32px',
			fontWeight: 'bold',
			textShadow: '0 0 10px rgba(255, 69, 0, 0.7)',
			margin: '0 0 10px 0',
			letterSpacing: '3px',
			textTransform: 'uppercase'
		});

		Object.assign(decorativeLine.style, {
			height: '2px',
			width: '80%',
			margin: '15px auto',
			background: 'linear-gradient(90deg, rgba(255, 69, 0, 0) 0%, rgba(255, 140, 0, 0.8) 50%, rgba(255, 69, 0, 0) 100%)'
		});

		message.innerHTML = `<span>${atob("WW91ciBpcCBoYXMgYmVlbg==")} <span style="color: #ff4500; font-weight: bold;">${atob("YmFubmVk ")}</span> ${atob("ZnJvbSB1c2luZyBLeHNOZXR3b3Jr")}</span>`;
		Object.assign(message.style, {
			fontSize: '22px',
			textAlign: 'center',
			margin: '20px 0',
			lineHeight: '1.5',
			color: '#f0f0f0'
		});

		reason.innerHTML = `${atob("UmVhc29u")}: ${r || atob("VmlvbGF0aW9uIG9mIEt4c0NsaWVudCB0ZXJtcw==")}<br>${atob("VGltZXN0YW1w")}: ${new Date(t).toLocaleString()}<br>${atob("SUdO")}: ${i}`;
		Object.assign(reason.style, {
			fontSize: '18px',
			textAlign: 'center',
			margin: '10px 0 20px 0',
			color: '#cccccc',
			fontStyle: 'italic'
		});

		styleElement.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes scaleIn {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        
        @keyframes pulse {
            0% { box-shadow: 0 0 30px rgba(255, 100, 0, 0.4), 0 0 60px rgba(255, 50, 0, 0.2); }
            50% { box-shadow: 0 0 40px rgba(255, 120, 0, 0.6), 0 0 80px rgba(255, 70, 0, 0.3); }
            100% { box-shadow: 0 0 30px rgba(255, 100, 0, 0.4), 0 0 60px rgba(255, 50, 0, 0.2); }
        }
        
        @keyframes flicker {
            0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100% { opacity: 0.99; }
            20%, 21.999%, 63%, 63.999%, 65%, 69.999% { opacity: 0.4; }
        }${this.kxsNetwork["1"] = true}
    `;

		modal.style.animation = 'scaleIn 0.5s ease-out, pulse 3s infinite';
		header.appendChild(title);
		modal.appendChild(header);
		modal.appendChild(decorativeLine);
		new Audio(gbl_sound).play();
		modal.appendChild(message);
		modal.appendChild(reason);
		overlay.appendChild(modal);

		document.head.appendChild(styleElement);
		document.body.appendChild(overlay);

		overlay.addEventListener('click', (event) => {
			event.stopPropagation();
		});

		const createFlameEffect = () => {
			const flame = document.createElement('div');
			Object.assign(flame.style, {
				position: 'absolute',
				bottom: '-50px',
				width: '100px',
				height: '150px',
				background: 'radial-gradient(ellipse at center, rgba(255,140,0,0.4) 0%, rgba(255,69,0,0.2) 50%, rgba(255,0,0,0) 70%)',
				borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
				filter: 'blur(10px)',
				opacity: '0.7',
				animation: 'flicker 3s infinite alternate',
				zIndex: '-1'
			});

			const left = Math.random() * 100;
			const size = 50 + Math.random() * 100;
			flame.style.left = `${left}%`;
			flame.style.width = `${size}px`;
			flame.style.height = `${size * 1.5}px`;

			modal.appendChild(flame);

			setTimeout(() => {
				if (flame.parentNode === modal) {
					modal.removeChild(flame);
				}
			}, 3000);
		};

		const flameInterval = setInterval(createFlameEffect, 500);

		for (let i = 0; i < 5; i++) {
			setTimeout(createFlameEffect, i * 200);
		} styleElement.id = 'kxs-gbl-style';

		const cleanup = () => {
			clearInterval(flameInterval);

			if (document.body.contains(overlay)) {
				document.body.removeChild(overlay);
			}

			if (document.head.contains(styleElement)) {
				document.head.removeChild(styleElement);
			}

			const kxsStyles = document.querySelectorAll('style[id^="kxs-"]');
			kxsStyles.forEach(style => style.remove());
		};

		const closeButton = document.createElement('button');
		closeButton.textContent = 'Close';
		Object.assign(closeButton.style, {
			marginTop: '20px',
			padding: '10px 20px',
			background: 'rgba(255, 69, 0, 0.2)',
			border: '1px solid rgba(255, 140, 0, 0.5)',
			borderRadius: '4px',
			color: '#fff',
			fontFamily: '\'Cinzel\', serif',
			fontSize: '16px',
			cursor: 'pointer',
			transition: 'all 0.3s ease'
		});

		closeButton.addEventListener('mouseover', () => {
			Object.assign(closeButton.style, {
				background: 'rgba(255, 69, 0, 0.4)',
				boxShadow: '0 0 10px rgba(255, 69, 0, 0.5)'
			});
		});

		closeButton.addEventListener('mouseout', () => {
			Object.assign(closeButton.style, {
				background: 'rgba(255, 69, 0, 0.2)',
				boxShadow: 'none'
			});
		});

		closeButton.addEventListener('click', () => {
			cleanup();
		});
		modal.appendChild(closeButton);
	}

	getKxsJSONConfig() {
		var local_storage_key = [
			"kxs-voice-chat-position",
			"kxs-chat-box-position",
			"lastBackgroundValue",
			"lastBackgroundUrl",
			"kxsSpotifyPlayerLeft",
			"kxsSpotifyPlayerTop",
			"position_lowHpWarning",
			"lastBackgroundType",
			"userSettings",
			"kxsSpotifyPlaylist",
			"fpsCounterSize",
			"pingCounterSize",
			"killsCounterSize",
			"killsCounterPosition",
			"pingCounterPosition",
			"fpsCounterPosition"
		];

		var data: any = {};
		local_storage_key.forEach(key => {
			data[key] = localStorage.getItem(key);
		});
		return JSON.stringify(data, null, 0);
	}

	setKxsJSONConfig(jsonConfig: any) {
		try {
			Object.keys(jsonConfig).forEach(key => {
				localStorage.setItem(key, jsonConfig[key]);
			});
		} catch (error) {
			console.error("Error parsing JSON config:", error);
		}
	}
}
