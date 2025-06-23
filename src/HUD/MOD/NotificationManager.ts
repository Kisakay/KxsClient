import { DesignSystem } from "../DesignSystem";

class NotificationManager {
	private static instance: NotificationManager;
	private notifications: HTMLElement[] = [];
	private readonly NOTIFICATION_HEIGHT = 65; // Height + margin

	private constructor() {
		this.addGlobalStyles();
	}

	public static getInstance(): NotificationManager {
		if (!NotificationManager.instance) {
			NotificationManager.instance = new NotificationManager();
		}
		return NotificationManager.instance;
	}

	private addGlobalStyles(): void {
		const styleSheet = document.createElement("style");
		styleSheet.textContent = `
        @keyframes slideIn {
          0% { transform: translateX(-120%); opacity: 0; }
          50% { transform: translateX(10px); opacity: 0.8; }
          100% { transform: translateX(0); opacity: 1; }
        }
  
        @keyframes slideOut {
          0% { transform: translateX(0); opacity: 1; }
          50% { transform: translateX(10px); opacity: 0.8; }
          100% { transform: translateX(-120%); opacity: 0; }
        }
  
        @keyframes slideLeft {
          from { transform-origin: right; transform: scaleX(1); }
          to { transform-origin: right; transform: scaleX(0); }
        }
  
        @keyframes bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `;
		document.head.appendChild(styleSheet);
	}

	private updateNotificationPositions(): void {
		this.notifications.forEach((notification, index) => {
			const topPosition = 20 + (index * this.NOTIFICATION_HEIGHT);
			notification.style.top = `${topPosition}px`;
		});
	}

	private removeNotification(notification: HTMLElement): void {
		const index = this.notifications.indexOf(notification);
		if (index > -1) {
			this.notifications.splice(index, 1);
			this.updateNotificationPositions();
		}
	}

	private getIconConfig(type: "success" | "info" | "error") {
		const configs = {
			success: {
				color: '#4CAF50',
				svg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>`
			},
			error: {
				color: '#F44336',
				svg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
                </svg>`
			},
			info: {
				color: '#FFD700',
				svg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>`
			}
		};
		return configs[type];
	}

	// Helper method to check if glassmorphism is enabled
	private isGlassmorphismEnabled(): boolean {
		return globalThis.kxsClient?.isGlassmorphismEnabled ?? true;
	}

	public showNotification(message: string, type: "success" | "info" | "error", duration: number = 5000): void {
		const notification = document.createElement("div");

		// Apply styles using DesignSystem with dark theme to match the rest of the interface
		DesignSystem.applyGlassEffect(notification, this.isGlassmorphismEnabled() ? 'light' : 'dark', {
			position: "fixed",
			top: "20px",
			left: "20px",
			padding: DesignSystem.spacing.md + " " + DesignSystem.spacing.lg,
			color: "white",
			zIndex: DesignSystem.layers.notification.toString(),
			minWidth: "200px",
			display: "flex",
			alignItems: "center",
			gap: DesignSystem.spacing.sm,
			transform: "translateX(-120%)",
			opacity: "0",
			fontFamily: DesignSystem.fonts.primary
		});

		// Create icon
		const icon = document.createElement("div");
		Object.assign(icon.style, {
			width: "20px",
			height: "20px",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			animation: "bounce 0.5s ease-in-out"
		});

		const iconConfig = this.getIconConfig(type);
		icon.style.color = iconConfig.color;
		icon.innerHTML = iconConfig.svg;

		// Create message
		const messageDiv = document.createElement("div");
		messageDiv.textContent = message;
		messageDiv.style.flex = "1";

		// Create progress bar with appropriate style based on glassmorphism setting
		const progressBar = document.createElement("div");

		if (this.isGlassmorphismEnabled()) {
			// Glassmorphism progress bar style
			Object.assign(progressBar.style, {
				height: "4px",
				background: "rgba(255, 255, 255, 0.3)",
				backdropFilter: "blur(5px)",
				webkitBackdropFilter: "blur(5px)",
				borderRadius: `0 0 ${DesignSystem.radius.lg} ${DesignSystem.radius.lg}`,
				width: "100%",
				position: "absolute",
				bottom: "0",
				left: "0",
				animation: `slideLeft ${duration}ms linear forwards`
			});
		} else {
			// Classic progress bar style
			Object.assign(progressBar.style, {
				height: "3px",
				background: type === "success" ? "#4CAF50" : type === "error" ? "#F44336" : "#2196F3",
				opacity: "0.7",
				borderRadius: `0 0 ${DesignSystem.radius.md} ${DesignSystem.radius.md}`,
				width: "100%",
				position: "absolute",
				bottom: "0",
				left: "0",
				animation: `slideLeft ${duration}ms linear forwards`
			});
		}

		// Assemble notification
		notification.appendChild(icon);
		notification.appendChild(messageDiv);
		notification.appendChild(progressBar);
		document.body.appendChild(notification);

		// Add to stack and update positions
		this.notifications.push(notification);
		this.updateNotificationPositions();

		// Entrance animation
		requestAnimationFrame(() => {
			notification.style.transition = "all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)";
			notification.style.animation = "slideIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards";
		});

		// Exit animation and cleanup (optimized)
		setTimeout(() => {
			notification.style.animation = "slideOut 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards";
			// Use event listener for animation end instead of setTimeout
			notification.addEventListener('animationend', () => {
				this.removeNotification(notification);
				notification.remove();
			}, { once: true });
		}, duration);
	}
}

export {
	NotificationManager
};