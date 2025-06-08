/**
 * KxsClient Modern Design System
 * Implements a modern glassmorphism UI design with blur effects
 */

export class DesignSystem {
	/**
	 * Injects required fonts and animations into the document
	 */
	static injectFonts(): void {
		// Inject fonts
		const fontLinks = [
			'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
			'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap'
		];

		fontLinks.forEach(href => {
			if (!document.querySelector(`link[href="${href}"]`)) {
				const link = document.createElement('link');
				link.rel = 'stylesheet';
				link.href = href;
				document.head.appendChild(link);
			}
		});

		// Inject animations if not already injected
		if (!document.getElementById('kxs-design-system-animations')) {
			const animationStyle = document.createElement('style');
			animationStyle.id = 'kxs-design-system-animations';
			animationStyle.textContent = `
				@keyframes pulse {
					0% { transform: scale(1); }
					50% { transform: scale(1.05); }
					100% { transform: scale(1); }
				}
			`;
			document.head.appendChild(animationStyle);
		}
	}
	// Color palette
	static colors = {
		primary: 'rgba(59, 130, 246, 0.9)',      // Blue
		secondary: 'rgba(139, 92, 246, 0.9)',    // Purple
		accent: 'rgba(236, 72, 153, 0.9)',       // Pink
		dark: 'rgba(17, 24, 39, 0.8)',           // Dark background
		light: 'rgba(255, 255, 255, 0.9)',       // Light text
		success: 'rgba(16, 185, 129, 0.9)',      // Green
		warning: 'rgba(245, 158, 11, 0.9)',      // Orange
		danger: 'rgba(239, 68, 68, 0.9)',        // Red
		info: 'rgba(59, 130, 246, 0.9)',         // Blue
	};

	// Glassmorphism effects
	static glass = {
		light: {
			background: 'rgba(255, 255, 255, 0.1)',
			blur: '10px',
			border: '1px solid rgba(255, 255, 255, 0.18)',
			shadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
		},
		medium: {
			background: 'rgba(255, 255, 255, 0.15)',
			blur: '15px',
			border: '1px solid rgba(255, 255, 255, 0.2)',
			shadow: '0 8px 32px 0 rgba(31, 38, 135, 0.4)',
		},
		dark: {
			background: 'rgba(17, 24, 39, 0.75)',
			blur: '20px',
			border: '1px solid rgba(255, 255, 255, 0.1)',
			shadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
		},
	};

	// Font settings
	static fonts = {
		primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
		secondary: '"Cinzel", serif',
		sizes: {
			xs: '0.75rem',
			sm: '0.875rem',
			base: '1rem',
			lg: '1.125rem',
			xl: '1.25rem',
			'2xl': '1.5rem',
			'3xl': '1.875rem',
			'4xl': '2.25rem',
		}
	};

	// Border radius
	static radius = {
		sm: '0.25rem',
		md: '0.5rem',
		lg: '1rem',
		xl: '1.5rem',
		full: '9999px',
	};

	// Spacing
	static spacing = {
		xs: '0.25rem',
		sm: '0.5rem',
		md: '1rem',
		lg: '1.5rem',
		xl: '2rem',
		'2xl': '3rem',
	};

	// Animation durations
	static animation = {
		fast: '0.15s',
		normal: '0.3s',
		slow: '0.5s',
		pulse: 'pulse',
	};

	// Z-index layers
	static layers = {
		base: 1,
		menu: 10,
		modal: 20,
		tooltip: 30,
		notification: 40,
	};

	/**
	 * Creates a glassmorphism element
	 * @param type Glass effect type
	 * @param additionalStyles Additional CSS styles
	 * @returns CSS style object
	 */
	static createGlassStyle(type: 'light' | 'medium' | 'dark', additionalStyles: Record<string, string> = {}) {
		const glass = this.glass[type];
		return {
			backgroundColor: glass.background,
			backdropFilter: `blur(${glass.blur})`,
			WebkitBackdropFilter: `blur(${glass.blur})`,
			border: glass.border,
			boxShadow: glass.shadow,
			borderRadius: this.radius.lg,
			...additionalStyles,
		};
	}

	/**
	 * Applies glassmorphism styles to an HTML element
	 * @param element HTML element to style
	 * @param type Glass effect type
	 * @param additionalStyles Additional CSS styles
	 */
	static applyGlassEffect(element: HTMLElement, type: 'light' | 'medium' | 'dark', additionalStyles: Record<string, string> = {}) {
		const styles = this.createGlassStyle(type, additionalStyles);
		Object.assign(element.style, styles);
	}

	/**
	 * Creates a modern button with glassmorphism effect
	 * @param text Button text
	 * @param onClick Click handler
	 * @param variant Button variant
	 * @returns HTMLButtonElement
	 */
	static createButton(text: string, onClick: () => void, variant: 'primary' | 'secondary' | 'accent' | 'danger' = 'primary'): HTMLButtonElement {
		const button = document.createElement('button');
		button.textContent = text;
		button.addEventListener('click', onClick);

		// Base styles
		Object.assign(button.style, {
			padding: `${this.spacing.sm} ${this.spacing.md}`,
			borderRadius: this.radius.md,
			fontFamily: this.fonts.primary,
			fontSize: this.fonts.sizes.base,
			fontWeight: '500',
			color: this.colors.light,
			backgroundColor: this.colors[variant],
			border: 'none',
			cursor: 'pointer',
			transition: `all ${this.animation.normal} ease`,
			outline: 'none',
			boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
		});

		// Hover effect
		button.addEventListener('mouseenter', () => {
			button.style.transform = 'translateY(-2px)';
			button.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
		});

		button.addEventListener('mouseleave', () => {
			button.style.transform = 'translateY(0)';
			button.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
		});

		// Active effect
		button.addEventListener('mousedown', () => {
			button.style.transform = 'translateY(1px)';
			button.style.boxShadow = '0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)';
		});

		return button;
	}

	/**
	 * Creates a modern card with glassmorphism effect
	 * @param content HTML content for the card
	 * @param type Glass effect type
	 * @returns HTMLDivElement
	 */
	static createCard(content: string, type: 'light' | 'medium' | 'dark' = 'medium'): HTMLDivElement {
		const card = document.createElement('div');
		card.innerHTML = content;
		this.applyGlassEffect(card, type, {
			padding: this.spacing.lg,
			margin: this.spacing.md,
		});
		return card;
	}

	/**
	 * Creates a modern slider element with fire theme
	 * @param min Minimum value
	 * @param max Maximum value
	 * @param value Initial value
	 * @param onChange Change handler
	 * @param showValue Whether to show value display
	 * @returns HTMLDivElement containing the slider
	 */
	static createSliderElement(min: number, max: number, value: number, onChange: (value: number) => void, showValue: boolean = true): HTMLDivElement {
		// Container principal sans fond
		const container = document.createElement('div');
		Object.assign(container.style, {
			width: '100%',
			fontFamily: this.fonts.primary,
			position: 'relative',
			background: 'transparent',
		});

		// Input range invisible pour la fonctionnalité
		const slider = document.createElement('input');
		slider.type = 'range';
		slider.min = min.toString();
		slider.max = max.toString();
		slider.value = value.toString();
		slider.step = '1';

		// Wrapper pour le slider visuel
		const sliderWrapper = document.createElement('div');
		Object.assign(sliderWrapper.style, {
			position: 'relative',
			height: '32px',
			marginBottom: '16px',
			display: 'flex',
			alignItems: 'center',
			overflow: 'visible',
			padding: '0 16px',
			boxSizing: 'border-box',
		});

		// Track de base avec effet glassmorphism
		const track = document.createElement('div');
		Object.assign(track.style, {
			position: 'absolute',
			top: '50%',
			left: '0',
			right: '0',
			height: '8px',
			transform: 'translateY(-50%)',
			borderRadius: this.radius.full,
			background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(51, 65, 85, 0.8) 100%)',
			backdropFilter: 'blur(8px)',
			WebkitBackdropFilter: 'blur(8px)',
			border: '1px solid rgba(255, 255, 255, 0.05)',
			boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(255, 255, 255, 0.1)',
		});

		// Barre de progression avec gradient moderne
		const progressFill = document.createElement('div');
		const progressWidth = ((value - min) / (max - min)) * 100;
		Object.assign(progressFill.style, {
			position: 'absolute',
			top: '50%',
			left: '0',
			height: '8px',
			width: `${progressWidth}%`,
			transform: 'translateY(-50%)',
			borderRadius: this.radius.full,
			background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.8) 0%, rgba(147, 51, 234, 0.9) 50%, rgba(236, 72, 153, 0.8) 100%)',
			boxShadow: '0 0 16px rgba(59, 130, 246, 0.4), 0 0 8px rgba(147, 51, 234, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
			transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease',
			overflow: 'hidden',
		});

		// Effet de brillance animé sur la barre de progression
		const shine = document.createElement('div');
		Object.assign(shine.style, {
			position: 'absolute',
			top: '0',
			left: '-100%',
			width: '100%',
			height: '100%',
			background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
			animation: 'sliderShine 2s ease-in-out infinite',
		});
		progressFill.appendChild(shine);

		// Ajout de l'animation CSS pour l'effet de brillance
		if (!document.querySelector('#slider-shine-animation')) {
			const style = document.createElement('style');
			style.id = 'slider-shine-animation';
			style.textContent = `
				@keyframes sliderShine {
					0% { left: -100%; }
					50% { left: 100%; }
					100% { left: 100%; }
				}
			`;
			document.head.appendChild(style);
		}

		// Assemblage du track
		sliderWrapper.appendChild(track);
		sliderWrapper.appendChild(progressFill);

		// Input invisible pour la fonctionnalité
		Object.assign(slider.style, {
			position: 'absolute',
			top: '0',
			left: '0',
			width: '100%',
			height: '32px',
			opacity: '0',
			margin: '0',
			cursor: 'pointer',
			zIndex: '3',
		});

		// Thumb personnalisé avec glassmorphism
		const thumb = document.createElement('div');
		const thumbPosition = ((value - min) / (max - min)) * 100;
		Object.assign(thumb.style, {
			position: 'absolute',
			top: '50%',
			left: `${thumbPosition}%`,
			width: '18px',
			height: '18px',
			transform: 'translate(-50%, -50%)',
			borderRadius: '50%',
			background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
			backdropFilter: 'blur(10px) saturate(180%)',
			WebkitBackdropFilter: 'blur(10px) saturate(180%)',
			border: '1px solid rgba(59, 130, 246, 0.6)',
			boxShadow: '0 3px 12px rgba(59, 130, 246, 0.25), 0 1px 6px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
			cursor: 'grab',
			transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
			zIndex: '2',
		});

		// Point central du thumb
		const thumbCenter = document.createElement('div');
		Object.assign(thumbCenter.style, {
			position: 'absolute',
			top: '50%',
			left: '50%',
			width: '6px',
			height: '6px',
			transform: 'translate(-50%, -50%)',
			borderRadius: '50%',
			background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(147, 51, 234, 0.8))',
			boxShadow: '0 0 6px rgba(59, 130, 246, 0.5)',
		});
		thumb.appendChild(thumbCenter);

		// Affichage de la valeur avec style moderne
		let valueDisplay: HTMLDivElement | null = null;
		if (showValue) {
			valueDisplay = document.createElement('div');
			valueDisplay.textContent = value.toString();
			Object.assign(valueDisplay.style, {
				position: 'absolute',
				bottom: '-40px',
				left: `${thumbPosition}%`,
				transform: 'translateX(-50%)',
				fontFamily: this.fonts.primary,
				fontSize: '12px',
				fontWeight: '600',
				color: '#ffffff',
				background: 'transparent',
				padding: '4px 8px',
				textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
				transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
				zIndex: '4',
			});
			sliderWrapper.appendChild(valueDisplay);
		}

		// Labels min/max avec style amélioré
		const labelsContainer = document.createElement('div');
		Object.assign(labelsContainer.style, {
			display: 'flex',
			justifyContent: 'space-between',
			marginTop: '12px',
			fontSize: '11px',
			fontWeight: '500',
			color: 'rgba(255, 255, 255, 0.8)',
			textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
		});

		const minLabel = document.createElement('div');
		minLabel.textContent = min.toString();
		const maxLabel = document.createElement('div');
		maxLabel.textContent = max.toString();

		labelsContainer.appendChild(minLabel);
		labelsContainer.appendChild(maxLabel);

		// Gestion des événements avec animations fluides
		slider.addEventListener('input', () => {
			const newValue = parseInt(slider.value);
			const percentage = ((newValue - min) / (max - min)) * 100;

			// Animation du thumb
			thumb.style.left = `${percentage}%`;

			// Animation de la barre de progression
			progressFill.style.width = `${percentage}%`;

			// Mise à jour de l'affichage de la valeur
			if (valueDisplay) {
				valueDisplay.textContent = newValue.toString();
				valueDisplay.style.left = `${percentage}%`;
			}

			// Callback
			onChange(newValue);
		});

		// Effets de survol et d'interaction
		slider.addEventListener('mousedown', () => {
			thumb.style.cursor = 'grabbing';
			thumb.style.transform = 'translate(-50%, -50%) scale(1.1)';
			thumb.style.boxShadow = '0 5px 16px rgba(59, 130, 246, 0.35), 0 2px 10px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.9)';
			progressFill.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.5), 0 0 12px rgba(147, 51, 234, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
		});

		document.addEventListener('mouseup', () => {
			thumb.style.cursor = 'grab';
			thumb.style.transform = 'translate(-50%, -50%) scale(1)';
			thumb.style.boxShadow = '0 3px 12px rgba(59, 130, 246, 0.25), 0 1px 6px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)';
			progressFill.style.boxShadow = '0 0 16px rgba(59, 130, 246, 0.4), 0 0 8px rgba(147, 51, 234, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
		});

		// Effet de survol
		sliderWrapper.addEventListener('mouseenter', () => {
			if (thumb.style.cursor !== 'grabbing') {
				thumb.style.transform = 'translate(-50%, -50%) scale(1.05)';
				thumb.style.boxShadow = '0 4px 14px rgba(59, 130, 246, 0.3), 0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.85)';
			}
		});

		sliderWrapper.addEventListener('mouseleave', () => {
			if (thumb.style.cursor !== 'grabbing') {
				thumb.style.transform = 'translate(-50%, -50%) scale(1)';
				thumb.style.boxShadow = '0 3px 12px rgba(59, 130, 246, 0.25), 0 1px 6px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)';
			}
		});

		// Assemblage final
		sliderWrapper.appendChild(slider);
		sliderWrapper.appendChild(thumb);
		container.appendChild(sliderWrapper);
		container.appendChild(labelsContainer);
		return container;
	}

	/**
	 * Creates a modern notification with glassmorphism effect
	 * @param message Notification message
	 * @param type Notification type
	 * @param duration Duration in ms
	 * @returns HTMLDivElement
	 */
	static createNotification(message: string, type: 'info' | 'success' | 'warning' | 'danger', duration: number = 3000): HTMLDivElement {
		const notification = document.createElement('div');

		// Apply glassmorphism effect
		this.applyGlassEffect(notification, 'medium', {
			padding: `${this.spacing.md} ${this.spacing.lg}`,
			margin: this.spacing.md,
			borderLeft: `4px solid ${this.colors[type]}`,
			color: this.colors.light,
			fontFamily: this.fonts.primary,
			fontSize: this.fonts.sizes.sm,
			position: 'relative',
			animation: `fadeInRight ${this.animation.normal} forwards`,
			maxWidth: '300px',
			boxSizing: 'border-box',
		});

		notification.textContent = message;

		// Create and add animation styles if they don't exist
		if (!document.getElementById('kxs-notification-animations')) {
			const style = document.createElement('style');
			style.id = 'kxs-notification-animations';
			style.textContent = `
        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
      `;
			document.head.appendChild(style);
		}

		// Auto-remove after duration
		if (duration > 0) {
			setTimeout(() => {
				notification.style.animation = `fadeOut ${this.animation.normal} forwards`;
				// Use event listener for animation end instead of setTimeout
				notification.addEventListener('animationend', function onAnimationEnd() {
					if (notification.parentNode) {
						notification.parentNode.removeChild(notification);
					}
					notification.removeEventListener('animationend', onAnimationEnd);
				}, { once: true });
			}, duration);
		}

		return notification;
	}
}
