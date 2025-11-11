import KxsClient from "../../KxsClient";
import { DesignSystem } from "../DesignSystem";

class GameIdHelper {
	private warningElement: HTMLDivElement | null;
	private kxsClient: KxsClient;
	private readonly POSITION_KEY = 'gameIdHelper';
	private menuToggleCallback: (() => void) | null = null;
	private isDraggable: boolean = false;
	private isDragging: boolean = false;
	private dragOffset: { x: number, y: number } = { x: 0, y: 0 };
	private mouseMoveThrottle: boolean = false;
	private clickStartTime: number = 0;
	private clickStartPosition: { x: number, y: number } = { x: 0, y: 0 };
	private readonly CLICK_THRESHOLD = 5; // pixels de mouvement pour considérer comme un drag
	private readonly CLICK_TIME_THRESHOLD = 200; // ms pour considérer comme un clic
	private updateInterval: number | null = null;


	constructor(kxsClient: KxsClient) {
		this.warningElement = null;
		this.kxsClient = kxsClient;

		this.createWarningElement();
		this.setFixedPosition();
		this.setupDragAndDrop();
		this.startMenuCheckInterval();
	}

	private createWarningElement() {
		const warning = document.createElement("div");
		const uiTopLeft = document.getElementById("ui-top-left");

		// Vérifier si le mode glassmorphism est activé
		const is_glassmorphism_enabled = this.kxsClient.isGlassmorphismEnabled;

		// Appliquer le style approprié en fonction du toggle glassmorphism
		DesignSystem.applyGlassEffect(warning, this.kxsClient.isGlassmorphismEnabled ? 'medium' : 'dark', {
			position: 'fixed',
			border: is_glassmorphism_enabled ?
				'2px solid rgba(255, 255, 255, 0.8)' :
				'2px solid rgba(255, 255, 255, 0.8)',
			padding: DesignSystem.spacing.md + ' ' + DesignSystem.spacing.lg,
			color: '#ffffff',
			fontFamily: DesignSystem.fonts.primary,
			fontSize: DesignSystem.fonts.sizes.base,
			fontWeight: '600',
			zIndex: DesignSystem.layers.notification.toString(),
			display: 'none',
			pointerEvents: 'none',
			cursor: 'default',
			transition: `all ${DesignSystem.animation.normal} ease`,
			boxShadow: is_glassmorphism_enabled ?
				'0 8px 32px rgba(255, 255, 255, 0.3), 0 0 20px rgba(255, 255, 255, 0.2)' :
				'0 4px 12px rgba(255, 255, 255, 0.25)',
			textShadow: is_glassmorphism_enabled ?
				'0 0 10px rgba(255, 255, 255, 0.5)' :
				'0 0 5px rgba(255, 255, 255, 0.4)',
			backdropFilter: is_glassmorphism_enabled ? 'blur(8px) saturate(180%)' : 'none',
			borderRadius: is_glassmorphism_enabled ? '12px' : '8px'
		});

		// Appliquer le webkit backdrop filter manuellement
		if (is_glassmorphism_enabled) {
			(warning.style as any)['-webkit-backdrop-filter'] = 'blur(8px) saturate(180%)';
		} else {
			(warning.style as any)['-webkit-backdrop-filter'] = 'none';
		}

		const content = document.createElement("div");
		Object.assign(content.style, {
			display: 'flex',
			alignItems: 'center',
			gap: DesignSystem.spacing.sm,
			filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.4))'
		});

		const icon = document.createElement("div");
		icon.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"></path>
            </svg>
        `;

		const text = document.createElement("span");
		text.textContent = this.kxsClient.kxsNetwork.actualGameId || "";

		if (uiTopLeft) {
			content.appendChild(icon);
			content.appendChild(text);
			warning.appendChild(content);
			uiTopLeft.appendChild(warning);
		}
		this.warningElement = warning;
		this.addPulseAnimation();
	}

	private setFixedPosition() {
		if (!this.warningElement) return;

		// Récupérer la position depuis le localStorage ou les valeurs par défaut
		const storageKey = `position_${this.POSITION_KEY}`;
		const savedPosition = localStorage.getItem(storageKey);
		let position;

		if (savedPosition) {
			try {
				// Utiliser la position sauvegardée
				const { x, y } = JSON.parse(savedPosition);
				position = { left: x, top: y };
			} catch (error) {
				// En cas d'erreur, utiliser la position par défaut
				position = this.kxsClient.defaultPositions[this.POSITION_KEY];
				this.kxsClient.logger.error('Erreur lors du chargement de la position LOW HP:', error);
			}
		} else {
			// Utiliser la position par défaut
			position = this.kxsClient.defaultPositions[this.POSITION_KEY];
		}

		// Appliquer la position
		if (position) {
			this.warningElement.style.top = `${position.top}px`;
			this.warningElement.style.left = `${position.left}px`;
		}
	}
	private addPulseAnimation() {
		const keyframes = `
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }
        `;
		const style = document.createElement("style");
		style.textContent = keyframes;
		document.head.appendChild(style);

		if (this.warningElement) {
			this.warningElement.style.animation = "pulse 1.5s infinite";
		}
	}

	public show() {
		if (!this.warningElement) return;
		if (!this.kxsClient.isGameIdHelperEnabled) {
			this.hide();
			return;
		}

		const gameId = this.kxsClient.kxsNetwork.actualGameId;
		if (!gameId || gameId === "") {
			this.hide();
			return;
		}

		this.warningElement.style.display = "block";

		const span = this.warningElement.querySelector("span");
		if (span) {
			span.textContent = `Game ID: ${gameId}`;
		}
	}

	public hide() {
		if (!this.warningElement) return;
		// Toujours cacher si le module est désactivé
		if (!this.kxsClient.isGameIdHelperEnabled) {
			this.warningElement.style.display = "none";
			this.isDraggable = false;
			this.isDragging = false;
			return;
		}
		// Ne pas masquer si en mode placement (dragging)
		if (this.isDraggable) return;
		this.warningElement.style.display = "none";
	}

	public update() {
		// L'affichage est géré par setupRShiftListener selon l'état du menu
		// On met juste à jour le contenu si l'élément est visible
		if (this.warningElement && this.warningElement.style.display === "block") {
			const gameId = this.kxsClient.kxsNetwork.actualGameId;
			const span = this.warningElement.querySelector("span");
			if (span && gameId && gameId !== "") {
				span.textContent = `Game ID: ${gameId}`;
			}
		}
	}

	private setupDragAndDrop() {
		// Écouteurs d'événements de souris pour le glisser-déposer et le clic
		document.addEventListener('mousedown', this.handleMouseDown.bind(this));
		document.addEventListener('mousemove', this.handleMouseMove.bind(this));
		document.addEventListener('mouseup', this.handleMouseUp.bind(this));
	}

	private async copyGameIdToClipboard() {
		const gameId = this.kxsClient.kxsNetwork.actualGameId;
		if (!gameId || gameId === "") {
			return;
		}

		try {
			// Copier le gameId dans le clipboard
			await navigator.clipboard.writeText(gameId);

			// Feedback visuel : changer temporairement le texte
			const span = this.warningElement?.querySelector("span");
			if (span) {
				const originalText = span.textContent || `Game ID: ${gameId}`;
				span.textContent = "✓ Copied!";

				// Restaurer le texte original après 1.5 secondes
				setTimeout(() => {
					if (span && this.warningElement) {
						const currentGameId = this.kxsClient.kxsNetwork.actualGameId;
						if (currentGameId && currentGameId !== "") {
							span.textContent = `Game ID: ${currentGameId}`;
						} else {
							span.textContent = originalText;
						}
					}
				}, 1500);
			}
		} catch (error) {
			// Fallback pour les navigateurs qui ne supportent pas l'API clipboard
			this.kxsClient.logger.error('Erreur lors de la copie du gameId:', error);

			// Alternative : utiliser l'ancienne méthode
			const textArea = document.createElement('textarea');
			textArea.value = gameId;
			textArea.style.position = 'fixed';
			textArea.style.opacity = '0';
			document.body.appendChild(textArea);
			textArea.select();
			try {
				document.execCommand('copy');
				const span = this.warningElement?.querySelector("span");
				if (span) {
					const originalText = span.textContent || `Game ID: ${gameId}`;
					span.textContent = "✓ Copied!";
					setTimeout(() => {
						if (span && this.warningElement) {
							const currentGameId = this.kxsClient.kxsNetwork.actualGameId;
							if (currentGameId && currentGameId !== "") {
								span.textContent = `Game ID: ${currentGameId}`;
							} else {
								span.textContent = originalText;
							}
						}
					}, 1500);
				}
			} catch (err) {
				this.kxsClient.logger.error('Erreur lors de la copie (fallback):', err);
			}
			document.body.removeChild(textArea);
		}
	}

	public enableDragging() {
		if (!this.warningElement) return;

		// Vérifier si le module est activé
		if (!this.kxsClient.isGameIdHelperEnabled) {
			this.disableDragging();
			return;
		}

		const is_glassmorphism_enabled = this.kxsClient.isGlassmorphismEnabled;

		this.isDraggable = true;
		this.warningElement.style.pointerEvents = 'auto';
		this.warningElement.style.cursor = 'move';

		// Adaptation du style pour le mode placement, selon le toggle glassmorphism
		this.warningElement.style.borderColor = '#00ff00'; // Feedback visuel quand déplaçable

		if (is_glassmorphism_enabled) {
			this.warningElement.style.boxShadow = '0 8px 32px rgba(0, 255, 0, 0.2), 0 0 20px rgba(0, 255, 0, 0.15)';
			this.warningElement.style.backdropFilter = 'blur(8px) saturate(180%)';
			(this.warningElement.style as any)['-webkit-backdrop-filter'] = 'blur(8px) saturate(180%)';
		} else {
			this.warningElement.style.boxShadow = '0 4px 12px rgba(0, 255, 0, 0.2)';
			this.warningElement.style.backdropFilter = 'none';
			(this.warningElement.style as any)['-webkit-backdrop-filter'] = 'none';
		}

		// Force l'affichage de l'élément et met à jour le texte
		this.warningElement.style.display = 'block';
		this.updateDisplayText();
	}

	private updateDisplayText() {
		if (!this.warningElement) return;
		const span = this.warningElement.querySelector("span");
		if (span) {
			const gameId = this.kxsClient.kxsNetwork.actualGameId;
			// Ne pas mettre à jour si le texte est "✓ Copied!" (feedback de copie)
			if (span.textContent !== "✓ Copied!") {
				span.textContent = gameId && gameId !== "" ? `Game ID: ${gameId}` : 'Game ID: Placement Mode';
			}
		}
	}

	private disableDragging() {
		if (!this.warningElement) return;

		const is_glassmorphism_enabled = this.kxsClient.isGlassmorphismEnabled;

		this.isDraggable = false;
		this.isDragging = false;
		this.warningElement.style.pointerEvents = 'none';
		this.warningElement.style.cursor = 'default';

		// Restauration du style original en fonction du mode glassmorphism
		this.warningElement.style.borderColor = is_glassmorphism_enabled ?
			'rgba(255, 255, 255, 0.8)' :
			'rgba(255, 255, 255, 0.8)';

		if (is_glassmorphism_enabled) {
			this.warningElement.style.boxShadow = '0 8px 32px rgba(255, 255, 255, 0.3), 0 0 20px rgba(255, 255, 255, 0.2)';
			this.warningElement.style.backdropFilter = 'blur(8px) saturate(180%)';
			(this.warningElement.style as any)['-webkit-backdrop-filter'] = 'blur(8px) saturate(180%)';
		} else {
			this.warningElement.style.boxShadow = '0 4px 12px rgba(255, 255, 255, 0.25)';
			this.warningElement.style.backdropFilter = 'none';
			(this.warningElement.style as any)['-webkit-backdrop-filter'] = 'none';
		}

		// Cacher l'élément quand le menu est fermé ou si le module est désactivé
		this.warningElement.style.display = 'none';
	}

	private handleMouseDown(event: MouseEvent) {
		if (!this.isDraggable || !this.warningElement) return;

		// Vérifier si le clic est sur l'élément
		if (this.warningElement.contains(event.target as Node)) {
			this.clickStartTime = Date.now();
			this.clickStartPosition = { x: event.clientX, y: event.clientY };
			this.isDragging = false;

			// Calculer l'offset depuis la position de la souris jusqu'au coin de l'élément
			const rect = this.warningElement.getBoundingClientRect();
			this.dragOffset = {
				x: event.clientX - rect.left,
				y: event.clientY - rect.top
			};

			// Empêcher la sélection de texte pendant le drag
			event.preventDefault();
		}
	}

	private handleMouseMove(event: MouseEvent) {
		if (!this.isDraggable || !this.warningElement || this.mouseMoveThrottle) return;

		// Si on a commencé un clic sur l'élément, vérifier si c'est un drag
		if (this.clickStartTime > 0 && !this.isDragging) {
			const moveDistance = Math.sqrt(
				Math.pow(event.clientX - this.clickStartPosition.x, 2) +
				Math.pow(event.clientY - this.clickStartPosition.y, 2)
			);

			// Si le mouvement est suffisant, considérer comme un drag
			if (moveDistance > this.CLICK_THRESHOLD) {
				this.isDragging = true;
			}
		}

		// Si on est en train de drag, déplacer l'élément
		if (this.isDragging && this.warningElement) {
			// Optimisé : throttle mousemove pour de meilleures performances
			this.mouseMoveThrottle = true;
			requestAnimationFrame(() => {
				// Calculer la nouvelle position
				const newX = event.clientX - this.dragOffset.x;
				const newY = event.clientY - this.dragOffset.y;

				// Mettre à jour la position de l'élément
				if (this.warningElement) {
					this.warningElement.style.left = `${newX}px`;
					this.warningElement.style.top = `${newY}px`;
				}
				this.mouseMoveThrottle = false;
			});
		}
	}

	private handleMouseUp(event: MouseEvent) {
		if (!this.isDraggable || !this.warningElement) return;

		// Si on était en train de drag, sauvegarder la position
		if (this.isDragging) {
			this.isDragging = false;

			// Récupérer les positions actuelles
			const left = parseInt(this.warningElement.style.left);
			const top = parseInt(this.warningElement.style.top);

			// Sauvegarder la position
			const storageKey = `position_${this.POSITION_KEY}`;
			localStorage.setItem(
				storageKey,
				JSON.stringify({ x: left, y: top })
			);
		} else if (this.clickStartTime > 0) {
			// Sinon, vérifier si c'était un clic simple
			const clickDuration = Date.now() - this.clickStartTime;
			const moveDistance = Math.sqrt(
				Math.pow(event.clientX - this.clickStartPosition.x, 2) +
				Math.pow(event.clientY - this.clickStartPosition.y, 2)
			);

			// Si c'était un clic rapide et sans mouvement significatif, copier le gameId
			if (clickDuration < this.CLICK_TIME_THRESHOLD && moveDistance < this.CLICK_THRESHOLD) {
				this.copyGameIdToClipboard();
			}
		}

		// Réinitialiser les variables
		this.clickStartTime = 0;
		this.clickStartPosition = { x: 0, y: 0 };
	}

	private startMenuCheckInterval() {
		// Écouter directement les événements RSHIFT pour une réaction immédiate
		this.setupRShiftListener();
	}

	private setupRShiftListener(): void {
		// Fonction pour vérifier et mettre à jour l'affichage selon l'état du menu
		this.menuToggleCallback = () => {
			// Vérifier d'abord si le module est activé
			if (!this.kxsClient.isGameIdHelperEnabled) {
				this.disableDragging();
				return;
			}

			const isMenuOpen = this.kxsClient.secondaryMenu?.isOpen || false;
			const gameId = this.kxsClient.kxsNetwork.actualGameId;

			// Afficher uniquement si le module est activé, le menu est ouvert ET qu'un gameId existe
			if (isMenuOpen && gameId && gameId !== "") {
				this.enableDragging();
			} else {
				// Si le menu est fermé ou pas de gameId, désactiver le mode placement et cacher
				this.disableDragging();
			}
		};

		// S'abonner aux notifications de changement d'état du menu
		if (!this.kxsClient.secondaryMenu.onMenuToggle) {
			this.kxsClient.secondaryMenu.onMenuToggle = [];
		}
		this.kxsClient.secondaryMenu.onMenuToggle.push(this.menuToggleCallback);

		// Vérifier l'état initial
		this.menuToggleCallback();

		// Mettre à jour périodiquement le texte si le menu est ouvert (pour détecter les changements de gameId)
		this.updateInterval = window.setInterval(() => {
			if (this.isDraggable && this.warningElement && this.warningElement.style.display === 'block') {
				this.updateDisplayText();
			}
		}, 1000); // Vérifier toutes les secondes
	}

	public destroy(): void {
		// Nettoyer l'intervalle de mise à jour
		if (this.updateInterval !== null) {
			clearInterval(this.updateInterval);
			this.updateInterval = null;
		}

		// Supprimer le callback du menu secondaire
		if (this.kxsClient.secondaryMenu?.onMenuToggle && this.menuToggleCallback) {
			const index = this.kxsClient.secondaryMenu.onMenuToggle.indexOf(this.menuToggleCallback);
			if (index !== -1) {
				this.kxsClient.secondaryMenu.onMenuToggle.splice(index, 1);
			}
			this.menuToggleCallback = null;
		}

		// Supprimer l'élément du DOM
		if (this.warningElement) {
			this.warningElement.remove();
			this.warningElement = null;
		}
	}
}

export { GameIdHelper };
