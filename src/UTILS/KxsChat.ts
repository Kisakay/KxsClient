import KxsClient from "../KxsClient";

class KxsChat {
	private chatInput: HTMLInputElement | null = null;
	private chatBox: HTMLDivElement | null = null;
	private messagesContainer: HTMLDivElement | null = null;
	private chatMessages: { user: string, text: string, isSystem?: boolean }[] = [];
	private chatOpen = false;
	private kxsClient: KxsClient;

	constructor(kxsClient: KxsClient) {
		this.kxsClient = kxsClient;

		this.initGlobalChat();

		// Initialize chat visibility based on the current setting
		if (this.chatBox && !this.kxsClient.isKxsChatEnabled) {
			this.chatBox.style.display = 'none';
			window.removeEventListener('keydown', this.handleKeyDown);
		}
	}

	private handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Enter' && !this.chatOpen && document.activeElement !== this.chatInput) {
			e.preventDefault();
			this.openChatInput();
		} else if (e.key === 'Escape' && this.chatOpen) {
			this.closeChatInput();
		}
	};

	private initGlobalChat() {
		const area = document.getElementById('game-touch-area');
		if (!area) return;
		// Chat box
		const chatBox = document.createElement('div');
		chatBox.id = 'kxs-chat-box';

		// Messages container
		const messagesContainer = document.createElement('div');
		messagesContainer.id = 'kxs-chat-messages';
		messagesContainer.style.display = 'flex';
		messagesContainer.style.flexDirection = 'column';
		messagesContainer.style.gap = '3px';
		chatBox.appendChild(messagesContainer);
		this.messagesContainer = messagesContainer;
		chatBox.style.position = 'absolute';
		chatBox.style.left = '50%';
		chatBox.style.bottom = '38px';
		chatBox.style.transform = 'translateX(-50%)';
		chatBox.style.minWidth = '260px';
		chatBox.style.maxWidth = '480px';
		chatBox.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))';
		chatBox.style.backdropFilter = 'blur(40px) saturate(180%)';
		(chatBox.style as any)['-webkitBackdropFilter'] = 'blur(40px) saturate(180%)';
		chatBox.style.border = '1px solid rgba(255, 255, 255, 0.3)';
		chatBox.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)';
		chatBox.style.color = '#fff';
		chatBox.style.borderRadius = '15px';
		chatBox.style.padding = '7px 14px 4px 14px';
		chatBox.style.fontSize = '15px';
		chatBox.style.fontFamily = 'inherit';
		chatBox.style.zIndex = '1002';
		chatBox.style.pointerEvents = 'auto';
		chatBox.style.cursor = 'move'; // Indique que c'est déplaçable
		chatBox.style.display = 'flex';
		chatBox.style.flexDirection = 'column';
		chatBox.style.gap = '3px';
		chatBox.style.opacity = '0.5';

		// Charger la position sauvegardée dès l'initialisation
		const savedPosition = localStorage.getItem('kxs-chat-box-position');
		if (savedPosition) {
			try {
				const { x, y } = JSON.parse(savedPosition);
				chatBox.style.left = `${x}px`;
				chatBox.style.top = `${y}px`;
				chatBox.style.position = 'absolute';
			} catch (e) { }
		}

		area.appendChild(chatBox);
		this.chatBox = chatBox;
		// Rendre la chatbox draggable UNIQUEMENT si le menu secondaire est ouvert
		const updateChatDraggable = () => {
			const isMenuOpen = this.kxsClient.secondaryMenu.getMenuVisibility()

			if (isMenuOpen) {
				chatBox.style.pointerEvents = 'auto';
				chatBox.style.cursor = 'move';
				this.kxsClient.makeDraggable(chatBox, 'kxs-chat-box-position');
			} else {
				chatBox.style.pointerEvents = 'none';
				chatBox.style.cursor = 'default';
			}
		};
		// Initial state
		updateChatDraggable();
		// Observe menu changes
		const observer = new MutationObserver(updateChatDraggable);
		if (this.kxsClient.secondaryMenu && this.kxsClient.secondaryMenu.menu) {
			observer.observe(this.kxsClient.secondaryMenu.menu, { attributes: true, attributeFilter: ['style', 'class'] });
		}
		// Optionnel : timer pour fallback (si le menu est modifié autrement)
		setInterval(updateChatDraggable, 500);
		// Input
		const input = document.createElement('input');
		input.type = 'text';
		input.placeholder = 'Press Enter to write...';
		input.id = 'kxs-chat-input';
		input.style.width = '100%';
		input.style.boxSizing = 'border-box';
		input.style.padding = '8px 12px';
		input.style.borderRadius = '8px';
		input.style.border = 'none';
		input.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))';
		input.style.backdropFilter = 'blur(25px) saturate(150%)';
		(input.style as any)['-webkit-backdrop-filter'] = 'blur(25px) saturate(150%)';
		input.style.border = '1px solid rgba(255, 255, 255, 0.35)';
		input.style.boxShadow = '0 4px 20px 0 rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1)';
		input.style.color = '#fff';
		input.style.fontSize = '15px';
		input.style.fontFamily = 'inherit';
		input.style.zIndex = '1003';
		input.style.outline = 'none';
		input.style.display = this.chatOpen ? 'block' : 'none';
		input.style.opacity = '0.5';
		input.style.marginTop = 'auto'; // Pour coller l'input en bas
		chatBox.appendChild(input); // Ajoute l'input dans la chatBox
		this.chatInput = input;

		// Ajuste le style de chatBox pour le layout
		chatBox.style.display = 'flex';
		chatBox.style.flexDirection = 'column';
		chatBox.style.gap = '3px';
		chatBox.style.justifyContent = 'flex-end'; // S'assure que l'input est en bas

		// Focus automatique sur l'input quand on clique dessus ou sur la chatBox
		input.addEventListener('focus', () => {
			// Rien de spécial, mais peut servir à customiser plus tard
		});
		chatBox.addEventListener('mousedown', (e) => {
			// Focus l'input si clic sur la chatBox (hors drag)
			if (e.target === chatBox) {
				input.focus();
			}
		});
		input.addEventListener('mousedown', () => {
			input.focus();
		});


		['keydown', 'keypress', 'keyup'].forEach(eventType => {
			input.addEventListener(eventType, (e) => {
				const ke = e as KeyboardEvent;
				if (eventType === 'keydown') {
					if (ke.key === 'Enter') {
						const txt = input.value.trim();
						if (txt) {
							this.kxsClient.kxsNetwork.sendGlobalChatMessage(txt);
							input.value = '';
							this.closeChatInput();
						} else {
							// Ne ferme pas l'input si rien n'a été écrit
							input.value = '';
						}
					} else if (ke.key === 'Escape') {
						this.closeChatInput();
					}
				}
				e.stopImmediatePropagation();
				e.stopPropagation();
			}, true);
		});

		// Gestion clavier
		window.addEventListener('keydown', this.handleKeyDown);

	}

	private openChatInput() {
		if (!this.chatInput) return;
		this.chatInput.placeholder = 'Press Enter to write...';
		this.chatInput.value = '';
		this.chatInput.style.display = 'block';
		this.chatInput.focus();
		this.chatOpen = true;
	}

	private closeChatInput() {
		if (!this.chatInput) return;
		this.chatInput.style.display = 'none';
		this.chatInput.blur();
		this.chatOpen = false;
	}

	public addChatMessage(user: string, text: string) {
		if (!this.chatBox || !this.kxsClient.isKxsChatEnabled) return;
		this.chatMessages.push({ user, text, isSystem: false });
		if (this.chatMessages.length > 5) this.chatMessages.shift();
		this.renderMessages();
	}

	/**
	 * Ajoute un message système dans le chat
	 * @param text Texte du message système
	 */
	public addSystemMessage(text: string) {
		if (!this.chatBox || !this.kxsClient.isKxsChatEnabled) return;

		// Ajouter le message système avec un marqueur spécifique isSystem = true
		this.chatMessages.push({ user: "", text, isSystem: true });
		if (this.chatMessages.length > 5) this.chatMessages.shift();

		this.renderMessages();
	}

	/**
	 * Rend les messages du chat avec leur style approprié
	 */
	private renderMessages() {
		if (!this.messagesContainer) return;

		this.messagesContainer.innerHTML = this.chatMessages.map(m => {
			if (m.isSystem) {
				return `<span style='color:#3B82F6; font-style:italic;'>${m.text}</span>`;
			} else {
				return `<span><b style='color:#3fae2a;'>${m.user}</b>: ${m.text}</span>`;
			}
		}).join('');
	}

	public toggleChat() {
		if (this.chatBox) {
			this.chatBox.style.display = this.kxsClient.isKxsChatEnabled ? 'flex' : 'none';
		}

		if (this.kxsClient.isKxsChatEnabled) {
			window.addEventListener('keydown', this.handleKeyDown);
		} else {
			this.closeChatInput();
			window.removeEventListener('keydown', this.handleKeyDown);
		}

		const message = this.kxsClient.isKxsChatEnabled ? 'Chat enabled' : 'Chat disabled';
		const type = this.kxsClient.isKxsChatEnabled ? 'success' : 'info';
		this.kxsClient.nm.showNotification(message, type, 600);
	}
}

export {
	KxsChat
}