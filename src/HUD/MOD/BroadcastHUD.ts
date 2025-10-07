import { DesignSystem } from "../DesignSystem";
import KxsClient from "../../KxsClient";

/**
 * BroadcastHUD - Displays broadcast messages in a glassmorphism HUD
 * matching the online menu style from KxsClient
 */
export class BroadcastHUD {
	private static instance: BroadcastHUD | null = null;
	private container: HTMLDivElement;
	private messageElement: HTMLDivElement;
	private progressBar: HTMLDivElement;
	private currentMessage: string = "";
	private isVisible: boolean = false;
	private hideTimeout: number | null = null;
	private progressAnimation: Animation | null = null;
	private kxsClient: KxsClient;

	/**
	 * Get the singleton instance of BroadcastHUD
	 * @param kxsClient Reference to the KxsClient instance
	 * @returns BroadcastHUD instance
	 */
	public static getInstance(kxsClient: KxsClient): BroadcastHUD {
		if (!BroadcastHUD.instance) {
			BroadcastHUD.instance = new BroadcastHUD(kxsClient);
		}
		return BroadcastHUD.instance;
	}

	/**
	 * Private constructor to enforce singleton pattern
	 * @param kxsClient Reference to the KxsClient instance
	 */
	private constructor(kxsClient: KxsClient) {
		this.kxsClient = kxsClient;
		this.container = document.createElement("div");
		this.messageElement = document.createElement("div");
		this.progressBar = document.createElement("div");
		this.createHUD();
	}

	/**
	 * Create the HUD container and elements
	 */
	private createHUD(): void {
		// Check if glassmorphism is enabled
		const is_glassmorphism_enabled = this.kxsClient.isGlassmorphismEnabled;

		// Apply the appropriate styling based on glassmorphism toggle
		Object.assign(this.container.style, {
			position: "fixed",
			top: "20px",
			right: "20px",
			padding: "8px 18px 0 18px", // Remove bottom padding to accommodate progress bar
			zIndex: "999",
			minWidth: "280px",
			maxWidth: "400px",
			display: "flex",
			flexDirection: "column",
			alignItems: "flex-start",
			opacity: "0",
			pointerEvents: "none",
			transition: "all 0.3s ease",
			transform: "translateY(-20px)",
			// Apply different styles based on glassmorphism toggle
			background: is_glassmorphism_enabled ? "rgba(255, 255, 255, 0.1)" : "rgba(50, 50, 50, 0.95)",
			backdropFilter: is_glassmorphism_enabled ? "blur(20px) saturate(180%)" : "none",
			WebkitBackdropFilter: is_glassmorphism_enabled ? "blur(20px) saturate(180%)" : "none",
			border: is_glassmorphism_enabled ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid #555",
			borderRadius: is_glassmorphism_enabled ? "16px" : "10px",
			boxShadow: is_glassmorphism_enabled ?
				"0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)" :
				"0 4px 15px rgba(0, 0, 0, 0.4)",
			fontSize: "15px",
			userSelect: "none",
			fontFamily: "inherit",
			overflow: "hidden" // Ensure progress bar doesn't overflow
		});

		// Create header
		const header = document.createElement("div");
		Object.assign(header.style, {
			display: "flex",
			alignItems: "center",
			marginBottom: "8px",
			width: "100%"
		});

		// Create notification dot (similar to online dot)
		const dot = document.createElement("span");
		Object.assign(dot.style, {
			display: "inline-block",
			width: "12px",
			height: "12px",
			borderRadius: "50%",
			background: "#3fae2a",
			marginRight: "10px",
			boxShadow: "0 0 8px #3fae2a"
		});

		// Create title
		const title = document.createElement("div");
		title.textContent = `BROADCAST MESSAGE FROM ${client.acronym_upper} CREATOR`;
		Object.assign(title.style, {
			fontWeight: "bold",
			color: "#fff",
			fontSize: "15px"
		});

		header.appendChild(dot);
		header.appendChild(title);

		// Create message element
		Object.assign(this.messageElement.style, {
			fontFamily: "inherit",
			fontSize: "14px",
			lineHeight: "1.5",
			color: "#fff",
			width: "100%",
			wordBreak: "break-word"
		});

		// Create decorative line
		const decorativeLine = document.createElement("div");
		Object.assign(decorativeLine.style, {
			background: "linear-gradient(90deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.05) 100%)",
			width: "100%",
			margin: "8px 0"
		});

		// Create progress bar at the bottom
		Object.assign(this.progressBar.style, {
			height: is_glassmorphism_enabled ? "4px" : "3px",
			marginTop: "10px",
			background: "linear-gradient(to right, #3fae2a, #6ae95f)",
			transformOrigin: "left",
			transform: "scaleX(0)",
			transition: "transform 0.2s linear",
			alignSelf: "flex-start",
			marginLeft: "-18px", // To compensate for container padding
			width: "calc(100% + 36px)" // Extend full width including padding
		});

		// Assemble HUD
		this.container.appendChild(header);
		this.container.appendChild(decorativeLine);
		this.container.appendChild(this.messageElement);
		this.container.appendChild(this.progressBar);

		// Add to document
		document.body.appendChild(this.container);

		// Create animation style for the dot
		if (!document.getElementById('kxs-broadcast-style')) {
			const style = document.createElement('style');
			style.id = 'kxs-broadcast-style';
			style.innerHTML = `
                @keyframes kxs-broadcast-pulse {
                    0% { box-shadow:0 0 8px #3fae2a; opacity: 1; }
                    100% { box-shadow:0 0 16px #3fae2a; opacity: 0.6; }
                }
            `;
			document.head.appendChild(style);

			// Apply animation to dot
			dot.style.animation = "kxs-broadcast-pulse 1s infinite alternate";
		}
	}

	/**
	 * Show a broadcast message in the HUD
	 * @param message The message to display
	 * @param duration How long to show the message (ms)
	 */
	public showMessage(message: string, duration: number = 8000): void {
		if (!this.container || !this.messageElement) return;

		// Clear any existing timeout and animation
		if (this.hideTimeout !== null) {
			clearTimeout(this.hideTimeout);
			this.hideTimeout = null;
		}

		if (this.progressAnimation) {
			this.progressAnimation.cancel();
			this.progressAnimation = null;
		}

		// Reset progress bar
		this.progressBar.style.transform = "scaleX(0)";

		// Update message
		this.currentMessage = message;
		this.messageElement.textContent = message;

		// Show HUD if not already visible
		if (!this.isVisible) {
			this.container.style.opacity = "1";
			this.container.style.transform = "translateY(0)";
			this.container.style.pointerEvents = "auto";
			this.isVisible = true;
		} else {
			// Apply a quick pulse effect to draw attention to the new message
			const dot = this.container.querySelector('span');
			if (dot) {
				dot.style.animation = "none";
				setTimeout(() => {
					if (dot) {
						dot.style.animation = "kxs-broadcast-pulse 1s infinite alternate";
					}
				}, 10);
			}
		}

		// Animate progress bar
		this.progressAnimation = this.progressBar.animate(
			[
				{ transform: "scaleX(0)" },
				{ transform: "scaleX(1)" }
			],
			{
				duration: duration,
				easing: "linear",
				fill: "forwards"
			}
		);

		// Set timeout to hide the message
		this.hideTimeout = setTimeout(() => {
			this.hideMessage();
		}, duration) as unknown as number;
	}

	/**
	 * Hide the broadcast message HUD
	 */
	private hideMessage(): void {
		if (!this.container) return;

		this.container.style.opacity = "0";
		this.container.style.transform = "translateY(-20px)";
		this.container.style.pointerEvents = "none";
		this.isVisible = false;

		if (this.hideTimeout !== null) {
			clearTimeout(this.hideTimeout);
			this.hideTimeout = null;
		}

		if (this.progressAnimation) {
			this.progressAnimation.cancel();
			this.progressAnimation = null;
		}

		// Reset progress bar
		this.progressBar.style.transform = "scaleX(0)";
	}
}
