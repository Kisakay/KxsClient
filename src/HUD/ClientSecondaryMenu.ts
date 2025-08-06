import { background_image, background_song, kxs_logo } from "../UTILS/vars";
import KxsClient from "../KxsClient";
import { DesignSystem } from "./DesignSystem";
import { category, Category, MenuOption, MenuSection, Mod, ModType, X0 } from "../types/hudMenu";

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
	// Fonction pour fermer un sous-menu
	public closeSubMenu: () => void = () => { };
	// Callbacks pour notifier les changements d'état du menu
	public onMenuToggle: (() => void)[] = [];

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
		this.menu.id = "kxsClientMenu";
		this.applyMenuStyles();
		this.createHeader();
		this.createGridContainer();
		document.body.appendChild(this.menu);
		this.menu.style.display = "none";



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

	private applyMenuStyles(): void {
		const isMobile = this.kxsClient.isMobile && this.kxsClient.isMobile();

		// Injecter les polices et animations du DesignSystem
		DesignSystem.injectFonts();

		// Apply appropriate styling based on the glassmorphism toggle
		DesignSystem.applyStyle(this.menu, 'dark', {
			position: "fixed",
			left: "50%",
			top: "50%",
			transform: "translate(-50%, -50%)",
			width: isMobile ? "85%" : "55%",
			maxWidth: "650px",
			maxHeight: "70vh",
			color: "#fff",
			padding: isMobile ? "10px" : "18px",
			zIndex: "10000",
			display: "none",
			flexDirection: "column",
			fontFamily: DesignSystem.fonts.primary,
			cursor: "grab",
			userSelect: "none",
			overflow: "hidden",
			boxSizing: "border-box",
			transition: `all ${DesignSystem.animation.normal} ease`,
			borderRadius: this.kxsClient.isGlassmorphismEnabled ? "14px" : "10px"
		});

		// Styles réduits pour mobile
		if (isMobile) {
			Object.assign(this.menu.style, {
				padding: "8px",
				borderRadius: this.kxsClient.isGlassmorphismEnabled ? "12px" : "8px",
				width: "75vw",
				maxWidth: "80vw",
				fontSize: "11px",
				maxHeight: "65vh",
				top: "5%"
			});

			// Add specific mobile styles based on glassmorphism toggle
			if (this.kxsClient.isGlassmorphismEnabled) {
				// Glassmorphism mobile optimisé pour les performances
				Object.assign(this.menu.style, {
					backdropFilter: "blur(10px) saturate(140%)",
					WebkitBackdropFilter: "blur(10px) saturate(140%)",
					willChange: "transform, opacity",
					backgroundColor: "rgba(15, 23, 42, 0.9)",
					boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
				});
			} else {
				// Classic style mobile
				Object.assign(this.menu.style, {
					backgroundColor: "rgba(40, 40, 40, 0.97)",
					boxShadow: "0 6px 16px rgba(0, 0, 0, 0.4)"
				});
			}
		}
	}

	private blockMousePropagation(element: HTMLElement, preventDefault = true) {
		['click', 'mousedown', 'mouseup', 'dblclick', 'contextmenu', 'wheel'].forEach(eventType => {
			element.addEventListener(eventType, (e) => {
				e.stopPropagation();
				if (preventDefault && (eventType === 'contextmenu' || eventType === 'wheel' || element.tagName !== 'INPUT')) {
					e.preventDefault();
				}
			}, false);
		});
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

		let HUD = this.addSection("HUD");
		let MECHANIC = this.addSection("MECHANIC");
		let SERVER = this.addSection("SERVER");
		let MISC = this.addSection("MISC");
		let CONFIG = this.addSection("CONFIG");

		this.addOption(SERVER, {
			label: "Kxs Network",
			value: true,
			type: ModType.Sub,
			icon: '<svg fill="#000000" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>network</title> <path d="M27 21.75c-0.795 0.004-1.538 0.229-2.169 0.616l0.018-0.010-2.694-2.449c0.724-1.105 1.154-2.459 1.154-3.913 0-1.572-0.503-3.027-1.358-4.212l0.015 0.021 3.062-3.062c0.57 0.316 1.249 0.503 1.971 0.508h0.002c2.347 0 4.25-1.903 4.25-4.25s-1.903-4.25-4.25-4.25c-2.347 0-4.25 1.903-4.25 4.25v0c0.005 0.724 0.193 1.403 0.519 1.995l-0.011-0.022-3.062 3.062c-1.147-0.84-2.587-1.344-4.144-1.344-0.868 0-1.699 0.157-2.467 0.443l0.049-0.016-0.644-1.17c0.726-0.757 1.173-1.787 1.173-2.921 0-2.332-1.891-4.223-4.223-4.223s-4.223 1.891-4.223 4.223c0 2.332 1.891 4.223 4.223 4.223 0.306 0 0.605-0.033 0.893-0.095l-0.028 0.005 0.642 1.166c-1.685 1.315-2.758 3.345-2.758 5.627 0 0.605 0.076 1.193 0.218 1.754l-0.011-0.049-0.667 0.283c-0.78-0.904-1.927-1.474-3.207-1.474-2.334 0-4.226 1.892-4.226 4.226s1.892 4.226 4.226 4.226c2.334 0 4.226-1.892 4.226-4.226 0-0.008-0-0.017-0-0.025v0.001c-0.008-0.159-0.023-0.307-0.046-0.451l0.003 0.024 0.667-0.283c1.303 2.026 3.547 3.349 6.1 3.349 1.703 0 3.268-0.589 4.503-1.574l-0.015 0.011 2.702 2.455c-0.258 0.526-0.41 1.144-0.414 1.797v0.001c0 2.347 1.903 4.25 4.25 4.25s4.25-1.903 4.25-4.25c0-2.347-1.903-4.25-4.25-4.25v0zM8.19 5c0-0.966 0.784-1.75 1.75-1.75s1.75 0.784 1.75 1.75c0 0.966-0.784 1.75-1.75 1.75v0c-0.966-0.001-1.749-0.784-1.75-1.75v-0zM5 22.42c-0.966-0.001-1.748-0.783-1.748-1.749s0.783-1.749 1.749-1.749c0.966 0 1.748 0.782 1.749 1.748v0c-0.001 0.966-0.784 1.749-1.75 1.75h-0zM27 3.25c0.966 0 1.75 0.784 1.75 1.75s-0.784 1.75-1.75 1.75c-0.966 0-1.75-0.784-1.75-1.75v0c0.001-0.966 0.784-1.749 1.75-1.75h0zM11.19 16c0-0.001 0-0.002 0-0.003 0-2.655 2.152-4.807 4.807-4.807 1.328 0 2.53 0.539 3.4 1.409l0.001 0.001 0.001 0.001c0.87 0.87 1.407 2.072 1.407 3.399 0 2.656-2.153 4.808-4.808 4.808s-4.808-2.153-4.808-4.808c0-0 0-0 0-0v0zM27 27.75c-0.966 0-1.75-0.784-1.75-1.75s0.784-1.75 1.75-1.75c0.966 0 1.75 0.784 1.75 1.75v0c-0.001 0.966-0.784 1.749-1.75 1.75h-0z"></path> </g></svg>',

			fields: [
				{
					label: "Spoof Nickname",
					icon: '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>hacker-solid</title> <g id="Layer_2" data-name="Layer 2"> <g id="invisible_box" data-name="invisible box"> <rect width="48" height="48" fill="none"></rect> </g> <g id="Q3_icons" data-name="Q3 icons"> <g> <path d="M24,30a60.3,60.3,0,0,1-13-1.3L7,27.6V40.2a1.9,1.9,0,0,0,1.5,1.9l12,2.9a2.4,2.4,0,0,0,2.1-.8L24,42.5l1.4,1.7A2.1,2.1,0,0,0,27,45h.5l12-2.9A1.9,1.9,0,0,0,41,40.2V27.6l-4,1.1A60.3,60.3,0,0,1,24,30Zm-7,8c-2,0-4-1.9-4-3s2-1,4-1,4,.9,4,2S19,38,17,38Zm14,0c-2,0-4-.9-4-2s2-2,4-2,4-.1,4,1S33,38,31,38Z"></path> <path d="M39.4,16,37.3,6.2A4,4,0,0,0,33.4,3H29.1a3.9,3.9,0,0,0-3.4,1.9L24,7.8,22.3,4.9A3.9,3.9,0,0,0,18.9,3H14.6a4,4,0,0,0-3.9,3.2L8.6,16C4.5,17.3,2,19,2,21c0,3.9,9.8,7,22,7s22-3.1,22-7C46,19,43.5,17.3,39.4,16Z"></path> </g> </g> </g> </g></svg>',
					type: ModType.Toggle,
					value: this.kxsClient.kxsNetworkSettings.nickname_anonymized,
					onChange: () => {
						this.kxsClient.kxsNetworkSettings.nickname_anonymized = !this.kxsClient.kxsNetworkSettings.nickname_anonymized;
						this.kxsClient.updateLocalStorage();
					}
				},
				{
					label: "Voice Chat",
					value: this.kxsClient.isVoiceChatEnabled,
					icon: '<svg fill="#000000" viewBox="0 0 32 32" id="icon" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <defs> <style> .cls-1 { fill: none; } </style> </defs> <path d="M26,30H24V27H20a5.0055,5.0055,0,0,1-5-5V20.7207l-2.3162-.772a1,1,0,0,1-.5412-1.4631L15,13.7229V11a9.01,9.01,0,0,1,9-9h5V4H24a7.0078,7.0078,0,0,0-7,7v3a.9991.9991,0,0,1-.1426.5144l-2.3586,3.9312,1.8174.6057A1,1,0,0,1,17,20v2a3.0033,3.0033,0,0,0,3,3h5a1,1,0,0,1,1,1Z"></path> <rect x="19" y="12" width="4" height="2"></rect> <path d="M9.3325,25.2168a7.0007,7.0007,0,0,1,0-10.4341l1.334,1.49a5,5,0,0,0,0,7.4537Z"></path> <path d="M6.3994,28.8008a11.0019,11.0019,0,0,1,0-17.6006L7.6,12.8a9.0009,9.0009,0,0,0,0,14.4014Z"></path> <rect id="_Transparent_Rectangle_" data-name="<Transparent Rectangle>" class="cls-1" width="32" height="32"></rect> </g></svg>',
					type: ModType.Toggle,
					onChange: () => {
						this.kxsClient.isVoiceChatEnabled = !this.kxsClient.isVoiceChatEnabled;
						this.kxsClient.updateLocalStorage();
						this.kxsClient.voiceChat.toggleVoiceChat();
					},
				},
				{
					label: "Chat",
					value: this.kxsClient.isKxsChatEnabled,
					icon: '<svg fill="#000000" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <path d="M232.727,238.545v186.182H281.6l-13.964,69.818l97.745-69.818H512V238.545H232.727z M477.091,389.818H365.382h-11.187 l-9.103,6.502l-25.912,18.508l5.003-25.01H281.6h-13.964V273.455h209.455V389.818z"></path> </g> </g> <g> <g> <path d="M279.273,17.455H0v186.182h65.164l97.745,69.818l-13.964-69.818h130.327V17.455z M244.364,168.727h-95.418h-42.582 l5.003,25.01L85.455,175.23l-9.104-6.502H65.164H34.909V52.364h209.455V168.727z"></path> </g> </g> <g> <g> <rect x="180.364" y="93.091" width="34.909" height="34.909"></rect> </g> </g> <g> <g> <rect x="122.182" y="93.091" width="34.909" height="34.909"></rect> </g> </g> <g> <g> <rect x="64" y="93.091" width="34.909" height="34.909"></rect> </g> </g> <g> <g> <rect x="413.091" y="314.182" width="34.909" height="34.909"></rect> </g> </g> <g> <g> <rect x="354.909" y="314.182" width="34.909" height="34.909"></rect> </g> </g> <g> <g> <rect x="296.727" y="314.182" width="34.909" height="34.909"></rect> </g> </g> </g></svg>',
					type: ModType.Toggle,
					onChange: () => {
						this.kxsClient.isKxsChatEnabled = !this.kxsClient.isKxsChatEnabled;
						this.kxsClient.updateLocalStorage();
						this.kxsClient.chat.toggleChat();
					},
				}
			],
		})

		this.addOption(MISC, {
			label: "Game History",
			value: true,
			icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M5.52786 16.7023C6.6602 18.2608 8.3169 19.3584 10.1936 19.7934C12.0703 20.2284 14.0409 19.9716 15.7434 19.0701C17.446 18.1687 18.766 16.6832 19.4611 14.8865C20.1562 13.0898 20.1796 11.1027 19.527 9.29011C18.8745 7.47756 17.5898 5.96135 15.909 5.02005C14.2282 4.07875 12.2641 3.77558 10.3777 4.16623C8.49129 4.55689 6.80919 5.61514 5.64045 7.14656C4.47171 8.67797 3.89482 10.5797 4.01579 12.5023M4.01579 12.5023L2.51579 11.0023M4.01579 12.5023L5.51579 11.0023" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M12 8V12L15 15" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>',
			type: ModType.Click,
			onChange: () => {
				this.kxsClient.historyManager.show();
			}
		})

		this.addOption(MECHANIC, {
			label: "Win sound",
			value: true,
			type: ModType.Sub,
			icon: '<svg fill="#000000" version="1.1" id="Trophy_x5F_cup" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 256 256" enable-background="new 0 0 256 256" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M190.878,111.272c31.017-11.186,53.254-40.907,53.254-75.733l-0.19-8.509h-48.955V5H64.222v22.03H15.266l-0.19,8.509 c0,34.825,22.237,64.546,53.254,75.733c7.306,18.421,22.798,31.822,41.878,37.728v20c-0.859,15.668-14.112,29-30,29v18h-16v35H195 v-35h-16v-18c-15.888,0-29.141-13.332-30-29v-20C168.08,143.094,183.572,129.692,190.878,111.272z M195,44h30.563 c-0.06,0.427-0.103,1.017-0.171,1.441c-3.02,18.856-14.543,34.681-30.406,44.007C195.026,88.509,195,44,195,44z M33.816,45.441 c-0.068-0.424-0.111-1.014-0.171-1.441h30.563c0,0-0.026,44.509,0.013,45.448C48.359,80.122,36.837,64.297,33.816,45.441z M129.604,86.777l-20.255,13.52l6.599-23.442L96.831,61.77l24.334-0.967l8.44-22.844l8.44,22.844l24.334,0.967L143.26,76.856 l6.599,23.442L129.604,86.777z"></path> </g></svg>',
			fields: [
				{
					label: "Enable",
					value: this.kxsClient.isWinSoundEnabled,
					icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M3 11V13M6 10V14M9 11V13M12 9V15M15 6V18M18 10V14M21 11V13" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>',
					type: ModType.Toggle,
					onChange: () => {
						this.kxsClient.isWinSoundEnabled = !this.kxsClient.isWinSoundEnabled
						this.kxsClient.updateLocalStorage()
					},
				},
				{
					label: "Sound URL",
					value: this.kxsClient.soundLibrary.win_sound_url,
					icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M3 11V13M6 10V14M9 11V13M12 9V15M15 6V18M18 10V14M21 11V13" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>',
					type: ModType.Input,
					placeholder: "URL of a sound",
					onChange: (value) => {
						this.kxsClient.soundLibrary.win_sound_url = value as string;
						this.kxsClient.updateLocalStorage();
					}
				}
			]
		});

		this.addOption(MECHANIC, {
			label: "Death sound",
			value: true,
			type: ModType.Sub,
			icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M19 21C19 21.5523 18.5523 22 18 22H14H10H6C5.44771 22 5 21.5523 5 21V18.75C5 17.7835 4.2165 17 3.25 17C2.55964 17 2 16.4404 2 15.75V11C2 5.47715 6.47715 1 12 1C17.5228 1 22 5.47715 22 11V15.75C22 16.4404 21.4404 17 20.75 17C19.7835 17 19 17.7835 19 18.75V21ZM17 20V18.75C17 16.9358 18.2883 15.4225 20 15.075V11C20 6.58172 16.4183 3 12 3C7.58172 3 4 6.58172 4 11V15.075C5.71168 15.4225 7 16.9358 7 18.75V20H9V18C9 17.4477 9.44771 17 10 17C10.5523 17 11 17.4477 11 18V20H13V18C13 17.4477 13.4477 17 14 17C14.5523 17 15 17.4477 15 18V20H17ZM11 12.5C11 13.8807 8.63228 15 7.25248 15C5.98469 15 5.99206 14.055 6.00161 12.8306V12.8305C6.00245 12.7224 6.00331 12.6121 6.00331 12.5C6.00331 11.1193 7.12186 10 8.50166 10C9.88145 10 11 11.1193 11 12.5ZM17.9984 12.8306C17.9975 12.7224 17.9967 12.6121 17.9967 12.5C17.9967 11.1193 16.8781 10 15.4983 10C14.1185 10 13 11.1193 13 12.5C13 13.8807 15.3677 15 16.7475 15C18.0153 15 18.0079 14.055 17.9984 12.8306Z" fill="#000000"></path> </g></svg>',
			fields: [
				{
					label: "Enable",
					value: this.kxsClient.isDeathSoundEnabled,

					icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M3 11V13M6 10V14M9 11V13M12 9V15M15 6V18M18 10V14M21 11V13" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>',
					type: ModType.Toggle,
					onChange: () => {
						this.kxsClient.isDeathSoundEnabled = !this.kxsClient.isDeathSoundEnabled
						this.kxsClient.updateLocalStorage()
					},
				},
				{
					label: "Sound URL",
					value: this.kxsClient.soundLibrary.death_sound_url,
					icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M3 11V13M6 10V14M9 11V13M12 9V15M15 12V18M15 6V8M18 10V14M21 11V13" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>',
					type: ModType.Input,
					placeholder: "URL of a sound",
					onChange: (value) => {
						this.kxsClient.soundLibrary.death_sound_url = value as string;
						this.kxsClient.updateLocalStorage();
					}
				}
			]
		});

		this.addOption(MECHANIC, {
			label: "Background Music",
			value: this.kxsClient.soundLibrary.background_sound_url,
			type: ModType.Input,
			icon: '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M15 1H4V9H3C1.34315 9 0 10.3431 0 12C0 13.6569 1.34315 15 3 15C4.65685 15 6 13.6569 6 12V5H13V9H12C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12V1Z" fill="#000000"></path> </g></svg>',
			placeholder: background_song,
			onChange: (value) => {
				this.kxsClient.soundLibrary.background_sound_url = value as string
				this.kxsClient.updateLocalStorage();
			},
		});


		this.addOption(HUD, {
			label: "Clean Main Menu",
			value: this.kxsClient.isMainMenuCleaned,
			icon: '<svg fill="#000000" viewBox="0 0 32 32" id="icon" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <defs> <style> .cls-1 { fill: none; } </style> </defs> <title>clean</title> <rect x="20" y="18" width="6" height="2" transform="translate(46 38) rotate(-180)"></rect> <rect x="24" y="26" width="6" height="2" transform="translate(54 54) rotate(-180)"></rect> <rect x="22" y="22" width="6" height="2" transform="translate(50 46) rotate(-180)"></rect> <path d="M17.0029,20a4.8952,4.8952,0,0,0-2.4044-4.1729L22,3,20.2691,2,12.6933,15.126A5.6988,5.6988,0,0,0,7.45,16.6289C3.7064,20.24,3.9963,28.6821,4.01,29.04a1,1,0,0,0,1,.96H20.0012a1,1,0,0,0,.6-1.8C17.0615,25.5439,17.0029,20.0537,17.0029,20ZM11.93,16.9971A3.11,3.11,0,0,1,15.0041,20c0,.0381.0019.208.0168.4688L9.1215,17.8452A3.8,3.8,0,0,1,11.93,16.9971ZM15.4494,28A5.2,5.2,0,0,1,14,25H12a6.4993,6.4993,0,0,0,.9684,3H10.7451A16.6166,16.6166,0,0,1,10,24H8a17.3424,17.3424,0,0,0,.6652,4H6c.031-1.8364.29-5.8921,1.8027-8.5527l7.533,3.35A13.0253,13.0253,0,0,0,17.5968,28Z"></path> <rect id="_Transparent_Rectangle_" data-name="<Transparent Rectangle>" class="cls-1" width="32" height="32"></rect> </g></svg>',
			type: ModType.Toggle,
			onChange: (value) => {
				this.kxsClient.isMainMenuCleaned = !this.kxsClient.isMainMenuCleaned
				this.kxsClient.MainMenuCleaning();
				this.kxsClient.updateLocalStorage()
			},
		});

		this.addOption(HUD, {
			label: "Counters",
			value: true,
			type: ModType.Sub,
			icon: '<svg fill="#000000" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M 13.1640 4.6562 L 43.3280 4.6562 C 43.1874 2.6875 42.0624 1.6328 39.9062 1.6328 L 16.5858 1.6328 C 14.4296 1.6328 13.3046 2.6875 13.1640 4.6562 Z M 8.1015 11.1484 L 47.9454 11.1484 C 47.5936 9.0156 46.5625 7.8438 44.2187 7.8438 L 11.8046 7.8438 C 9.4609 7.8438 8.4531 9.0156 8.1015 11.1484 Z M 10.2343 54.3672 L 45.7888 54.3672 C 50.6641 54.3672 53.1251 51.9297 53.1251 47.1016 L 53.1251 22.2109 C 53.1251 17.3828 50.6641 14.9453 45.7888 14.9453 L 10.2343 14.9453 C 5.3358 14.9453 2.8749 17.3594 2.8749 22.2109 L 2.8749 47.1016 C 2.8749 51.9297 5.3358 54.3672 10.2343 54.3672 Z"></path></g></svg>',
			fields: [
				{
					label: "Show Kills",
					value: this.kxsClient.isKillsVisible,
					type: ModType.Toggle,

					icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M14.7245 11.2754L16 12.4999L10.0129 17.8218C8.05054 19.5661 5.60528 20.6743 3 20.9999L3.79443 19.5435C4.6198 18.0303 5.03249 17.2737 5.50651 16.5582C5.92771 15.9224 6.38492 15.3113 6.87592 14.7278C7.42848 14.071 8.0378 13.4615 9.25644 12.2426L12 9.49822M11.5 8.99787L17.4497 3.04989C18.0698 2.42996 19.0281 2.3017 19.7894 2.73674C20.9027 3.37291 21.1064 4.89355 20.1997 5.80024L19.8415 6.15847C19.6228 6.3771 19.3263 6.49992 19.0171 6.49992H18L16 8.49992V8.67444C16 9.16362 16 9.40821 15.9447 9.63839C15.8957 9.84246 15.8149 10.0375 15.7053 10.2165C15.5816 10.4183 15.4086 10.5913 15.0627 10.9372L14.2501 11.7498L11.5 8.99787Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>',
					onChange: (value) => {
						this.kxsClient.isKillsVisible = !this.kxsClient.isKillsVisible
						this.kxsClient.updateKillsVisibility()
						this.kxsClient.updateLocalStorage()
					},
				},
				{
					label: "Show FPS",
					value: this.kxsClient.isFpsVisible,

					type: ModType.Toggle,
					icon: '<svg fill="#000000" viewBox="0 0 24 24" id="60fps" data-name="Flat Line" xmlns="http://www.w3.org/2000/svg" class="icon flat-line"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><rect id="primary" x="10.5" y="8.5" width="14" height="7" rx="1" transform="translate(5.5 29.5) rotate(-90)" style="fill: none; stroke: #000000; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2;"></rect><path id="primary-2" data-name="primary" d="M3,12H9a1,1,0,0,1,1,1v5a1,1,0,0,1-1,1H4a1,1,0,0,1-1-1V6A1,1,0,0,1,4,5h6" style="fill: none; stroke: #000000; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2;"></path></g></svg>',
					onChange: (value) => {
						this.kxsClient.isFpsVisible = !this.kxsClient.isFpsVisible
						this.kxsClient.updateFpsVisibility()
						this.kxsClient.updateLocalStorage()
					},
				},
				{
					label: "Show Ping",
					value: this.kxsClient.isPingVisible,

					icon: '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><defs><style>.a{fill:none;stroke:#000000;stroke-linecap:round;stroke-linejoin:round;}</style></defs><path class="a" d="M34.6282,24.0793a14.7043,14.7043,0,0,0-22.673,1.7255"></path><path class="a" d="M43.5,20.5846a23.8078,23.8078,0,0,0-39,0"></path><path class="a" d="M43.5,20.5845,22.0169,29.0483a5.5583,5.5583,0,1,0,6.2116,8.7785l.0153.0206Z"></path></g></svg>',
					type: ModType.Toggle,
					onChange: (value) => {
						this.kxsClient.isPingVisible = !this.kxsClient.isPingVisible
						this.kxsClient.updatePingVisibility()
						this.kxsClient.updateLocalStorage()
					},
				}
			],
		})

		this.addOption(HUD, {
			label: "Weapon Border",
			value: this.kxsClient.isGunOverlayColored,
			type: ModType.Toggle,
			icon: '<svg fill="#000000" height="200px" width="200px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <path d="M363.929,0l-12.346,12.346L340.036,0.799l-21.458,21.458l11.547,11.547L107.782,256.147L96.235,244.6l-21.458,21.458 l11.863,11.863c-17.171,21.661-18.478,51.842-3.925,74.805L399.683,35.755L363.929,0z"></path> </g> </g> <g> <g> <path d="M304.934,330.282c27.516-27.516,29.126-71.268,4.845-100.695l129.522-129.523l-30.506-30.506L115.402,362.954 l30.506,30.506l16.191-16.191L259.625,512l84.679-84.679l-57.279-79.13L304.934,330.282z M269.003,323.296l-18.666-25.788 l-3.561-4.919l5.696-5.696l15.814,15.814l21.458-21.458l-15.814-15.814l14.228-14.228c12.546,17.432,10.985,41.949-4.683,57.617 L269.003,323.296z"></path> </g> </g> </g></svg>',
			onChange: (value) => {
				this.kxsClient.isGunOverlayColored = !this.kxsClient.isGunOverlayColored
				this.kxsClient.updateLocalStorage()
				this.kxsClient.hud.toggleWeaponBorderHandler()
			},
		});

		this.addOption(HUD, {
			label: "Chromatic Weapon Border",
			value: this.kxsClient.isGunBorderChromatic,

			type: ModType.Toggle,
			icon: '<svg fill="#000000" height="200px" width="200px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <path d="M256.005,13.477c-84.682,0-153.734,68.227-155.075,152.594c0.535-0.164,1.073-0.318,1.61-0.477 c0.341-0.101,0.681-0.204,1.022-0.303c1.366-0.398,2.733-0.781,4.107-1.146c0.166-0.043,0.331-0.084,0.497-0.127 c1.214-0.318,2.43-0.623,3.651-0.917c0.389-0.094,0.777-0.186,1.167-0.276c1.147-0.268,2.296-0.526,3.448-0.771 c0.253-0.055,0.506-0.112,0.76-0.166c1.377-0.288,2.757-0.557,4.139-0.813c0.347-0.064,0.695-0.124,1.044-0.186 c1.091-0.195,2.183-0.38,3.278-0.555c0.385-0.062,0.769-0.124,1.154-0.184c1.396-0.214,2.793-0.417,4.195-0.599 c0.112-0.014,0.225-0.026,0.337-0.041c1.298-0.167,2.599-0.316,3.902-0.454c0.404-0.042,0.808-0.084,1.213-0.124 c1.139-0.113,2.278-0.216,3.42-0.309c0.303-0.024,0.605-0.052,0.907-0.076c1.408-0.106,2.818-0.197,4.231-0.271 c0.333-0.018,0.668-0.03,1.001-0.045c1.128-0.054,2.258-0.097,3.389-0.13c0.402-0.012,0.803-0.024,1.205-0.033 c1.43-0.032,2.863-0.055,4.297-0.055c1.176,0,2.351,0.013,3.525,0.036c0.389,0.007,0.778,0.022,1.167,0.032 c0.787,0.02,1.574,0.041,2.361,0.072c0.46,0.018,0.921,0.042,1.382,0.064c0.715,0.033,1.429,0.067,2.144,0.108 c0.487,0.028,0.974,0.062,1.462,0.094c0.689,0.045,1.379,0.093,2.068,0.146c0.497,0.038,0.993,0.081,1.49,0.123 c0.68,0.059,1.36,0.119,2.039,0.186c0.497,0.047,0.993,0.098,1.49,0.149c0.684,0.072,1.368,0.148,2.051,0.228 c0.487,0.057,0.973,0.113,1.46,0.174c0.701,0.087,1.402,0.181,2.102,0.276c0.464,0.064,0.929,0.125,1.393,0.191 c0.74,0.106,1.479,0.221,2.218,0.336c0.423,0.066,0.846,0.128,1.269,0.198c0.85,0.138,1.698,0.287,2.546,0.437 c0.307,0.055,0.616,0.105,0.923,0.16c1.166,0.212,2.33,0.435,3.49,0.67c0.07,0.014,0.138,0.03,0.208,0.043 c1.082,0.22,2.161,0.449,3.239,0.688c0.352,0.078,0.704,0.163,1.055,0.242c0.793,0.181,1.588,0.362,2.379,0.554 c0.421,0.102,0.841,0.209,1.262,0.314c0.722,0.18,1.442,0.36,2.162,0.548c0.446,0.116,0.89,0.237,1.335,0.357 c0.693,0.187,1.387,0.377,2.078,0.57c0.453,0.127,0.906,0.258,1.359,0.39c0.683,0.198,1.367,0.4,2.048,0.606 c0.451,0.136,0.902,0.273,1.353,0.414c0.685,0.212,1.369,0.43,2.051,0.651c0.439,0.141,0.878,0.283,1.316,0.428 c0.703,0.232,1.402,0.471,2.101,0.712c0.414,0.142,0.828,0.283,1.24,0.427c0.747,0.262,1.491,0.534,2.235,0.805 c0.36,0.132,0.722,0.26,1.081,0.395c0.887,0.331,1.771,0.671,2.654,1.015c0.212,0.083,0.425,0.161,0.636,0.245 c1.108,0.437,2.212,0.884,3.313,1.342c0.125,0.052,0.249,0.107,0.374,0.16c0.958,0.401,1.913,0.81,2.865,1.226 c0.329,0.144,0.656,0.295,0.985,0.441c0.744,0.332,1.487,0.665,2.227,1.006c0.391,0.181,0.779,0.365,1.169,0.548 c0.673,0.316,1.345,0.634,2.015,0.959c0.417,0.202,0.832,0.408,1.248,0.613c0.64,0.316,1.278,0.634,1.914,0.957 c0.425,0.216,0.849,0.435,1.273,0.654c0.625,0.323,1.248,0.65,1.868,0.981c0.424,0.226,0.847,0.452,1.269,0.68 c0.621,0.336,1.239,0.678,1.856,1.021c0.413,0.23,0.826,0.459,1.237,0.692c0.63,0.357,1.257,0.721,1.882,1.086 c0.392,0.228,0.784,0.454,1.174,0.685c0.664,0.394,1.323,0.795,1.982,1.197c0.344,0.21,0.69,0.417,1.034,0.629 c0.803,0.498,1.601,1.003,2.396,1.513c0.118,0.076,0.237,0.148,0.355,0.224l0.297-0.218l0.297,0.218 c0.118-0.076,0.237-0.148,0.355-0.224c0.795-0.51,1.593-1.015,2.396-1.513c0.343-0.212,0.689-0.419,1.034-0.629 c0.659-0.402,1.318-0.803,1.982-1.197c0.39-0.231,0.782-0.457,1.174-0.685c0.626-0.365,1.253-0.729,1.882-1.086 c0.411-0.233,0.824-0.462,1.236-0.692c0.617-0.343,1.235-0.685,1.856-1.021c0.422-0.229,0.845-0.455,1.268-0.68 c0.622-0.331,1.246-0.658,1.871-0.982c0.422-0.218,0.845-0.436,1.269-0.652c0.637-0.323,1.276-0.642,1.917-0.959 c0.415-0.205,0.83-0.41,1.247-0.612c0.669-0.324,1.341-0.642,2.015-0.959c0.39-0.183,0.778-0.368,1.169-0.548 c0.74-0.341,1.483-0.674,2.227-1.006c0.328-0.146,0.655-0.296,0.985-0.441c0.951-0.418,1.907-0.826,2.865-1.226 c0.125-0.052,0.249-0.108,0.374-0.16c1.1-0.458,2.203-0.905,3.313-1.342c0.211-0.084,0.425-0.162,0.636-0.245 c0.882-0.344,1.766-0.685,2.654-1.015c0.359-0.134,0.721-0.262,1.081-0.395c0.744-0.273,1.488-0.543,2.235-0.805 c0.413-0.145,0.827-0.286,1.24-0.427c0.699-0.24,1.399-0.479,2.102-0.712c0.438-0.145,0.877-0.287,1.316-0.428 c0.683-0.221,1.367-0.438,2.051-0.651c0.45-0.139,0.901-0.277,1.353-0.414c0.681-0.206,1.364-0.407,2.048-0.606 c0.452-0.131,0.905-0.261,1.359-0.39c0.691-0.195,1.385-0.384,2.078-0.57c0.445-0.12,0.89-0.24,1.335-0.357 c0.72-0.189,1.44-0.369,2.162-0.548c0.421-0.105,0.841-0.212,1.262-0.314c0.791-0.191,1.585-0.373,2.379-0.554 c0.352-0.081,0.703-0.164,1.055-0.242c1.078-0.239,2.157-0.468,3.239-0.688c0.07-0.014,0.138-0.029,0.208-0.043 c1.162-0.234,2.325-0.457,3.49-0.67c0.307-0.057,0.615-0.106,0.922-0.161c0.848-0.149,1.697-0.298,2.548-0.437 c0.422-0.069,0.844-0.131,1.266-0.197c0.739-0.115,1.479-0.23,2.219-0.336c0.463-0.067,0.928-0.128,1.392-0.191 c0.701-0.095,1.401-0.189,2.103-0.276c0.487-0.061,0.973-0.117,1.461-0.174c0.682-0.08,1.366-0.155,2.05-0.228 c0.497-0.051,0.993-0.102,1.49-0.149c0.679-0.066,1.359-0.127,2.039-0.186c0.497-0.042,0.993-0.085,1.49-0.123 c0.688-0.054,1.378-0.101,2.068-0.146c0.487-0.032,0.974-0.066,1.462-0.094c0.715-0.042,1.429-0.076,2.144-0.108 c0.46-0.021,0.921-0.045,1.382-0.064c0.786-0.03,1.574-0.051,2.361-0.072c0.389-0.01,0.778-0.024,1.167-0.032 c1.175-0.023,2.35-0.036,3.525-0.036c1.435,0,2.867,0.022,4.297,0.055c0.402,0.009,0.803,0.021,1.205,0.033 c1.132,0.033,2.261,0.077,3.388,0.13c0.334,0.016,0.668,0.028,1.002,0.045c1.413,0.075,2.823,0.166,4.23,0.272 c0.303,0.023,0.605,0.051,0.907,0.076c1.142,0.093,2.282,0.195,3.42,0.309c0.405,0.04,0.808,0.081,1.213,0.124 c1.303,0.138,2.604,0.288,3.902,0.454c0.112,0.015,0.225,0.026,0.337,0.041c1.401,0.182,2.799,0.385,4.194,0.599 c0.386,0.06,0.77,0.122,1.156,0.184c1.094,0.175,2.186,0.36,3.277,0.555c0.348,0.063,0.696,0.122,1.044,0.186 c1.383,0.255,2.763,0.526,4.139,0.813c0.253,0.054,0.507,0.111,0.76,0.166c1.152,0.245,2.3,0.503,3.448,0.771 c0.39,0.091,0.778,0.183,1.167,0.276c1.218,0.294,2.435,0.598,3.648,0.915c0.167,0.043,0.334,0.084,0.501,0.128 c1.373,0.364,2.74,0.749,4.106,1.145c0.341,0.1,0.681,0.203,1.022,0.304c0.537,0.159,1.074,0.314,1.61,0.477 C409.734,81.704,340.686,13.477,256.005,13.477z"></path> </g> </g> <g> <g> <path d="M436.614,210.342c-0.136,0.588-0.291,1.172-0.433,1.758c-0.163,0.671-0.325,1.341-0.495,2.01 c-0.317,1.249-0.651,2.49-0.993,3.73c-0.161,0.585-0.317,1.174-0.484,1.757c-0.482,1.682-0.986,3.354-1.515,5.017 c-0.039,0.124-0.075,0.25-0.114,0.374c-0.571,1.784-1.175,3.555-1.8,5.318c-0.197,0.554-0.406,1.103-0.608,1.655 c-0.442,1.21-0.891,2.417-1.358,3.617c-0.253,0.652-0.515,1.3-0.775,1.948c-0.445,1.108-0.9,2.211-1.367,3.309 c-0.277,0.652-0.555,1.304-0.84,1.953c-0.497,1.133-1.008,2.258-1.527,3.379c-0.268,0.579-0.53,1.161-0.803,1.738 c-0.687,1.446-1.395,2.883-2.119,4.31c-0.118,0.233-0.229,0.469-0.348,0.701c-0.843,1.644-1.713,3.273-2.603,4.89 c-0.286,0.52-0.584,1.032-0.875,1.548c-0.624,1.107-1.254,2.211-1.9,3.306c-0.358,0.607-0.724,1.209-1.089,1.811 c-0.61,1.007-1.228,2.008-1.857,3.003c-0.383,0.607-0.767,1.211-1.158,1.813c-0.659,1.016-1.331,2.023-2.01,3.027 c-0.368,0.544-0.731,1.091-1.104,1.63c-0.867,1.254-1.753,2.495-2.652,3.727c-0.196,0.268-0.384,0.542-0.579,0.808 c-1.093,1.483-2.21,2.946-3.346,4.397c-0.357,0.455-0.725,0.902-1.086,1.354c-0.801,1.003-1.608,2.001-2.43,2.987 c-0.449,0.54-0.906,1.073-1.362,1.608c-0.763,0.895-1.534,1.785-2.314,2.666c-0.477,0.539-0.956,1.076-1.439,1.609 c-0.811,0.894-1.633,1.778-2.462,2.658c-0.455,0.482-0.905,0.968-1.367,1.446c-1.03,1.07-2.075,2.123-3.131,3.168 c-0.268,0.265-0.529,0.537-0.798,0.8c-1.322,1.293-2.666,2.565-4.027,3.819c-0.409,0.377-0.827,0.742-1.24,1.115 c-0.973,0.881-1.952,1.756-2.945,2.617c-0.526,0.456-1.059,0.905-1.591,1.356c-0.909,0.771-1.825,1.534-2.75,2.288 c-0.557,0.454-1.117,0.906-1.681,1.355c-0.951,0.757-1.912,1.502-2.879,2.241c-0.532,0.406-1.06,0.817-1.596,1.217 c-1.172,0.876-2.359,1.734-3.554,2.584c-0.337,0.239-0.667,0.487-1.005,0.724c-1.528,1.071-3.076,2.119-4.638,3.145 c-0.451,0.296-0.911,0.581-1.367,0.874c-1.131,0.729-2.268,1.45-3.417,2.156c-0.598,0.366-1.202,0.725-1.804,1.085 c-1.034,0.618-2.073,1.228-3.121,1.828c-0.635,0.363-1.272,0.724-1.913,1.08c-1.067,0.592-2.142,1.173-3.222,1.746 c-0.61,0.323-1.217,0.651-1.832,0.968c-0.13,0.067-0.258,0.138-0.389,0.205l0.04,0.361l-0.333,0.146 c0.008,0.161,0.01,0.322,0.018,0.483c0.03,0.645,0.049,1.289,0.073,1.935c0.046,1.27,0.083,2.539,0.103,3.808 c0.011,0.696,0.017,1.392,0.02,2.088c0.005,1.247-0.004,2.491-0.023,3.736c-0.01,0.67-0.018,1.34-0.036,2.01 c-0.037,1.388-0.095,2.772-0.164,4.156c-0.025,0.505-0.04,1.009-0.069,1.514c-0.108,1.877-0.242,3.752-0.407,5.621 c-0.033,0.382-0.079,0.761-0.115,1.143c-0.14,1.488-0.294,2.973-0.469,4.454c-0.078,0.656-0.168,1.31-0.252,1.965 c-0.157,1.214-0.323,2.427-0.505,3.638c-0.106,0.708-0.217,1.414-0.331,2.121c-0.191,1.18-0.395,2.356-0.608,3.531 c-0.124,0.685-0.247,1.372-0.379,2.056c-0.247,1.283-0.515,2.56-0.788,3.836c-0.119,0.553-0.229,1.109-0.353,1.661 c-0.405,1.801-0.833,3.595-1.29,5.382c-0.099,0.388-0.21,0.771-0.312,1.157c-0.371,1.412-0.754,2.821-1.158,4.224 c-0.189,0.654-0.389,1.304-0.584,1.956c-0.342,1.139-0.69,2.275-1.054,3.407c-0.225,0.699-0.455,1.397-0.687,2.093 c-0.366,1.097-0.745,2.19-1.132,3.28c-0.242,0.681-0.482,1.363-0.732,2.04c-0.431,1.172-0.88,2.337-1.334,3.498 c-0.223,0.571-0.438,1.145-0.667,1.713c-0.682,1.696-1.387,3.383-2.119,5.058c-0.155,0.356-0.323,0.707-0.48,1.062 c-0.596,1.339-1.201,2.673-1.828,3.998c-0.295,0.622-0.601,1.238-0.901,1.857c-0.515,1.059-1.036,2.114-1.571,3.162 c-0.338,0.662-0.681,1.321-1.028,1.979c-0.532,1.012-1.074,2.02-1.625,3.023c-0.353,0.643-0.706,1.286-1.066,1.925 c-0.605,1.071-1.225,2.132-1.851,3.192c-0.321,0.543-0.635,1.091-0.962,1.631c-0.948,1.567-1.915,3.122-2.908,4.661 c-0.177,0.274-0.363,0.542-0.542,0.815c-0.839,1.284-1.691,2.561-2.562,3.824c-0.38,0.55-0.77,1.093-1.156,1.64 c-0.694,0.985-1.395,1.965-2.109,2.936c-0.432,0.587-0.87,1.171-1.309,1.753c-0.703,0.934-1.417,1.861-2.139,2.782 c-0.443,0.566-0.886,1.131-1.336,1.693c-0.787,0.981-1.59,1.951-2.398,2.917c-0.395,0.472-0.783,0.949-1.184,1.417 c-1.207,1.413-2.433,2.813-3.684,4.192c-0.119,0.131-0.243,0.257-0.362,0.389c-1.146,1.255-2.309,2.494-3.491,3.718 c-0.434,0.45-0.879,0.891-1.318,1.337c-0.889,0.903-1.785,1.8-2.694,2.686c-0.503,0.49-1.01,0.974-1.519,1.458 c-0.433,0.412-0.856,0.833-1.293,1.24c23.044,12.82,49.005,19.586,75.238,19.589c0.002,0,0.006,0,0.008,0 c26.778,0,53.256-6.96,76.576-20.133c24-13.557,44.018-33.419,57.887-57.44C533.598,347.601,509.03,253.68,436.614,210.342z"></path> </g> </g> <g> <g> <path d="M357.097,188.296c-26.339,0-52.539,6.858-75.519,19.563c0.206,0.192,0.401,0.394,0.605,0.585 c1.334,1.256,2.652,2.526,3.946,3.82c0.146,0.146,0.298,0.289,0.443,0.435c1.417,1.426,2.803,2.881,4.172,4.352 c0.372,0.4,0.74,0.804,1.108,1.208c1.12,1.225,2.224,2.466,3.311,3.723c0.272,0.314,0.548,0.623,0.818,0.939 c1.302,1.527,2.579,3.077,3.831,4.647c0.299,0.374,0.589,0.754,0.885,1.13c1.013,1.291,2.011,2.596,2.991,3.915 c0.303,0.408,0.61,0.814,0.909,1.224c1.192,1.632,2.364,3.283,3.505,4.959c0.19,0.278,0.372,0.562,0.56,0.842 c0.973,1.444,1.926,2.906,2.861,4.382c0.296,0.466,0.59,0.933,0.882,1.402c1.085,1.746,2.154,3.505,3.187,5.294 c0.721,1.249,1.421,2.506,2.112,3.767c0.195,0.355,0.387,0.712,0.578,1.068c0.539,0.999,1.068,2.003,1.588,3.009 c0.154,0.3,0.313,0.599,0.465,0.899c0.645,1.265,1.275,2.536,1.888,3.812c0.133,0.278,0.262,0.556,0.394,0.835 c0.493,1.036,0.974,2.076,1.446,3.12c0.169,0.372,0.337,0.745,0.503,1.118c0.536,1.205,1.061,2.413,1.57,3.627 c0.042,0.101,0.087,0.201,0.129,0.302c0.547,1.31,1.073,2.627,1.589,3.949c0.141,0.36,0.279,0.723,0.417,1.085 c0.399,1.042,0.788,2.087,1.168,3.135c0.12,0.331,0.242,0.661,0.36,0.993c0.472,1.328,0.932,2.663,1.374,4.001 c0.082,0.246,0.157,0.495,0.238,0.741c0.364,1.119,0.717,2.243,1.06,3.369c0.118,0.389,0.235,0.777,0.351,1.166 c0.354,1.194,0.697,2.391,1.028,3.592c0.048,0.175,0.1,0.349,0.147,0.525c0.37,1.364,0.721,2.732,1.06,4.104 c0.091,0.367,0.178,0.736,0.265,1.104c0.127,0.529,0.259,1.056,0.382,1.587c37.925-22.771,64.617-60.932,72.753-104.53 C391.963,191.252,374.736,188.296,357.097,188.296z"></path> </g> </g> <g> <g> <path d="M229.161,477.688c-0.508-0.483-1.014-0.967-1.516-1.455c-0.909-0.886-1.806-1.785-2.696-2.688 c-0.439-0.446-0.883-0.886-1.317-1.336c-1.182-1.224-2.346-2.464-3.491-3.718c-0.119-0.13-0.243-0.257-0.362-0.389 c-1.252-1.379-2.477-2.779-3.684-4.192c-0.4-0.468-0.788-0.946-1.184-1.417c-0.808-0.966-1.611-1.936-2.398-2.917 c-0.45-0.561-0.893-1.126-1.336-1.693c-0.722-0.922-1.435-1.848-2.139-2.782c-0.439-0.582-0.877-1.166-1.309-1.753 c-0.714-0.971-1.414-1.952-2.109-2.936c-0.386-0.547-0.776-1.089-1.156-1.64c-0.871-1.264-1.723-2.54-2.562-3.824 c-0.179-0.273-0.364-0.541-0.542-0.815c-0.994-1.539-1.962-3.096-2.91-4.662c-0.326-0.538-0.638-1.084-0.958-1.625 c-0.627-1.061-1.249-2.124-1.854-3.197c-0.36-0.639-0.713-1.282-1.066-1.924c-0.551-1.003-1.093-2.011-1.625-3.023 c-0.346-0.658-0.689-1.317-1.028-1.979c-0.535-1.049-1.056-2.104-1.571-3.162c-0.301-0.619-0.608-1.235-0.901-1.857 c-0.627-1.325-1.232-2.659-1.828-3.998c-0.157-0.355-0.325-0.706-0.48-1.062c-0.732-1.674-1.435-3.362-2.119-5.058 c-0.229-0.568-0.443-1.142-0.667-1.713c-0.454-1.162-0.903-2.327-1.334-3.498c-0.249-0.678-0.491-1.36-0.732-2.04 c-0.387-1.09-0.765-2.183-1.132-3.28c-0.232-0.696-0.463-1.394-0.687-2.093c-0.363-1.133-0.713-2.271-1.055-3.412 c-0.195-0.649-0.395-1.297-0.582-1.949c-0.405-1.404-0.788-2.814-1.16-4.228c-0.101-0.386-0.212-0.768-0.311-1.155 c-0.457-1.786-0.885-3.58-1.29-5.382c-0.124-0.552-0.234-1.108-0.353-1.661c-0.275-1.276-0.541-2.553-0.788-3.836 c-0.132-0.684-0.254-1.37-0.378-2.056c-0.213-1.175-0.417-2.351-0.608-3.531c-0.114-0.706-0.225-1.412-0.331-2.121 c-0.182-1.21-0.347-2.423-0.505-3.638c-0.085-0.655-0.175-1.308-0.252-1.965c-0.176-1.481-0.329-2.966-0.469-4.454 c-0.036-0.382-0.082-0.761-0.115-1.143c-0.164-1.869-0.299-3.744-0.407-5.621c-0.029-0.504-0.044-1.008-0.069-1.512 c-0.069-1.385-0.126-2.771-0.164-4.16c-0.018-0.667-0.025-1.335-0.036-2.004c-0.019-1.246-0.028-2.492-0.023-3.741 c0.003-0.695,0.009-1.391,0.02-2.087c0.02-1.269,0.057-2.539,0.103-3.808c0.023-0.645,0.042-1.289,0.073-1.935 c0.007-0.162,0.01-0.322,0.018-0.484l-0.333-0.146l0.04-0.361c-0.13-0.067-0.258-0.138-0.389-0.205 c-0.615-0.317-1.222-0.645-1.833-0.968c-1.081-0.573-2.157-1.154-3.224-1.747c-0.638-0.355-1.274-0.714-1.907-1.076 c-1.051-0.601-2.092-1.213-3.129-1.833c-0.601-0.358-1.202-0.716-1.798-1.081c-1.15-0.706-2.286-1.427-3.418-2.157 c-0.454-0.293-0.915-0.577-1.367-0.874c-1.563-1.025-3.109-2.072-4.636-3.143c-0.343-0.24-0.678-0.492-1.02-0.735 c-1.189-0.845-2.37-1.7-3.537-2.571c-0.54-0.403-1.071-0.816-1.606-1.224c-0.964-0.737-1.922-1.479-2.871-2.234 c-0.565-0.45-1.126-0.904-1.687-1.361c-0.921-0.751-1.833-1.511-2.738-2.278c-0.536-0.454-1.072-0.906-1.602-1.366 c-0.984-0.854-1.955-1.722-2.921-2.595c-0.421-0.38-0.849-0.755-1.266-1.14c-1.358-1.251-2.698-2.519-4.017-3.809 c-0.281-0.275-0.552-0.558-0.832-0.835c-1.044-1.034-2.078-2.075-3.097-3.133c-0.466-0.484-0.924-0.978-1.385-1.468 c-0.821-0.871-1.637-1.747-2.441-2.634c-0.489-0.539-0.973-1.082-1.456-1.626c-0.774-0.875-1.54-1.757-2.297-2.647 c-0.461-0.541-0.923-1.08-1.377-1.625c-0.814-0.977-1.612-1.965-2.405-2.958c-0.368-0.461-0.744-0.917-1.108-1.382 c-1.133-1.446-2.248-2.906-3.337-4.385c-0.21-0.284-0.41-0.574-0.617-0.86c-0.885-1.215-1.758-2.439-2.614-3.674 c-0.379-0.548-0.747-1.103-1.12-1.654c-0.672-0.995-1.339-1.993-1.992-3.001c-0.395-0.609-0.783-1.22-1.171-1.834 c-0.624-0.986-1.236-1.978-1.841-2.978c-0.369-0.609-0.739-1.216-1.1-1.83c-0.642-1.088-1.269-2.186-1.888-3.286 c-0.295-0.523-0.596-1.04-0.884-1.565c-0.889-1.615-1.758-3.241-2.6-4.883c-0.124-0.241-0.239-0.487-0.361-0.729 c-0.719-1.417-1.421-2.842-2.103-4.279c-0.278-0.584-0.543-1.174-0.815-1.76c-0.516-1.115-1.024-2.234-1.518-3.36 c-0.286-0.651-0.564-1.304-0.843-1.959c-0.466-1.098-0.922-2.201-1.367-3.309c-0.26-0.647-0.521-1.294-0.773-1.944 c-0.467-1.201-0.917-2.409-1.36-3.622c-0.201-0.551-0.41-1.099-0.606-1.652c-0.625-1.763-1.228-3.535-1.8-5.319 c-0.039-0.123-0.074-0.247-0.113-0.369c-0.53-1.666-1.035-3.343-1.518-5.027c-0.166-0.578-0.32-1.162-0.48-1.742 c-0.344-1.246-0.679-2.493-0.998-3.748c-0.169-0.662-0.329-1.326-0.491-1.991c-0.143-0.59-0.299-1.178-0.436-1.77 C2.971,253.679-21.598,347.601,20.747,420.946c13.866,24.018,33.884,43.88,57.888,57.436 c23.322,13.172,49.804,20.136,76.584,20.137c0.002,0,0.005,0,0.007,0c26.227,0,52.183-6.767,75.23-19.589 C230.018,478.523,229.594,478.101,229.161,477.688z"></path> </g> </g> <g> <g> <path d="M154.899,188.295c-17.638,0-34.866,2.956-51.358,8.799c8.136,43.599,34.828,81.76,72.749,104.53 c0.126-0.53,0.258-1.058,0.385-1.586c0.089-0.368,0.175-0.737,0.266-1.104c0.338-1.372,0.689-2.74,1.06-4.104 c0.047-0.176,0.099-0.349,0.147-0.525c0.33-1.201,0.673-2.398,1.028-3.592c0.115-0.39,0.233-0.778,0.351-1.166 c0.342-1.126,0.695-2.25,1.06-3.369c0.081-0.247,0.157-0.495,0.238-0.741c0.442-1.338,0.9-2.672,1.374-4.001 c0.118-0.332,0.24-0.662,0.36-0.993c0.38-1.049,0.769-2.093,1.168-3.135c0.138-0.361,0.276-0.724,0.417-1.085 c0.516-1.321,1.042-2.637,1.589-3.949c0.042-0.101,0.087-0.201,0.129-0.302c0.509-1.214,1.034-2.421,1.57-3.627 c0.166-0.373,0.334-0.746,0.503-1.118c0.472-1.044,0.955-2.083,1.446-3.12c0.132-0.278,0.26-0.557,0.394-0.835 c0.614-1.277,1.243-2.547,1.888-3.812c0.152-0.301,0.311-0.6,0.465-0.899c0.52-1.006,1.049-2.01,1.588-3.009 c0.192-0.356,0.384-0.713,0.578-1.068c0.69-1.262,1.391-2.518,2.112-3.767c1.033-1.789,2.102-3.548,3.187-5.294 c0.292-0.469,0.586-0.936,0.882-1.402c0.936-1.476,1.888-2.937,2.861-4.382c0.188-0.28,0.37-0.564,0.56-0.842 c1.142-1.676,2.312-3.327,3.505-4.959c0.3-0.411,0.606-0.817,0.909-1.224c0.98-1.32,1.977-2.625,2.991-3.915 c0.296-0.376,0.587-0.756,0.885-1.13c1.254-1.571,2.529-3.12,3.831-4.647c0.27-0.316,0.546-0.625,0.818-0.939 c1.087-1.257,2.19-2.497,3.311-3.722c0.368-0.403,0.736-0.807,1.108-1.208c1.369-1.472,2.755-2.926,4.172-4.352 c0.146-0.146,0.297-0.289,0.443-0.435c1.294-1.294,2.612-2.565,3.945-3.82c0.205-0.192,0.4-0.394,0.605-0.585 C207.437,195.152,181.237,188.295,154.899,188.295z"></path> </g> </g> <g> <g> <path d="M308.604,346.356c-0.375,0.111-0.751,0.224-1.126,0.333c-1.352,0.392-2.707,0.77-4.067,1.129 c-0.183,0.048-0.365,0.092-0.548,0.14c-1.2,0.314-2.404,0.614-3.61,0.902c-0.394,0.095-0.788,0.188-1.183,0.279 c-1.15,0.268-2.302,0.524-3.458,0.769c-0.249,0.053-0.499,0.11-0.749,0.161c-1.385,0.288-2.774,0.558-4.166,0.814 c-0.336,0.063-0.674,0.119-1.011,0.18c-1.108,0.197-2.219,0.385-3.33,0.561c-0.376,0.06-0.752,0.121-1.128,0.178 c-1.406,0.215-2.815,0.418-4.227,0.601c-0.096,0.012-0.193,0.022-0.29,0.035c-1.319,0.169-2.642,0.319-3.967,0.458 c-0.398,0.042-0.796,0.082-1.195,0.121c-1.152,0.114-2.305,0.217-3.461,0.31c-0.298,0.024-0.594,0.051-0.891,0.074 c-1.416,0.106-2.834,0.197-4.255,0.272c-0.334,0.018-0.669,0.03-1.004,0.045c-1.131,0.054-2.266,0.097-3.4,0.13 c-0.407,0.012-0.813,0.023-1.219,0.033c-1.436,0.032-2.875,0.055-4.316,0.055c-1.441,0-2.88-0.022-4.316-0.055 c-0.407-0.009-0.814-0.021-1.219-0.033c-1.135-0.033-2.269-0.077-3.401-0.13c-0.335-0.016-0.67-0.028-1.004-0.045 c-1.421-0.075-2.84-0.165-4.255-0.272c-0.298-0.022-0.595-0.049-0.891-0.074c-1.156-0.093-2.309-0.196-3.461-0.31 c-0.399-0.039-0.796-0.079-1.194-0.121c-1.325-0.139-2.649-0.291-3.968-0.458c-0.096-0.012-0.193-0.022-0.29-0.035 c-1.413-0.183-2.821-0.386-4.227-0.601c-0.376-0.058-0.752-0.118-1.128-0.178c-1.112-0.177-2.223-0.364-3.33-0.561 c-0.337-0.061-0.674-0.117-1.011-0.18c-1.392-0.255-2.781-0.526-4.166-0.814c-0.25-0.052-0.499-0.108-0.749-0.161 c-1.156-0.245-2.307-0.502-3.458-0.769c-0.395-0.092-0.788-0.185-1.183-0.279c-1.206-0.289-2.41-0.588-3.61-0.902 c-0.183-0.047-0.365-0.092-0.548-0.14c-1.36-0.359-2.715-0.738-4.067-1.129c-0.376-0.109-0.751-0.222-1.126-0.333 c-0.513-0.151-1.028-0.298-1.538-0.455c0.756,44.222,20.455,86.416,54.141,115.261c33.685-28.845,53.385-71.039,54.143-115.261 C309.631,346.057,309.117,346.204,308.604,346.356z"></path> </g> </g> <g> <g> <path d="M289.37,265.857c-8.877-15.374-20.073-28.874-33.371-40.251c-13.298,11.376-24.494,24.875-33.371,40.251 c-8.876,15.374-14.969,31.819-18.173,49.024c16.502,5.827,33.79,8.773,51.544,8.773c17.754,0,35.045-2.945,51.546-8.773 C304.339,297.676,298.247,281.232,289.37,265.857z"></path> </g> </g> </g></svg>',
			onChange: (value) => {
				this.kxsClient.isGunBorderChromatic = !this.kxsClient.isGunBorderChromatic
				this.kxsClient.updateLocalStorage()
				this.kxsClient.hud.toggleChromaticWeaponBorder()
			},
		});

		this.addOption(HUD, {
			label: "Focus Mode",
			value: true,
			type: ModType.Sub,
			icon: '<svg fill="#000000" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 569.16 569.16" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <path d="M513.217,216.366c-18.427,0-31.318-4.568-34.492-12.218c-3.17-7.647,2.702-19.982,15.704-32.999l33.109-33.109 l6.493-6.493l-6.493-6.49l-83.474-83.44l-6.49-6.49l-6.49,6.49l-33.079,33.082c-14.422,14.419-24.076,16.573-28.547,16.573 c-3.295,0-5.915-1.083-8.24-3.415c-3.151-3.161-8.434-11.5-8.391-31.864c0-0.386-0.021-0.768-0.067-1.147V9.18V0h-9.18H225.599 h-9.18v9.18v46.931c-0.024,8.229-1.3,35.166-16.741,35.166c-4.464,0-14.104-2.154-28.519-16.576l-33.103-33.085l-6.49-6.487 l-6.49,6.49l-83.44,83.44l-6.487,6.487l6.484,6.49l33.082,33.112c13.018,13.011,18.896,25.343,15.729,32.996 c-3.17,7.65-16.046,12.222-34.446,12.222H9.18H0v9.18V343.58v9.18h9.18h46.815c18.396,0,31.273,4.568,34.443,12.219 c3.173,7.656-2.705,20.004-15.722,33.025l-33.079,33.08l-6.49,6.49l6.49,6.492l83.44,83.475l6.493,6.496l6.494-6.496 l33.097-33.113c14.407-14.4,24.049-16.551,28.51-16.551c15.45,0,16.726,26.918,16.75,35.168v46.936v9.18h9.18h117.984h9.18v-9.18 v-45.662c0.046-0.377,0.067-0.752,0.067-1.135c-0.042-20.373,5.239-28.713,8.391-31.871c2.329-2.334,4.951-3.42,8.25-3.42 c4.471,0,14.125,2.148,28.544,16.539l33.069,33.104l6.49,6.498l6.493-6.496l83.474-83.471l6.493-6.492l-6.496-6.494 l-33.112-33.082c-12.999-13.023-18.871-25.373-15.698-33.023c3.174-7.648,16.065-12.215,34.489-12.215h46.761h9.18v-9.18V225.546 v-9.18h-9.18H513.217z M413.1,284.58c0,70.867-57.653,128.52-128.52,128.52c-70.867,0-128.52-57.652-128.52-128.52 c0-70.867,57.653-128.52,128.52-128.52C355.446,156.06,413.1,213.713,413.1,284.58z"></path> </g> </g> </g></svg>',
			fields: [
				{
					label: "Enable",
					value: this.kxsClient.isFocusModeEnabled,
					type: ModType.Toggle,

					icon: '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M11 3C13.7614 3 16 5.23858 16 8C16 10.7614 13.7614 13 11 13H5C2.23858 13 0 10.7614 0 8C0 5.23858 2.23858 3 5 3H11ZM11 5C12.6569 5 14 6.34315 14 8C14 9.65685 12.6569 11 11 11C9.34315 11 8 9.65685 8 8C8 6.34315 9.34315 5 11 5Z" fill="#000000"></path> </g></svg>',
					onChange: (value) => {
						this.kxsClient.isFocusModeEnabled = !this.kxsClient.isFocusModeEnabled
						if (!this.kxsClient.isFocusModeEnabled) {
							this.kxsClient.currentFocusModeState = false;
							this.kxsClient.hud.toggleFocusMode();
						}
						this.kxsClient.updateLocalStorage()
					},
				},
				{
					label: "Focus Mode",
					value: (() => {
						const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
						return `Press ${isMac ? 'Command+F (⌘+F)' : 'Ctrl+F'} to toggle Focus Mode.\nWhen enabled, the HUD will dim and notifications will appear.`;
					})(),

					type: ModType.Info,
					icon: '<svg version="1.1" id="Uploaded to svgrepo.com" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32" xml:space="preserve" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M30.146,28.561l-1.586,1.586c-0.292,0.292-0.676,0.438-1.061,0.438s-0.768-0.146-1.061-0.438 l-4.293-4.293l-2.232,2.232c-0.391,0.391-0.902,0.586-1.414,0.586s-1.024-0.195-1.414-0.586l-0.172-0.172 c-0.781-0.781-0.781-2.047,0-2.828l8.172-8.172c0.391-0.391,0.902-0.586,1.414-0.586s1.024,0.195,1.414,0.586l0.172,0.172 c0.781,0.781,0.781,2.047,0,2.828l-2.232,2.232l4.293,4.293C30.731,27.024,30.731,27.976,30.146,28.561z M22.341,18.244 l-4.097,4.097L3.479,13.656C2.567,13.12,2,12.128,2,11.07V3c0-0.551,0.449-1,1-1h8.07c1.058,0,2.049,0.567,2.586,1.479 L22.341,18.244z M19.354,19.354c0.195-0.195,0.195-0.512,0-0.707l-15.5-15.5c-0.195-0.195-0.512-0.195-0.707,0s-0.195,0.512,0,0.707 l15.5,15.5C18.744,19.451,18.872,19.5,19,19.5S19.256,19.451,19.354,19.354z" fill="#000000"></path> </g></svg>',
				}
			],
		})

		this.addOption(HUD, {
			label: "Health Bar Indicator",
			value: this.kxsClient.isHealBarIndicatorEnabled,
			type: ModType.Toggle,
			icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M12.0001 8.59997C13.3334 7.01474 15 5.42847 17 5.42847C19.6667 5.42847 22 7.52847 22 11.2855C22 13.7143 20.2683 16.4912 18.1789 18.9912C16.5956 20.8955 14.7402 22.5713 13.2302 22.5713H10.7698C9.25981 22.5713 7.40446 20.8955 5.82112 18.9912C3.73174 16.4912 2 13.7143 2 11.2855C2 7.52847 4.33333 5.42847 7 5.42847C9 5.42847 10.6667 7.01474 12.0001 8.59997Z" fill="#000000"></path> </g></svg>',

			onChange: () => {
				this.kxsClient.isHealBarIndicatorEnabled = !this.kxsClient.isHealBarIndicatorEnabled;
				this.kxsClient.updateLocalStorage();
			},
		});

		this.addOption(HUD, {
			label: "Message Open/Close RSHIFT Menu",
			value: this.kxsClient.isNotifyingForToggleMenu,
			type: ModType.Toggle,
			icon: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title></title> <g id="Complete"> <g id="info-circle"> <g> <circle cx="12" cy="12" data-name="--Circle" fill="none" id="_--Circle" r="10" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></circle> <line fill="none" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="12" y2="16"></line> <line fill="none" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="8" y2="8"></line> </g> </g> </g> </g></svg>',

			onChange: (value) => {
				this.kxsClient.isNotifyingForToggleMenu = !this.kxsClient.isNotifyingForToggleMenu
				this.kxsClient.updateLocalStorage()
			},
		})

		this.addOption(SERVER, {
			label: "Webhook URL",
			value: this.kxsClient.discordWebhookUrl || "",
			icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M12.52 3.046a3 3 0 0 0-2.13 5.486 1 1 0 0 1 .306 1.38l-3.922 6.163a2 2 0 1 1-1.688-1.073l3.44-5.405a5 5 0 1 1 8.398-2.728 1 1 0 1 1-1.97-.348 3 3 0 0 0-2.433-3.475zM10 6a2 2 0 1 1 3.774.925l3.44 5.405a5 5 0 1 1-1.427 8.5 1 1 0 0 1 1.285-1.532 3 3 0 1 0 .317-4.83 1 1 0 0 1-1.38-.307l-3.923-6.163A2 2 0 0 1 10 6zm-5.428 6.9a1 1 0 0 1-.598 1.281A3 3 0 1 0 8.001 17a1 1 0 0 1 1-1h8.266a2 2 0 1 1 0 2H9.9a5 5 0 1 1-6.61-5.698 1 1 0 0 1 1.282.597Z" fill="#000000"></path> </g></svg>',
			type: ModType.Input,
			placeholder: "discord webhook url",
			onChange: (value) => {
				value = value.toString().trim();
				this.kxsClient.discordWebhookUrl = value as string
				this.kxsClient.discordTracker.setWebhookUrl(value as string)
				this.kxsClient.updateLocalStorage()
			},
		});

		this.addOption(MECHANIC, {
			label: "Custom Crosshair",
			value: this.kxsClient.customCrosshair || "",
			type: ModType.Input,

			icon: '<svg fill="#000000" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>crosshair</title> <path d="M30 14.75h-2.824c-0.608-5.219-4.707-9.318-9.874-9.921l-0.053-0.005v-2.824c0-0.69-0.56-1.25-1.25-1.25s-1.25 0.56-1.25 1.25v0 2.824c-5.219 0.608-9.318 4.707-9.921 9.874l-0.005 0.053h-2.824c-0.69 0-1.25 0.56-1.25 1.25s0.56 1.25 1.25 1.25v0h2.824c0.608 5.219 4.707 9.318 9.874 9.921l0.053 0.005v2.824c0 0.69 0.56 1.25 1.25 1.25s1.25-0.56 1.25-1.25v0-2.824c5.219-0.608 9.318-4.707 9.921-9.874l0.005-0.053h2.824c0.69 0 1.25-0.56 1.25-1.25s-0.56-1.25-1.25-1.25v0zM17.25 24.624v-2.624c0-0.69-0.56-1.25-1.25-1.25s-1.25 0.56-1.25 1.25v0 2.624c-3.821-0.57-6.803-3.553-7.368-7.326l-0.006-0.048h2.624c0.69 0 1.25-0.56 1.25-1.25s-0.56-1.25-1.25-1.25v0h-2.624c0.57-3.821 3.553-6.804 7.326-7.368l0.048-0.006v2.624c0 0.69 0.56 1.25 1.25 1.25s1.25-0.56 1.25-1.25v0-2.624c3.821 0.57 6.803 3.553 7.368 7.326l0.006 0.048h-2.624c-0.69 0-1.25 0.56-1.25 1.25s0.56 1.25 1.25 1.25v0h2.624c-0.571 3.821-3.553 6.803-7.326 7.368l-0.048 0.006z"></path> </g></svg>',
			placeholder: "URL of png,gif,svg",
			onChange: (value) => {
				this.kxsClient.customCrosshair = value as string
				this.kxsClient.updateLocalStorage()
				this.kxsClient.hud.loadCustomCrosshair();
			},
		});

		this.addOption(MECHANIC, {
			label: "Heal Warning",
			value: this.kxsClient.isHealthWarningEnabled,
			type: ModType.Toggle,

			icon: '<svg viewBox="0 0 512 512" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>health</title> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="add" fill="#000000" transform="translate(42.666667, 64.000000)"> <path d="M365.491733,234.665926 C339.947827,276.368766 302.121072,321.347032 252.011468,369.600724 L237.061717,383.7547 C234.512147,386.129148 231.933605,388.511322 229.32609,390.901222 L213.333333,405.333333 C205.163121,398.070922 197.253659,390.878044 189.604949,383.7547 L174.655198,369.600724 C124.545595,321.347032 86.7188401,276.368766 61.174934,234.665926 L112.222458,234.666026 C134.857516,266.728129 165.548935,301.609704 204.481843,339.08546 L213.333333,347.498667 L214.816772,346.115558 C257.264819,305.964102 290.400085,268.724113 314.444476,234.665648 L365.491733,234.665926 Z M149.333333,58.9638831 L213.333333,186.944 L245.333333,122.963883 L269.184,170.666667 L426.666667,170.666667 L426.666667,213.333333 L247.850667,213.333333 L213.333333,282.36945 L149.333333,154.368 L119.851392,213.333333 L3.55271368e-14,213.333333 L3.55271368e-14,170.666667 L93.4613333,170.666667 L149.333333,58.9638831 Z M290.133333,0 C353.756537,0 405.333333,51.5775732 405.333333,115.2 C405.333333,126.248908 404.101625,137.626272 401.63821,149.33209 L357.793994,149.332408 C360.62486,138.880112 362.217829,128.905378 362.584434,119.422244 L362.666667,115.2 C362.666667,75.1414099 330.192075,42.6666667 290.133333,42.6666667 C273.651922,42.6666667 258.124715,48.1376509 245.521279,58.0219169 L241.829932,61.1185374 L213.366947,86.6338354 L184.888885,61.1353673 C171.661383,49.2918281 154.669113,42.6666667 136.533333,42.6666667 C96.4742795,42.6666667 64,75.1409461 64,115.2 C64,125.932203 65.6184007,137.316846 68.8727259,149.332605 L25.028457,149.33209 C22.5650412,137.626272 21.3333333,126.248908 21.3333333,115.2 C21.3333333,51.5767968 72.9101302,0 136.533333,0 C166.046194,0 192.966972,11.098031 213.350016,29.348444 C233.716605,11.091061 260.629741,0 290.133333,0 Z" id="Combined-Shape"> </path> </g> </g> </g></svg>',
			onChange: (value) => {
				this.kxsClient.isHealthWarningEnabled = !this.kxsClient.isHealthWarningEnabled;
				if (this.kxsClient.isHealthWarningEnabled) {
					// Always enter placement mode when enabling from RSHIFT menu
					this.kxsClient.healWarning?.enableDragging();
				} else {
					this.kxsClient.healWarning?.hide();
				}
				this.kxsClient.updateLocalStorage();
			},
		});

		this.addOption(SERVER, {
			label: "Update Checker",
			value: this.kxsClient.isAutoUpdateEnabled,
			type: ModType.Toggle,
			icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M18.4721 16.7023C17.3398 18.2608 15.6831 19.3584 13.8064 19.7934C11.9297 20.2284 9.95909 19.9716 8.25656 19.0701C6.55404 18.1687 5.23397 16.6832 4.53889 14.8865C3.84381 13.0898 3.82039 11.1027 4.47295 9.29011C5.12551 7.47756 6.41021 5.96135 8.09103 5.02005C9.77184 4.07875 11.7359 3.77558 13.6223 4.16623C15.5087 4.55689 17.1908 5.61514 18.3596 7.14656C19.5283 8.67797 20.1052 10.5797 19.9842 12.5023M19.9842 12.5023L21.4842 11.0023M19.9842 12.5023L18.4842 11.0023" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M12 8V12L15 15" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>',
			onChange: (value) => {
				this.kxsClient.isAutoUpdateEnabled = !this.kxsClient.isAutoUpdateEnabled
				this.kxsClient.updateLocalStorage()
			},
		});

		this.addOption(MECHANIC, {
			label: `Uncap FPS`,
			value: this.kxsClient.isFpsUncapped,
			type: ModType.Toggle,
			icon: '<svg viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_fps_960_24_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_fps_960_24_filled" fill="#000000" fill-rule="nonzero"> <path d="M11.75,15 C12.9926407,15 14,16.0073593 14,17.25 C14,18.440864 13.0748384,19.4156449 11.9040488,19.4948092 L11.75,19.5 L11,19.5 L11,21.25 C11,21.6296958 10.7178461,21.943491 10.3517706,21.9931534 L10.25,22 C9.87030423,22 9.55650904,21.7178461 9.50684662,21.3517706 L9.5,21.25 L9.5,15.75 C9.5,15.3703042 9.78215388,15.056509 10.1482294,15.0068466 L10.25,15 L11.75,15 Z M18,15 C19.1045695,15 20,15.8954305 20,17 C20,17.4142136 19.6642136,17.75 19.25,17.75 C18.8703042,17.75 18.556509,17.4678461 18.5068466,17.1017706 L18.5,17 C18.5,16.7545401 18.3231248,16.5503916 18.0898756,16.5080557 L18,16.5 L17.375,16.5 C17.029822,16.5 16.75,16.779822 16.75,17.125 C16.75,17.4387982 16.9812579,17.6985831 17.2826421,17.7432234 L17.375,17.75 L17.875,17.75 C19.0486051,17.75 20,18.7013949 20,19.875 C20,20.9975788 19.1295366,21.91685 18.0267588,21.9946645 L17.875,22 L17.25,22 C16.1454305,22 15.25,21.1045695 15.25,20 C15.25,19.5857864 15.5857864,19.25 16,19.25 C16.3796958,19.25 16.693491,19.5321539 16.7431534,19.8982294 L16.75,20 C16.75,20.2454599 16.9268752,20.4496084 17.1601244,20.4919443 L17.25,20.5 L17.875,20.5 C18.220178,20.5 18.5,20.220178 18.5,19.875 C18.5,19.5612018 18.2687421,19.3014169 17.9673579,19.2567766 L17.875,19.25 L17.375,19.25 C16.2013949,19.25 15.25,18.2986051 15.25,17.125 C15.25,16.0024212 16.1204634,15.08315 17.2232412,15.0053355 L17.375,15 L18,15 Z M7.75,15 C8.16421356,15 8.5,15.3357864 8.5,15.75 C8.5,16.1296958 8.21784612,16.443491 7.85177056,16.4931534 L7.75,16.5 L5.5,16.4990964 L5.5,18.0020964 L7.25,18.002809 C7.66421356,18.002809 8,18.3385954 8,18.752809 C8,19.1325047 7.71784612,19.4462999 7.35177056,19.4959623 L7.25,19.502809 L5.5,19.5020964 L5.5,21.2312276 C5.5,21.6109234 5.21784612,21.9247186 4.85177056,21.974381 L4.75,21.9812276 C4.37030423,21.9812276 4.05650904,21.6990738 4.00684662,21.3329982 L4,21.2312276 L4,15.75 C4,15.3703042 4.28215388,15.056509 4.64822944,15.0068466 L4.75,15 L7.75,15 Z M11.75,16.5 L11,16.5 L11,18 L11.75,18 C12.1642136,18 12.5,17.6642136 12.5,17.25 C12.5,16.8703042 12.2178461,16.556509 11.8517706,16.5068466 L11.75,16.5 Z M5,3 C6.65685425,3 8,4.34314575 8,6 L7.99820112,6.1048763 L8,6.15469026 L8,10 C8,11.5976809 6.75108004,12.9036609 5.17627279,12.9949073 L5,13 L4.7513884,13 C3.23183855,13 2,11.7681615 2,10.2486116 C2,9.69632685 2.44771525,9.2486116 3,9.2486116 C3.51283584,9.2486116 3.93550716,9.63465179 3.99327227,10.1319905 L4,10.2486116 C4,10.6290103 4.28267621,10.9433864 4.64942945,10.9931407 L4.7513884,11 L5,11 C5.51283584,11 5.93550716,10.6139598 5.99327227,10.1166211 L6,10 L5.99991107,8.82932572 C5.68715728,8.93985718 5.35060219,9 5,9 C3.34314575,9 2,7.65685425 2,6 C2,4.34314575 3.34314575,3 5,3 Z M12.2512044,3 C13.7707542,3 15.0025928,4.23183855 15.0025928,5.7513884 C15.0025928,6.30367315 14.5548775,6.7513884 14.0025928,6.7513884 C13.489757,6.7513884 13.0670856,6.36534821 13.0093205,5.86800953 L13.0025928,5.7513884 C13.0025928,5.37098974 12.7199166,5.05661365 12.3531633,5.00685929 L12.2512044,5 L12.0025928,5 C11.489757,5 11.0670856,5.38604019 11.0093205,5.88337887 L11.0025928,6 L11.0026817,7.17067428 C11.3154355,7.06014282 11.6519906,7 12.0025928,7 C13.659447,7 15.0025928,8.34314575 15.0025928,10 C15.0025928,11.6568542 13.659447,13 12.0025928,13 C10.3457385,13 9.0025928,11.6568542 9.0025928,10 L9.00441213,9.89453033 L9.0025928,9.84530974 L9.0025928,6 C9.0025928,4.40231912 10.2515128,3.09633912 11.82632,3.00509269 L12.0025928,3 L12.2512044,3 Z M19,3 C20.5976809,3 21.9036609,4.24891996 21.9949073,5.82372721 L22,6 L22,10 C22,11.6568542 20.6568542,13 19,13 C17.4023191,13 16.0963391,11.75108 16.0050927,10.1762728 L16,10 L16,6 C16,4.34314575 17.3431458,3 19,3 Z M12.0025928,9 C11.450308,9 11.0025928,9.44771525 11.0025928,10 C11.0025928,10.5522847 11.450308,11 12.0025928,11 C12.5548775,11 13.0025928,10.5522847 13.0025928,10 C13.0025928,9.44771525 12.5548775,9 12.0025928,9 Z M19,5 C18.4871642,5 18.0644928,5.38604019 18.0067277,5.88337887 L18,6 L18,10 C18,10.5522847 18.4477153,11 19,11 C19.5128358,11 19.9355072,10.6139598 19.9932723,10.1166211 L20,10 L20,6 C20,5.44771525 19.5522847,5 19,5 Z M5,5 C4.44771525,5 4,5.44771525 4,6 C4,6.55228475 4.44771525,7 5,7 C5.55228475,7 6,6.55228475 6,6 C6,5.44771525 5.55228475,5 5,5 Z" id="🎨Color"> </path> </g> </g> </g></svg>',
			onChange: () => {
				this.kxsClient.isFpsUncapped = !this.kxsClient.isFpsUncapped;
				this.kxsClient.setAnimationFrameCallback();
				this.kxsClient.updateLocalStorage();
			},
		});

		this.addOption(HUD, {
			label: `Winning Animation`,
			value: this.kxsClient.isWinningAnimationEnabled,
			icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M5.5713 14.5L9.46583 18.4141M18.9996 3.60975C17.4044 3.59505 16.6658 4.33233 16.4236 5.07743C16.2103 5.73354 16.4052 7.07735 15.896 8.0727C15.4091 9.02443 14.1204 9.5617 12.6571 9.60697M20 7.6104L20.01 7.61049M19 15.96L19.01 15.9601M7.00001 3.94926L7.01001 3.94936M19 11.1094C17.5 11.1094 16.5 11.6094 15.5949 12.5447M10.2377 7.18796C11 6.10991 11.5 5.10991 11.0082 3.52734M3.53577 20.4645L7.0713 9.85791L14.1424 16.929L3.53577 20.4645Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>',
			type: ModType.Toggle,
			onChange: () => {
				this.kxsClient.isWinningAnimationEnabled = !this.kxsClient.isWinningAnimationEnabled;
				this.kxsClient.updateLocalStorage();
			},
		});

		this.addOption(HUD, {
			label: `Glassmorphism`,
			value: this.kxsClient.isGlassmorphismEnabled,
			icon: '<svg fill="#000000" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M 6 5 L 6 7.375 L 6.8125 7.65625 C 7.546875 8.269531 8 9.15625 8 10.125 L 8 21 C 8 22.644531 9.355469 24 11 24 C 12.644531 24 14 22.644531 14 21 L 14 18.875 C 14 18.144531 14.660156 17.679688 15.34375 17.9375 C 15.738281 18.085938 16 18.453125 16 18.875 L 16 25 C 16 26.644531 17.355469 28 19 28 C 20.644531 28 22 26.644531 22 25 L 22 16.03125 C 22 14.757813 22.980469 13.796875 24.1875 13.75 L 24.21875 13.75 L 26 14.375 L 26 12 Z M 9.8125 8.71875 L 21.5 12.8125 C 20.59375 13.59375 20 14.730469 20 16.03125 L 20 25 C 20 25.566406 19.566406 26 19 26 C 18.433594 26 18 25.566406 18 25 L 18 18.875 C 18 17.628906 17.230469 16.5 16.0625 16.0625 C 14.132813 15.339844 12 16.8125 12 18.875 L 12 21 C 12 21.566406 11.566406 22 11 22 C 10.433594 22 10 21.566406 10 21 L 10 10.125 C 10 9.644531 9.9375 9.171875 9.8125 8.71875 Z"></path></g></svg>',

			type: ModType.Toggle,
			onChange: () => {
				this.kxsClient.isGlassmorphismEnabled = !this.kxsClient.isGlassmorphismEnabled;
				this.kxsClient.updateLocalStorage();
				this.kxsClient.nm.showNotification("You need to reload the page to see the changes", "info", 1900);
			},
		});


		this.addOption(HUD, {
			label: `KxsClient Logo`,
			value: this.kxsClient.isKxsClientLogoEnable,
			icon: '<svg fill="#000000" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" enable-background="new 0 0 52 52" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M20,37.5c0-0.8-0.7-1.5-1.5-1.5h-15C2.7,36,2,36.7,2,37.5v11C2,49.3,2.7,50,3.5,50h15c0.8,0,1.5-0.7,1.5-1.5 V37.5z"></path> <path d="M8.1,22H3.2c-1,0-1.5,0.9-0.9,1.4l8,8.3c0.4,0.3,1,0.3,1.4,0l8-8.3c0.6-0.6,0.1-1.4-0.9-1.4h-4.7 c0-5,4.9-10,9.9-10V6C15,6,8.1,13,8.1,22z"></path> <path d="M41.8,20.3c-0.4-0.3-1-0.3-1.4,0l-8,8.3c-0.6,0.6-0.1,1.4,0.9,1.4h4.8c0,6-4.1,10-10.1,10v6 c9,0,16.1-7,16.1-16H49c1,0,1.5-0.9,0.9-1.4L41.8,20.3z"></path> <path d="M50,3.5C50,2.7,49.3,2,48.5,2h-15C32.7,2,32,2.7,32,3.5v11c0,0.8,0.7,1.5,1.5,1.5h15c0.8,0,1.5-0.7,1.5-1.5 V3.5z"></path> </g></svg>',

			type: ModType.Toggle,
			onChange: () => {
				this.kxsClient.isKxsClientLogoEnable = !this.kxsClient.isKxsClientLogoEnable;
				this.kxsClient.updateLocalStorage();
			},
		});

		this.addOption(HUD, {
			label: `Spotify Player`,
			value: this.kxsClient.isSpotifyPlayerEnabled,
			icon: '<svg fill="#000000" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>spotify</title> <path d="M24.849 14.35c-3.206-1.616-6.988-2.563-10.991-2.563-2.278 0-4.484 0.306-6.58 0.881l0.174-0.041c-0.123 0.040-0.265 0.063-0.412 0.063-0.76 0-1.377-0.616-1.377-1.377 0-0.613 0.401-1.132 0.954-1.311l0.010-0.003c5.323-1.575 14.096-1.275 19.646 2.026 0.426 0.258 0.706 0.719 0.706 1.245 0 0.259-0.068 0.502-0.186 0.712l0.004-0.007c-0.29 0.345-0.721 0.563-1.204 0.563-0.273 0-0.529-0.070-0.752-0.192l0.008 0.004zM24.699 18.549c-0.201 0.332-0.561 0.55-0.971 0.55-0.225 0-0.434-0.065-0.61-0.178l0.005 0.003c-2.739-1.567-6.021-2.49-9.518-2.49-1.925 0-3.784 0.28-5.539 0.801l0.137-0.035c-0.101 0.032-0.217 0.051-0.337 0.051-0.629 0-1.139-0.51-1.139-1.139 0-0.509 0.333-0.939 0.793-1.086l0.008-0.002c1.804-0.535 3.878-0.843 6.023-0.843 3.989 0 7.73 1.064 10.953 2.925l-0.106-0.056c0.297 0.191 0.491 0.52 0.491 0.894 0 0.227-0.071 0.437-0.192 0.609l0.002-0.003zM22.899 22.673c-0.157 0.272-0.446 0.452-0.777 0.452-0.186 0-0.359-0.057-0.502-0.154l0.003 0.002c-2.393-1.346-5.254-2.139-8.299-2.139-1.746 0-3.432 0.261-5.020 0.745l0.122-0.032c-0.067 0.017-0.145 0.028-0.224 0.028-0.512 0-0.927-0.415-0.927-0.927 0-0.432 0.296-0.795 0.696-0.898l0.006-0.001c1.581-0.47 3.397-0.74 5.276-0.74 3.402 0 6.596 0.886 9.366 2.44l-0.097-0.050c0.302 0.15 0.506 0.456 0.506 0.809 0 0.172-0.048 0.333-0.132 0.469l0.002-0.004zM16 1.004c0 0 0 0-0 0-8.282 0-14.996 6.714-14.996 14.996s6.714 14.996 14.996 14.996c8.282 0 14.996-6.714 14.996-14.996v0c-0.025-8.272-6.724-14.971-14.993-14.996h-0.002z"></path> </g></svg>',

			type: ModType.Toggle,
			onChange: () => {
				this.kxsClient.isSpotifyPlayerEnabled = !this.kxsClient.isSpotifyPlayerEnabled;
				this.kxsClient.updateLocalStorage();
				this.kxsClient.toggleSpotifyMenu();
			},
		});

		this.addOption(HUD, {
			label: "Brightness",
			value: this.kxsClient.brightness,
			icon: '<svg fill="#000000" viewBox="-5.5 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>light</title> <path d="M11.875 6v2.469c0 0.844-0.375 1.25-1.156 1.25s-1.156-0.406-1.156-1.25v-2.469c0-0.813 0.375-1.219 1.156-1.219s1.156 0.406 1.156 1.219zM14.219 9.25l1.438-2.031c0.469-0.625 1.063-0.75 1.656-0.313s0.656 1 0.188 1.688l-1.438 2c-0.469 0.688-1.031 0.75-1.656 0.313-0.594-0.438-0.656-0.969-0.188-1.656zM5.781 7.25l1.469 2c0.469 0.688 0.406 1.219-0.219 1.656-0.594 0.469-1.156 0.375-1.625-0.313l-1.469-2c-0.469-0.688-0.406-1.219 0.219-1.656 0.594-0.469 1.156-0.375 1.625 0.313zM10.719 11.125c2.688 0 4.875 2.188 4.875 4.875 0 2.656-2.188 4.813-4.875 4.813s-4.875-2.156-4.875-4.813c0-2.688 2.188-4.875 4.875-4.875zM1.594 11.813l2.375 0.75c0.781 0.25 1.063 0.719 0.813 1.469-0.219 0.75-0.75 0.969-1.563 0.719l-2.313-0.75c-0.781-0.25-1.063-0.75-0.844-1.5 0.25-0.719 0.75-0.938 1.531-0.688zM17.5 12.563l2.344-0.75c0.813-0.25 1.313-0.031 1.531 0.688 0.25 0.75-0.031 1.25-0.844 1.469l-2.313 0.781c-0.781 0.25-1.281 0.031-1.531-0.719-0.219-0.75 0.031-1.219 0.813-1.469zM10.719 18.688c1.5 0 2.719-1.219 2.719-2.688 0-1.5-1.219-2.719-2.719-2.719s-2.688 1.219-2.688 2.719c0 1.469 1.188 2.688 2.688 2.688zM0.906 17.969l2.344-0.75c0.781-0.25 1.313-0.063 1.531 0.688 0.25 0.75-0.031 1.219-0.813 1.469l-2.375 0.781c-0.781 0.25-1.281 0.031-1.531-0.719-0.219-0.75 0.063-1.219 0.844-1.469zM18.219 17.219l2.344 0.75c0.781 0.25 1.063 0.719 0.813 1.469-0.219 0.75-0.719 0.969-1.531 0.719l-2.344-0.781c-0.813-0.25-1.031-0.719-0.813-1.469 0.25-0.75 0.75-0.938 1.531-0.688zM3.938 23.344l1.469-1.969c0.469-0.688 1.031-0.781 1.625-0.313 0.625 0.438 0.688 0.969 0.219 1.656l-1.469 1.969c-0.469 0.688-1.031 0.813-1.656 0.375-0.594-0.438-0.656-1.031-0.188-1.719zM16.063 21.375l1.438 1.969c0.469 0.688 0.406 1.281-0.188 1.719s-1.188 0.281-1.656-0.344l-1.438-2c-0.469-0.688-0.406-1.219 0.188-1.656 0.625-0.438 1.188-0.375 1.656 0.313zM11.875 23.469v2.469c0 0.844-0.375 1.25-1.156 1.25s-1.156-0.406-1.156-1.25v-2.469c0-0.844 0.375-1.25 1.156-1.25s1.156 0.406 1.156 1.25z"></path> </g></svg>',

			type: ModType.Slider,
			min: 20,
			max: 100,
			step: 1,
			onChange: (value) => {
				this.kxsClient.applyBrightness(value as number);
			},
		});

		this.addOption(HUD, {
			label: "Kill Feed Chroma",
			value: this.kxsClient.isKillFeedBlint,
			icon: `<svg fill="#000000" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title></title> <g data-name="Layer 2" id="Layer_2"> <path d="M18,11a1,1,0,0,1-1,1,5,5,0,0,0-5,5,1,1,0,0,1-2,0,5,5,0,0,0-5-5,1,1,0,0,1,0-2,5,5,0,0,0,5-5,1,1,0,0,1,2,0,5,5,0,0,0,5,5A1,1,0,0,1,18,11Z"></path> <path d="M19,24a1,1,0,0,1-1,1,2,2,0,0,0-2,2,1,1,0,0,1-2,0,2,2,0,0,0-2-2,1,1,0,0,1,0-2,2,2,0,0,0,2-2,1,1,0,0,1,2,0,2,2,0,0,0,2,2A1,1,0,0,1,19,24Z"></path> <path d="M28,17a1,1,0,0,1-1,1,4,4,0,0,0-4,4,1,1,0,0,1-2,0,4,4,0,0,0-4-4,1,1,0,0,1,0-2,4,4,0,0,0,4-4,1,1,0,0,1,2,0,4,4,0,0,0,4,4A1,1,0,0,1,28,17Z"></path> </g> </g></svg>`,

			type: ModType.Toggle,
			onChange: () => {
				this.kxsClient.isKillFeedBlint = !this.kxsClient.isKillFeedBlint
				this.kxsClient.updateLocalStorage()
				this.kxsClient.hud.toggleKillFeed();
			},
		});

		this.addOption(SERVER, {
			label: `Rich Presence (Account token required)`,
			value: this.kxsClient.discordToken || "",
			icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M18.59 5.88997C17.36 5.31997 16.05 4.89997 14.67 4.65997C14.5 4.95997 14.3 5.36997 14.17 5.69997C12.71 5.47997 11.26 5.47997 9.83001 5.69997C9.69001 5.36997 9.49001 4.95997 9.32001 4.65997C7.94001 4.89997 6.63001 5.31997 5.40001 5.88997C2.92001 9.62997 2.25001 13.28 2.58001 16.87C4.23001 18.1 5.82001 18.84 7.39001 19.33C7.78001 18.8 8.12001 18.23 8.42001 17.64C7.85001 17.43 7.31001 17.16 6.80001 16.85C6.94001 16.75 7.07001 16.64 7.20001 16.54C10.33 18 13.72 18 16.81 16.54C16.94 16.65 17.07 16.75 17.21 16.85C16.7 17.16 16.15 17.42 15.59 17.64C15.89 18.23 16.23 18.8 16.62 19.33C18.19 18.84 19.79 18.1 21.43 16.87C21.82 12.7 20.76 9.08997 18.61 5.88997H18.59ZM8.84001 14.67C7.90001 14.67 7.13001 13.8 7.13001 12.73C7.13001 11.66 7.88001 10.79 8.84001 10.79C9.80001 10.79 10.56 11.66 10.55 12.73C10.55 13.79 9.80001 14.67 8.84001 14.67ZM15.15 14.67C14.21 14.67 13.44 13.8 13.44 12.73C13.44 11.66 14.19 10.79 15.15 10.79C16.11 10.79 16.87 11.66 16.86 12.73C16.86 13.79 16.11 14.67 15.15 14.67Z" fill="#000000"></path> </g></svg>',
			type: ModType.Input,
			placeholder: "Your discord account token",
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

			value: this.kxsClient.isKillLeaderTrackerEnabled,
			type: ModType.Toggle,
			onChange: (value) => {
				this.kxsClient.isKillLeaderTrackerEnabled = !this.kxsClient.isKillLeaderTrackerEnabled;
				this.kxsClient.updateLocalStorage();
			},
		});

		this.addOption(MECHANIC, {
			label: `Friends Detector (separe with ',')`,
			icon: '<svg fill="#000000" viewBox="0 -6 44 44" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M42.001,32.000 L14.010,32.000 C12.908,32.000 12.010,31.104 12.010,30.001 L12.010,28.002 C12.010,27.636 12.211,27.300 12.532,27.124 L22.318,21.787 C19.040,18.242 19.004,13.227 19.004,12.995 L19.010,7.002 C19.010,6.946 19.015,6.891 19.024,6.837 C19.713,2.751 24.224,0.007 28.005,0.007 C28.006,0.007 28.008,0.007 28.009,0.007 C31.788,0.007 36.298,2.749 36.989,6.834 C36.998,6.889 37.003,6.945 37.003,7.000 L37.006,12.994 C37.006,13.225 36.970,18.240 33.693,21.785 L43.479,27.122 C43.800,27.298 44.000,27.634 44.000,28.000 L44.000,30.001 C44.000,31.104 43.103,32.000 42.001,32.000 ZM31.526,22.880 C31.233,22.720 31.039,22.425 31.008,22.093 C30.978,21.761 31.116,21.436 31.374,21.226 C34.971,18.310 35.007,13.048 35.007,12.995 L35.003,7.089 C34.441,4.089 30.883,2.005 28.005,2.005 C25.126,2.006 21.570,4.091 21.010,7.091 L21.004,12.997 C21.004,13.048 21.059,18.327 24.636,21.228 C24.895,21.438 25.033,21.763 25.002,22.095 C24.972,22.427 24.778,22.722 24.485,22.882 L14.010,28.596 L14.010,30.001 L41.999,30.001 L42.000,28.595 L31.526,22.880 ZM18.647,2.520 C17.764,2.177 16.848,1.997 15.995,1.997 C13.116,1.998 9.559,4.083 8.999,7.083 L8.993,12.989 C8.993,13.041 9.047,18.319 12.625,21.220 C12.884,21.430 13.022,21.755 12.992,22.087 C12.961,22.419 12.767,22.714 12.474,22.874 L1.999,28.588 L1.999,29.993 L8.998,29.993 C9.550,29.993 9.997,30.441 9.997,30.993 C9.997,31.545 9.550,31.993 8.998,31.993 L1.999,31.993 C0.897,31.993 -0.000,31.096 -0.000,29.993 L-0.000,27.994 C-0.000,27.629 0.200,27.292 0.521,27.117 L10.307,21.779 C7.030,18.234 6.993,13.219 6.993,12.988 L6.999,6.994 C6.999,6.939 7.004,6.883 7.013,6.829 C7.702,2.744 12.213,-0.000 15.995,-0.000 C15.999,-0.000 16.005,-0.000 16.010,-0.000 C17.101,-0.000 18.262,0.227 19.369,0.656 C19.885,0.856 20.140,1.435 19.941,1.949 C19.740,2.464 19.158,2.720 18.647,2.520 Z"></path> </g></svg>',

			value: this.kxsClient.all_friends,
			type: ModType.Input,
			placeholder: "kisakay,iletal...",
			onChange: (value) => {
				this.kxsClient.all_friends = value as string;
				this.kxsClient.updateLocalStorage();
			},
		});

		this.addOption(HUD, {
			icon: '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <rect width="48" height="48" fill="white" fill-opacity="0.01"></rect> <path fill-rule="evenodd" clip-rule="evenodd" d="M37 37C39.2091 37 41 35.2091 41 33C41 31.5272 39.6667 29.5272 37 27C34.3333 29.5272 33 31.5272 33 33C33 35.2091 34.7909 37 37 37Z" fill="#000000"></path> <path d="M20.8535 5.50439L24.389 9.03993" stroke="#000000" stroke-width="4" stroke-linecap="round"></path> <path d="M23.6818 8.33281L8.12549 23.8892L19.4392 35.2029L34.9955 19.6465L23.6818 8.33281Z" stroke="#000000" stroke-width="4" stroke-linejoin="round"></path> <path d="M12 20.0732L28.961 25.6496" stroke="#000000" stroke-width="4" stroke-linecap="round"></path> <path d="M4 43H44" stroke="#000000" stroke-width="4" stroke-linecap="round"></path> </g></svg>',
			label: "Background Modifiction",
			type: ModType.Sub,
			fields: [
				{
					label: "Custom Background",
					icon: '<svg fill="#000000" viewBox="0 0 32 32" enable-background="new 0 0 32 32" id="Glyph" version="1.1" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M20.722,24.964c0.096,0.096,0.057,0.264-0.073,0.306c-7.7,2.466-16.032-1.503-18.594-8.942 c-0.072-0.21-0.072-0.444,0-0.655c0.743-2.157,1.99-4.047,3.588-5.573c0.061-0.058,0.158-0.056,0.217,0.003l4.302,4.302 c0.03,0.03,0.041,0.072,0.031,0.113c-1.116,4.345,2.948,8.395,7.276,7.294c0.049-0.013,0.095-0.004,0.131,0.032 C17.958,22.201,20.045,24.287,20.722,24.964z" id="XMLID_323_"></path><path d="M24.68,23.266c2.406-1.692,4.281-4.079,5.266-6.941c0.072-0.21,0.072-0.44,0-0.65 C27.954,9.888,22.35,6,16,6c-2.479,0-4.841,0.597-6.921,1.665L3.707,2.293c-0.391-0.391-1.023-0.391-1.414,0s-0.391,1.023,0,1.414 l26,26c0.391,0.391,1.023,0.391,1.414,0c0.391-0.391,0.391-1.023,0-1.414L24.68,23.266z M16,10c3.309,0,6,2.691,6,6 c0,1.294-0.416,2.49-1.115,3.471l-8.356-8.356C13.51,10.416,14.706,10,16,10z" id="XMLID_325_"></path></g></svg>',
					type: ModType.Toggle,
					value: this.kxsClient.isCustomBackgroundEnabled,
					onChange: () => {
						this.kxsClient.isCustomBackgroundEnabled = !this.kxsClient.isCustomBackgroundEnabled;
						this.kxsClient.updateLocalStorage();
					},
				},
				{
					label: `Change Background`,
					icon: '<svg height="200px" width="200px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 179.006 179.006" xml:space="preserve" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <polygon style="fill:#010002;" points="20.884,116.354 11.934,116.354 11.934,32.818 137.238,32.818 137.238,41.768 149.172,41.768 149.172,20.884 0,20.884 0,128.288 20.884,128.288 "></polygon> <path style="fill:#010002;" d="M29.834,50.718v107.404h149.172V50.718H29.834z M123.58,136.856c-0.024,0-0.048,0-0.072,0 c-0.012,0-1.187,0-2.81,0c-3.795,0-10.078,0-10.114,0c-19.625,0-39.25,0-58.875,0v-3.473c0.907-0.859,2.005-1.551,3.168-2.166 c1.981-1.062,3.938-2.148,5.967-3.115c1.957-0.937,3.998-1.742,6.003-2.59c1.886-0.8,3.801-1.545,5.674-2.363 c0.328-0.137,0.638-0.489,0.776-0.811c0.424-1.05,0.782-2.124,1.116-3.216c0.245-0.823,0.412-1.635,1.468-1.862 c0.263-0.048,0.597-0.513,0.627-0.817c0.209-1.581,0.37-3.168,0.489-4.744c0.024-0.346-0.149-0.776-0.382-1.038 c-1.384-1.557-2.142-3.353-2.47-5.406c-0.161-1.038-0.74-1.993-1.038-3.013c-0.394-1.366-0.728-2.745-1.038-4.129 c-0.119-0.501-0.048-1.038-0.125-1.551c-0.125-0.746-0.107-1.319,0.806-1.611c0.233-0.084,0.442-0.668,0.453-1.032 c0.048-2.214,0.012-4.433,0.024-6.641c0.012-1.36,0-2.727,0.107-4.087c0.185-2.596,1.718-4.421,3.622-5.997 c2.787-2.303,6.128-3.377,9.565-4.189c1.808-0.424,3.64-0.68,5.478-0.979c0.489-0.078,0.996-0.006,1.498-0.006 c0.095,0.125,0.161,0.251,0.251,0.37c-0.376,0.28-0.811,0.513-1.134,0.847c-0.746,0.746-0.674,1.265,0.125,1.945 c1.647,1.396,3.318,2.804,4.911,4.254c1.42,1.271,1.969,2.942,1.981,4.815c0,3.222,0,6.45,0,9.672c0,0.65-0.048,1.313,0.776,1.605 c0.167,0.066,0.352,0.424,0.34,0.632c-0.131,1.641-0.322,3.294-0.489,4.941c-0.006,0.066-0.018,0.131-0.054,0.185 c-1.486,2.166-1.677,4.827-2.733,7.148c-0.048,0.09-0.078,0.191-0.125,0.257c-1.969,2.315-1.36,5.102-1.396,7.769 c0,0.269,0.197,0.686,0.406,0.782c0.806,0.358,1.002,1.044,1.223,1.772c0.352,1.14,0.692,2.303,1.181,3.389 c0.179,0.394,0.716,0.746,1.17,0.907c0.943,0.364,1.886,0.74,2.834,1.11c2.363-1.002,5.734-2.434,6.385-2.727 c0.919-0.418,1.611-1.349,2.44-1.993c0.37-0.28,0.817-0.537,1.259-0.615c1.504-0.239,2.16-0.77,2.518-2.255 c0.465-1.945,0.806-3.89,0.388-5.913c-0.167-0.877-0.489-1.45-1.366-1.784c-1.778-0.698-3.532-1.474-5.293-2.22 c-1.319-0.555-1.396-1.02-0.919-2.387c1.516-4.296,2.631-8.658,3.007-13.258c0.28-3.443,0.048-6.981,1.307-10.305 c0.871-2.339,2.339-4.505,4.696-5.203c1.796-0.531,3.359-1.742,5.269-1.999c0.358-0.018,0.674-0.072,1.026-0.054 c0.042,0.006,0.078,0.012,0.113,0.012c4.529,0.286,9.923,3.019,11.2,8.043c0.066,0.257,0.101,0.525,0.143,0.788h0.125 c0.698,2.852,0.621,5.818,0.859,8.712c0.37,4.594,1.504,8.962,3.019,13.264c0.477,1.366,0.394,1.832-0.919,2.381 c-1.76,0.746-3.514,1.522-5.299,2.22c-0.871,0.34-1.181,0.895-1.36,1.784c-0.406,2.029-0.084,3.968,0.388,5.913 c0.346,1.48,1.014,2.011,2.512,2.25c0.442,0.078,0.883,0.334,1.259,0.615c0.829,0.644,1.516,1.569,2.44,1.993 c3.234,1.468,6.51,2.888,9.839,4.117c5.114,1.88,8.509,5.478,9.326,11.045C145.944,136.856,134.768,136.856,123.58,136.856z"></path> </g> </g> </g></svg>',

					value: true,
					type: ModType.Click,
					onChange: () => {
						if (!this.kxsClient.isCustomBackgroundEnabled) {
							alert("The custom background is disabled.");
							return;
						}

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
				}
			],
			value: true
		})

		this.addOption(MISC, {
			label: "Developer Options",
			value: true,
			icon: '<svg fill="#000000" viewBox="0 0 14 14" role="img" focusable="false" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="m 9.095305,2.8613212 -8.0953049,1.257035 1.3073163,8.3969928 4.3242001,-0.70394 C 6.5812355,11.45944 7.7377073,8.4425562 7.9388329,7.8894612 l -2.2123815,0.351969 0.3016884,-0.905065 1.5587233,-0.251407 0.4022512,0.502814 c 0,0 0.1005628,-0.251407 0.1005628,-0.35197 L 5.927577,4.5708882 C 5.8270142,4.4200442 5.8270142,4.2189192 5.9778584,4.1183562 l 0.1005628,-0.100563 c 0.1508442,-0.100563 0.3519698,-0.100563 0.4525326,0.05028 l 1.910693,2.212382 c 0.4022512,-1.206754 0.754221,-2.262663 0.754221,-2.614633 0.050281,-0.100563 0.050281,-0.452532 -0.1005628,-0.804502 z M 3.0615374,7.8391792 4.4191351,7.5877722 4.0671653,8.4928372 3.1621002,8.6436812 3.0615374,7.8391792 Z m 2.916321,-2.564351 0.1508442,0.05028 c 0.2011256,0.05028 0.251407,0.251407 0.2011256,0.452533 L 4.8213863,9.8001542 3.9163211,11.006907 4.0168839,9.4984652 5.5253258,5.4759532 c 0.050281,-0.201125 0.251407,-0.251407 0.4525326,-0.201125 z m 5.4303906,-1.407879 c -0.201125,0.201125 -0.452532,0.854784 -0.955346,2.765477 l 0.05028,0 0.150844,0.804502 -0.402251,0.05028 c -0.05028,0.251407 -0.100563,0.502814 -0.201126,0.804503 0.854784,0.452532 0.402251,1.558723 0.35197,1.558723 -0.05028,0 -0.05028,0 -0.05028,-0.05028 0,-0.05028 0.05028,-0.201126 -0.100563,-0.251407 C 10.151214,9.4984652 9.9500887,9.4481842 9.7992445,9.3476212 9.6484004,9.9509982 9.4975562,10.654937 9.346712,11.409158 l 3.167728,-0.502814 -1.055909,-7.0896768 -0.05028,0.05028 z m -0.35197,-0.502814 c 0.201126,-0.100563 0.301689,-0.201126 0.452533,-0.201126 0.251407,0 0.402251,0.150844 0.452533,0.251407 0.100562,0.150844 0.452532,0.251407 0.603376,0.251407 0.100563,0 0.251407,-0.35197 0.35197,-0.653658 0.100563,-0.301688 0.100563,-0.653658 0.05028,-0.70394 -0.05028,-0.05028 -0.452532,-0.150844 -0.553095,-0.150844 -0.05028,0.05028 -0.150844,0.100563 -0.35197,0.100563 -0.201125,0 -0.402251,-0.150844 -0.553095,-0.301688 -0.251406,-0.251407 -0.553094,-0.35197 -0.854783,-0.452533 -0.301688,-0.100563 -0.653658,-0.100563 -0.9553462,-0.100563 -0.4525326,-0.05028 -0.9553466,-0.05028 -1.4078792,0.100563 -0.2011255,0.05028 -0.3519697,0.100563 -0.5530953,0.201126 -0.050281,0.05028 -0.2011256,0.100562 -0.251407,0.100562 -0.050281,0.05028 -0.050281,0.100563 0,0.100563 0.050281,0 0.251407,-0.05028 0.251407,-0.05028 0,0 -0.251407,0.100563 -0.251407,0.201125 0,0.05028 0.050281,0.05028 0.050281,0.05028 0,0 0.1508442,-0.05028 0.251407,-0.05028 0.2011256,0 0.5028139,-0.100562 0.7542209,-0.100562 0.3016884,0 0.6033768,0.100562 0.9050652,0.402251 0.4525325,0.553095 0.4022511,1.257035 0.4022511,1.407879 -0.1005627,1.055909 -2.4637884,7.4919278 -2.5643512,7.9444608 -0.1005628,0.452532 -0.1005628,0.703939 0.4525326,0.854783 0.5530953,0.150845 0.7542209,0 0.8547837,-0.201125 0.050281,-0.35197 1.5587234,-8.2964308 2.4637884,-9.0003698 z"></path></g></svg>',
			type: ModType.Sub,
			fields: [
				{
					label: "Enable GameID Exchange",
					icon: '<svg viewBox="-1 0 26 26" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:sketch="http://www.bohemiancoding.com/sketch/ns" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>share</title> <desc>Created with Sketch Beta.</desc> <defs> </defs> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" sketch:type="MSPage"> <g id="Icon-Set" sketch:type="MSLayerGroup" transform="translate(-312.000000, -726.000000)" fill="#000000"> <path d="M331,750 C329.343,750 328,748.657 328,747 C328,745.343 329.343,744 331,744 C332.657,744 334,745.343 334,747 C334,748.657 332.657,750 331,750 L331,750 Z M317,742 C315.343,742 314,740.657 314,739 C314,737.344 315.343,736 317,736 C318.657,736 320,737.344 320,739 C320,740.657 318.657,742 317,742 L317,742 Z M331,728 C332.657,728 334,729.343 334,731 C334,732.657 332.657,734 331,734 C329.343,734 328,732.657 328,731 C328,729.343 329.343,728 331,728 L331,728 Z M331,742 C329.23,742 327.685,742.925 326.796,744.312 L321.441,741.252 C321.787,740.572 322,739.814 322,739 C322,738.497 321.903,738.021 321.765,737.563 L327.336,734.38 C328.249,735.37 329.547,736 331,736 C333.762,736 336,733.762 336,731 C336,728.238 333.762,726 331,726 C328.238,726 326,728.238 326,731 C326,731.503 326.097,731.979 326.235,732.438 L320.664,735.62 C319.751,734.631 318.453,734 317,734 C314.238,734 312,736.238 312,739 C312,741.762 314.238,744 317,744 C318.14,744 319.179,743.604 320.02,742.962 L320,743 L326.055,746.46 C326.035,746.64 326,746.814 326,747 C326,749.762 328.238,752 331,752 C333.762,752 336,749.762 336,747 C336,744.238 333.762,742 331,742 L331,742 Z" id="share" sketch:type="MSShapeGroup"> </path> </g> </g> </g></svg>',
					type: ModType.Toggle,
					value: this.kxsClient.kxsDeveloperOptions.enableGameIDExchange,
					onChange: () => {
						this.kxsClient.kxsDeveloperOptions.enableGameIDExchange = !this.kxsClient.kxsDeveloperOptions.enableGameIDExchange;
						this.kxsClient.updateLocalStorage();
					}
				},
				{
					label: "Renew Exchange Key",
					value: true,
					type: ModType.Click,
					icon: '<svg viewBox="0 0 512 512" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>reset</title> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="Combined-Shape" fill="#000000" transform="translate(74.806872, 64.000000)"> <path d="M351.859794,42.6666667 L351.859794,85.3333333 L283.193855,85.3303853 C319.271288,116.988529 341.381875,163.321355 341.339886,213.803851 C341.27474,291.98295 288.098183,360.121539 212.277591,379.179704 C136.456999,398.237869 57.3818117,363.341907 20.3580507,294.485411 C-16.6657103,225.628916 -2.17003698,140.420413 55.5397943,87.68 C63.6931909,100.652227 75.1888658,111.189929 88.8197943,118.186667 C59.4998648,141.873553 42.4797783,177.560832 42.5264609,215.253333 C43.5757012,285.194843 100.577082,341.341203 170.526461,341.333333 C234.598174,342.388718 289.235113,295.138227 297.4321,231.584253 C303.556287,184.101393 282.297007,138.84385 245.195596,112.637083 L245.193128,192 L202.526461,192 L202.526461,42.6666667 L351.859794,42.6666667 Z M127.859794,-1.42108547e-14 C151.423944,-1.42108547e-14 170.526461,19.1025173 170.526461,42.6666667 C170.526461,66.230816 151.423944,85.3333333 127.859794,85.3333333 C104.295645,85.3333333 85.1931276,66.230816 85.1931276,42.6666667 C85.1931276,19.1025173 104.295645,-1.42108547e-14 127.859794,-1.42108547e-14 Z"> </path> </g> </g> </g></svg>',
					onChange: async () => {
						const new_password = this.kxsClient.generateRandomPassword();
						this.kxsClient.kxsDeveloperOptions.exchange.password = new_password;
						this.kxsClient.updateLocalStorage();
						this.kxsClient.nm.showNotification("New Exchange Key Generated (pasted to clipboard)", "success", 2100);
						await navigator.clipboard.writeText(new_password);
					}
				},
				{
					label: "Copy Exchange Key",
					value: this.kxsClient.kxsDeveloperOptions.exchange.password,
					type: ModType.Click,
					icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M9 17.5C9 18.8807 7.88071 20 6.5 20C5.11929 20 4 18.8807 4 17.5C4 16.1193 5.11929 15 6.5 15C7.88071 15 9 16.1193 9 17.5ZM9 17.5H15.125M19 20V17.75C19 17.6119 18.8881 17.5 18.75 17.5M15.125 17.5H18.75M15.125 17.5V20M18.75 17.5Lnan nanCnan nan nan nan nan nanLnan nanCnan nan nan nan nan nanL18.75 17.5ZM5 11H19C20.1046 11 21 10.1046 21 9V6C21 4.89543 20.1046 4 19 4H5C3.89543 4 3 4.89543 3 6V9C3 10.1046 3.89543 11 5 11Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> <circle cx="7.5" cy="7.5" r="1.5" fill="#000000"></circle> <circle cx="12" cy="7.5" r="1.5" fill="#000000"></circle> <circle cx="16.5" cy="7.5" r="1.5" fill="#000000"></circle> </g></svg>',
					onChange: () => {
						this.kxsClient.nm.showNotification("Exchange Key Copied to Clipboard", "success", 2100);
						navigator.clipboard.writeText(this.kxsClient.kxsDeveloperOptions.exchange.password);
					}
				}
			],
		})

		this.addOption(CONFIG, {
			icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M19.53 8L14 2.47C13.8595 2.32931 13.6688 2.25018 13.47 2.25H11C10.2707 2.25 9.57118 2.53973 9.05546 3.05546C8.53973 3.57118 8.25 4.27065 8.25 5V6.25H7C6.27065 6.25 5.57118 6.53973 5.05546 7.05546C4.53973 7.57118 4.25 8.27065 4.25 9V19C4.25 19.7293 4.53973 20.4288 5.05546 20.9445C5.57118 21.4603 6.27065 21.75 7 21.75H14C14.7293 21.75 15.4288 21.4603 15.9445 20.9445C16.4603 20.4288 16.75 19.7293 16.75 19V17.75H17C17.7293 17.75 18.4288 17.4603 18.9445 16.9445C19.4603 16.4288 19.75 15.7293 19.75 15V8.5C19.7421 8.3116 19.6636 8.13309 19.53 8ZM14.25 4.81L17.19 7.75H14.25V4.81ZM15.25 19C15.25 19.3315 15.1183 19.6495 14.8839 19.8839C14.6495 20.1183 14.3315 20.25 14 20.25H7C6.66848 20.25 6.35054 20.1183 6.11612 19.8839C5.8817 19.6495 5.75 19.3315 5.75 19V9C5.75 8.66848 5.8817 8.35054 6.11612 8.11612C6.35054 7.8817 6.66848 7.75 7 7.75H8.25V15C8.25 15.7293 8.53973 16.4288 9.05546 16.9445C9.57118 17.4603 10.2707 17.75 11 17.75H15.25V19ZM17 16.25H11C10.6685 16.25 10.3505 16.1183 10.1161 15.8839C9.8817 15.6495 9.75 15.3315 9.75 15V5C9.75 4.66848 9.8817 4.35054 10.1161 4.11612C10.3505 3.8817 10.6685 3.75 11 3.75H12.75V8.5C12.7526 8.69811 12.8324 8.88737 12.9725 9.02747C13.1126 9.16756 13.3019 9.24741 13.5 9.25H18.25V15C18.25 15.3315 18.1183 15.6495 17.8839 15.8839C17.6495 16.1183 17.3315 16.25 17 16.25Z" fill="#000000"></path> </g></svg>',
			label: "Copy Kxs Config",
			type: ModType.Click,
			value: true,
			onChange: async () => {
				await navigator.clipboard.writeText(this.kxsClient.getKxsJSONConfig());
				this.kxsClient.nm.showNotification("Kxs Config copied to clipboard", "success", 3000);
			}
		})

		this.addOption(CONFIG, {
			icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M12 14L11.2929 14.7071L12 15.4142L12.7071 14.7071L12 14ZM13 5C13 4.44772 12.5523 4 12 4C11.4477 4 11 4.44771 11 5L13 5ZM6.29289 9.70711L11.2929 14.7071L12.7071 13.2929L7.70711 8.29289L6.29289 9.70711ZM12.7071 14.7071L17.7071 9.70711L16.2929 8.29289L11.2929 13.2929L12.7071 14.7071ZM13 14L13 5L11 5L11 14L13 14Z" fill="#000000"></path> <path d="M5 16L5 17C5 18.1046 5.89543 19 7 19L17 19C18.1046 19 19 18.1046 19 17V16" stroke="#000000" stroke-width="2"></path> </g></svg>',
			label: "Import Kxs Config",
			type: ModType.Click,
			value: true,
			onChange: async () => {
				const data = await navigator.clipboard.readText();
				try {
					const parse_data = JSON.parse(data);
					if (parse_data["userSettings"]) {
						this.kxsClient.setKxsJSONConfig(parse_data);
						this.kxsClient.nm.showNotification("Kxs Config imported", "success", 4000);
						setInterval(() => {
							this.kxsClient.nm.showNotification("Kxs reloading soon...", "info", 4000);
						}, 1000);

						// Reload the webpage
						setTimeout(() => {
							window.location.reload();
						}, 4000);
					}
				} catch {
					this.kxsClient.nm.showNotification("The current configuration in the clipboard is not a valid Kxs Config", "error", 4000);
				}
			}
		})
	}

	private createOptionCard(option: MenuOption, container: HTMLElement): void {
		const isMobile = this.kxsClient.isMobile && this.kxsClient.isMobile();
		const optionCard = document.createElement("div");
		Object.assign(optionCard.style, {
			background: "rgba(31, 41, 55, 0.8)",
			borderRadius: "12px",
			padding: isMobile ? "12px" : "16px",
			display: "flex",
			flexDirection: "row",
			alignItems: "center",
			gap: isMobile ? "12px" : "16px",
			minHeight: isMobile ? "50px" : "60px",
			width: "100%",
			boxSizing: "border-box",
			border: "1px solid rgba(255, 255, 255, 0.1)",
			transition: "all 0.2s ease"
		});

		// Hover effect for the card
		optionCard.addEventListener("mouseenter", () => {
			optionCard.style.background = "rgba(31, 41, 55, 0.9)";
			optionCard.style.border = "1px solid rgba(255, 255, 255, 0.2)";
		});

		optionCard.addEventListener("mouseleave", () => {
			optionCard.style.background = "rgba(31, 41, 55, 0.8)";
			optionCard.style.border = "1px solid rgba(255, 255, 255, 0.1)";
		});

		const iconContainer = document.createElement("div");
		Object.assign(iconContainer.style, {
			width: isMobile ? "32px" : "40px",
			height: isMobile ? "32px" : "40px",
			borderRadius: "8px",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			background: "rgba(59, 130, 246, 0.1)",
			border: "1px solid rgba(59, 130, 246, 0.2)",
			flexShrink: "0"
		});
		iconContainer.innerHTML = option.icon || '';

		const contentContainer = document.createElement("div");
		Object.assign(contentContainer.style, {
			display: "flex",
			flexDirection: "column",
			flex: "1",
			minWidth: "0" // Allow text truncation
		});

		const title = document.createElement("div");
		title.textContent = option.label;
		Object.assign(title.style, {
			fontSize: isMobile ? "14px" : "16px",
			fontWeight: "600",
			color: "#ffffff",
			marginBottom: "4px",
			whiteSpace: "nowrap",
			overflow: "hidden",
			textOverflow: "ellipsis"
		});

		let control: null | HTMLElement = null;

		switch (option.type) {
			case ModType.Info:
				control = this.createInfoElement(option);
				break;
			case ModType.Input:
				control = this.createInputElement(option);
				break
			case ModType.Toggle:
				control = this.createToggleButton(option);
				break;
			case ModType.Sub:
				control = this.createSubButton(option);
				break;
			case ModType.Slider:
				control = this.createSliderElement(option);
				break;
			case ModType.Click:
				control = this.createClickButton(option);
		}

		const controlContainer = document.createElement("div");
		Object.assign(controlContainer.style, {
			flexShrink: "0",
			minWidth: isMobile ? "80px" : "120px",
			maxWidth: isMobile ? "120px" : "200px"
		});

		contentContainer.appendChild(title);
		if (control) {
			controlContainer.appendChild(control);
		}

		optionCard.appendChild(iconContainer);
		optionCard.appendChild(contentContainer);
		optionCard.appendChild(controlContainer);

		container.appendChild(optionCard);
	}

	private setActiveCategory(category: string): void {
		// Fermer le sous-menu s'il est ouvert lors du changement de catégorie
		if (this.closeSubMenu) {
			this.closeSubMenu();
		}

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
					section.options.forEach((option) => {
						// Create a unique key for each option
						if ((this.kxsClient.kxsNetwork["1"] === true) && X0.includes(option.label)) {
							return;
						}
						const optionKey = `${option.label}-${section.category}`;

						// Check if option matches search term (including subfields)
						const matchesSearch = this.searchTerm === '' ||
							option.label.toLowerCase().includes(this.searchTerm) ||
							section.category.toLowerCase().includes(this.searchTerm) ||
							// Search in sub-menu fields
							(option.fields && option.fields.some(field =>
								field.label.toLowerCase().includes(this.searchTerm)
							));

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
				noResultsMsg.style.textAlign = 'center';
				noResultsMsg.style.padding = '20px';
				noResultsMsg.style.color = '#9CA3AF';
				noResultsMsg.style.width = '100%';
				gridContainer.appendChild(noResultsMsg);
			}
		}
	}

	private createGridContainer(): void {
		const gridContainer = document.createElement("div");
		const isMobile = this.kxsClient.isMobile && this.kxsClient.isMobile();
		Object.assign(gridContainer.style, {
			display: "flex",
			flexDirection: "column",
			gap: isMobile ? "8px" : "12px",
			padding: isMobile ? "8px" : "16px",
			overflowY: "auto",
			overflowX: "hidden", // Prevent horizontal scrolling
			maxHeight: isMobile ? "35vh" : "50vh",
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

	public addSection(category: Category = "ALL"): MenuSection {
		const section: MenuSection = {
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
		// Créer le bouton principal
		const btn = document.createElement("button");
		const isMobile = this.kxsClient.isMobile && this.kxsClient.isMobile();

		// Créer l'indicateur (point vert/rouge)
		const indicator = document.createElement("div");

		// Appliquer le style de base au bouton avec glassmorphism moderne
		btn.style.width = "100%";
		btn.style.padding = isMobile ? "8px 14px" : "12px 18px";
		btn.style.height = isMobile ? "32px" : "42px";
		btn.style.background = "linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.08) 100%)";
		btn.style.backdropFilter = "blur(16px) saturate(180%)";
		(btn.style as any)['-webkit-backdrop-filter'] = "blur(16px) saturate(180%)";
		btn.style.border = "1px solid rgba(255, 255, 255, 0.18)";
		btn.style.borderRadius = "12px";
		btn.style.color = "#ffffff";
		btn.style.cursor = "pointer";
		btn.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
		btn.style.fontSize = isMobile ? "11px" : "14px";
		btn.style.fontWeight = "500";
		btn.style.letterSpacing = "0.3px";
		btn.style.fontFamily = "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
		btn.style.position = "relative";
		btn.style.display = "flex";
		btn.style.alignItems = "center";
		btn.style.justifyContent = "space-between";
		btn.style.textAlign = "left";
		btn.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)";
		btn.style.textShadow = "0 1px 2px rgba(0, 0, 0, 0.3)";
		btn.style.overflow = "hidden";

		// Appliquer le style à l'indicateur avec effet glassmorphism
		indicator.style.width = isMobile ? "10px" : "12px";
		indicator.style.height = isMobile ? "10px" : "12px";
		indicator.style.borderRadius = "50%";
		indicator.style.marginLeft = "12px";
		indicator.style.flexShrink = "0";
		indicator.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
		indicator.style.border = "2px solid rgba(255, 255, 255, 0.2)";
		indicator.style.backdropFilter = "blur(8px)";
		(indicator.style as any)['-webkit-backdrop-filter'] = "blur(8px)";

		// Créer un conteneur pour le texte
		const textSpan = document.createElement("span");
		textSpan.style.flexGrow = "1";

		// Fonction pour mettre à jour l'apparence du bouton
		const updateButtonState = () => {
			const isEnabled = option.value as boolean;

			// Mettre à jour le texte
			textSpan.textContent = isEnabled ? "ENABLED" : "DISABLED";

			// Mettre à jour le style du bouton avec glassmorphism
			btn.style.background = isEnabled ?
				"linear-gradient(135deg, rgba(74, 222, 128, 0.15) 0%, rgba(34, 197, 94, 0.12) 100%)" :
				"linear-gradient(135deg, rgba(248, 113, 113, 0.15) 0%, rgba(239, 68, 68, 0.12) 100%)";
			btn.style.border = isEnabled ?
				"1px solid rgba(74, 222, 128, 0.3)" :
				"1px solid rgba(248, 113, 113, 0.3)";
			btn.style.boxShadow = isEnabled ?
				"0 4px 16px rgba(74, 222, 128, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)" :
				"0 4px 16px rgba(248, 113, 113, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)";

			// Mettre à jour l'indicateur avec effet glassmorphism
			indicator.style.background = isEnabled ?
				"radial-gradient(circle, #4ade80 0%, #22c55e 100%)" :
				"radial-gradient(circle, #f87171 0%, #ef4444 100%)";
			indicator.style.boxShadow = isEnabled ?
				"0 0 12px rgba(74, 222, 128, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3)" :
				"0 0 12px rgba(248, 113, 113, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3)";
		};

		// Ajouter les éléments au DOM
		btn.appendChild(textSpan);
		btn.appendChild(indicator);

		// Définir l'état initial
		updateButtonState();

		// Gérer les événements de survol avec glassmorphism amélioré
		btn.addEventListener("mouseenter", () => {
			const isEnabled = option.value as boolean;
			btn.style.transform = "translateY(-3px) scale(1.02)";
			btn.style.backdropFilter = "blur(20px) saturate(200%)";
			(btn.style as any)['-webkit-backdrop-filter'] = "blur(20px) saturate(200%)";
			btn.style.boxShadow = isEnabled ?
				"0 8px 24px rgba(74, 222, 128, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 0 0 1px rgba(74, 222, 128, 0.2)" :
				"0 8px 24px rgba(248, 113, 113, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 0 0 1px rgba(248, 113, 113, 0.2)";
			btn.style.border = isEnabled ?
				"1px solid rgba(74, 222, 128, 0.4)" :
				"1px solid rgba(248, 113, 113, 0.4)";
		});

		btn.addEventListener("mouseleave", () => {
			const isEnabled = option.value as boolean;
			btn.style.transform = "translateY(0) scale(1)";
			btn.style.backdropFilter = "blur(16px) saturate(180%)";
			(btn.style as any)['-webkit-backdrop-filter'] = "blur(16px) saturate(180%)";
			btn.style.boxShadow = isEnabled ?
				"0 4px 16px rgba(74, 222, 128, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)" :
				"0 4px 16px rgba(248, 113, 113, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)";
			btn.style.border = isEnabled ?
				"1px solid rgba(74, 222, 128, 0.3)" :
				"1px solid rgba(248, 113, 113, 0.3)";
		});

		// Gérer le clic
		btn.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();

			// Inverser la valeur
			const newValue = !(option.value as boolean);
			option.value = newValue;

			// Mettre à jour l'apparence
			updateButtonState();

			// Ajouter une animation de pulsation (optimized)
			btn.style.animation = `${DesignSystem.animation.pulse} 0.5s ease`;
			// Use event listener for animation end instead of setTimeout
			btn.addEventListener('animationend', function onAnimationEnd() {
				btn.style.animation = '';
				btn.removeEventListener('animationend', onAnimationEnd);
			}, { once: true });

			// Appeler le gestionnaire onChange
			if (option.onChange) {
				option.onChange(newValue);
			}

			return false;
		});

		this.blockMousePropagation(btn);
		return btn;
	}

	private createClickButton(option: MenuOption): HTMLButtonElement {
		const btn = document.createElement("button");
		const isMobile = this.kxsClient.isMobile && this.kxsClient.isMobile();

		// Appliquer un style glassmorphism moderne
		btn.style.width = "100%";
		btn.style.padding = isMobile ? "6px 8px" : "10px 12px";
		btn.style.height = isMobile ? "32px" : "auto";
		btn.style.minHeight = isMobile ? "32px" : "40px";
		btn.style.background = "linear-gradient(135deg, rgba(66, 135, 245, 0.15) 0%, rgba(59, 118, 217, 0.12) 100%)";
		btn.style.backdropFilter = "blur(16px) saturate(180%)";
		(btn.style as any)['-webkit-backdrop-filter'] = "blur(16px) saturate(180%)";
		btn.style.border = "1px solid rgba(66, 135, 245, 0.25)";
		btn.style.borderRadius = "12px";
		btn.style.color = "#ffffff";
		btn.style.cursor = "pointer";
		btn.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
		btn.style.fontSize = isMobile ? "11px" : "13px";
		btn.style.fontWeight = "500";
		btn.style.letterSpacing = "0.2px";
		btn.style.fontFamily = "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
		btn.style.boxShadow = "0 4px 16px rgba(66, 135, 245, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)";
		btn.style.textShadow = "0 1px 2px rgba(0, 0, 0, 0.3)";
		btn.style.position = "relative";
		btn.style.overflow = "hidden";
		btn.style.whiteSpace = "nowrap";
		btn.style.textOverflow = "ellipsis";
		btn.style.display = "flex";
		btn.style.alignItems = "center";
		btn.style.justifyContent = "center";
		btn.style.textAlign = "center";

		btn.textContent = option.label;

		// Ajouter les effets hover modernes
		btn.addEventListener("mouseenter", () => {
			btn.style.transform = "translateY(-3px) scale(1.02)";
			btn.style.backdropFilter = "blur(20px) saturate(200%)";
			(btn.style as any)['-webkit-backdrop-filter'] = "blur(20px) saturate(200%)";
			btn.style.boxShadow = "0 8px 24px rgba(66, 135, 245, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 0 0 1px rgba(66, 135, 245, 0.2)";
			btn.style.border = "1px solid rgba(66, 135, 245, 0.35)";
		});

		btn.addEventListener("mouseleave", () => {
			btn.style.transform = "translateY(0) scale(1)";
			btn.style.backdropFilter = "blur(16px) saturate(180%)";
			(btn.style as any)['-webkit-backdrop-filter'] = "blur(16px) saturate(180%)";
			btn.style.boxShadow = "0 4px 16px rgba(66, 135, 245, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)";
			btn.style.border = "1px solid rgba(66, 135, 245, 0.25)";
		});

		// Ajouter l'effet actif
		btn.addEventListener("mousedown", () => {
			btn.style.transform = "translateY(-1px) scale(0.98)";
			btn.style.boxShadow = "0 2px 8px rgba(66, 135, 245, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)";
		});

		btn.addEventListener("click", () => {
			// Add ripple effect for feedback
			const ripple = document.createElement("span");
			Object.assign(ripple.style, {
				position: "absolute",
				top: "50%",
				left: "50%",
				transform: "translate(-50%, -50%)",
				background: "rgba(255, 255, 255, 0.3)",
				borderRadius: "50%",
				width: "0",
				height: "0",
				animation: "ripple 0.6s linear",
				zIndex: "1"
			});

			// Add ripple animation if it doesn't exist
			if (!document.getElementById("kxs-ripple-animation")) {
				const style = document.createElement("style");
				style.id = "kxs-ripple-animation";
				style.textContent = `
					@keyframes ripple {
						to {
							width: 200px;
							height: 200px;
							opacity: 0;
						}
					}
				`;
				document.head.appendChild(style);
			}

			btn.appendChild(ripple);
			// Use event listener for animation end instead of setTimeout
			ripple.addEventListener('animationend', () => {
				ripple.remove();
			}, { once: true });

			option.onChange?.(true);
		});

		this.blockMousePropagation(btn);
		return btn;
	}

	private addShiftListener(): void {
		// Gestionnaire pour la touche Shift (ouverture du menu)
		window.addEventListener("keydown", (event) => {
			if (event.key === "Shift" && event.location == 2) {
				this.clearMenu();
				this.toggleMenuVisibility();
				// Ensure options are displayed after loading
				this.filterOptions();

				if (this.kxsClient.getUsername() === "debug") {
					let _ = `✨ KxsClient's Features\n\r`;
					this.allOptions.forEach(x => {
						_ += `* ${x.label} (${x.placeholder || "No description"}) - ${x.type}\n` +
							`${x.fields?.map(field => {
								return `- Name: ${field.label}\n- Type: ${field.type}\n\n`
							}).join("") || "Not SubMenu Found\n"}\n`
					})

					navigator.clipboard.writeText(_);
				}
			}
		});

		// Gestionnaire séparé pour la touche Échap avec capture en phase de capture
		// pour intercepter l'événement avant qu'il n'atteigne le jeu
		document.addEventListener("keydown", (event) => {
			if (event.key === "Escape" && this.isClientMenuVisible) {
				// Fermer le menu si la touche Échap est pressée et que le menu est visible
				this.toggleMenuVisibility();
				// Empêcher la propagation ET l'action par défaut
				event.stopPropagation();
				event.preventDefault();
				// Arrêter la propagation de l'événement
				return false;
			}
		}, true); // true = phase de capture
	}

	private createInputElement(option: MenuOption): HTMLElement {
		const isMobile = this.kxsClient.isMobile && this.kxsClient.isMobile();

		// Create container for input with label effect
		const container = document.createElement("div");
		Object.assign(container.style, {
			position: "relative",
			width: "100%",
			margin: "4px 0"
		});

		// Create the input element
		const input = document.createElement("input");
		input.type = "text";
		input.value = String(option.value);
		if (option.placeholder) {
			input.placeholder = option.placeholder;
		}

		// Apply glassmorphism effect to input
		DesignSystem.applyGlassEffect(input, 'dark', {
			width: "100%",
			padding: isMobile ? "6px 8px" : "8px 10px",
			background: "rgba(17, 24, 39, 0.7)",
			borderRadius: "6px",
			color: "#FFAE00", // Gold color
			fontSize: isMobile ? "12px" : "14px",
			fontFamily: DesignSystem.fonts.primary,
			boxSizing: "border-box",
			border: "1px solid rgba(255, 174, 0, 0.3)",
			transition: `all ${DesignSystem.animation.normal} ease`,
			outline: "none"
		});

		// Add focus effects
		input.addEventListener("focus", () => {
			input.style.boxShadow = "0 0 0 2px rgba(255, 174, 0, 0.2)";
			input.style.border = "1px solid rgba(255, 174, 0, 0.5)";
		});

		input.addEventListener("blur", () => {
			input.style.boxShadow = "none";
			input.style.border = "1px solid rgba(255, 174, 0, 0.3)";
		});

		input.addEventListener("change", () => {
			option.value = input.value;
			option.onChange?.(input.value);

			// Visual feedback on change (optimized)
			input.style.animation = "glow 0.5s ease";
			// Use event listener for animation end instead of setTimeout
			input.addEventListener('animationend', function onAnimationEnd() {
				input.style.animation = "";
				input.removeEventListener('animationend', onAnimationEnd);
			}, { once: true });
		});

		// Add glow animation if it doesn't exist
		if (!document.getElementById("kxs-input-animations")) {
			const style = document.createElement("style");
			style.id = "kxs-input-animations";
			style.textContent = `
				@keyframes glow {
					0% { box-shadow: 0 0 0 0 rgba(255, 174, 0, 0.4); }
					50% { box-shadow: 0 0 10px 3px rgba(255, 174, 0, 0.4); }
					100% { box-shadow: 0 0 0 0 rgba(255, 174, 0, 0.4); }
				}
			`;
			document.head.appendChild(style);
		}

		// Prevent key propagation to the game
		input.addEventListener("keydown", (e) => {
			e.stopPropagation();
		});

		input.addEventListener("keyup", (e) => {
			e.stopPropagation();
		});

		input.addEventListener("keypress", (e) => {
			e.stopPropagation();
		});

		this.blockMousePropagation(input);
		container.appendChild(input);
		return container;
	}

	private createSliderElement(option: MenuOption): HTMLElement {
		// Create the slider using DesignSystem with proper event handling
		const sliderElement = DesignSystem.createSliderElement(
			option.min || 0,
			option.max || 100,
			Number(option.value),
			(newValue) => {
				option.value = newValue;
				option.onChange?.(newValue);
			},
			true
		);

		// Prevent mouse events from propagating to the game
		const sliderInput = sliderElement.querySelector("input");
		if (sliderInput) {
			this.blockMousePropagation(sliderInput, false);
		}

		// Apply consistent styling
		Object.assign(sliderElement.style, {
			width: "100%",
			margin: "5px 0"
		});

		return sliderElement;
	}

	private createInfoElement(option: MenuOption): HTMLElement {
		const info = document.createElement("div");
		info.textContent = String(option.value);
		Object.assign(info.style, {
			color: "#b0b0b0",
			fontSize: "12px",
			fontStyle: "italic",
			marginTop: "2px",
			marginLeft: "6px",
			marginBottom: "2px",
			flex: "1 1 100%",
			whiteSpace: "pre-line"
		});
		this.blockMousePropagation(info);
		return info;
	}

	private createSubButton(option: MenuOption): HTMLButtonElement {
		const btn = document.createElement("button");
		const isMobile = this.kxsClient.isMobile && this.kxsClient.isMobile();

		// Apply modern glassmorphism effect
		DesignSystem.applyGlassEffect(btn, 'dark', {
			width: "100%",
			padding: isMobile ? "6px 8px" : "12px 16px",
			height: isMobile ? "32px" : "auto",
			background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.25) 100%)",
			backdropFilter: "blur(12px) saturate(180%)",
			WebkitBackdropFilter: "blur(12px) saturate(180%)",
			border: "1px solid rgba(59, 130, 246, 0.3)",
			borderRadius: isMobile ? "8px" : "12px",
			color: "#ffffff",
			cursor: "pointer",
			transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
			fontSize: isMobile ? "11px" : "14px",
			fontWeight: "600",
			letterSpacing: "0.5px",
			fontFamily: DesignSystem.fonts.primary,
			boxShadow: "0 4px 16px rgba(59, 130, 246, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
			textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
			position: "relative",
			overflow: "hidden"
		});

		// Add a subtle icon to indicate configuration
		btn.innerHTML = `<span style="display: flex; align-items: center; justify-content: center; gap: 5px;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        CONFIGURE
    </span>`;

		// Add sophisticated hover effects
		btn.addEventListener("mouseenter", () => {
			btn.style.transform = "translateY(-2px) scale(1.02)";
			btn.style.backdropFilter = "blur(16px) saturate(200%)";
			btn.style.setProperty('-webkit-backdrop-filter', 'blur(16px) saturate(200%)');
			btn.style.boxShadow = "0 8px 24px rgba(59, 130, 246, 0.35), 0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)";
			btn.style.border = "1px solid rgba(59, 130, 246, 0.5)";
		});

		btn.addEventListener("mouseleave", () => {
			btn.style.transform = "translateY(0) scale(1)";
			btn.style.backdropFilter = "blur(12px) saturate(180%)";
			btn.style.setProperty('-webkit-backdrop-filter', 'blur(12px) saturate(180%)');
			btn.style.boxShadow = "0 4px 16px rgba(59, 130, 246, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)";
			btn.style.border = "1px solid rgba(59, 130, 246, 0.3)";
		});

		// Add active effect
		btn.addEventListener("mousedown", () => {
			btn.style.transform = "translateY(0) scale(0.98)";
			btn.style.boxShadow = "0 2px 8px rgba(59, 130, 246, 0.3), 0 1px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(0, 0, 0, 0.1)";
		});

		// Variables pour le sous-menu
		let subMenuContainer: HTMLElement | null = null;
		let originalElements: HTMLElement[] = [];
		let isSubMenuOpen = false;

		// Gestionnaire d'événement pour ouvrir le sous-menu
		btn.addEventListener("click", () => {
			if (!option.fields || option.fields.length === 0) {
				if (option.onChange) {
					option.onChange(option.value as boolean);
				}
				return;
			}

			if (isSubMenuOpen) {
				this.closeSubMenu();
				return;
			}

			// Sauvegarder et masquer les éléments originaux
			originalElements = [];
			const allSections = document.querySelectorAll('.menu-section');
			allSections.forEach(section => {
				originalElements.push(section as HTMLElement);
				(section as HTMLElement).style.display = 'none';
			});

			const grid = document.getElementById('kxsMenuGrid');
			if (grid) {
				originalElements.push(grid as HTMLElement);
				grid.style.display = 'none';
			}

			// Créer le conteneur du sous-menu avec glassmorphism amélioré
			subMenuContainer = document.createElement("div");
			subMenuContainer.id = "kxs-submenu";
			subMenuContainer.className = "kxs-submenu-container";

			// Appliquer l'effet glassmorphism moderne au sous-menu
			DesignSystem.applyGlassEffect(subMenuContainer, this.kxsClient.isGlassmorphismEnabled ? 'medium' : 'dark', {
				width: "100%",
				padding: "10px 0",
				boxSizing: "border-box",
				overflowY: "auto",
				borderRadius: "16px",
				border: this.kxsClient.isGlassmorphismEnabled
					? "1px solid rgba(255, 255, 255, 0.15)"
					: "1px solid rgba(31, 41, 55, 0.8)",
				background: this.kxsClient.isGlassmorphismEnabled
					? "rgba(17, 24, 39, 0.3)"
					: "rgba(17, 24, 39, 0.95)",
				backdropFilter: this.kxsClient.isGlassmorphismEnabled
					? "blur(20px) saturate(180%)"
					: "none",
				WebkitBackdropFilter: this.kxsClient.isGlassmorphismEnabled
					? "blur(20px) saturate(180%)"
					: "none"
			});

			this.blockMousePropagation(subMenuContainer);

			// Créer l'en-tête du sous-menu avec glassmorphism
			const subMenuHeader = document.createElement("div");
			Object.assign(subMenuHeader.style, {
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center",
				marginBottom: isMobile ? "10px" : "15px",
				paddingBottom: isMobile ? "5px" : "10px",
				borderBottom: this.kxsClient.isGlassmorphismEnabled
					? "1px solid rgba(255, 255, 255, 0.1)"
					: "1px solid rgba(255, 255, 255, 0.1)",
				paddingLeft: isMobile ? "10px" : "15px",
				paddingRight: isMobile ? "10px" : "15px",
				width: "100%",
				boxSizing: "border-box",
				background: this.kxsClient.isGlassmorphismEnabled
					? "rgba(31, 41, 55, 0.2)"
					: "rgba(31, 41, 55, 0.3)",
				borderRadius: "12px",
				backdropFilter: this.kxsClient.isGlassmorphismEnabled
					? "blur(10px)"
					: "none",
				WebkitBackdropFilter: this.kxsClient.isGlassmorphismEnabled
					? "blur(10px)"
					: "none"
			});
			this.blockMousePropagation(subMenuHeader);

			// Bouton de retour avec glassmorphism
			const backBtn = document.createElement("button");
			backBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 19L8 12L15 5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg> Back`;

			DesignSystem.applyGlassEffect(backBtn, this.kxsClient.isGlassmorphismEnabled ? 'light' : 'dark', {
				background: this.kxsClient.isGlassmorphismEnabled
					? "rgba(255, 255, 255, 0.1)"
					: "rgba(55, 65, 81, 0.8)",
				border: this.kxsClient.isGlassmorphismEnabled
					? "1px solid rgba(255, 255, 255, 0.2)"
					: "1px solid rgba(75, 85, 99, 0.5)",
				borderRadius: "8px",
				color: "#fff",
				cursor: "pointer",
				display: "flex",
				alignItems: "center",
				gap: "6px",
				padding: isMobile ? "4px 8px" : "6px 12px",
				fontSize: isMobile ? "12px" : "14px",
				backdropFilter: this.kxsClient.isGlassmorphismEnabled ? "blur(8px)" : "none",
				WebkitBackdropFilter: this.kxsClient.isGlassmorphismEnabled ? "blur(8px)" : "none",
				transition: "all 0.3s ease"
			});
			this.blockMousePropagation(backBtn);

			// Titre du sous-menu
			const subMenuTitle = document.createElement("h3");
			subMenuTitle.textContent = option.label;
			Object.assign(subMenuTitle.style, {
				margin: "0",
				color: "#fff",
				fontSize: isMobile ? "16px" : "20px",
				fontWeight: "bold",
				textAlign: "center",
				flex: "1",
				textShadow: "0 1px 3px rgba(0, 0, 0, 0.3)"
			});
			this.blockMousePropagation(subMenuTitle);

			// Ajouter l'événement au bouton retour
			backBtn.addEventListener("click", () => {
				this.closeSubMenu();
			});

			// Effet hover pour le bouton retour
			backBtn.addEventListener("mouseenter", () => {
				backBtn.style.background = this.kxsClient.isGlassmorphismEnabled
					? "rgba(255, 255, 255, 0.15)"
					: "rgba(75, 85, 99, 0.8)";
				backBtn.style.transform = "translateY(-1px)";
			});

			backBtn.addEventListener("mouseleave", () => {
				backBtn.style.background = this.kxsClient.isGlassmorphismEnabled
					? "rgba(255, 255, 255, 0.1)"
					: "rgba(55, 65, 81, 0.8)";
				backBtn.style.transform = "translateY(0)";
			});

			// Assembler l'en-tête
			subMenuHeader.appendChild(backBtn);
			subMenuHeader.appendChild(subMenuTitle);
			subMenuHeader.appendChild(document.createElement("div")); // Espace vide pour l'équilibre
			subMenuContainer.appendChild(subMenuHeader);

			// Créer la grille pour les options avec glassmorphism
			const optionsGrid = document.createElement("div");
			Object.assign(optionsGrid.style, {
				display: "grid",
				gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
				gap: isMobile ? "8px" : "16px",
				padding: isMobile ? "8px" : "16px",
				gridAutoRows: isMobile ? "minmax(100px, auto)" : "minmax(150px, auto)",
				width: "100%",
				boxSizing: "border-box"
			});
			this.blockMousePropagation(optionsGrid);

			// Créer les cartes pour chaque option avec glassmorphism
			option.fields.forEach(mod => {
				this.createModCard(mod, optionsGrid);
			});

			subMenuContainer.appendChild(optionsGrid);

			// Ajouter le sous-menu au menu principal
			this.menu.appendChild(subMenuContainer);
			isSubMenuOpen = true;

			// Définir la méthode pour fermer le sous-menu
			this.closeSubMenu = () => {
				if (subMenuContainer && subMenuContainer.parentElement) {
					subMenuContainer.parentElement.removeChild(subMenuContainer);
				}

				// Réafficher tous les éléments originaux
				originalElements.forEach(el => {
					if (el.id === 'kxsMenuGrid') {
						el.style.display = 'flex';
					} else {
						el.style.display = 'block';
					}
				});

				this.filterOptions();
				subMenuContainer = null;
				isSubMenuOpen = false;
			};

			if (option.onChange) {
				option.onChange(option.value as boolean);
			}
		});

		this.blockMousePropagation(btn);
		return btn;
	}

	private createModCard(mod: Mod, container: HTMLElement): void {
		const modCard = document.createElement("div");
		const isMobile = this.kxsClient.isMobile && this.kxsClient.isMobile();

		// Appliquer l'effet glassmorphism aux cartes des mods
		DesignSystem.applyGlassEffect(modCard, this.kxsClient.isGlassmorphismEnabled ? 'medium' : 'dark', {
			background: this.kxsClient.isGlassmorphismEnabled
				? "rgba(31, 41, 55, 0.4)"
				: "rgba(31, 41, 55, 0.8)",
			borderRadius: "12px",
			padding: isMobile ? "12px" : "16px",
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
			gap: isMobile ? "8px" : "12px",
			minHeight: isMobile ? "100px" : "150px",
			border: this.kxsClient.isGlassmorphismEnabled
				? "1px solid rgba(255, 255, 255, 0.15)"
				: "1px solid rgba(255, 255, 255, 0.1)",
			backdropFilter: this.kxsClient.isGlassmorphismEnabled
				? "blur(12px) saturate(180%)"
				: "none",
			WebkitBackdropFilter: this.kxsClient.isGlassmorphismEnabled
				? "blur(12px) saturate(180%)"
				: "none",
			boxShadow: this.kxsClient.isGlassmorphismEnabled
				? "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
				: "0 4px 16px rgba(0, 0, 0, 0.2)",
			transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
			cursor: "default"
		});

		// Effet hover pour les cartes
		modCard.addEventListener("mouseenter", () => {
			modCard.style.transform = "translateY(-2px) scale(1.02)";
			modCard.style.boxShadow = this.kxsClient.isGlassmorphismEnabled
				? "0 12px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)"
				: "0 8px 24px rgba(0, 0, 0, 0.3)";
			modCard.style.border = this.kxsClient.isGlassmorphismEnabled
				? "1px solid rgba(255, 255, 255, 0.2)"
				: "1px solid rgba(255, 255, 255, 0.15)";
		});

		modCard.addEventListener("mouseleave", () => {
			modCard.style.transform = "translateY(0) scale(1)";
			modCard.style.boxShadow = this.kxsClient.isGlassmorphismEnabled
				? "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
				: "0 4px 16px rgba(0, 0, 0, 0.2)";
			modCard.style.border = this.kxsClient.isGlassmorphismEnabled
				? "1px solid rgba(255, 255, 255, 0.15)"
				: "1px solid rgba(255, 255, 255, 0.1)";
		});

		// Icône avec effet glassmorphism
		const iconContainer = document.createElement("div");
		DesignSystem.applyGlassEffect(iconContainer, this.kxsClient.isGlassmorphismEnabled ? 'light' : 'dark', {
			width: isMobile ? "32px" : "40px",
			height: isMobile ? "32px" : "40px",
			borderRadius: "50%",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			marginBottom: isMobile ? "4px" : "8px",
			background: this.kxsClient.isGlassmorphismEnabled
				? "rgba(59, 130, 246, 0.15)"
				: "rgba(59, 130, 246, 0.1)",
			border: this.kxsClient.isGlassmorphismEnabled
				? "1px solid rgba(59, 130, 246, 0.3)"
				: "1px solid rgba(59, 130, 246, 0.2)",
			backdropFilter: this.kxsClient.isGlassmorphismEnabled ? "blur(8px)" : "none",
			WebkitBackdropFilter: this.kxsClient.isGlassmorphismEnabled ? "blur(8px)" : "none"
		});
		iconContainer.innerHTML = mod.icon || '';

		// Titre avec effet de texte
		const title = document.createElement("div");
		title.textContent = mod.label;
		Object.assign(title.style, {
			fontSize: isMobile ? "14px" : "16px",
			textAlign: "center",
			color: "#ffffff",
			fontWeight: "600",
			textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
			marginBottom: "8px"
		});

		// Contrôle selon le type
		let control: null | HTMLElement = null;

		switch (mod.type) {
			case ModType.Info:
				control = this.createInfoElement(mod);
				break;
			case ModType.Input:
				control = this.createInputElement(mod);
				break;
			case ModType.Toggle:
				control = this.createToggleButton(mod);
				break;
			case ModType.Slider:
				control = this.createSliderElement(mod);
				break;
			case ModType.Click:
				control = this.createClickButton(mod);
		}

		modCard.appendChild(iconContainer);
		modCard.appendChild(title);
		if (control) {
			modCard.appendChild(control);
		}

		container.appendChild(modCard);
		this.blockMousePropagation(modCard);
	}

	// 5. Mise à jour de la méthode pour gérer la fermeture automatique lors des recherches
	private createHeader(): void {
		const header = document.createElement("div");

		// Mobile detection for reduced styles
		const isMobile = this.kxsClient.isMobile && this.kxsClient.isMobile();

		const logoSize = isMobile ? 20 : 30;
		const titleFontSize = isMobile ? 12 : 20;
		const headerGap = isMobile ? 4 : 10;
		const headerMarginBottom = isMobile ? 8 : 20;
		const closeBtnPadding = isMobile ? 2 : 6;
		const closeBtnFontSize = isMobile ? 12 : 18;
		const discordBtnPadding = isMobile ? '4px 6px' : '6px 12px';
		const discordBtnFontSize = isMobile ? 10 : 12;
		const discordIconSize = isMobile ? 12 : 16;

		header.style.marginBottom = `${headerMarginBottom}px`;
		header.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${isMobile ? 7 : 15}px; width: 100%; box-sizing: border-box;">
        <div style="display: flex; align-items: center; gap: ${headerGap}px;">
            <img src="${kxs_logo}" 
                alt="Logo" style="width: ${logoSize}px; height: ${logoSize}px;">
            <span style="font-size: ${titleFontSize}px; font-weight: bold;">KXS CLIENT <span style="
             font-size: ${isMobile ? 10 : 14}px;
             font-weight: 700;
             color: #3B82F6;
             opacity: 0.95;
             position: relative;
             top: ${isMobile ? -1 : -2}px;
             margin-left: ${isMobile ? 2 : 3}px;
             letter-spacing: 0.5px;
           ">v${this.kxsClient.pkg.version}</span></span>
        </div>
        <div style="display: flex; gap: ${headerGap}px; align-items: center;">
          <button id="discordBtn" style="
            padding: ${discordBtnPadding};
            border: none;
            border-radius: ${isMobile ? '3px' : '4px'};
            color: white;
            cursor: pointer;
            font-size: ${discordBtnFontSize}px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: ${isMobile ? '3px' : '6px'};
            transition: background 0.2s;
          " onmouseover="this.style.background='#4752C4'" onmouseout="this.style.background='#242632'">
            <svg width="${discordIconSize}" height="${discordIconSize}" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            ${isMobile ? '' : 'Join Discord'}
          </button>
          <button style="
            padding: ${closeBtnPadding}px;
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: ${closeBtnFontSize}px;
          ">×</button>
        </div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 15px; width: 100%; box-sizing: border-box;">
        <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 5px;">
          ${category.map(cat => `
            <button class="category-btn" data-category="${cat}" style="
              padding: ${isMobile ? '2px 6px' : '6px 16px'};
              background: ${this.activeCategory === cat ? '#3B82F6' : 'rgba(55, 65, 81, 0.8)'};
              border: none;
              border-radius: ${isMobile ? '3px' : '6px'};
              color: white;
              cursor: pointer;
              font-size: ${isMobile ? '9px' : '14px'};
              transition: background 0.2s;
            ">${cat}</button>
          `).join('')}
        </div>
        <div style="display: flex; width: 100%; box-sizing: border-box;">
          <div style="position: relative; width: 100%; box-sizing: border-box;">
            <input type="text" id="kxsSearchInput" placeholder="Search options..." style="
              width: 100%;
              padding: ${isMobile ? '3px 5px 3px 20px' : '8px 12px 8px 32px'};
              background: rgba(55, 65, 81, 0.8);
              border: none;
              border-radius: ${isMobile ? '3px' : '6px'};
              color: white;
              font-size: ${isMobile ? '9px' : '14px'};
              outline: none;
              box-sizing: border-box;
            ">
            <div style="
              position: absolute;
              left: ${isMobile ? '4px' : '10px'};
              top: 50%;
              transform: translateY(-50%);
              width: ${isMobile ? '9px' : '14px'};
              height: ${isMobile ? '9px' : '14px'};
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
			this.blockMousePropagation(btn as HTMLElement);
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

		// Discord button event listener
		const discordButton = header.querySelector('#discordBtn');
		DesignSystem.applyGlassEffect((discordButton as HTMLElement), this.kxsClient.isGlassmorphismEnabled ? 'medium' : 'dark')
		if (discordButton) {
			this.blockMousePropagation(discordButton as HTMLElement);
			discordButton.addEventListener('click', () => {
				// Open Discord invite link in new tab
				window.open('https://discord.wf/kxsclient', '_blank');
			});
		}

		const searchInput = header.querySelector('#kxsSearchInput') as HTMLInputElement;
		if (searchInput) {
			this.blockMousePropagation(searchInput, false);
			// Handler to update search
			searchInput.addEventListener('input', (e) => {
				// Fermer le sous-menu si ouvert lors de la recherche
				if (this.closeSubMenu) {
					this.closeSubMenu();
				}

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

			// Prevent search bar from automatically refocusing
			// when user interacts with another text field
			searchInput.addEventListener('blur', (e) => {
				// Don't refocus if user clicked on another input
				const newFocusElement = e.relatedTarget as HTMLElement | null;
				if (newFocusElement && (newFocusElement.tagName === 'INPUT' || newFocusElement.tagName === 'TEXTAREA')) {
					// User clicked on another text field, don't refocus
					return;
				}

				// For other cases, only if no other element has focus (optimized)
				requestAnimationFrame(() => {
					const activeElement = document.activeElement as HTMLElement | null;
					if (this.isClientMenuVisible &&
						activeElement &&
						activeElement !== searchInput &&
						activeElement.tagName !== 'INPUT' &&
						activeElement.tagName !== 'TEXTAREA') {
						searchInput.focus();
					}
				});
			});
		}

		this.menu.appendChild(header);
	}

	private addDragListeners(): void {
		this.menu.addEventListener('mousedown', (e: MouseEvent) => {
			// Ne pas arrêter la propagation si l'événement vient d'un élément interactif
			if (
				e.target instanceof HTMLElement &&
				e.target.matches("input, select, button, svg, path")
			) {
				// Laisser l'événement se propager aux éléments interactifs
				return;
			}

			// Empêcher la propagation de l'événement mousedown vers la page web
			e.stopPropagation();

			// Activer le drag & drop seulement si on clique sur une zone non interactive
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

		// Optimized: use throttled mousemove for better performance
		let mouseMoveThrottle = false;
		document.addEventListener('mousemove', (e) => {
			if (this.isDragging && !mouseMoveThrottle) {
				mouseMoveThrottle = true;
				requestAnimationFrame(() => {
					const x = e.clientX - this.dragOffset.x;
					const y = e.clientY - this.dragOffset.y;
					this.menu.style.transform = 'none';
					this.menu.style.left = `${x}px`;
					this.menu.style.top = `${y}px`;
					mouseMoveThrottle = false;
				});
			}
		});

		document.addEventListener('mouseup', (e) => {
			// Arrêter le drag & drop
			const wasDragging = this.isDragging;
			this.isDragging = false;
			this.menu.style.cursor = "grab";

			// Empêcher la propagation de l'événement mouseup vers la page web
			// seulement si l'événement vient du menu et n'est pas un élément interactif
			if (this.menu.contains(e.target as Node)) {
				if (wasDragging || !(e.target instanceof HTMLElement && e.target.matches("input, select, button, svg, path"))) {
					e.stopPropagation();
				}
			}
		});
	}

	public toggleMenuVisibility(): void {
		this.isClientMenuVisible = !this.isClientMenuVisible;
		// Mettre à jour la propriété publique en même temps
		this.isOpen = this.isClientMenuVisible;

		if (this.kxsClient.isNotifyingForToggleMenu) {
			this.kxsClient.nm.showNotification(this.isClientMenuVisible ? "Opening menu..." : "Closing menu...", "info", 1100);
		}

		this.menu.style.display = this.isClientMenuVisible ? "block" : "none";

		// If opening the menu, make sure to display options
		if (this.isClientMenuVisible) {
			this.filterOptions();
		}

		// Notifier immédiatement tous les callbacks enregistrés
		this.onMenuToggle.forEach(callback => {
			try {
				callback();
			} catch (error) {
				return;
			}
		});
	}

	destroy() {
		// Supprimer tous les écouteurs d'événements keydown du document
		// Nous ne pouvons pas supprimer directement l'écouteur anonyme, mais ce n'est pas grave
		// car la vérification isClientMenuVisible empêchera toute action une fois le menu détruit

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

	public getMenuVisibility(): boolean {
		return this.isClientMenuVisible;
	}
}

export { KxsClientSecondaryMenu };