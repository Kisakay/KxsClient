import KxsClient from "../../KxsClient";
import { DesignSystem } from "../DesignSystem";

class HealthWarning {
	private warningElement: HTMLDivElement | null;
	private kxsClient: KxsClient;
	private isDraggable: boolean = false;
	private isDragging: boolean = false;
	private dragOffset: { x: number, y: number } = { x: 0, y: 0 };
	private readonly POSITION_KEY = 'lowHpWarning';


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

		// Apply enhanced glassmorphism effect using DesignSystem
		DesignSystem.applyGlassEffect(warning, 'medium', {
			position: 'fixed',
			border: '2px solid rgba(255, 0, 0, 0.8)',
			padding: DesignSystem.spacing.md + ' ' + DesignSystem.spacing.lg,
			color: '#ff4444',
			fontFamily: DesignSystem.fonts.primary,
			fontSize: DesignSystem.fonts.sizes.base,
			fontWeight: '600',
			zIndex: DesignSystem.layers.notification.toString(),
			display: 'none',
			pointerEvents: 'none',
			transition: `all ${DesignSystem.animation.normal} ease`,
			boxShadow: '0 8px 32px rgba(255, 0, 0, 0.3), 0 0 20px rgba(255, 0, 0, 0.2)',
			textShadow: '0 0 10px rgba(255, 0, 0, 0.5)'
		});

		const content = document.createElement("div");
		Object.assign(content.style, {
			display: 'flex',
			alignItems: 'center',
			gap: DesignSystem.spacing.sm,
			filter: 'drop-shadow(0 0 8px rgba(255, 0, 0, 0.4))'
		});

		const icon = document.createElement("div");
		icon.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
        `;

		const text = document.createElement("span");
		text.textContent = "LOW HP!";

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

	public show(health: number) {
		if (!this.warningElement) return;
		this.warningElement.style.display = "block";

		const span = this.warningElement.querySelector("span");
		if (span) {
			span.textContent = `LOW HP: ${health}%`;
		}
	}

	public hide() {
		if (!this.warningElement) return;
		// Ne pas masquer si en mode placement
		// if (this.isDraggable) return;
		this.warningElement.style.display = "none";
	}

	public update(health: number) {
		// Si le mode placement est actif (isDraggable), on ne fait rien pour maintenir l'affichage
		if (this.isDraggable) {
			return;
		}

		// Sinon, comportement normal
		if (health <= 30 && health > 0) {
			this.show(health);
		} else {
			this.hide();
		}
	}

	private setupDragAndDrop() {
		// Nous n'avons plus besoin d'écouteurs pour RSHIFT car nous utilisons maintenant
		// l'état du menu secondaire pour déterminer quand activer/désactiver le mode placement

		// Écouteurs d'événements de souris pour le glisser-déposer
		document.addEventListener('mousedown', this.handleMouseDown.bind(this));
		document.addEventListener('mousemove', this.handleMouseMove.bind(this));
		document.addEventListener('mouseup', this.handleMouseUp.bind(this));
	}

	public enableDragging() {
		if (!this.warningElement) return;

		this.isDraggable = true;
		this.warningElement.style.pointerEvents = 'auto';
		this.warningElement.style.cursor = 'move';
		this.warningElement.style.borderColor = '#00ff00'; // Feedback visuel quand déplaçable

		// Force l'affichage de l'avertissement LOW HP, peu importe la santé actuelle
		this.warningElement.style.display = 'block';
		const span = this.warningElement.querySelector("span");
		if (span) {
			span.textContent = 'LOW HP: Placement Mode';
		}
	}

	private disableDragging() {
		if (!this.warningElement) return;

		this.isDraggable = false;
		this.isDragging = false;
		this.warningElement.style.pointerEvents = 'none';
		this.warningElement.style.cursor = 'default';
		this.warningElement.style.borderColor = '#ff0000'; // Retour à la couleur normale

		// Remet le texte original si l'avertissement est visible
		if (this.warningElement.style.display === 'block') {
			const span = this.warningElement.querySelector("span");
			if (span) {
				span.textContent = 'LOW HP';
			}
		}

		// Récupérer la santé actuelle à partir de l'élément UI de santé du jeu
		const healthBars = document.querySelectorAll("#ui-health-container");
		if (healthBars.length > 0) {
			const bar = healthBars[0].querySelector("#ui-health-actual");
			if (bar) {
				const currentHealth = Math.round(parseFloat((bar as HTMLElement).style.width));
				// Forcer une mise à jour immédiate en fonction de la santé actuelle
				this.update(currentHealth);
			}
		}
	}

	private handleMouseDown(event: MouseEvent) {
		if (!this.isDraggable || !this.warningElement) return;

		// Check if click was on the warning element
		if (this.warningElement.contains(event.target as Node)) {
			this.isDragging = true;

			// Calculate offset from mouse position to element corner
			const rect = this.warningElement.getBoundingClientRect();
			this.dragOffset = {
				x: event.clientX - rect.left,
				y: event.clientY - rect.top
			};

			// Prevent text selection during drag
			event.preventDefault();
		}
	}

	private mouseMoveThrottle = false;

	private handleMouseMove(event: MouseEvent) {
		if (!this.isDragging || !this.warningElement || this.mouseMoveThrottle) return;

		// Optimized: throttle mousemove for better performance
		this.mouseMoveThrottle = true;
		requestAnimationFrame(() => {
			// Calculate new position
			const newX = event.clientX - this.dragOffset.x;
			const newY = event.clientY - this.dragOffset.y;

			// Update element position
			if (this.warningElement) {
				this.warningElement.style.left = `${newX}px`;
				this.warningElement.style.top = `${newY}px`;
			}
			this.mouseMoveThrottle = false;
		});
	}

	private handleMouseUp() {
		if (this.isDragging && this.warningElement) {
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
		}
	}

	private startMenuCheckInterval() {
		// Écouter directement les événements RSHIFT pour une réaction immédiate
		this.setupRShiftListener();
	}

	private setupRShiftListener(): void {
		// Fonction pour vérifier et mettre à jour l'état du mode placement
		const checkMenuState = () => {
			const isMenuOpen = this.kxsClient.secondaryMenu?.isOpen || false;

			// Si le menu est ouvert et que nous ne sommes pas en mode placement, activer le mode placement
			if (isMenuOpen && this.kxsClient.isHealthWarningEnabled && !this.isDraggable) {
				this.enableDragging();
			}
			// Si le menu est fermé et que nous sommes en mode placement, désactiver le mode placement
			else if (!isMenuOpen && this.isDraggable) {
				this.disableDragging();
			}
		};

		// S'abonner aux notifications de changement d'état du menu
		if (!this.kxsClient.secondaryMenu.onMenuToggle) {
			this.kxsClient.secondaryMenu.onMenuToggle = [];
		}
		this.kxsClient.secondaryMenu.onMenuToggle.push(checkMenuState);

		// Vérifier l'état initial
		checkMenuState();
	}

	public destroy(): void {
		// Supprimer le callback du menu secondaire
		if (this.kxsClient.secondaryMenu?.onMenuToggle) {
			const index = this.kxsClient.secondaryMenu.onMenuToggle.findIndex(callback => 
				callback.toString().includes('checkMenuState')
			);
			if (index !== -1) {
				this.kxsClient.secondaryMenu.onMenuToggle.splice(index, 1);
			}
		}

		// Supprimer l'élément du DOM
		if (this.warningElement) {
			this.warningElement.remove();
			this.warningElement = null;
		}
	}
}

export { HealthWarning };
