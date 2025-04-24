import KxsClient from "../KxsClient";

class GameHistoryMenu {
	private kxsClient: KxsClient;
	private container: HTMLDivElement;
	private closeBtn: HTMLButtonElement;

	constructor(kxsClient: KxsClient) {
		this.kxsClient = kxsClient;
		this.container = document.createElement('div');
		this.closeBtn = document.createElement('button');

		// Initialize container style
		this.initContainer();

		// Add close button
		this.addCloseButton();

		// Add header with title
		this.addHeader();

		// Load and display game history
		this.renderContent();
	}



	private initContainer() {
		const isMobile = this.kxsClient.isMobile && this.kxsClient.isMobile();

		// Position the menu in the center of the screen
		Object.assign(this.container.style, {
			position: 'fixed',
			top: '50%',
			left: '50%',
			transform: 'translate(-50%, -50%)',
			width: isMobile ? '78vw' : '700px',
			maxWidth: isMobile ? '84vw' : '90vw',
			maxHeight: isMobile ? '60vh' : '80vh',
			overflowY: 'auto',
			overflowX: 'hidden',
			backgroundColor: 'rgba(17, 24, 39, 0.95)',
			color: '#fff',
			borderRadius: isMobile ? '7px' : '12px',
			border: '1px solid rgba(60, 80, 120, 0.3)',
			boxShadow: '0 4px 20px rgba(0,0,0,0.8)',
			zIndex: '10001',
			padding: isMobile ? '6px' : '20px',
			boxSizing: 'border-box',
			fontFamily: "'Segoe UI', Arial, sans-serif",
		});
	}

	private addCloseButton() {
		this.closeBtn.textContent = '✖';
		Object.assign(this.closeBtn.style, {
			position: 'absolute',
			top: '10px',
			right: '15px',
			background: 'transparent',
			color: '#fff',
			border: 'none',
			fontSize: '22px',
			cursor: 'pointer',
			transition: 'transform 0.2s ease, color 0.2s ease',
			zIndex: '10',
		});
		this.closeBtn.onclick = (e) => {
			e.stopPropagation();
			this.hide();
		};
		this.closeBtn.onmouseenter = () => {
			this.closeBtn.style.color = '#3B82F6';
			this.closeBtn.style.transform = 'scale(1.1)';
		};
		this.closeBtn.onmouseleave = () => {
			this.closeBtn.style.color = '#fff';
			this.closeBtn.style.transform = 'scale(1)';
		};
		this.container.appendChild(this.closeBtn);
	}

	private addHeader() {
		// Create a title area at the top of the menu (header)
		const header = document.createElement('div');
		header.style.position = 'absolute';
		header.style.top = '0';
		header.style.left = '0';
		header.style.right = '0';
		header.style.height = '40px';
		// No border at the bottom

		// Add a centered title
		const title = document.createElement('div');
		title.textContent = 'Game History';
		title.style.position = 'absolute';
		title.style.left = '50%';
		title.style.top = '50%';
		title.style.transform = 'translate(-50%, -50%)';
		title.style.fontWeight = 'bold';
		title.style.fontSize = '14px';
		title.style.color = '#fff';
		header.appendChild(title);

		this.container.insertBefore(header, this.container.firstChild);
	}

	private async renderContent() {
		// Header
		const header = document.createElement('div');
		header.textContent = 'Game History';
		const isMobile = this.kxsClient.isMobile && this.kxsClient.isMobile();
		Object.assign(header.style, {
			fontWeight: 'bold',
			fontSize: isMobile ? '1.1em' : '1.3em',
			letterSpacing: '1px',
			margin: isMobile ? '10px 0 12px 0' : '10px 0 20px 0',
			textAlign: 'center',
			color: '#3B82F6',
		});
		this.container.appendChild(header);

		// Liste de l'historique
		let historyList = document.createElement('div');
		Object.assign(historyList.style, {
			display: 'flex',
			flexDirection: 'column',
			gap: isMobile ? '6px' : '8px',
			padding: isMobile ? '0 8px' : '0 15px',
			width: '100%',
		});

		// Récupération de l'historique via SteganoDB
		let result = this.kxsClient.db.all();
		let entries = [];

		// Traitement de la structure JSON gameplay_history
		if (result && typeof result === 'object') {
			// Vérifier si c'est la structure gameplay_history
			if ('gameplay_history' in result && Array.isArray((result as any).gameplay_history)) {
				entries = (result as any).gameplay_history;
				// Tri par date décroissante
				entries.sort((a: any, b: any) => {
					if (a.id && b.id) return b.id.localeCompare(a.id);
					return 0;
				});
			} else {
				// Fallback pour l'ancienne structure
				entries = Array.isArray(result) ? result : [];
			}
		}

		// Affichage ligne par ligne
		if (!entries || entries.length === 0) {
			const empty = document.createElement('div');
			empty.textContent = 'No games recorded.';
			empty.style.textAlign = 'center';
			empty.style.color = '#aaa';
			historyList.appendChild(empty);
		} else {
			let i = 1;
			for (const entry of entries) {
				let key: string, value: any;

				// Structure gameplay_history
				if (typeof entry === 'object' && entry.id && entry.value) {
					key = entry.id;
					value = entry.value;

					// Traitement des games dans value
					if (typeof value === 'object') {
						for (const gameId in value) {
							const gameStats = value[gameId];
							this.createGameHistoryLine(historyList, gameStats, key, i, isMobile);
							i++;
						}
						continue; // Passer à l'entrée suivante après avoir traité tous les jeux
					}
				}
				// Ancienne structure
				else if (Array.isArray(entry) && entry.length === 2) {
					key = entry[0];
					value = entry[1];
				} else if (typeof entry === 'object' && entry.key && entry.value) {
					key = entry.key;
					value = entry.value;
				} else {
					continue;
				}
				// Pour l'ancienne structure, créer une ligne
				this.createGameHistoryLine(historyList, value, key, i, isMobile);
				i++;
			}
		}
		this.container.appendChild(historyList);
	}

	private createGameHistoryLine(historyList: HTMLDivElement, stats: any, dateKey: string, index: number, isMobile: boolean) {
		const line = document.createElement('div');
		Object.assign(line.style, {
			background: index % 2 ? 'rgba(31, 41, 55, 0.7)' : 'rgba(17, 24, 39, 0.8)',
			borderRadius: isMobile ? '5px' : '8px',
			padding: isMobile ? '6px 8px' : '10px 15px',
			fontFamily: "'Segoe UI', Arial, sans-serif",
			fontSize: isMobile ? '0.8em' : '0.95em',
			display: 'flex',
			flexDirection: isMobile ? 'column' : 'row',
			alignItems: isMobile ? 'flex-start' : 'center',
			gap: isMobile ? '4px' : '12px',
			transition: 'background 0.2s, transform 0.1s',
			cursor: 'pointer',
			border: '1px solid transparent',
		});

		// Effet hover
		line.onmouseenter = () => {
			line.style.background = 'rgba(59, 130, 246, 0.3)';
			line.style.borderColor = 'rgba(59, 130, 246, 0.5)';
			line.style.transform = 'translateY(-1px)';
		};
		line.onmouseleave = () => {
			line.style.background = index % 2 ? 'rgba(31, 41, 55, 0.7)' : 'rgba(17, 24, 39, 0.8)';
			line.style.borderColor = 'transparent';
			line.style.transform = 'translateY(0)';
		};

		// Date formatée
		const dateStr = dateKey ? new Date(dateKey).toLocaleString() : '';
		const dateEl = document.createElement('div');
		dateEl.textContent = dateStr;
		Object.assign(dateEl.style, {
			color: '#93c5fd',
			fontWeight: 'bold',
			whiteSpace: 'nowrap',
			marginRight: isMobile ? '0' : '10px',
		});

		// Stats du jeu
		const statsContainer = document.createElement('div');
		Object.assign(statsContainer.style, {
			display: 'flex',
			flexDirection: isMobile ? 'column' : 'row',
			flexWrap: 'wrap',
			gap: isMobile ? '3px 8px' : '0 15px',
			flex: '1',
		});

		// Création des éléments de stats
		const createStatElement = (label: string, value: any, color: string = '#fff') => {
			const statEl = document.createElement('div');
			statEl.style.display = 'inline-flex';
			statEl.style.alignItems = 'center';
			statEl.style.marginRight = isMobile ? '5px' : '12px';

			const labelEl = document.createElement('span');
			labelEl.textContent = `${label}: `;
			labelEl.style.color = '#9ca3af';

			const valueEl = document.createElement('span');
			valueEl.textContent = value !== undefined && value !== null ? String(value) : '-';
			valueEl.style.color = color;
			valueEl.style.fontWeight = 'bold';

			statEl.appendChild(labelEl);
			statEl.appendChild(valueEl);
			return statEl;
		};

		// Ajout des stats avec couleurs
		if (typeof stats === 'object') {
			const isWin = stats.isWin === true;

			statsContainer.appendChild(createStatElement('Player', stats.username, '#fff'));
			statsContainer.appendChild(createStatElement('Kills', stats.kills, '#ef4444'));
			statsContainer.appendChild(createStatElement('DMG', stats.damageDealt, '#f59e0b'));
			statsContainer.appendChild(createStatElement('Taken', stats.damageTaken, '#a855f7'));
			statsContainer.appendChild(createStatElement('Duration', stats.duration, '#fff'));

			// Position avec couleur selon le rang
			let posColor = '#fff';
			if (stats.position) {
				const pos = parseInt(stats.position.replace('#', ''));
				if (pos <= 10) posColor = '#fbbf24'; // Or
				else if (pos <= 25) posColor = '#94a3b8'; // Argent
				else if (pos <= 50) posColor = '#b45309'; // Bronze
			}
			statsContainer.appendChild(createStatElement('Pos', stats.position, posColor));

			// Indicateur de victoire
			if (isWin) {
				const winEl = document.createElement('div');
				winEl.textContent = '🏆 WIN';
				winEl.style.color = '#fbbf24';
				winEl.style.fontWeight = 'bold';
				winEl.style.marginLeft = 'auto';
				statsContainer.appendChild(winEl);
			}
		} else {
			// Fallback si stats n'est pas un objet
			const fallbackEl = document.createElement('div');
			fallbackEl.textContent = typeof stats === 'string' ? stats : JSON.stringify(stats);
			statsContainer.appendChild(fallbackEl);
		}

		line.appendChild(dateEl);
		line.appendChild(statsContainer);
		historyList.appendChild(line);
	}

	public show() {
		// Close RSHIFT menu if it's open
		if (this.kxsClient.secondaryMenu && typeof this.kxsClient.secondaryMenu.getMenuVisibility === 'function') {
			if (this.kxsClient.secondaryMenu.getMenuVisibility()) {
				this.kxsClient.secondaryMenu.toggleMenuVisibility();
			}
		}

		// Prevent mouse event propagation
		this.container.addEventListener('click', (e) => e.stopPropagation());
		this.container.addEventListener('wheel', (e) => e.stopPropagation());
		this.container.addEventListener('mousedown', (e) => e.stopPropagation());
		this.container.addEventListener('mouseup', (e) => e.stopPropagation());
		this.container.addEventListener('contextmenu', (e) => e.stopPropagation());
		this.container.addEventListener('dblclick', (e) => e.stopPropagation());

		// Center the menu on screen
		this.container.style.top = '50%';
		this.container.style.left = '50%';
		this.container.style.transform = 'translate(-50%, -50%)';

		// Add fade-in animation
		this.container.style.opacity = '0';
		this.container.style.transition = 'opacity 0.2s ease-in-out';
		setTimeout(() => {
			this.container.style.opacity = '1';
		}, 10);

		document.body.appendChild(this.container);
	}

	public hide() {
		// Clean up listeners before removing the menu
		if (this.container) {
			// Supprimer tous les gestionnaires d'événements
			const allElements = this.container.querySelectorAll('*');
			allElements.forEach(element => {
				const el = element as HTMLElement;
				el.replaceWith(el.cloneNode(true));
			});

			// Remove the container
			this.container.remove();
		}

		// Reset document cursor in case it was changed
		document.body.style.cursor = '';
	}

	// Méthode alias pour compatibilité avec le code existant
	public close() {
		this.hide();
	}
}

export {
	GameHistoryMenu
}