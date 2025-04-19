import { background_image, full_logo, kxs_logo } from ".";
import { KxsLegacyClientSecondaryMenu } from "./ClientSecondaryMenu";
import KxsClient from "./KxsClient";

interface MenuOption {
	label: string;
	value: string | boolean | number;
	type: "toggle" | "input" | "click";
	onChange?: (value: string | boolean) => void;
	category: "HUD" | "SERVER" | "MECHANIC" | "ALL" | "SOUND";
	icon: string;
}

interface MenuSection {
	title: string;
	options: MenuOption[];
	element?: HTMLDivElement;
	category: "HUD" | "SERVER" | "MECHANIC" | "ALL" | "SOUND";
}

class KxsClientSecondaryMenu {
	private isClientMenuVisible: boolean;
	private isDragging: boolean;
	private dragOffset: { x: number; y: number };
	private sections: MenuSection[];
	private allOptions: MenuOption[];
	private activeCategory: string;
	private searchTerm: string = '';
	menu: HTMLDivElement;
	kxsClient: KxsClient;
	// Propriété publique pour exposer l'état d'ouverture du menu
	public isOpen: boolean;

	constructor(kxsClient: KxsClient) {
		this.kxsClient = kxsClient;
		this.isClientMenuVisible = false;
		this.isDragging = false;
		this.dragOffset = { x: 0, y: 0 };
		this.sections = [];
		this.allOptions = [];
		this.activeCategory = "ALL";
		this.isOpen = false;
		this.menu = document.createElement("div");
		this.initMenu();
		this.addShiftListener();
		this.addDragListeners();
		this.loadOption();
	}

	private initMenu(): void {
		this.menu.id = "kxsMenuIG";
		this.applyMenuStyles();
		this.createHeader();
		this.createGridContainer();
		document.body.appendChild(this.menu);
	}

	private applyMenuStyles(): void {
		Object.assign(this.menu.style, {
			backgroundColor: "rgba(17, 24, 39, 0.95)",
			padding: "20px",
			borderRadius: "12px",
			boxShadow: "0 4px 20px rgba(0, 0, 0, 0.8)",
			zIndex: "10001",
			width: "800px",
			fontFamily: "'Segoe UI', Arial, sans-serif",
			color: "#fff",
			maxHeight: "80vh",
			overflowY: "auto",
			overflowX: "hidden", // Prevent horizontal scrolling
			position: "fixed",
			top: "10%",
			left: "50%",
			transform: "translateX(-50%)",
			display: "none",
			boxSizing: "border-box", // Include padding in width calculation
		});
	}


	private createHeader(): void {
		const header = document.createElement("div");
		header.style.marginBottom = "20px";
		header.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; width: 100%; box-sizing: border-box;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <img src="${kxs_logo}" 
                    alt="Logo" style="width: 24px; height: 24px;">
                <span style="font-size: 20px; font-weight: bold;">KXS CLIENT</span>
            </div>
            <div style="display: flex; gap: 10px;">
              <button style="
                padding: 6px;
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 18px;
              ">×</button>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 15px; width: 100%; box-sizing: border-box;">
            <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 5px;">
              ${["ALL", "HUD", "SERVER", "MECHANIC", "SOUND"].map(cat => `
                <button class="category-btn" data-category="${cat}" style="
                  padding: 6px 16px;
                  background: ${this.activeCategory === cat ? '#3B82F6' : 'rgba(55, 65, 81, 0.8)'};
                  border: none;
                  border-radius: 6px;
                  color: white;
                  cursor: pointer;
                  font-size: 14px;
                  transition: background 0.2s;
                ">${cat}</button>
              `).join('')}
            </div>
            <div style="display: flex; width: 100%; box-sizing: border-box;">
              <div style="position: relative; width: 100%; box-sizing: border-box;">
                <input type="text" id="kxsSearchInput" placeholder="Search options..." style="
                  width: 100%;
                  padding: 8px 12px 8px 32px;
                  background: rgba(55, 65, 81, 0.8);
                  border: none;
                  border-radius: 6px;
                  color: white;
                  font-size: 14px;
                  outline: none;
                  box-sizing: border-box;
                ">
                <div style="
                  position: absolute;
                  left: 10px;
                  top: 50%;
                  transform: translateY(-50%);
                  width: 14px;
                  height: 14px;
                ">
                  <svg fill="#ffffff" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        `;

		header.querySelectorAll('.category-btn').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const category = (e.target as HTMLElement).dataset.category;
				if (category) {
					this.setActiveCategory(category);
				}
			});
		});

		const closeButton = header.querySelector('button');
		closeButton?.addEventListener('click', () => {
			this.toggleMenuVisibility();
		});

		const searchInput = header.querySelector('#kxsSearchInput') as HTMLInputElement;
		if (searchInput) {
			// Gestionnaire pour mettre à jour la recherche
			searchInput.addEventListener('input', (e) => {
				this.searchTerm = (e.target as HTMLInputElement).value.toLowerCase();
				this.filterOptions();
			});

			// Prevent keys from being interpreted by the game
			// We only block the propagation of keyboard events, except for special keys
			['keydown', 'keyup', 'keypress'].forEach(eventType => {
				searchInput.addEventListener(eventType, (e: Event) => {
					const keyEvent = e as KeyboardEvent;

					// Don't block special keys (Escape, Shift)
					if (keyEvent.key === 'Escape' || (keyEvent.key === 'Shift' && keyEvent.location === 2)) {
						return; // Let the event propagate normally
					}

					// Block propagation for all other keys
					e.stopPropagation();
				});
			});

			// Éviter que la barre de recherche ne reprenne automatiquement le focus
			// lorsque l'utilisateur interagit avec un autre champ de texte
			searchInput.addEventListener('blur', (e) => {
				// Ne pas reprendre le focus si l'utilisateur clique sur un autre input
				const newFocusElement = e.relatedTarget as HTMLElement | null;
				if (newFocusElement && (newFocusElement.tagName === 'INPUT' || newFocusElement.tagName === 'TEXTAREA')) {
					// L'utilisateur a cliqué sur un autre champ de texte, ne pas reprendre le focus
					return;
				}

				// Pour les autres cas, seulement si aucun autre élément n'a le focus
				setTimeout(() => {
					const activeElement = document.activeElement as HTMLElement | null;
					if (this.isClientMenuVisible &&
						activeElement &&
						activeElement !== searchInput &&
						activeElement.tagName !== 'INPUT' &&
						activeElement.tagName !== 'TEXTAREA') {
						searchInput.focus();
					}
				}, 100);
			});
		}

		this.menu.appendChild(header);
	}


	private clearMenu(): void {
		const gridContainer = document.getElementById('kxsMenuGrid');
		if (gridContainer) {
			gridContainer.innerHTML = '';
		}
		// Reset search term when clearing menu
		this.searchTerm = '';
		const searchInput = document.getElementById('kxsSearchInput') as HTMLInputElement;
		if (searchInput) {
			searchInput.value = '';
		}
	}

	private loadOption(): void {
		// Clear existing options to avoid duplicates
		this.allOptions = [];

		let HUD = this.addSection("HUD", 'HUD');
		let MECHANIC = this.addSection("MECHANIC", 'MECHANIC');
		let SERVER = this.addSection("SERVER", 'SERVER');
		let SOUND = this.addSection("SOUND", 'SOUND');

		this.addOption(SOUND, {
			label: "Win sound",
			value: this.kxsClient.soundLibrary.win_sound_url,
			category: "SOUND",
			icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M3 11V13M6 10V14M9 11V13M12 9V15M15 6V18M18 10V14M21 11V13" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>',
			type: "input",
			onChange: (value) => {
				this.kxsClient.soundLibrary.win_sound_url = value as string;
				this.kxsClient.updateLocalStorage();
			}
		});

		this.addOption(SOUND, {
			label: "Death sound",
			value: this.kxsClient.soundLibrary.death_sound_url,
			category: "SOUND",
			icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M3 11V13M6 10V14M9 11V13M12 9V15M15 12V18M15 6V8M18 10V14M21 11V13" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>',
			type: "input",
			onChange: (value) => {
				this.kxsClient.soundLibrary.death_sound_url = value as string;
				this.kxsClient.updateLocalStorage();
			}
		});

		this.addOption(HUD, {
			label: "Clean Main Menu",
			value: this.kxsClient.isMainMenuCleaned,
			category: "HUD",
			icon: '<svg fill="#000000" viewBox="0 0 32 32" id="icon" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <defs> <style> .cls-1 { fill: none; } </style> </defs> <title>clean</title> <rect x="20" y="18" width="6" height="2" transform="translate(46 38) rotate(-180)"></rect> <rect x="24" y="26" width="6" height="2" transform="translate(54 54) rotate(-180)"></rect> <rect x="22" y="22" width="6" height="2" transform="translate(50 46) rotate(-180)"></rect> <path d="M17.0029,20a4.8952,4.8952,0,0,0-2.4044-4.1729L22,3,20.2691,2,12.6933,15.126A5.6988,5.6988,0,0,0,7.45,16.6289C3.7064,20.24,3.9963,28.6821,4.01,29.04a1,1,0,0,0,1,.96H20.0012a1,1,0,0,0,.6-1.8C17.0615,25.5439,17.0029,20.0537,17.0029,20ZM11.93,16.9971A3.11,3.11,0,0,1,15.0041,20c0,.0381.0019.208.0168.4688L9.1215,17.8452A3.8,3.8,0,0,1,11.93,16.9971ZM15.4494,28A5.2,5.2,0,0,1,14,25H12a6.4993,6.4993,0,0,0,.9684,3H10.7451A16.6166,16.6166,0,0,1,10,24H8a17.3424,17.3424,0,0,0,.6652,4H6c.031-1.8364.29-5.8921,1.8027-8.5527l7.533,3.35A13.0253,13.0253,0,0,0,17.5968,28Z"></path> <rect id="_Transparent_Rectangle_" data-name="<Transparent Rectangle>" class="cls-1" width="32" height="32"></rect> </g></svg>',
			type: "toggle",
			onChange: (value) => {
				this.kxsClient.isMainMenuCleaned = !this.kxsClient.isMainMenuCleaned
				this.kxsClient.MainMenuCleaning();
				this.kxsClient.updateLocalStorage()
			},
		});

		this.addOption(HUD, {
			label: "Show Ping",
			value: this.kxsClient.isPingVisible,
			category: "HUD",
			icon: '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><defs><style>.a{fill:none;stroke:#000000;stroke-linecap:round;stroke-linejoin:round;}</style></defs><path class="a" d="M34.6282,24.0793a14.7043,14.7043,0,0,0-22.673,1.7255"></path><path class="a" d="M43.5,20.5846a23.8078,23.8078,0,0,0-39,0"></path><path class="a" d="M43.5,20.5845,22.0169,29.0483a5.5583,5.5583,0,1,0,6.2116,8.7785l.0153.0206Z"></path></g></svg>',
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
			category: "HUD",
			type: "toggle",
			icon: '<svg fill="#000000" viewBox="0 0 24 24" id="60fps" data-name="Flat Line" xmlns="http://www.w3.org/2000/svg" class="icon flat-line"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><rect id="primary" x="10.5" y="8.5" width="14" height="7" rx="1" transform="translate(5.5 29.5) rotate(-90)" style="fill: none; stroke: #000000; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2;"></rect><path id="primary-2" data-name="primary" d="M3,12H9a1,1,0,0,1,1,1v5a1,1,0,0,1-1,1H4a1,1,0,0,1-1-1V6A1,1,0,0,1,4,5h6" style="fill: none; stroke: #000000; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2;"></path></g></svg>',
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
			category: "HUD",
			icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M14.7245 11.2754L16 12.4999L10.0129 17.8218C8.05054 19.5661 5.60528 20.6743 3 20.9999L3.79443 19.5435C4.6198 18.0303 5.03249 17.2737 5.50651 16.5582C5.92771 15.9224 6.38492 15.3113 6.87592 14.7278C7.42848 14.071 8.0378 13.4615 9.25644 12.2426L12 9.49822M11.5 8.99787L17.4497 3.04989C18.0698 2.42996 19.0281 2.3017 19.7894 2.73674C20.9027 3.37291 21.1064 4.89355 20.1997 5.80024L19.8415 6.15847C19.6228 6.3771 19.3263 6.49992 19.0171 6.49992H18L16 8.49992V8.67444C16 9.16362 16 9.40821 15.9447 9.63839C15.8957 9.84246 15.8149 10.0375 15.7053 10.2165C15.5816 10.4183 15.4086 10.5913 15.0627 10.9372L14.2501 11.7498L11.5 8.99787Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>',
			onChange: (value) => {
				this.kxsClient.isKillsVisible = !this.kxsClient.isKillsVisible
				this.kxsClient.updateKillsVisibility()
				this.kxsClient.updateLocalStorage()
			},
		});

		this.addOption(HUD, {
			label: "Use Legacy Menu",
			value: this.kxsClient.isLegaySecondaryMenu,
			type: "toggle",
			category: 'HUD',
			icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M4 12H20M4 8H20M4 16H12" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>',
			onChange: (value) => {
				this.kxsClient.isLegaySecondaryMenu = !this.kxsClient.isLegaySecondaryMenu
				this.kxsClient.updateLocalStorage()
				this.kxsClient.secondaryMenu = new KxsLegacyClientSecondaryMenu(this.kxsClient);
				this.destroy();
			},
		});

		this.addOption(MECHANIC, {
			label: "Death sound",
			value: this.kxsClient.isDeathSoundEnabled,
			type: "toggle",
			icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M19 21C19 21.5523 18.5523 22 18 22H14H10H6C5.44771 22 5 21.5523 5 21V18.75C5 17.7835 4.2165 17 3.25 17C2.55964 17 2 16.4404 2 15.75V11C2 5.47715 6.47715 1 12 1C17.5228 1 22 5.47715 22 11V15.75C22 16.4404 21.4404 17 20.75 17C19.7835 17 19 17.7835 19 18.75V21ZM17 20V18.75C17 16.9358 18.2883 15.4225 20 15.075V11C20 6.58172 16.4183 3 12 3C7.58172 3 4 6.58172 4 11V15.075C5.71168 15.4225 7 16.9358 7 18.75V20H9V18C9 17.4477 9.44771 17 10 17C10.5523 17 11 17.4477 11 18V20H13V18C13 17.4477 13.4477 17 14 17C14.5523 17 15 17.4477 15 18V20H17ZM11 12.5C11 13.8807 8.63228 15 7.25248 15C5.98469 15 5.99206 14.055 6.00161 12.8306V12.8305C6.00245 12.7224 6.00331 12.6121 6.00331 12.5C6.00331 11.1193 7.12186 10 8.50166 10C9.88145 10 11 11.1193 11 12.5ZM17.9984 12.8306C17.9975 12.7224 17.9967 12.6121 17.9967 12.5C17.9967 11.1193 16.8781 10 15.4983 10C14.1185 10 13 11.1193 13 12.5C13 13.8807 15.3677 15 16.7475 15C18.0153 15 18.0079 14.055 17.9984 12.8306Z" fill="#000000"></path> </g></svg>',
			category: "MECHANIC",
			onChange: (value) => {
				this.kxsClient.isDeathSoundEnabled = !this.kxsClient.isDeathSoundEnabled
				this.kxsClient.updateLocalStorage()
			},
		});

		this.addOption(HUD, {
			label: "Win sound",
			value: this.kxsClient.isWinSoundEnabled,
			type: "toggle",
			icon: '<svg fill="#000000" version="1.1" id="Trophy_x5F_cup" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 256 256" enable-background="new 0 0 256 256" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M190.878,111.272c31.017-11.186,53.254-40.907,53.254-75.733l-0.19-8.509h-48.955V5H64.222v22.03H15.266l-0.19,8.509 c0,34.825,22.237,64.546,53.254,75.733c7.306,18.421,22.798,31.822,41.878,37.728v20c-0.859,15.668-14.112,29-30,29v18h-16v35H195 v-35h-16v-18c-15.888,0-29.141-13.332-30-29v-20C168.08,143.094,183.572,129.692,190.878,111.272z M195,44h30.563 c-0.06,0.427-0.103,1.017-0.171,1.441c-3.02,18.856-14.543,34.681-30.406,44.007C195.026,88.509,195,44,195,44z M33.816,45.441 c-0.068-0.424-0.111-1.014-0.171-1.441h30.563c0,0-0.026,44.509,0.013,45.448C48.359,80.122,36.837,64.297,33.816,45.441z M129.604,86.777l-20.255,13.52l6.599-23.442L96.831,61.77l24.334-0.967l8.44-22.844l8.44,22.844l24.334,0.967L143.26,76.856 l6.599,23.442L129.604,86.777z"></path> </g></svg>',
			category: "HUD",
			onChange: (value) => {
				this.kxsClient.isWinSoundEnabled = !this.kxsClient.isWinSoundEnabled
				this.kxsClient.updateLocalStorage()
			},
		});

		this.addOption(HUD, {
			label: "Message Open/Close RSHIFT Menu",
			value: this.kxsClient.isNotifyingForToggleMenu,
			type: "toggle",
			icon: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title></title> <g id="Complete"> <g id="info-circle"> <g> <circle cx="12" cy="12" data-name="--Circle" fill="none" id="_--Circle" r="10" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></circle> <line fill="none" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="12" y2="16"></line> <line fill="none" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="8" y2="8"></line> </g> </g> </g> </g></svg>',
			category: "HUD",
			onChange: (value) => {
				this.kxsClient.isNotifyingForToggleMenu = !this.kxsClient.isNotifyingForToggleMenu
				this.kxsClient.updateLocalStorage()
			},
		})

		this.addOption(SERVER, {
			label: "Webhook URL",
			value: this.kxsClient.discordWebhookUrl || "",
			icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M12.52 3.046a3 3 0 0 0-2.13 5.486 1 1 0 0 1 .306 1.38l-3.922 6.163a2 2 0 1 1-1.688-1.073l3.44-5.405a5 5 0 1 1 8.398-2.728 1 1 0 1 1-1.97-.348 3 3 0 0 0-2.433-3.475zM10 6a2 2 0 1 1 3.774.925l3.44 5.405a5 5 0 1 1-1.427 8.5 1 1 0 0 1 1.285-1.532 3 3 0 1 0 .317-4.83 1 1 0 0 1-1.38-.307l-3.923-6.163A2 2 0 0 1 10 6zm-5.428 6.9a1 1 0 0 1-.598 1.281A3 3 0 1 0 8.001 17a1 1 0 0 1 1-1h8.266a2 2 0 1 1 0 2H9.9a5 5 0 1 1-6.61-5.698 1 1 0 0 1 1.282.597Z" fill="#000000"></path> </g></svg>',
			category: "SERVER",
			type: "input",
			onChange: (value) => {
				value = value.toString().trim();
				this.kxsClient.discordWebhookUrl = value as string
				this.kxsClient.discordTracker.setWebhookUrl(value as string)
				this.kxsClient.updateLocalStorage()
			},
		});

		this.addOption(MECHANIC, {
			label: "Heal Warning",
			value: this.kxsClient.isHealthWarningEnabled,
			type: "toggle",
			category: "MECHANIC",
			icon: '<svg viewBox="0 0 512 512" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>health</title> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="add" fill="#000000" transform="translate(42.666667, 64.000000)"> <path d="M365.491733,234.665926 C339.947827,276.368766 302.121072,321.347032 252.011468,369.600724 L237.061717,383.7547 C234.512147,386.129148 231.933605,388.511322 229.32609,390.901222 L213.333333,405.333333 C205.163121,398.070922 197.253659,390.878044 189.604949,383.7547 L174.655198,369.600724 C124.545595,321.347032 86.7188401,276.368766 61.174934,234.665926 L112.222458,234.666026 C134.857516,266.728129 165.548935,301.609704 204.481843,339.08546 L213.333333,347.498667 L214.816772,346.115558 C257.264819,305.964102 290.400085,268.724113 314.444476,234.665648 L365.491733,234.665926 Z M149.333333,58.9638831 L213.333333,186.944 L245.333333,122.963883 L269.184,170.666667 L426.666667,170.666667 L426.666667,213.333333 L247.850667,213.333333 L213.333333,282.36945 L149.333333,154.368 L119.851392,213.333333 L3.55271368e-14,213.333333 L3.55271368e-14,170.666667 L93.4613333,170.666667 L149.333333,58.9638831 Z M290.133333,0 C353.756537,0 405.333333,51.5775732 405.333333,115.2 C405.333333,126.248908 404.101625,137.626272 401.63821,149.33209 L357.793994,149.332408 C360.62486,138.880112 362.217829,128.905378 362.584434,119.422244 L362.666667,115.2 C362.666667,75.1414099 330.192075,42.6666667 290.133333,42.6666667 C273.651922,42.6666667 258.124715,48.1376509 245.521279,58.0219169 L241.829932,61.1185374 L213.366947,86.6338354 L184.888885,61.1353673 C171.661383,49.2918281 154.669113,42.6666667 136.533333,42.6666667 C96.4742795,42.6666667 64,75.1409461 64,115.2 C64,125.932203 65.6184007,137.316846 68.8727259,149.332605 L25.028457,149.33209 C22.5650412,137.626272 21.3333333,126.248908 21.3333333,115.2 C21.3333333,51.5767968 72.9101302,0 136.533333,0 C166.046194,0 192.966972,11.098031 213.350016,29.348444 C233.716605,11.091061 260.629741,0 290.133333,0 Z" id="Combined-Shape"> </path> </g> </g> </g></svg>',
			onChange: (value) => {
				this.kxsClient.isHealthWarningEnabled = !this.kxsClient.isHealthWarningEnabled
				this.kxsClient.updateLocalStorage()
			},
		});

		this.addOption(SERVER, {
			label: "Update Checker",
			value: this.kxsClient.isAutoUpdateEnabled,
			type: "toggle",
			icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M18.4721 16.7023C17.3398 18.2608 15.6831 19.3584 13.8064 19.7934C11.9297 20.2284 9.95909 19.9716 8.25656 19.0701C6.55404 18.1687 5.23397 16.6832 4.53889 14.8865C3.84381 13.0898 3.82039 11.1027 4.47295 9.29011C5.12551 7.47756 6.41021 5.96135 8.09103 5.02005C9.77184 4.07875 11.7359 3.77558 13.6223 4.16623C15.5087 4.55689 17.1908 5.61514 18.3596 7.14656C19.5283 8.67797 20.1052 10.5797 19.9842 12.5023M19.9842 12.5023L21.4842 11.0023M19.9842 12.5023L18.4842 11.0023" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M12 8V12L15 15" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>',
			category: "SERVER",
			onChange: (value) => {
				this.kxsClient.isAutoUpdateEnabled = !this.kxsClient.isAutoUpdateEnabled
				this.kxsClient.updateLocalStorage()
			},
		});

		this.addOption(MECHANIC, {
			label: `Uncap FPS`,
			value: this.kxsClient.isFpsUncapped,
			type: "toggle",
			icon: '<svg viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_fps_960_24_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_fps_960_24_filled" fill="#000000" fill-rule="nonzero"> <path d="M11.75,15 C12.9926407,15 14,16.0073593 14,17.25 C14,18.440864 13.0748384,19.4156449 11.9040488,19.4948092 L11.75,19.5 L11,19.5 L11,21.25 C11,21.6296958 10.7178461,21.943491 10.3517706,21.9931534 L10.25,22 C9.87030423,22 9.55650904,21.7178461 9.50684662,21.3517706 L9.5,21.25 L9.5,15.75 C9.5,15.3703042 9.78215388,15.056509 10.1482294,15.0068466 L10.25,15 L11.75,15 Z M18,15 C19.1045695,15 20,15.8954305 20,17 C20,17.4142136 19.6642136,17.75 19.25,17.75 C18.8703042,17.75 18.556509,17.4678461 18.5068466,17.1017706 L18.5,17 C18.5,16.7545401 18.3231248,16.5503916 18.0898756,16.5080557 L18,16.5 L17.375,16.5 C17.029822,16.5 16.75,16.779822 16.75,17.125 C16.75,17.4387982 16.9812579,17.6985831 17.2826421,17.7432234 L17.375,17.75 L17.875,17.75 C19.0486051,17.75 20,18.7013949 20,19.875 C20,20.9975788 19.1295366,21.91685 18.0267588,21.9946645 L17.875,22 L17.25,22 C16.1454305,22 15.25,21.1045695 15.25,20 C15.25,19.5857864 15.5857864,19.25 16,19.25 C16.3796958,19.25 16.693491,19.5321539 16.7431534,19.8982294 L16.75,20 C16.75,20.2454599 16.9268752,20.4496084 17.1601244,20.4919443 L17.25,20.5 L17.875,20.5 C18.220178,20.5 18.5,20.220178 18.5,19.875 C18.5,19.5612018 18.2687421,19.3014169 17.9673579,19.2567766 L17.875,19.25 L17.375,19.25 C16.2013949,19.25 15.25,18.2986051 15.25,17.125 C15.25,16.0024212 16.1204634,15.08315 17.2232412,15.0053355 L17.375,15 L18,15 Z M7.75,15 C8.16421356,15 8.5,15.3357864 8.5,15.75 C8.5,16.1296958 8.21784612,16.443491 7.85177056,16.4931534 L7.75,16.5 L5.5,16.4990964 L5.5,18.0020964 L7.25,18.002809 C7.66421356,18.002809 8,18.3385954 8,18.752809 C8,19.1325047 7.71784612,19.4462999 7.35177056,19.4959623 L7.25,19.502809 L5.5,19.5020964 L5.5,21.2312276 C5.5,21.6109234 5.21784612,21.9247186 4.85177056,21.974381 L4.75,21.9812276 C4.37030423,21.9812276 4.05650904,21.6990738 4.00684662,21.3329982 L4,21.2312276 L4,15.75 C4,15.3703042 4.28215388,15.056509 4.64822944,15.0068466 L4.75,15 L7.75,15 Z M11.75,16.5 L11,16.5 L11,18 L11.75,18 C12.1642136,18 12.5,17.6642136 12.5,17.25 C12.5,16.8703042 12.2178461,16.556509 11.8517706,16.5068466 L11.75,16.5 Z M5,3 C6.65685425,3 8,4.34314575 8,6 L7.99820112,6.1048763 L8,6.15469026 L8,10 C8,11.5976809 6.75108004,12.9036609 5.17627279,12.9949073 L5,13 L4.7513884,13 C3.23183855,13 2,11.7681615 2,10.2486116 C2,9.69632685 2.44771525,9.2486116 3,9.2486116 C3.51283584,9.2486116 3.93550716,9.63465179 3.99327227,10.1319905 L4,10.2486116 C4,10.6290103 4.28267621,10.9433864 4.64942945,10.9931407 L4.7513884,11 L5,11 C5.51283584,11 5.93550716,10.6139598 5.99327227,10.1166211 L6,10 L5.99991107,8.82932572 C5.68715728,8.93985718 5.35060219,9 5,9 C3.34314575,9 2,7.65685425 2,6 C2,4.34314575 3.34314575,3 5,3 Z M12.2512044,3 C13.7707542,3 15.0025928,4.23183855 15.0025928,5.7513884 C15.0025928,6.30367315 14.5548775,6.7513884 14.0025928,6.7513884 C13.489757,6.7513884 13.0670856,6.36534821 13.0093205,5.86800953 L13.0025928,5.7513884 C13.0025928,5.37098974 12.7199166,5.05661365 12.3531633,5.00685929 L12.2512044,5 L12.0025928,5 C11.489757,5 11.0670856,5.38604019 11.0093205,5.88337887 L11.0025928,6 L11.0026817,7.17067428 C11.3154355,7.06014282 11.6519906,7 12.0025928,7 C13.659447,7 15.0025928,8.34314575 15.0025928,10 C15.0025928,11.6568542 13.659447,13 12.0025928,13 C10.3457385,13 9.0025928,11.6568542 9.0025928,10 L9.00441213,9.89453033 L9.0025928,9.84530974 L9.0025928,6 C9.0025928,4.40231912 10.2515128,3.09633912 11.82632,3.00509269 L12.0025928,3 L12.2512044,3 Z M19,3 C20.5976809,3 21.9036609,4.24891996 21.9949073,5.82372721 L22,6 L22,10 C22,11.6568542 20.6568542,13 19,13 C17.4023191,13 16.0963391,11.75108 16.0050927,10.1762728 L16,10 L16,6 C16,4.34314575 17.3431458,3 19,3 Z M12.0025928,9 C11.450308,9 11.0025928,9.44771525 11.0025928,10 C11.0025928,10.5522847 11.450308,11 12.0025928,11 C12.5548775,11 13.0025928,10.5522847 13.0025928,10 C13.0025928,9.44771525 12.5548775,9 12.0025928,9 Z M19,5 C18.4871642,5 18.0644928,5.38604019 18.0067277,5.88337887 L18,6 L18,10 C18,10.5522847 18.4477153,11 19,11 C19.5128358,11 19.9355072,10.6139598 19.9932723,10.1166211 L20,10 L20,6 C20,5.44771525 19.5522847,5 19,5 Z M5,5 C4.44771525,5 4,5.44771525 4,6 C4,6.55228475 4.44771525,7 5,7 C5.55228475,7 6,6.55228475 6,6 C6,5.44771525 5.55228475,5 5,5 Z" id="🎨Color"> </path> </g> </g> </g></svg>',
			category: 'MECHANIC',
			onChange: () => {
				this.kxsClient.toggleFpsUncap();
				this.kxsClient.updateLocalStorage();
			},
		});

		this.addOption(HUD, {
			label: `Winning Animation`,
			value: this.kxsClient.isWinningAnimationEnabled,
			icon: '<svg fill="#000000" height="200px" width="200px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 448.881 448.881" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path d="M189.82,138.531c-8.92,0-16.611,6.307-18.353,15.055l-11.019,55.306c-3.569,20.398-7.394,40.53-9.946,59.652h-0.513 c-2.543-19.122-5.35-37.474-9.176-57.615l-11.85-62.35c-1.112-5.832-6.206-10.048-12.139-10.048H95.819 c-5.854,0-10.909,4.114-12.099,9.853l-12.497,60.507c-4.332,21.159-8.414,41.805-11.213,60.413h-0.513 c-2.8-17.332-6.369-39.511-10.196-59.901l-10.024-54.643c-1.726-9.403-9.922-16.23-19.479-16.23c-6.05,0-11.774,2.77-15.529,7.52 c-3.755,4.751-5.133,10.965-3.733,16.851l32.747,137.944c1.322,5.568,6.299,9.503,12.022,9.503h22.878 c5.792,0,10.809-4.028,12.061-9.689l14.176-64.241c4.083-17.334,6.883-33.648,9.946-53.019h0.507 c2.037,19.627,4.845,35.685,8.157,53.019l12.574,63.96c1.136,5.794,6.222,9.97,12.125,9.97h22.325 c5.638,0,10.561-3.811,11.968-9.269l35.919-139.158c1.446-5.607,0.225-11.564-3.321-16.136 C201.072,141.207,195.612,138.531,189.82,138.531z"></path> <path d="M253.516,138.531c-10.763,0-19.495,8.734-19.495,19.503v132.821c0,10.763,8.732,19.495,19.495,19.495 c10.771,0,19.503-8.732,19.503-19.495V158.034C273.019,147.265,264.287,138.531,253.516,138.531z"></path> <path d="M431.034,138.531c-9.861,0-17.847,7.995-17.847,17.847v32.373c0,25.748,0.761,48.945,3.313,71.637h-0.763 c-7.652-19.379-17.847-40.786-28.041-58.891l-32.14-56.704c-2.193-3.865-6.299-6.26-10.747-6.26h-25.818 c-6.827,0-12.357,5.529-12.357,12.357v141.615c0,9.86,7.987,17.847,17.847,17.847c9.853,0,17.84-7.987,17.84-17.847v-33.905 c0-28.042-0.514-52.258-1.532-74.941l0.769-0.256c8.406,20.141,19.627,42.318,29.823,60.671l33.174,59.909 c2.177,3.927,6.321,6.369,10.809,6.369h21.159c6.828,0,12.357-5.53,12.357-12.357V156.378 C448.881,146.526,440.894,138.531,431.034,138.531z"></path> </g> </g></svg>',
			category: "HUD",
			type: "toggle",
			onChange: () => {
				this.kxsClient.isWinningAnimationEnabled = !this.kxsClient.isWinningAnimationEnabled;
				this.kxsClient.updateLocalStorage();
			},
		});

		this.addOption(HUD, {
			label: `Spotify Player`,
			value: this.kxsClient.isSpotifyPlayerEnabled,
			icon: '<svg fill="#000000" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>spotify</title> <path d="M24.849 14.35c-3.206-1.616-6.988-2.563-10.991-2.563-2.278 0-4.484 0.306-6.58 0.881l0.174-0.041c-0.123 0.040-0.265 0.063-0.412 0.063-0.76 0-1.377-0.616-1.377-1.377 0-0.613 0.401-1.132 0.954-1.311l0.010-0.003c5.323-1.575 14.096-1.275 19.646 2.026 0.426 0.258 0.706 0.719 0.706 1.245 0 0.259-0.068 0.502-0.186 0.712l0.004-0.007c-0.29 0.345-0.721 0.563-1.204 0.563-0.273 0-0.529-0.070-0.752-0.192l0.008 0.004zM24.699 18.549c-0.201 0.332-0.561 0.55-0.971 0.55-0.225 0-0.434-0.065-0.61-0.178l0.005 0.003c-2.739-1.567-6.021-2.49-9.518-2.49-1.925 0-3.784 0.28-5.539 0.801l0.137-0.035c-0.101 0.032-0.217 0.051-0.337 0.051-0.629 0-1.139-0.51-1.139-1.139 0-0.509 0.333-0.939 0.793-1.086l0.008-0.002c1.804-0.535 3.878-0.843 6.023-0.843 3.989 0 7.73 1.064 10.953 2.925l-0.106-0.056c0.297 0.191 0.491 0.52 0.491 0.894 0 0.227-0.071 0.437-0.192 0.609l0.002-0.003zM22.899 22.673c-0.157 0.272-0.446 0.452-0.777 0.452-0.186 0-0.359-0.057-0.502-0.154l0.003 0.002c-2.393-1.346-5.254-2.139-8.299-2.139-1.746 0-3.432 0.261-5.020 0.745l0.122-0.032c-0.067 0.017-0.145 0.028-0.224 0.028-0.512 0-0.927-0.415-0.927-0.927 0-0.432 0.296-0.795 0.696-0.898l0.006-0.001c1.581-0.47 3.397-0.74 5.276-0.74 3.402 0 6.596 0.886 9.366 2.44l-0.097-0.050c0.302 0.15 0.506 0.456 0.506 0.809 0 0.172-0.048 0.333-0.132 0.469l0.002-0.004zM16 1.004c0 0 0 0-0 0-8.282 0-14.996 6.714-14.996 14.996s6.714 14.996 14.996 14.996c8.282 0 14.996-6.714 14.996-14.996v0c-0.025-8.272-6.724-14.971-14.993-14.996h-0.002z"></path> </g></svg>',
			category: "HUD",
			type: "toggle",
			onChange: () => {
				this.kxsClient.isSpotifyPlayerEnabled = !this.kxsClient.isSpotifyPlayerEnabled;
				this.kxsClient.updateLocalStorage();
				this.kxsClient.toggleSpotifyMenu();
			},
		});

		this.addOption(HUD, {
			label: "Kill Feed Blint Text",
			value: this.kxsClient.isKillFeedBlint,
			icon: `<svg fill="#000000" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title></title> <g data-name="Layer 2" id="Layer_2"> <path d="M18,11a1,1,0,0,1-1,1,5,5,0,0,0-5,5,1,1,0,0,1-2,0,5,5,0,0,0-5-5,1,1,0,0,1,0-2,5,5,0,0,0,5-5,1,1,0,0,1,2,0,5,5,0,0,0,5,5A1,1,0,0,1,18,11Z"></path> <path d="M19,24a1,1,0,0,1-1,1,2,2,0,0,0-2,2,1,1,0,0,1-2,0,2,2,0,0,0-2-2,1,1,0,0,1,0-2,2,2,0,0,0,2-2,1,1,0,0,1,2,0,2,2,0,0,0,2,2A1,1,0,0,1,19,24Z"></path> <path d="M28,17a1,1,0,0,1-1,1,4,4,0,0,0-4,4,1,1,0,0,1-2,0,4,4,0,0,0-4-4,1,1,0,0,1,0-2,4,4,0,0,0,4-4,1,1,0,0,1,2,0,4,4,0,0,0,4,4A1,1,0,0,1,28,17Z"></path> </g> </g></svg>`,
			category: "HUD",
			type: "toggle",
			onChange: () => {
				this.kxsClient.isKillFeedBlint = !this.kxsClient.isKillFeedBlint
				this.kxsClient.updateLocalStorage()
			},
		});

		this.addOption(SERVER, {
			label: `Rich Presence (Account token required)`,
			value: this.kxsClient.discordToken || "",
			icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M18.59 5.88997C17.36 5.31997 16.05 4.89997 14.67 4.65997C14.5 4.95997 14.3 5.36997 14.17 5.69997C12.71 5.47997 11.26 5.47997 9.83001 5.69997C9.69001 5.36997 9.49001 4.95997 9.32001 4.65997C7.94001 4.89997 6.63001 5.31997 5.40001 5.88997C2.92001 9.62997 2.25001 13.28 2.58001 16.87C4.23001 18.1 5.82001 18.84 7.39001 19.33C7.78001 18.8 8.12001 18.23 8.42001 17.64C7.85001 17.43 7.31001 17.16 6.80001 16.85C6.94001 16.75 7.07001 16.64 7.20001 16.54C10.33 18 13.72 18 16.81 16.54C16.94 16.65 17.07 16.75 17.21 16.85C16.7 17.16 16.15 17.42 15.59 17.64C15.89 18.23 16.23 18.8 16.62 19.33C18.19 18.84 19.79 18.1 21.43 16.87C21.82 12.7 20.76 9.08997 18.61 5.88997H18.59ZM8.84001 14.67C7.90001 14.67 7.13001 13.8 7.13001 12.73C7.13001 11.66 7.88001 10.79 8.84001 10.79C9.80001 10.79 10.56 11.66 10.55 12.73C10.55 13.79 9.80001 14.67 8.84001 14.67ZM15.15 14.67C14.21 14.67 13.44 13.8 13.44 12.73C13.44 11.66 14.19 10.79 15.15 10.79C16.11 10.79 16.87 11.66 16.86 12.73C16.86 13.79 16.11 14.67 15.15 14.67Z" fill="#000000"></path> </g></svg>',
			category: "SERVER",
			type: "input",
			onChange: (value) => {
				value = value.toString().trim();
				this.kxsClient.discordToken = this.kxsClient.parseToken(value as string);
				this.kxsClient.discordRPC.disconnect();
				this.kxsClient.discordRPC.connect();
				this.kxsClient.updateLocalStorage();
			},
		});

		this.addOption(MECHANIC, {
			label: `Kill Leader Tracking`,
			icon: '<svg fill="#000000" viewBox="-4 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>crown</title> <path d="M12 10.938c-1.375 0-2.5-1.125-2.5-2.5 0-1.406 1.125-2.5 2.5-2.5s2.5 1.094 2.5 2.5c0 1.375-1.125 2.5-2.5 2.5zM2.031 9.906c1.094 0 1.969 0.906 1.969 2 0 1.125-0.875 2-1.969 2-1.125 0-2.031-0.875-2.031-2 0-1.094 0.906-2 2.031-2zM22.031 9.906c1.094 0 1.969 0.906 1.969 2 0 1.125-0.875 2-1.969 2-1.125 0-2.031-0.875-2.031-2 0-1.094 0.906-2 2.031-2zM4.219 23.719l-1.656-9.063c0.5-0.094 0.969-0.375 1.344-0.688 1.031 0.938 2.344 1.844 3.594 1.844 1.5 0 2.719-2.313 3.563-4.25 0.281 0.094 0.625 0.188 0.938 0.188s0.656-0.094 0.938-0.188c0.844 1.938 2.063 4.25 3.563 4.25 1.25 0 2.563-0.906 3.594-1.844 0.375 0.313 0.844 0.594 1.344 0.688l-1.656 9.063h-15.563zM3.875 24.5h16.25v1.531h-16.25v-1.531z"></path> </g></svg>',
			category: "MECHANIC",
			value: this.kxsClient.isKillLeaderTrackerEnabled,
			type: "toggle",
			onChange: (value) => {
				this.kxsClient.isKillLeaderTrackerEnabled = !this.kxsClient.isKillLeaderTrackerEnabled;
				this.kxsClient.updateLocalStorage();
			},
		});

		this.addOption(MECHANIC, {
			label: `Friends Detector (separe with ',')`,
			icon: '<svg fill="#000000" viewBox="0 -6 44 44" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M42.001,32.000 L14.010,32.000 C12.908,32.000 12.010,31.104 12.010,30.001 L12.010,28.002 C12.010,27.636 12.211,27.300 12.532,27.124 L22.318,21.787 C19.040,18.242 19.004,13.227 19.004,12.995 L19.010,7.002 C19.010,6.946 19.015,6.891 19.024,6.837 C19.713,2.751 24.224,0.007 28.005,0.007 C28.006,0.007 28.008,0.007 28.009,0.007 C31.788,0.007 36.298,2.749 36.989,6.834 C36.998,6.889 37.003,6.945 37.003,7.000 L37.006,12.994 C37.006,13.225 36.970,18.240 33.693,21.785 L43.479,27.122 C43.800,27.298 44.000,27.634 44.000,28.000 L44.000,30.001 C44.000,31.104 43.103,32.000 42.001,32.000 ZM31.526,22.880 C31.233,22.720 31.039,22.425 31.008,22.093 C30.978,21.761 31.116,21.436 31.374,21.226 C34.971,18.310 35.007,13.048 35.007,12.995 L35.003,7.089 C34.441,4.089 30.883,2.005 28.005,2.005 C25.126,2.006 21.570,4.091 21.010,7.091 L21.004,12.997 C21.004,13.048 21.059,18.327 24.636,21.228 C24.895,21.438 25.033,21.763 25.002,22.095 C24.972,22.427 24.778,22.722 24.485,22.882 L14.010,28.596 L14.010,30.001 L41.999,30.001 L42.000,28.595 L31.526,22.880 ZM18.647,2.520 C17.764,2.177 16.848,1.997 15.995,1.997 C13.116,1.998 9.559,4.083 8.999,7.083 L8.993,12.989 C8.993,13.041 9.047,18.319 12.625,21.220 C12.884,21.430 13.022,21.755 12.992,22.087 C12.961,22.419 12.767,22.714 12.474,22.874 L1.999,28.588 L1.999,29.993 L8.998,29.993 C9.550,29.993 9.997,30.441 9.997,30.993 C9.997,31.545 9.550,31.993 8.998,31.993 L1.999,31.993 C0.897,31.993 -0.000,31.096 -0.000,29.993 L-0.000,27.994 C-0.000,27.629 0.200,27.292 0.521,27.117 L10.307,21.779 C7.030,18.234 6.993,13.219 6.993,12.988 L6.999,6.994 C6.999,6.939 7.004,6.883 7.013,6.829 C7.702,2.744 12.213,-0.000 15.995,-0.000 C15.999,-0.000 16.005,-0.000 16.010,-0.000 C17.101,-0.000 18.262,0.227 19.369,0.656 C19.885,0.856 20.140,1.435 19.941,1.949 C19.740,2.464 19.158,2.720 18.647,2.520 Z"></path> </g></svg>',
			category: "MECHANIC",
			value: this.kxsClient.all_friends,
			type: "input",
			onChange: (value) => {
				this.kxsClient.all_friends = value as string;
				this.kxsClient.updateLocalStorage();
			},
		});

		this.addOption(HUD, {
			label: `Change Background`,
			icon: '<svg height="200px" width="200px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 179.006 179.006" xml:space="preserve" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <polygon style="fill:#010002;" points="20.884,116.354 11.934,116.354 11.934,32.818 137.238,32.818 137.238,41.768 149.172,41.768 149.172,20.884 0,20.884 0,128.288 20.884,128.288 "></polygon> <path style="fill:#010002;" d="M29.834,50.718v107.404h149.172V50.718H29.834z M123.58,136.856c-0.024,0-0.048,0-0.072,0 c-0.012,0-1.187,0-2.81,0c-3.795,0-10.078,0-10.114,0c-19.625,0-39.25,0-58.875,0v-3.473c0.907-0.859,2.005-1.551,3.168-2.166 c1.981-1.062,3.938-2.148,5.967-3.115c1.957-0.937,3.998-1.742,6.003-2.59c1.886-0.8,3.801-1.545,5.674-2.363 c0.328-0.137,0.638-0.489,0.776-0.811c0.424-1.05,0.782-2.124,1.116-3.216c0.245-0.823,0.412-1.635,1.468-1.862 c0.263-0.048,0.597-0.513,0.627-0.817c0.209-1.581,0.37-3.168,0.489-4.744c0.024-0.346-0.149-0.776-0.382-1.038 c-1.384-1.557-2.142-3.353-2.47-5.406c-0.161-1.038-0.74-1.993-1.038-3.013c-0.394-1.366-0.728-2.745-1.038-4.129 c-0.119-0.501-0.048-1.038-0.125-1.551c-0.125-0.746-0.107-1.319,0.806-1.611c0.233-0.084,0.442-0.668,0.453-1.032 c0.048-2.214,0.012-4.433,0.024-6.641c0.012-1.36,0-2.727,0.107-4.087c0.185-2.596,1.718-4.421,3.622-5.997 c2.787-2.303,6.128-3.377,9.565-4.189c1.808-0.424,3.64-0.68,5.478-0.979c0.489-0.078,0.996-0.006,1.498-0.006 c0.095,0.125,0.161,0.251,0.251,0.37c-0.376,0.28-0.811,0.513-1.134,0.847c-0.746,0.746-0.674,1.265,0.125,1.945 c1.647,1.396,3.318,2.804,4.911,4.254c1.42,1.271,1.969,2.942,1.981,4.815c0,3.222,0,6.45,0,9.672c0,0.65-0.048,1.313,0.776,1.605 c0.167,0.066,0.352,0.424,0.34,0.632c-0.131,1.641-0.322,3.294-0.489,4.941c-0.006,0.066-0.018,0.131-0.054,0.185 c-1.486,2.166-1.677,4.827-2.733,7.148c-0.048,0.09-0.078,0.191-0.125,0.257c-1.969,2.315-1.36,5.102-1.396,7.769 c0,0.269,0.197,0.686,0.406,0.782c0.806,0.358,1.002,1.044,1.223,1.772c0.352,1.14,0.692,2.303,1.181,3.389 c0.179,0.394,0.716,0.746,1.17,0.907c0.943,0.364,1.886,0.74,2.834,1.11c2.363-1.002,5.734-2.434,6.385-2.727 c0.919-0.418,1.611-1.349,2.44-1.993c0.37-0.28,0.817-0.537,1.259-0.615c1.504-0.239,2.16-0.77,2.518-2.255 c0.465-1.945,0.806-3.89,0.388-5.913c-0.167-0.877-0.489-1.45-1.366-1.784c-1.778-0.698-3.532-1.474-5.293-2.22 c-1.319-0.555-1.396-1.02-0.919-2.387c1.516-4.296,2.631-8.658,3.007-13.258c0.28-3.443,0.048-6.981,1.307-10.305 c0.871-2.339,2.339-4.505,4.696-5.203c1.796-0.531,3.359-1.742,5.269-1.999c0.358-0.018,0.674-0.072,1.026-0.054 c0.042,0.006,0.078,0.012,0.113,0.012c4.529,0.286,9.923,3.019,11.2,8.043c0.066,0.257,0.101,0.525,0.143,0.788h0.125 c0.698,2.852,0.621,5.818,0.859,8.712c0.37,4.594,1.504,8.962,3.019,13.264c0.477,1.366,0.394,1.832-0.919,2.381 c-1.76,0.746-3.514,1.522-5.299,2.22c-0.871,0.34-1.181,0.895-1.36,1.784c-0.406,2.029-0.084,3.968,0.388,5.913 c0.346,1.48,1.014,2.011,2.512,2.25c0.442,0.078,0.883,0.334,1.259,0.615c0.829,0.644,1.516,1.569,2.44,1.993 c3.234,1.468,6.51,2.888,9.839,4.117c5.114,1.88,8.509,5.478,9.326,11.045C145.944,136.856,134.768,136.856,123.58,136.856z"></path> </g> </g> </g></svg>',
			category: "HUD",
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

					backgroundElement.style.backgroundImage = `url(${background_image})`;
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

	private createOptionCard(option: MenuOption, container: HTMLElement): void {
		const optionCard = document.createElement("div");
		Object.assign(optionCard.style, {
			background: "rgba(31, 41, 55, 0.8)",
			borderRadius: "10px",
			padding: "16px",
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
			gap: "12px",
			minHeight: "150px",
		});

		const iconContainer = document.createElement("div");
		Object.assign(iconContainer.style, {
			width: "48px",
			height: "48px",
			borderRadius: "50%",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			marginBottom: "8px"
		});
		iconContainer.innerHTML = option.icon || '';

		const title = document.createElement("div");
		title.textContent = option.label;
		title.style.fontSize = "16px";
		title.style.textAlign = "center";

		let control: null | HTMLElement = null;

		switch (option.type) {
			case "input":
				control = this.createInputElement(option);
				break
			case "toggle":
				control = this.createToggleButton(option);
				break;
			case "click":
				control = this.createClickButton(option);
		}

		optionCard.appendChild(iconContainer);
		optionCard.appendChild(title);
		optionCard.appendChild(control!);

		container.appendChild(optionCard);
	}

	private setActiveCategory(category: string): void {
		this.activeCategory = category;
		this.filterOptions();

		// Update button styles
		this.menu.querySelectorAll('.category-btn').forEach(btn => {
			const btnCategory = (btn as HTMLElement).dataset.category;
			(btn as HTMLElement).style.background =
				btnCategory === category ? '#3B82F6' : 'rgba(55, 65, 81, 0.8)';
		});
	}

	private filterOptions(): void {
		const gridContainer = document.getElementById('kxsMenuGrid');
		if (gridContainer) {
			// Clear existing content
			gridContainer.innerHTML = '';

			// Get unique options based on category and search term
			const displayedOptions = new Set();
			this.sections.forEach(section => {
				if (this.activeCategory === 'ALL' || section.category === this.activeCategory) {
					section.options.forEach(option => {
						// Create a unique key for each option
						const optionKey = `${option.label}-${option.category}`;

						// Check if option matches search term
						const matchesSearch = this.searchTerm === '' ||
							option.label.toLowerCase().includes(this.searchTerm) ||
							option.category.toLowerCase().includes(this.searchTerm);

						if (!displayedOptions.has(optionKey) && matchesSearch) {
							displayedOptions.add(optionKey);
							this.createOptionCard(option, gridContainer);
						}
					});
				}
			});

			// Show a message if no options match the search
			if (displayedOptions.size === 0 && this.searchTerm !== '') {
				const noResultsMsg = document.createElement('div');
				noResultsMsg.textContent = `No results found for "${this.searchTerm}"`;
				noResultsMsg.style.gridColumn = '1 / -1';
				noResultsMsg.style.textAlign = 'center';
				noResultsMsg.style.padding = '20px';
				noResultsMsg.style.color = '#9CA3AF';
				gridContainer.appendChild(noResultsMsg);
			}
		}
	}

	private createGridContainer(): void {
		const gridContainer = document.createElement("div");
		Object.assign(gridContainer.style, {
			display: "grid",
			gridTemplateColumns: "repeat(3, 1fr)",
			gap: "16px",
			padding: "16px",
			gridAutoRows: "minmax(150px, auto)",
			overflowY: "auto",
			overflowX: "hidden", // Prevent horizontal scrolling
			maxHeight: "calc(3 * 150px + 2 * 16px)",
			width: "100%",
			boxSizing: "border-box" // Include padding in width calculation
		});
		gridContainer.id = "kxsMenuGrid";
		this.menu.appendChild(gridContainer);
	}

	public addOption(section: MenuSection, option: MenuOption): void {
		section.options.push(option);
		// Store all options for searching
		this.allOptions.push(option);
	}

	public addSection(title: string, category: "HUD" | "SERVER" | "MECHANIC" | "ALL" | "SOUND" = "ALL"): MenuSection {
		const section: MenuSection = {
			title,
			options: [],
			category
		};

		const sectionElement = document.createElement("div");
		sectionElement.className = "menu-section";
		sectionElement.style.display = this.activeCategory === "ALL" || this.activeCategory === category ? "block" : "none";

		section.element = sectionElement;
		this.sections.push(section);
		this.menu.appendChild(sectionElement);
		return section;
	}

	private createToggleButton(option: MenuOption): HTMLButtonElement {
		const btn = document.createElement("button");
		Object.assign(btn.style, {
			width: "100%",
			padding: "8px",
			background: (option.value as boolean) ? "#059669" : "#DC2626",
			border: "none",
			borderRadius: "6px",
			color: "white",
			cursor: "pointer",
			transition: "background 0.2s",
			fontSize: "14px",
			fontWeight: "bold"
		});

		btn.textContent = (option.value as boolean) ? "ENABLED" : "DISABLED";

		btn.addEventListener("click", () => {
			const newValue = !(option.value as boolean);
			option.value = newValue;
			btn.textContent = newValue ? "ENABLED" : "DISABLED";
			btn.style.background = newValue ? "#059669" : "#DC2626";
			option.onChange?.(newValue);
		});

		return btn;
	}

	private createClickButton(option: MenuOption): HTMLButtonElement {
		const btn = document.createElement("button");
		Object.assign(btn.style, {
			width: "100%",
			padding: "8px",
			background: "#3B82F6",
			border: "none",
			borderRadius: "6px",
			color: "white",
			cursor: "pointer",
			transition: "background 0.2s",
			fontSize: "14px",
			fontWeight: "bold"
		});

		btn.textContent = option.label;

		btn.addEventListener("click", () => {
			option.onChange?.(true);
		});

		return btn;
	}

	addShiftListener() {
		window.addEventListener("keydown", (event) => {
			if (event.key === "Shift" && event.location == 2) {
				this.clearMenu();
				this.toggleMenuVisibility();
				// Ensure options are displayed after loading
				this.filterOptions();
			}
		});
	}

	private createInputElement(option: MenuOption): HTMLElement {
		const input = document.createElement("input");
		input.type = "text";
		input.value = String(option.value);
		Object.assign(input.style, {
			width: "100%",
			padding: "8px",
			background: "rgba(55, 65, 81, 0.8)",
			border: "none",
			borderRadius: "6px",
			color: "#FFAE00",
			fontSize: "14px"
		});

		input.addEventListener("change", () => {
			option.value = input.value;
			option.onChange?.(input.value);
		});

		return input;
	}

	private shiftListener = (event: KeyboardEvent) => {
		if (event.key === "Shift" && event.location == 2) {
			this.clearMenu();
			this.toggleMenuVisibility();
			// Ensure options are displayed after loading
			this.filterOptions();
		}
	};

	private mouseMoveListener = (e: MouseEvent) => {
		if (this.isDragging) {
			const x = e.clientX - this.dragOffset.x;
			const y = e.clientY - this.dragOffset.y;
			this.menu.style.transform = 'none';
			this.menu.style.left = `${x}px`;
			this.menu.style.top = `${y}px`;
		}
	};

	private mouseUpListener = () => {
		this.isDragging = false;
		this.menu.style.cursor = "grab";
	};

	addDragListeners() {
		this.menu.addEventListener('mousedown', (e: MouseEvent) => {
			if (
				e.target instanceof HTMLElement &&
				!e.target.matches("input, select, button, svg, path")
			) {
				this.isDragging = true;
				const rect = this.menu.getBoundingClientRect();
				this.dragOffset = {
					x: e.clientX - rect.left,
					y: e.clientY - rect.top
				};
				this.menu.style.cursor = "grabbing";
			}
		});

		document.addEventListener('mousemove', (e: MouseEvent) => {
			if (this.isDragging) {
				const x = e.clientX - this.dragOffset.x;
				const y = e.clientY - this.dragOffset.y;
				this.menu.style.transform = 'none';
				this.menu.style.left = `${x}px`;
				this.menu.style.top = `${y}px`;
			}
		});

		document.addEventListener('mouseup', () => {
			this.isDragging = false;
			this.menu.style.cursor = "grab";
		});
	}

	toggleMenuVisibility() {
		this.isClientMenuVisible = !this.isClientMenuVisible;
		// Mettre à jour la propriété publique en même temps
		this.isOpen = this.isClientMenuVisible;

		if (this.kxsClient.isNotifyingForToggleMenu) {
			this.kxsClient.nm.showNotification(this.isClientMenuVisible ? "Opening menu..." : "Closing menu...", "info", 1400);
		}

		this.menu.style.display = this.isClientMenuVisible ? "block" : "none";

		// If opening the menu, make sure to display options
		if (this.isClientMenuVisible) {
			this.filterOptions();
		}
	}

	destroy() {
		// Remove global event listeners
		window.removeEventListener("keydown", this.shiftListener);
		document.removeEventListener('mousemove', this.mouseMoveListener);
		document.removeEventListener('mouseup', this.mouseUpListener);

		// Remove all event listeners from menu elements
		const removeAllListeners = (element: HTMLElement) => {
			const clone = element.cloneNode(true) as HTMLElement;
			element.parentNode?.replaceChild(clone, element);
		};

		// Clean up all buttons and inputs in the menu
		this.menu.querySelectorAll('button, input').forEach(element => {
			removeAllListeners(element as HTMLElement);
		});

		// Remove the menu from DOM
		this.menu.remove();

		// Clear all sections
		this.sections.forEach(section => {
			if (section.element) {
				removeAllListeners(section.element);
				section.element.remove();
				delete section.element;
			}
			section.options = [];
		});
		this.sections = [];

		// Reset all class properties
		this.isClientMenuVisible = false;
		this.isDragging = false;
		this.dragOffset = { x: 0, y: 0 };
		this.activeCategory = "ALL";

		// Clear references
		this.menu = null as any;
		this.kxsClient = null as any;
	}

	getMenuVisibility(): boolean {
		return this.isClientMenuVisible;
	}
}

export { KxsClientSecondaryMenu, type MenuSection, type MenuOption };