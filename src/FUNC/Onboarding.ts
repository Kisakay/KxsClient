// FUNC/Onboarding.ts
// @ts-ignore
import htmlTemplate from '../assets/onboarding.html?raw';
// @ts-ignore
import styles from '../assets/onboarding-styles.css?raw';
import { felicitation } from './Felicitations';

export class OnboardingModal {
	private overlay: HTMLDivElement | null = null;
	private isVisible: boolean = false;

	// Inject CSS styles
	private injectStyles(): void {
		const styleId = 'onboarding-styles';

		// Check if styles already exist
		if (document.getElementById(styleId)) {
			return;
		}

		const styleElement = document.createElement('style');
		styleElement.id = styleId;
		styleElement.textContent = styles;
		document.head.appendChild(styleElement);
	}

	// Show the onboarding modal
	public show(): void {
		if (this.isVisible) {
			return;
		}

		// Inject CSS styles
		this.injectStyles();

		// Create overlay element
		this.overlay = document.createElement('div');
		this.overlay.innerHTML = htmlTemplate;

		// Get the actual overlay from the created HTML
		const overlayElement = this.overlay.firstElementChild as HTMLDivElement;

		// Add to document body
		document.body.appendChild(overlayElement);

		// Store reference to the overlay
		this.overlay = overlayElement;
		this.isVisible = true;

		// Add event listeners
		this.addEventListeners();
	}

	// Hide the onboarding modal
	public hide(): void {
		if (!this.isVisible || !this.overlay) {
			return;
		}

		// Remove overlay from DOM
		this.overlay.remove();
		this.overlay = null;
		this.isVisible = false;
		felicitation(true, "https://kxs.rip/assets/o_sound.mp3", 2000, "Welcome to KxsClient");
		localStorage.setItem("on_boarding_complete", "yes");
	}

	// Add event listeners for interactions
	private addEventListeners(): void {
		if (!this.overlay) return;

		// Play button click handler
		const playButton = this.overlay.querySelector('#play-now-btn') as HTMLButtonElement;
		if (playButton) {
			playButton.addEventListener('click', () => {
				this.onPlayButtonClick();
			});
		}

		// Discord button click handler
		const discordButton = this.overlay.querySelector('#discord-btn') as HTMLButtonElement;
		if (discordButton) {
			discordButton.addEventListener('click', () => {
				this.onDiscordButtonClick();
			});
		}

		// Click outside to close (optional)
		this.overlay.addEventListener('click', (e) => {
			if (e.target === this.overlay) {
				this.hide();
			}
		});

		// ESC key to close
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape' && this.isVisible) {
				this.hide();
			}
		});
	}

	// Handle play button click
	private onPlayButtonClick(): void {
		// Close the modal
		this.hide();
	}

	// Handle Discord button click
	private onDiscordButtonClick(): void {
		// Replace with your actual Discord invite link
		window.open('https://discord.wf/kxsclient', '_blank');
	}

	// Check if modal is currently visible
	public isOpen(): boolean {
		return this.isVisible;
	}
}

export default OnboardingModal;