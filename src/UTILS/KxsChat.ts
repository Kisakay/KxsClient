import KxsClient from "../KxsClient";

class KxsChat {
	private chatInput: HTMLInputElement | null = null;
	private chatBox: HTMLDivElement | null = null;
	private messagesContainer: HTMLDivElement | null = null;
	private chatMessages: { user: string, text: string, isSystem?: boolean, isError: boolean }[] = [];
	private chatOpen = false;
	private kxsClient: KxsClient;
	private resizeObserver: ResizeObserver | null = null;

	constructor(kxsClient: KxsClient) {
		this.kxsClient = kxsClient;

		this.initGlobalChat();

		// Initialize chat visibility based on the current setting
		if (this.chatBox && !this.kxsClient.isKxsChatEnabled) {
			this.chatBox.style.display = 'none';
			window.removeEventListener('keydown', this.handleKeyDown);
		}

		// Ajouter un gestionnaire de clic global pour fermer le chat lorsqu'on clique ailleurs
		document.addEventListener('mousedown', this.handleDocumentClick);
	}

	private handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Enter' && !this.chatOpen && document.activeElement !== this.chatInput) {
			e.preventDefault();
			this.openChatInput();
		} else if (e.key === 'Escape' && this.chatOpen) {
			this.closeChatInput();
		}
	};

	// Gestionnaire de clic sur le document pour fermer le chat quand on clique ailleurs
	private handleDocumentClick = (e: MouseEvent) => {
		// Si le chat est ouvert et qu'on clique en dehors du chat
		if (this.chatOpen && this.chatBox && this.chatInput) {
			// Vérifie si le clic est en dehors du chatBox
			const target = e.target as Node;
			if (!this.chatBox.contains(target) && target !== this.chatInput) {
				// Ferme le chat si on clique ailleurs
				this.closeChatInput();
			}
		}
	};

	private initGlobalChat() {
		
		if (this.chatBox) return;

		// FIX: Always attach to body so it doesn't get hidden when game-touch-area is hidden
		const area = document.body;

		// Chat box
		const chatBox = document.createElement('div');
		chatBox.id = 'kxs-chat-box';

		// Messages container
		const messagesContainer = document.createElement('div');
		messagesContainer.id = 'kxs-chat-messages';
		messagesContainer.style.display = 'flex';
		messagesContainer.style.flexDirection = 'column';
		messagesContainer.style.gap = '3px';
		messagesContainer.style.flexGrow = '1'; // Prend tout l'espace disponible
		messagesContainer.style.overflow = 'hidden'; // Masque le contenu qui dépasse au lieu d'afficher une barre de défilement
		messagesContainer.style.minHeight = '100px'; // Hauteur minimale pour assurer l'espace
		messagesContainer.style.maxHeight = '300px'; // Hauteur maximale pour éviter qu'il ne devienne trop grand
		chatBox.appendChild(messagesContainer);
		this.messagesContainer = messagesContainer;
		
		// FIX: Use 'fixed' instead of 'absolute' to keep it on screen regardless of scrolling/containers
		chatBox.style.position = 'fixed';

		// Chatbox Position (Right under kills section!)
		chatBox.style.left = '20px';
		chatBox.style.top = '360px';
		chatBox.style.bottom = 'unset';
		chatBox.style.minWidth = '160px';
		chatBox.style.maxWidth = '280px';
		chatBox.style.minHeight = '150px'; // Hauteur minimale pour le chat box
		chatBox.style.height = '150px'; // Hauteur par défaut

		// Apply styling based on glassmorphism toggle
		const is_glassmorphism_enabled = this.kxsClient.isGlassmorphismEnabled;

		if (is_glassmorphism_enabled) {
			// Glassmorphism style
			chatBox.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))';
			chatBox.style.backdropFilter = 'blur(40px) saturate(180%)';
			(chatBox.style as any)['-webkitBackdropFilter'] = 'blur(40px) saturate(180%)';
			chatBox.style.border = '1px solid rgba(255, 255, 255, 0.3)';
			chatBox.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)';
		} else {
			// Classic style - solid gray background without blur
			chatBox.style.background = 'rgba(50, 50, 50, 0.95)';
			chatBox.style.backdropFilter = 'none';
			(chatBox.style as any)['-webkitBackdropFilter'] = 'none';
			chatBox.style.border = '1px solid #555';
			chatBox.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
		}
		chatBox.style.color = '#fff';
		chatBox.style.borderRadius = '15px';
		chatBox.style.padding = '7px 14px 4px 14px';
		chatBox.style.fontSize = '15px';
		chatBox.style.fontFamily = 'inherit';
		
		// FIX: Increase Z-Index to ensure it sits above the Homepage Menu (which often has high z-index)
		chatBox.style.zIndex = '999999';
		
		chatBox.style.pointerEvents = 'auto';
		chatBox.style.cursor = 'move'; // Indique que c'est déplaçable
		chatBox.style.display = 'flex';
		chatBox.style.flexDirection = 'column';
		chatBox.style.gap = '3px';
		chatBox.style.opacity = '0.5';
		chatBox.style.overflow = 'hidden'; // Nécessaire pour le redimensionnement

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

		// Configurer un ResizeObserver pour détecter les changements de taille de la chatBox
		this.resizeObserver = new ResizeObserver(() => {
			// Quand la taille change, mettre à jour l'affichage des messages
			this.renderMessages();
		});

		// Observer la chatBox pour les changements de dimensions
		if (this.chatBox) {
			this.resizeObserver.observe(this.chatBox);
		}

		// Rendre la chatbox draggable et resizable UNIQUEMENT si le menu secondaire est ouvert
		const updateChatDraggable = () => {
			const isMenuOpen = this.kxsClient.secondaryMenu.getMenuVisibility()

			if (isMenuOpen) {
				chatBox.style.pointerEvents = 'auto';
				chatBox.style.cursor = 'move';
				chatBox.style.resize = 'both'; // Active le redimensionnement avec l'indicateur gris
				this.kxsClient.makeDraggable(chatBox, 'kxs-chat-box-position');
			} else {
				chatBox.style.pointerEvents = 'none';
				chatBox.style.cursor = 'default';
				chatBox.style.resize = 'none'; // Désactive le redimensionnement
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
		// Apply styling based on glassmorphism toggle for input
		if (this.kxsClient.isGlassmorphismEnabled) {
			// Glassmorphism style
			input.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))';
			input.style.backdropFilter = 'blur(25px) saturate(150%)';
			(input.style as any)['-webkit-backdrop-filter'] = 'blur(25px) saturate(150%)';
			input.style.border = '1px solid rgba(255, 255, 255, 0.35)';
			input.style.boxShadow = '0 4px 20px 0 rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1)';
		} else {
			// Classic style - solid gray background without blur
			input.style.background = 'rgba(60, 60, 60, 0.95)';
			input.style.backdropFilter = 'none';
			(input.style as any)['-webkit-backdrop-filter'] = 'none';
			input.style.border = '1px solid #666';
			input.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
		}
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

		this.addSystemMessage(`Wanna disable the chat ? Right Shift => ${client.acronym_start_upper} Network => Chat 🙂`)
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
		this.chatMessages.push({ user, text, isSystem: false, isError: false });
		this.renderMessages();
	}

	/**
	 * Ajoute un message système dans le chat
	 * @param text Texte du message système
	 */
	public addSystemMessage(text: string) {
		if (!this.chatBox || !this.kxsClient.isKxsChatEnabled) return;

		// Ajouter le message système avec un marqueur spécifique isSystem = true
		this.chatMessages.push({ user: "", text, isSystem: true, isError: false });
		this.renderMessages();
	}

	/**
	 * Ajoute un message système dans le chat
	 * @param text Texte du message système
	 */
	public addErrorMessage(text: string) {
		if (!this.chatBox || !this.kxsClient.isKxsChatEnabled) return;

		// Ajouter le message système avec un marqueur spécifique isSystem = true
		this.chatMessages.push({ user: "", text, isSystem: true, isError: true });
		this.renderMessages();
	}

	/**
	 * Calcule le nombre de messages qui peuvent s'afficher dans la division du chat
	 * @returns Le nombre de messages qui peuvent s'afficher
	 */
	private calculateVisibleMessageCount(): number {
		if (!this.chatBox || !this.messagesContainer) return 5; // Valeur par défaut

		// Obtenir les dimensions réelles du conteneur de messages
		const rect = this.messagesContainer.getBoundingClientRect();
		const container_height = rect.height;

		// Si la hauteur est toujours trop petite, utiliser une valeur par défaut
		if (container_height < 50) {
			// Utiliser la hauteur du chatBox comme base et soustraire l'espace pour l'input
			const chat_box_height = this.chatBox.clientHeight;
			const input_height = this.chatInput ? this.chatInput.clientHeight : 40; // Valeur par défaut si input n'est pas disponible
			const padding = 20; // Estimation du padding total
			const estimated_container_height = chat_box_height - input_height - padding;

			// Estimation de la hauteur moyenne d'un message (en pixels)
			const average_message_height = 22; // ~22px par message avec la taille de police actuelle

			// Calcul du nombre de messages qui peuvent s'afficher
			const visible_count = Math.max(1, Math.floor(estimated_container_height / average_message_height));
			return visible_count;
		}

		// Estimation de la hauteur moyenne d'un message (en pixels)
		const average_message_height = 22; // ~22px par message avec la taille de police actuelle

		// Calcul du nombre de messages qui peuvent s'afficher
		const visible_count = Math.max(1, Math.floor(container_height / average_message_height));
		return visible_count;
	}

	/**
	 * Rend les messages du chat avec leur style approprié
	 */
	private renderMessages() {
		if (!this.messagesContainer) return;

		// Calcule combien de messages peuvent s'afficher
		const visible_count = this.calculateVisibleMessageCount();

		// Sélectionne les messages les plus récents qui peuvent s'afficher
		const visible_messages = this.chatMessages.slice(-visible_count);

		// Rend les messages visibles
		this.messagesContainer.innerHTML = visible_messages.map(m => {
			if (m.isSystem && m.isError) {
				return `<div style='color:#EB3023; font-style:italic; margin-bottom:4px;'>${m.text}</div>`;
			} else if (m.isSystem) {
				return `<div style='color:#3B82F6; font-style:italic; margin-bottom:4px;'>${m.text}</div>`;
			} else {
				return `<div style='margin-bottom:4px;'><b style='color:#3fae2a;'>${m.user}</b>: ${m.text}</div>`;
			}
		}).join('');

		// Scroll to the bottom of the chatbox
		this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
	}

	public toggleChat() {
		if (this.chatBox) {
			this.chatBox.style.display = this.kxsClient.isKxsChatEnabled ? 'flex' : 'none';
		}

		if (this.kxsClient.isKxsChatEnabled) {
			window.addEventListener('keydown', this.handleKeyDown);
			// S'assurer que le gestionnaire de clic est actif
			document.addEventListener('mousedown', this.handleDocumentClick);
		} else {
			this.closeChatInput();
			window.removeEventListener('keydown', this.handleKeyDown);
			// Retirer le gestionnaire de clic si le chat est désactivé
			document.removeEventListener('mousedown', this.handleDocumentClick);
		}

		const message = this.kxsClient.isKxsChatEnabled ? 'Chat enabled' : 'Chat disabled';
		const type = this.kxsClient.isKxsChatEnabled ? 'success' : 'info';
		this.kxsClient.nm.showNotification(message, type, 600);
	}
}

export {
	KxsChat
}