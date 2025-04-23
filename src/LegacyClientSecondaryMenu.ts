import { KxsClientSecondaryMenu } from "./ClientSecondaryMenuRework";
const packageInfo = require('../package.json');
import KxsClient from "./KxsClient";

interface MenuOption {
	label: string;
	value: string | boolean | number;
	type: "toggle" | "input" | "click";
	onChange?: (value: string | boolean) => void;
}

interface MenuSection {
	title: string;
	options: MenuOption[];
	element?: HTMLDivElement; // Added a reference to the DOM element
}

class KxsLegacyClientSecondaryMenu {
	private isClientMenuVisible: boolean;
	private isDragging: boolean;
	private dragOffset: { x: number; y: number };
	private sections: MenuSection[];
	menu: HTMLDivElement;
	kxsClient: KxsClient;
	// Propriété publique pour exposer l'état d'ouverture du menu
	public isOpen: boolean;

	private boundShiftListener: (event: KeyboardEvent) => void;
	private boundEscapeListener: (event: KeyboardEvent) => void;
	private boundMouseDownListener: (event: MouseEvent) => void;
	private boundMouseMoveListener: (event: MouseEvent) => void;
	private boundMouseUpListener: (event: MouseEvent) => void;

	constructor(kxsClient: KxsClient) {
		this.kxsClient = kxsClient;
		this.isClientMenuVisible = false;
		this.isDragging = false;
		this.dragOffset = { x: 0, y: 0 };
		this.sections = [];
		this.menu = document.createElement("div");
		this.isOpen = false;

		this.boundShiftListener = this.handleShiftPress.bind(this);
		this.boundEscapeListener = this.handleEscapePress.bind(this);
		this.boundMouseDownListener = this.handleMouseDown.bind(this);
		this.boundMouseMoveListener = this.handleMouseMove.bind(this);
		this.boundMouseUpListener = this.handleMouseUp.bind(this);

		this.initMenu();
		this.addShiftListener();
		this.addDragListeners();
		this.loadOption();
	}

	private handleShiftPress(event: KeyboardEvent): void {
		if (event.key === "Shift" && event.location == 2) {
			// this.clearMenu();
			this.toggleMenuVisibility();
		}
	}

	private handleEscapePress(event: KeyboardEvent): void {
		if (event.key === "Escape" && this.isClientMenuVisible) {
			// Fermer le menu si la touche Échap est pressée et que le menu est visible
			this.toggleMenuVisibility();
			// Empêcher la propagation ET l'action par défaut
			event.stopPropagation();
			event.preventDefault();
			// Arrêter complètement la propagation de l'événement
			return false as any;
		}
	}

	private handleMouseDown(e: MouseEvent): void {
		// Empêcher la propagation de l'événement mousedown vers la page web
		// pour TOUS les éléments du menu, y compris les éléments interactifs
		e.stopPropagation();

		// Activer le drag & drop seulement si on clique sur une zone non interactive
		if (e.target instanceof HTMLElement && !e.target.matches("input, select, button")) {
			this.isDragging = true;
			const rect = this.menu.getBoundingClientRect();
			this.dragOffset = {
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
			};
			this.menu.style.cursor = "grabbing";
		}
	}

	private handleMouseMove(e: MouseEvent): void {
		if (!this.isDragging) return;

		e.preventDefault();

		const newX = e.clientX - this.dragOffset.x;
		const newY = e.clientY - this.dragOffset.y;

		const maxX = window.innerWidth - this.menu.offsetWidth;
		const maxY = window.innerHeight - this.menu.offsetHeight;

		this.menu.style.left = `${Math.max(0, Math.min(newX, maxX))}px`;
		this.menu.style.top = `${Math.max(0, Math.min(newY, maxY))}px`;
	}

	private handleMouseUp(e: MouseEvent): void {
		// Arrêter le drag & drop
		const wasDragging = this.isDragging;
		this.isDragging = false;
		this.menu.style.cursor = "move";

		// Empêcher la propagation de l'événement mouseup vers la page web
		// pour tous les éléments du menu, y compris les éléments interactifs
		if (this.menu.contains(e.target as Node)) {
			e.stopPropagation();
		}
	}

	private initMenu(): void {
		this.menu.id = "kxsMenuIG";
		this.applyMenuStyles();
		this.createHeader();
		document.body.appendChild(this.menu);

		// Empêcher la propagation des événements souris (clics et molette) vers la page web
		// Utiliser la phase de bouillonnement (bubbling) au lieu de la phase de capture
		// pour permettre aux éléments enfants de recevoir les événements d'abord
		this.menu.addEventListener('click', (e) => {
			e.stopPropagation();
		});

		this.menu.addEventListener('wheel', (e) => {
			e.stopPropagation();
		});
	}

	private loadOption(): void {
		let HUD = this.addSection("HUD");

		let SOUND = this.addSection("SOUND");

		this.addOption(SOUND, {
			label: "Win sound",
			value: this.kxsClient.soundLibrary.win_sound_url,
			type: "input",
			onChange: (value) => {
				this.kxsClient.soundLibrary.win_sound_url = value as string;
				this.kxsClient.updateLocalStorage();
			}
		});

		this.addOption(SOUND, {
			label: "Death sound",
			value: this.kxsClient.soundLibrary.death_sound_url,
			type: "input",
			onChange: (value) => {
				this.kxsClient.soundLibrary.death_sound_url = value as string;
				this.kxsClient.updateLocalStorage();
			}
		});

		this.addOption(HUD, {
			label: "Use Legacy Menu",
			value: this.kxsClient.isLegaySecondaryMenu,
			type: "toggle",
			onChange: (value) => {
				this.kxsClient.isLegaySecondaryMenu = !this.kxsClient.isLegaySecondaryMenu
				this.kxsClient.updateLocalStorage()
				this.kxsClient.secondaryMenu = new KxsClientSecondaryMenu(this.kxsClient);
				this.destroy();
			},
		});

		this.addOption(HUD, {
			label: "Clean Main Menu",
			value: this.kxsClient.isMainMenuCleaned,
			type: "toggle",
			onChange: (value) => {
				this.kxsClient.isMainMenuCleaned = !this.kxsClient.isMainMenuCleaned
				this.kxsClient.MainMenuCleaning();
				this.kxsClient.updateLocalStorage()
			},
		});


		this.addOption(HUD, {
			label: "Message Open/Close RSHIFT Menu",
			value: this.kxsClient.isNotifyingForToggleMenu,
			type: "toggle",
			onChange: (value) => {
				this.kxsClient.isNotifyingForToggleMenu = !this.kxsClient.isNotifyingForToggleMenu
				this.kxsClient.updateLocalStorage()
			},
		})

		this.addOption(HUD, {
			label: "Show Ping",
			value: this.kxsClient.isPingVisible,
			type: "toggle",
			onChange: (value) => {
				this.kxsClient.isPingVisible = !this.kxsClient.isPingVisible
				this.kxsClient.updatePingVisibility()
				this.kxsClient.updateLocalStorage()
			},
		});

		this.addOption(HUD, {
			label: "Show FPS",
			value: this.kxsClient.isFpsVisible,
			type: "toggle",
			onChange: (value) => {
				this.kxsClient.isFpsVisible = !this.kxsClient.isFpsVisible
				this.kxsClient.updateFpsVisibility()
				this.kxsClient.updateLocalStorage()
			},
		});

		this.addOption(HUD, {
			label: "Show Kills",
			value: this.kxsClient.isKillsVisible,
			type: "toggle",
			onChange: (value) => {
				this.kxsClient.isKillsVisible = !this.kxsClient.isKillsVisible
				this.kxsClient.updateKillsVisibility()
				this.kxsClient.updateLocalStorage()
			},
		});

		this.addOption(HUD, {
			label: "Kill Feed Chroma",
			value: this.kxsClient.isKillFeedBlint,
			type: "toggle",
			onChange: (value) => {
				this.kxsClient.isKillFeedBlint = !this.kxsClient.isKillFeedBlint
				this.kxsClient.updateLocalStorage()
				this.kxsClient.hud.toggleKillFeed();
			},
		});

		this.addOption(HUD, {
			label: "Weapon Border",
			value: this.kxsClient.isGunOverlayColored,
			type: "toggle",
			onChange: () => {
				this.kxsClient.isGunOverlayColored = !this.kxsClient.isGunOverlayColored
				this.kxsClient.updateLocalStorage()
				this.kxsClient.hud.toggleWeaponBorderHandler()
			},
		});

		this.addOption(HUD, {
			label: "Chromatic Weapon Border",
			value: this.kxsClient.isGunBorderChromatic,
			type: "toggle",
			onChange: () => {
				this.kxsClient.isGunBorderChromatic = !this.kxsClient.isGunBorderChromatic
				this.kxsClient.updateLocalStorage()
				this.kxsClient.hud.toggleChromaticWeaponBorder()

				if (this.kxsClient.isGunOverlayColored) {
					this.kxsClient.hud.toggleWeaponBorderHandler()
				}
			},
		});

		this.addOption(HUD, {
			label: "Custom Crosshair",
			value: this.kxsClient.customCrosshair || "",
			type: "input",
			onChange: (value) => {
				this.kxsClient.customCrosshair = value as string
				this.kxsClient.updateLocalStorage()
				this.kxsClient.hud.loadCustomCrosshair();
			},
		});

		let musicSection = this.addSection("Music");

		this.addOption(musicSection, {
			label: "Death sound",
			value: this.kxsClient.isDeathSoundEnabled,
			type: "toggle",
			onChange: (value) => {
				this.kxsClient.isDeathSoundEnabled = !this.kxsClient.isDeathSoundEnabled
				this.kxsClient.updateLocalStorage()
			},
		});

		this.addOption(musicSection, {
			label: "Win sound",
			value: this.kxsClient.isWinSoundEnabled,
			type: "toggle",
			onChange: (value) => {
				this.kxsClient.isWinSoundEnabled = !this.kxsClient.isWinSoundEnabled
				this.kxsClient.updateLocalStorage()
			},
		});

		let pluginsSection = this.addSection("Plugins");

		this.addOption(pluginsSection, {
			label: "Webhook URL",
			value: this.kxsClient.discordWebhookUrl || "",
			type: "input",
			onChange: (value) => {
				value = value.toString().trim();
				this.kxsClient.discordWebhookUrl = value as string
				this.kxsClient.discordTracker.setWebhookUrl(value as string)
				this.kxsClient.updateLocalStorage()
			},
		});

		this.addOption(pluginsSection, {
			label: "Heal Warning",
			value: this.kxsClient.isHealthWarningEnabled,
			type: "toggle",
			onChange: (value) => {
				this.kxsClient.isHealthWarningEnabled = !this.kxsClient.isHealthWarningEnabled
				if (this.kxsClient.isHealthWarningEnabled) {
					// Always enter placement mode when enabling from RSHIFT menu
					this.kxsClient.healWarning?.enableDragging();
				} else {
					this.kxsClient.healWarning?.hide();
				}
				this.kxsClient.updateLocalStorage()
			},
		});

		this.addOption(pluginsSection, {
			label: "Update Checker",
			value: this.kxsClient.isAutoUpdateEnabled,
			type: "toggle",
			onChange: (value) => {
				this.kxsClient.isAutoUpdateEnabled = !this.kxsClient.isAutoUpdateEnabled
				this.kxsClient.updateLocalStorage()
			},
		});

		this.addOption(HUD, {
			label: `Spotify Player`,
			value: this.kxsClient.isSpotifyPlayerEnabled,
			type: "toggle",
			onChange: () => {
				this.kxsClient.isSpotifyPlayerEnabled = !this.kxsClient.isSpotifyPlayerEnabled;
				this.kxsClient.updateLocalStorage();
				this.kxsClient.toggleSpotifyMenu();
			},
		});

		this.addOption(pluginsSection, {
			label: `Uncap FPS`,
			value: this.kxsClient.isFpsUncapped,
			type: "toggle",
			onChange: () => {
				this.kxsClient.isFpsUncapped = !this.kxsClient.isFpsUncapped;
				this.kxsClient.setAnimationFrameCallback();
				this.kxsClient.updateLocalStorage();
			},
		});

		this.addOption(pluginsSection, {
			label: `Winning Animation`,
			value: this.kxsClient.isWinningAnimationEnabled,
			type: "toggle",
			onChange: () => {
				this.kxsClient.isWinningAnimationEnabled = !this.kxsClient.isWinningAnimationEnabled;
				this.kxsClient.updateLocalStorage();
			},
		});

		this.addOption(pluginsSection, {
			label: `Rich Presence (Account token required)`,
			value: this.kxsClient.discordToken || "",
			type: "input",
			onChange: (value) => {
				value = value.toString().trim();
				this.kxsClient.discordToken = this.kxsClient.parseToken(value as string);
				this.kxsClient.discordRPC.disconnect();
				this.kxsClient.discordRPC.connect();
				this.kxsClient.updateLocalStorage();
			},
		});

		this.addOption(pluginsSection, {
			label: `Kill Leader Tracking`,
			value: this.kxsClient.isKillLeaderTrackerEnabled,
			type: "toggle",
			onChange: (value) => {
				this.kxsClient.isKillLeaderTrackerEnabled = !this.kxsClient.isKillLeaderTrackerEnabled;
				this.kxsClient.updateLocalStorage();
			},
		});

		this.addOption(pluginsSection, {
			label: `Friends Detector (separe with ',')`,
			value: this.kxsClient.all_friends,
			type: "input",
			onChange: (value) => {
				this.kxsClient.all_friends = value as string;
				this.kxsClient.updateLocalStorage();
			},
		});

		this.addOption(HUD, {
			label: `Change Background`,
			value: true,
			type: "click",
			onChange: () => {
				const backgroundElement = document.getElementById("background");
				if (!backgroundElement) {
					alert("Element with id 'background' not found.");
					return;
				}
				const choice = prompt(
					"Enter '0' to default Kxs background, '1' to provide a URL or '2' to upload a local image:",
				);

				if (choice === "0") {
					localStorage.removeItem("lastBackgroundUrl");
					localStorage.removeItem("lastBackgroundFile");
					localStorage.removeItem("lastBackgroundType");
					localStorage.removeItem("lastBackgroundValue");
				} else if (choice === "1") {
					const newBackgroundUrl = prompt(
						"Enter the URL of the new background image:",
					);
					if (newBackgroundUrl) {
						backgroundElement.style.backgroundImage = `url(${newBackgroundUrl})`;
						this.kxsClient.saveBackgroundToLocalStorage(newBackgroundUrl);
						alert("Background updated successfully!");
					}
				} else if (choice === "2") {
					const fileInput = document.createElement("input");
					fileInput.type = "file";
					fileInput.accept = "image/*";
					fileInput.onchange = (event) => {
						const file = (event.target as HTMLInputElement)?.files?.[0];
						if (file) {
							const reader = new FileReader();
							reader.onload = () => {
								backgroundElement.style.backgroundImage = `url(${reader.result})`;
								this.kxsClient.saveBackgroundToLocalStorage(file);
								alert("Background updated successfully!");
							};
							reader.readAsDataURL(file);
						}
					};
					fileInput.click();
				}
			},
		});
	}

	private clearMenu(): void {
		this.sections.forEach((section) => {
			if (section.element) {
				section.element.remove();
			}
		});
		this.sections = [];
	}

	private applyMenuStyles(): void {
		Object.assign(this.menu.style, {
			backgroundColor: "rgba(30, 30, 30, 0.95)",
			padding: "15px",
			borderRadius: "10px",
			boxShadow: "0 4px 15px rgba(0, 0, 0, 0.7)",
			zIndex: "10001",
			width: "300px",
			fontFamily: "Arial, sans-serif",
			color: "#fff",
			maxHeight: "500px",
			overflowY: "auto",
			position: "fixed",
			top: "15%",
			left: "10%",
			cursor: "move",
			display: "none",
		});
	}

	private createHeader(): void {
		const title = document.createElement("h2");
		title.textContent = "KxsClient v" + packageInfo.version;
		Object.assign(title.style, {
			margin: "0 0 10px",
			textAlign: "center",
			fontSize: "18px",
			color: "#FFAE00",
		});

		this.menu.appendChild(title);
	}

	public addSection(title: string): MenuSection {
		const section: MenuSection = {
			title,
			options: [],
		};

		const sectionElement = document.createElement("div");
		sectionElement.className = "menu-section";

		const sectionTitle = document.createElement("h3");
		sectionTitle.textContent = title;
		Object.assign(sectionTitle.style, {
			margin: "15px 0 10px",
			fontSize: "16px",
			color: "#4CAF50",
		});

		sectionElement.appendChild(sectionTitle);
		this.menu.appendChild(sectionElement);

		// Stocker la référence à l'élément DOM
		section.element = sectionElement;
		this.sections.push(section);
		return section;
	}

	public addOption(section: MenuSection, option: MenuOption): void {
		section.options.push(option);

		const optionDiv = document.createElement("div");
		Object.assign(optionDiv.style, {
			display: "flex",
			justifyContent: "space-between",
			alignItems: "center",
			marginBottom: "8px",
			padding: "4px",
			borderRadius: "4px",
			backgroundColor: "rgba(255, 255, 255, 0.1)",
		});

		const label = document.createElement("span");
		label.textContent = option.label;
		label.style.color = "#fff";

		let valueElement: null | HTMLElement = null;

		switch (option.type) {
			case "toggle":
				valueElement = this.createToggleElement(option);
				break;
			case "input":
				valueElement = this.createInputElement(option);
				break;
			case "click":
				valueElement = this.createClickElement(option);
				break;
		}

		optionDiv.appendChild(label);
		optionDiv.appendChild(valueElement!);

		// Utiliser la référence stockée à l'élément de section
		if (section.element) {
			section.element.appendChild(optionDiv);
		}
	}

	private createToggleElement(option: MenuOption): HTMLElement {
		const toggle = document.createElement("div");
		toggle.style.cursor = "pointer";
		toggle.style.color = (option.value as boolean) ? "#4CAF50" : "#ff4444";
		toggle.textContent = String(option.value);

		toggle.addEventListener("click", () => {
			const newValue = !(option.value as boolean);
			option.value = newValue;
			toggle.textContent = String(newValue);
			toggle.style.color = newValue ? "#4CAF50" : "#ff4444";
			option.onChange?.(newValue);
		});

		return toggle;
	}

	private createClickElement(option: MenuOption): HTMLElement {
		const button = document.createElement("button");
		button.textContent = option.label;
		button.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
		button.style.border = "none";
		button.style.borderRadius = "3px";
		button.style.color = "#FFAE00";
		button.style.padding = "2px 5px";
		button.style.cursor = "pointer";
		button.style.fontSize = "12px";

		button.addEventListener("click", () => {
			option.onChange?.(true);
		});

		return button;
	}

	private createInputElement(option: MenuOption): HTMLElement {
		const input = document.createElement("input");
		input.type = "text";
		input.value = String(option.value);
		Object.assign(input.style, {
			backgroundColor: "rgba(255, 255, 255, 0.1)",
			border: "none",
			borderRadius: "3px",
			color: "#FFAE00",
			padding: "2px 5px",
			width: "60px",
			textAlign: "right",
		});

		input.addEventListener("change", () => {
			option.value = input.value;
			option.onChange?.(input.value);
		});

		// Empêcher la propagation des touches de texte vers la page web
		// mais permettre l'interaction avec l'input
		input.addEventListener("keydown", (e) => {
			e.stopPropagation();
		});

		input.addEventListener("keyup", (e) => {
			e.stopPropagation();
		});

		input.addEventListener("keypress", (e) => {
			e.stopPropagation();
		});

		// Empêcher la propagation des événements de souris
		input.addEventListener("mousedown", (e) => {
			e.stopPropagation();
		});

		input.addEventListener("click", (e) => {
			e.stopPropagation();
		});

		return input;
	}

	addShiftListener(): void {
		// Gestionnaire pour la touche Shift (ouverture du menu)
		window.addEventListener("keydown", this.boundShiftListener);
		
		// Utiliser la phase de capture pour intercepter l'événement Escape
		// avant qu'il n'atteigne le jeu
		document.addEventListener("keydown", this.boundEscapeListener, true);
	}

	addDragListeners(): void {
		this.menu.addEventListener("mousedown", this.boundMouseDownListener);
		window.addEventListener("mousemove", this.boundMouseMoveListener);
		window.addEventListener("mouseup", this.boundMouseUpListener);
	}

	toggleMenuVisibility() {
		this.isClientMenuVisible = !this.isClientMenuVisible;
		// Mettre à jour la propriété publique en même temps
		this.isOpen = this.isClientMenuVisible;
		if (this.kxsClient.isNotifyingForToggleMenu) {
			this.kxsClient.nm.showNotification(this.isClientMenuVisible ? "Opening menu..." : "Closing menu...", "info", 1400);
		}
		this.menu.style.display = this.isClientMenuVisible ? "block" : "none";
	}

	destroy(): void {
		// Remove event listeners
		window.removeEventListener("keydown", this.boundShiftListener);
		document.removeEventListener("keydown", this.boundEscapeListener, true);
		this.menu.removeEventListener("mousedown", this.boundMouseDownListener);
		window.removeEventListener("mousemove", this.boundMouseMoveListener);
		window.removeEventListener("mouseup", this.boundMouseUpListener);

		// Remove all section elements and clear sections array
		this.sections.forEach(section => {
			if (section.element) {
				// Remove all option elements within the section
				const optionElements = section.element.querySelectorAll("div");
				optionElements.forEach(element => {
					// Remove event listeners from toggle and input elements
					const interactive = element.querySelector("div, input");
					if (interactive) {
						interactive.replaceWith(interactive.cloneNode(true));
					}
					element.remove();
				});
				section.element.remove();
			}
		});
		this.sections = [];

		// Remove the menu from DOM
		this.menu.remove();

		// Reset instance variables
		this.isClientMenuVisible = false;
		this.isDragging = false;
		this.dragOffset = { x: 0, y: 0 };
		this.menu = null as any;

		// Clear references
		this.kxsClient = null as any;
		this.boundShiftListener = null as any;
		this.boundMouseDownListener = null as any;
		this.boundMouseMoveListener = null as any;
		this.boundMouseUpListener = null as any;
	}

	getMenuVisibility(): boolean {
		return this.isClientMenuVisible;
	}
}

export { KxsLegacyClientSecondaryMenu, type MenuSection, type MenuOption };
