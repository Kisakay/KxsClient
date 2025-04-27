import KxsClient from "../KxsClient";

class KxsChat {
	private chatInput: HTMLInputElement | null = null;
	private chatBox: HTMLDivElement | null = null;
	private messagesContainer: HTMLDivElement | null = null;
	private chatMessages: { user: string, text: string }[] = [];
	private chatOpen = false;
	private kxsClient: KxsClient;

	constructor(kxsClient: KxsClient) {
		this.kxsClient = kxsClient;

		this.initGlobalChat();
	}

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
		chatBox.style.background = 'rgba(30,30,40,0.80)';
		chatBox.style.color = '#fff';
		chatBox.style.borderRadius = '10px';
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
		area.appendChild(chatBox);
		this.chatBox = chatBox;
		// Rendre la chatbox draggable
		this.kxsClient.makeDraggable(chatBox, 'kxs-chat-box-position');
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
		input.style.background = 'rgba(40,40,50,0.95)';
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
						if (txt) this.kxsClient.kxsNetwork.sendGlobalChatMessage(txt);
						input.value = '';
						this.closeChatInput();
					} else if (ke.key === 'Escape') {
						this.closeChatInput();
					}
				}
				e.stopImmediatePropagation();
				e.stopPropagation();
			}, true);
		});

		// Gestion clavier
		window.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' && !this.chatOpen && document.activeElement !== input) {
				e.preventDefault();
				this.openChatInput();
			} else if (e.key === 'Escape' && this.chatOpen) {
				this.closeChatInput();
			}
		});

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
		if (!this.chatBox) return;
		this.chatMessages.push({ user, text });
		if (this.chatMessages.length > 5) this.chatMessages.shift();
		if (this.messagesContainer) {
			this.messagesContainer.innerHTML = this.chatMessages.map(m => `<span><b style='color:#3fae2a;'>${m.user}</b>: ${m.text}</span>`).join('');
		}
	}
}

export {
	KxsChat
}