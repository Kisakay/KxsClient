import { ServerSelector } from "./ServerSelector";
import config from "../../config.json";

export class EasterEgg {
	private originalStyles: { [key: string]: string } = {};
	private zelda3Sound: HTMLAudioElement | null = null;
	private periodSound: HTMLAudioElement | null = null;
	private ambientSound: HTMLAudioElement | null = null;
	private buttonClickSound: HTMLAudioElement | null = null;
	private arrowKeySound: HTMLAudioElement | null = null;
	private enterKeySound: HTMLAudioElement | null = null;
	private closeMenuSound: HTMLAudioElement | null = null;
	private textElement: HTMLElement | null = null;
	private fireElements: HTMLElement[] = [];
	private pillars: HTMLElement[] = [];
	private isActive: boolean = false;
	private isInitialized: boolean = false;
	private overlayElement: HTMLElement | null = null;
	private animationFrameId: number | null = null;
	private originalBodyContent: string = '';
	private serverSelector: ServerSelector | null = null;
	private serverButton: HTMLElement | null = null;
	private messageChangeInterval: number | null = null;
	private messages: string[] = [
		"You're already in",
		"You didnt have found Kxs, is kxs who found you",
		"The prophecies are true",
		"Kxs is the chosen one",
		"Kxs is the one who will save you",
		"I am Kxs, the one who will save you"
	];
	private globalEventHandlersInitialized: boolean = false;

	constructor() {
		this.init();
	}

	private init(): void {
		// Check if we're on the target website
		if (window.location.hostname === 'kxs.rip' || window.location.hostname === 'www.kxs.rip') {
			// Initialize sounds
			this.zelda3Sound = new Audio('https://kxs.rip/assets/message.mp3'); // Replace with actual Zelda sound
			this.periodSound = new Audio('https://kxs.rip/assets/message-finish.mp3'); // Sound for the final period
			this.ambientSound = new Audio('https://kxs.rip/assets/hell_ambiance.m4a'); // Replace with actual ambient URL
			this.buttonClickSound = new Audio('https://kxs.rip/assets/enter.mp3'); // Button click sound
			this.arrowKeySound = new Audio('https://kxs.rip/assets/arrow.mp3'); // Arrow key sound
			this.enterKeySound = new Audio('https://kxs.rip/assets/enter.mp3'); // Enter key sound
			this.closeMenuSound = new Audio('https://kxs.rip/assets/close.mp3'); // Close menu sound

			if (this.ambientSound) {
				this.ambientSound.loop = true;
			}

			// Create the initial overlay with Click prompt instead of immediately applying Easter egg
			this.createInitialOverlay();

			// Initialize global event handlers for interaction sounds
			this.initGlobalEventHandlers();
		}
	}

	/**
	 * Creates the initial blur overlay with Click text
	 */
	private createInitialOverlay(): void {
		// Store original body content to restore it later if needed
		this.originalBodyContent = document.body.innerHTML;

		// Save original styles
		this.saveOriginalStyles();

		// Create the overlay
		this.overlayElement = document.createElement('div');
		const overlay = this.overlayElement;

		// Set full screen styles
		overlay.style.position = 'fixed';
		overlay.style.top = '0';
		overlay.style.left = '0';
		overlay.style.width = '100%';
		overlay.style.height = '100%';
		overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
		overlay.style.backdropFilter = 'blur(10px)';
		(overlay.style as any)['-webkit-backdrop-filter'] = 'blur(10px)';
		overlay.style.display = 'flex';
		overlay.style.justifyContent = 'center';
		overlay.style.alignItems = 'center';
		overlay.style.cursor = 'pointer';
		overlay.style.zIndex = '9999';
		overlay.style.transition = 'opacity 0.5s ease';

		// Create the Click text
		const clickText = document.createElement('div');
		clickText.textContent = 'Click';
		clickText.style.color = '#fff';
		clickText.style.fontSize = '3rem';
		clickText.style.fontWeight = 'bold';
		clickText.style.textShadow = '0 0 10px rgba(255, 255, 255, 0.7)';
		clickText.style.fontFamily = '"Cinzel", "Trajan Pro", serif';
		clickText.style.letterSpacing = '5px';

		// Add font for the text
		const fontLink = document.createElement('link');
		fontLink.rel = 'stylesheet';
		fontLink.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@700&display=swap';
		document.head.appendChild(fontLink);

		// Add click event to start the Easter egg
		overlay.addEventListener('click', () => {
			this.removeOverlay();
			this.applyEasterEgg();
		});

		// Add the text to the overlay
		overlay.appendChild(clickText);

		// Add the overlay to the body
		document.body.appendChild(overlay);
	}

	/**
	 * Removes the initial overlay
	 */
	private removeOverlay(): void {
		if (this.overlayElement && this.overlayElement.parentNode) {
			// Fade out
			this.overlayElement.style.opacity = '0';

			// Remove after transition
			setTimeout(() => {
				if (this.overlayElement && this.overlayElement.parentNode) {
					this.overlayElement.parentNode.removeChild(this.overlayElement);
					this.overlayElement = null;
				}
			}, 500);
		}
	}

	/**
	 * Initialize global event handlers for sounds
	 */
	private initGlobalEventHandlers(): void {
		if (this.globalEventHandlersInitialized) return;
		this.globalEventHandlersInitialized = true;

		// Play sound on button clicks
		document.addEventListener('click', (e) => {
			if (e.target instanceof HTMLButtonElement ||
				e.target instanceof HTMLAnchorElement ||
				(e.target instanceof HTMLElement && e.target.role === 'button')) {
				this.playButtonSound();
			}
		});

		// Play sound on arrow keys and enter key
		document.addEventListener('keydown', (e) => {
			if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
				this.playArrowKeySound();
			} else if (e.key === 'Enter') {
				this.playEnterKeySound();
			}
		});
	}

	private applyEasterEgg(): void {
		if (this.isActive) return;
		this.isActive = true;
		this.isInitialized = true;

		// Transform the website
		this.transformWebsite();

		// Start animations
		this.startAnimations();

		// Play ambient sound
		this.playAmbientSound();

		// Display the message with sound effect
		setTimeout(() => {
			this.displayMessage();

			// Add server selector button after the message is displayed
			this.addServerSelectorButton();
		}, 2000);
	}

	private saveOriginalStyles(): void {
		this.originalStyles = {
			bodyBackground: document.body.style.background,
			bodyColor: document.body.style.color,
			bodyOverflow: document.body.style.overflow
		};
	}

	private transformWebsite(): void {
		// Clear the existing content
		document.body.innerHTML = '';
		document.body.style.margin = '0';
		document.body.style.padding = '0';
		document.body.style.overflow = 'hidden';
		document.body.style.backgroundColor = '#000';
		document.body.style.color = '#fff';
		document.body.style.fontFamily = '"Times New Roman", serif';
		document.body.style.height = '100vh';
		document.body.style.display = 'flex';
		document.body.style.flexDirection = 'column';
		document.body.style.justifyContent = 'center';
		document.body.style.alignItems = 'center';
		document.body.style.perspective = '1000px';

		// Create a temple background
		const temple = document.createElement('div');
		temple.style.position = 'absolute';
		temple.style.top = '0';
		temple.style.left = '0';
		temple.style.width = '100%';
		temple.style.height = '100%';
		temple.style.background = 'linear-gradient(to bottom, #000, #300)';
		temple.style.zIndex = '-2';
		document.body.appendChild(temple);

		// Create pillars
		for (let i = 0; i < 6; i++) {
			const pillar = document.createElement('div');
			pillar.style.position = 'absolute';
			pillar.style.width = '80px';
			pillar.style.height = '100%';
			pillar.style.background = 'linear-gradient(to bottom, #222, #111)';
			pillar.style.transform = `rotateY(${i * 60}deg) translateZ(400px)`;
			pillar.style.boxShadow = 'inset 0 0 20px #500';
			pillar.style.transition = 'transform 0.5s ease-in-out';
			this.pillars.push(pillar);
			document.body.appendChild(pillar);
		}

		// Create floor
		const floor = document.createElement('div');
		floor.style.position = 'absolute';
		floor.style.bottom = '0';
		floor.style.width = '100%';
		floor.style.height = '40%';
		floor.style.background = 'radial-gradient(circle, #300, #100)';
		floor.style.zIndex = '-1';
		document.body.appendChild(floor);

		// Create text container for the message
		this.textElement = document.createElement('div');
		this.textElement.style.position = 'relative';
		this.textElement.style.fontSize = '3.5em';
		this.textElement.style.fontWeight = 'bold';
		this.textElement.style.fontFamily = '"Cinzel", "Trajan Pro", serif';
		this.textElement.style.color = '#f00';
		this.textElement.style.textShadow = '0 0 10px #f00, 0 0 20px #f00, 0 0 30px #900';
		this.textElement.style.letterSpacing = '2px';
		this.textElement.style.opacity = '0';
		this.textElement.style.transition = 'opacity 2s';

		// Add a fancy font from Google Fonts
		const fontLink = document.createElement('link');
		fontLink.rel = 'stylesheet';
		fontLink.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@700&display=swap';
		document.head.appendChild(fontLink);
		document.body.appendChild(this.textElement);

		// Create fire elements as 3D rotating rectangles
		for (let i = 0; i < 20; i++) {
			const fire = document.createElement('div');
			fire.style.position = 'absolute';
			fire.style.width = `${Math.random() * 40 + 20}px`;
			fire.style.height = `${Math.random() * 60 + 40}px`;
			fire.style.background = 'radial-gradient(circle, #f50, #900, transparent)';
			fire.style.borderRadius = '10%';
			fire.style.filter = 'blur(3px)';
			fire.style.opacity = `${Math.random() * 0.5 + 0.5}`;
			const randomX = Math.random() * 100;
			fire.style.left = `${randomX}%`;
			fire.style.bottom = '0';
			fire.style.zIndex = '-1';
			fire.style.transformStyle = 'preserve-3d';
			fire.style.perspective = '1000px';
			fire.dataset.velocityY = `${Math.random() * 2 + 1}`;
			fire.dataset.posX = randomX.toString();
			fire.dataset.posY = '0';
			fire.dataset.rotateX = `${Math.random() * 4 - 2}`; // Random rotation speed X
			fire.dataset.rotateY = `${Math.random() * 4 - 2}`; // Random rotation speed Y
			fire.dataset.rotateZ = `${Math.random() * 4 - 2}`; // Random rotation speed Z
			fire.dataset.rotationX = '0';
			fire.dataset.rotationY = '0';
			fire.dataset.rotationZ = '0';
			this.fireElements.push(fire);
			document.body.appendChild(fire);
		}
	}

	private startAnimations(): void {
		// Animate fire and pillars
		this.animateFireElements();
		this.animatePillars();
	}

	private animateFireElements(): void {
		if (!this.isActive) return;

		this.fireElements.forEach(fire => {
			let posY = parseFloat(fire.dataset.posY || '0');
			const velocityY = parseFloat(fire.dataset.velocityY || '1');

			// Update position
			posY += velocityY;
			fire.dataset.posY = posY.toString();

			// Update rotation
			let rotX = parseFloat(fire.dataset.rotationX || '0');
			let rotY = parseFloat(fire.dataset.rotationY || '0');
			let rotZ = parseFloat(fire.dataset.rotationZ || '0');

			rotX += parseFloat(fire.dataset.rotateX || '0');
			rotY += parseFloat(fire.dataset.rotateY || '0');
			rotZ += parseFloat(fire.dataset.rotateZ || '0');

			fire.dataset.rotationX = rotX.toString();
			fire.dataset.rotationY = rotY.toString();
			fire.dataset.rotationZ = rotZ.toString();

			// Apply transform
			fire.style.transform = `translateY(${-posY}px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`;

			// Reset fire when it goes off screen
			if (posY > 100) {
				posY = 0;
				fire.dataset.posY = '0';
				fire.style.opacity = `${Math.random() * 0.5 + 0.5}`;
				fire.style.width = `${Math.random() * 40 + 20}px`;
				fire.style.height = `${Math.random() * 60 + 40}px`;
				const randomX = Math.random() * 100;
				fire.style.left = `${randomX}%`;
				fire.dataset.posX = randomX.toString();

				// Reset rotation speeds
				fire.dataset.rotateX = `${Math.random() * 4 - 2}`;
				fire.dataset.rotateY = `${Math.random() * 4 - 2}`;
				fire.dataset.rotateZ = `${Math.random() * 4 - 2}`;
			}

			fire.style.opacity = `${Math.max(0, 1 - posY / 100)}`;
		});

		this.animationFrameId = requestAnimationFrame(() => this.animateFireElements());
	}

	private animatePillars(): void {
		if (!this.isActive) return;

		// Create a slow rotation effect for the pillars
		let angle = 0;
		setInterval(() => {
			angle += 0.5;
			this.pillars.forEach((pillar, index) => {
				pillar.style.transform = `rotateY(${index * 60 + angle}deg) translateZ(400px)`;
			});
		}, 100);
	}

	private playAmbientSound(): void {
		// Play ambient sound
		if (this.ambientSound) {
			this.ambientSound.volume = 0.3;
			this.ambientSound.play().catch(err => {
				console.error('Failed to play ambient sound:', err);
			});
		}
	}

	/**
	 * Temporarily reduce ambient sound volume to allow other sounds to be heard better
	 */
	private lowerAmbientVolume(): void {
		if (this.ambientSound) {
			// Store current volume if we need it
			const originalVolume = this.ambientSound.volume;

			// Lower volume
			this.ambientSound.volume = 0.1; // Lower to 1/3 of original volume

			// Restore volume after a delay
			setTimeout(() => {
				if (this.ambientSound) {
					this.ambientSound.volume = 0.3; // Restore to original volume
				}
			}, 500); // Half second delay
		}
	}

	/**
	 * Play button click sound
	 */
	private playButtonSound(): void {
		if (this.buttonClickSound) {
			// Lower ambient volume
			this.lowerAmbientVolume();

			this.buttonClickSound.currentTime = 0;
			this.buttonClickSound.volume = 0.3;
			this.buttonClickSound.play().catch(err => {
				console.error('Failed to play button sound:', err);
			});
		}
	}

	/**
	 * Play arrow key sound
	 */
	private playArrowKeySound(): void {
		if (this.arrowKeySound) {
			// Lower ambient volume
			this.lowerAmbientVolume();

			this.arrowKeySound.currentTime = 0;
			this.arrowKeySound.volume = 0.3;
			this.arrowKeySound.play().catch(err => {
				console.error('Failed to play arrow key sound:', err);
			});
		}
	}

	/**
	 * Play enter key sound
	 */
	private playEnterKeySound(): void {
		if (this.enterKeySound) {
			// Lower ambient volume
			this.lowerAmbientVolume();

			this.enterKeySound.currentTime = 0;
			this.enterKeySound.volume = 0.3;
			this.enterKeySound.play().catch(err => {
				console.error('Failed to play enter key sound:', err);
			});
		}
	}

	private displayMessage(): void {
		if (!this.textElement) return;

		// Set the message text and start with the first message
		this.typeMessage(this.messages[0]);

		// Set up message changing at random intervals
		this.setupMessageChanging();
	}

	/**
	 * Type out a message with the typewriter effect
	 */
	private typeMessage(message: string): void {
		if (!this.textElement) return;

		// Clear current text and ensure visibility
		this.textElement.textContent = '';
		this.textElement.style.opacity = '1';

		// Calculate typing speed based on message length
		// Longer messages type faster (inversely proportional)
		const baseSpeed = 300; // Base speed in ms
		const minSpeed = 40;  // Minimum speed for very long messages
		const typeSpeed = Math.max(minSpeed, baseSpeed - (message.length * 5));

		// Type writer effect with Zelda sound
		let i = 0;
		const typeInterval = setInterval(() => {
			if (i < message.length && this.textElement) {
				// Check if we're at the last character and it's not already a period
				const isLastChar = i === message.length - 1;
				const shouldAddPeriod = isLastChar && message.charAt(i) !== '.';

				// Play the appropriate sound
				if (isLastChar && this.periodSound) {
					// Play special sound for the last character
					this.periodSound.currentTime = 0;
					this.periodSound.volume = 0.3;
					this.periodSound.play().catch(err => {
						console.error('Failed to play period sound:', err);
					});
				} else if (this.zelda3Sound) {
					// Play regular typing sound
					this.zelda3Sound.currentTime = 0;
					this.zelda3Sound.volume = 0.2;
					this.zelda3Sound.play().catch(err => {
						console.error('Failed to play Zelda sound:', err);
					});
				}

				// Add character
				this.textElement.textContent += message.charAt(i);

				// If last character and we should add a period, do it with a pause
				if (shouldAddPeriod) {
					setTimeout(() => {
						if (this.textElement && this.periodSound) {
							this.periodSound.currentTime = 0;
							this.periodSound.volume = 0.4;
							this.periodSound.play().catch(err => {
								console.error('Failed to play period sound:', err);
							});
							this.textElement.textContent += '.';
						}
					}, 400);
				}

				i++;
			} else {
				clearInterval(typeInterval);
			}
		}, typeSpeed); // Dynamic typing speed based on message length
	}

	/**
	 * Setup changing messages at random intervals
	 */
	private setupMessageChanging(): void {
		// Function to change to a random message
		const changeMessage = () => {
			// Get a random message that's different from the current one
			if (!this.textElement) return;

			const currentMessage = this.textElement.textContent || '';
			let newMessage = currentMessage;

			// Make sure we pick a different message
			while (newMessage === currentMessage) {
				const randomIndex = Math.floor(Math.random() * this.messages.length);
				newMessage = this.messages[randomIndex];
			}

			// Type the new message
			this.typeMessage(newMessage);

			// Schedule the next message change
			this.scheduleNextMessageChange();
		};

		// Schedule the first message change
		this.scheduleNextMessageChange();
	}

	/**
	 * Schedule the next message change with a random delay
	 */
	private scheduleNextMessageChange(): void {
		// Clear any existing timer
		if (this.messageChangeInterval !== null) {
			clearTimeout(this.messageChangeInterval);
		}

		// Random delay between 4 and 19 seconds
		const delay = Math.floor(Math.random() * 15000) + 4000; // 4-19 seconds

		// Set timeout for next message change
		this.messageChangeInterval = window.setTimeout(() => {
			// Get a random message that's different from the current one
			if (!this.textElement) return;

			const currentMessage = this.textElement.textContent || '';
			let newMessage = currentMessage;

			// Make sure we pick a different message
			while (newMessage === currentMessage) {
				const randomIndex = Math.floor(Math.random() * this.messages.length);
				newMessage = this.messages[randomIndex];
			}

			// Type the new message
			this.typeMessage(newMessage);

			// Schedule the next message change
			this.scheduleNextMessageChange();
		}, delay);
	}

	/**
	 * Add a button to open the server selector
	 */
	private addServerSelectorButton(): void {
		// Create a button
		this.serverButton = document.createElement('button');
		const button = this.serverButton;

		// Set button text
		button.textContent = 'SELECT SERVER';

		// Position and base styling
		button.style.position = 'absolute';
		button.style.bottom = '30px';
		button.style.left = '50%';
		button.style.transform = 'translateX(-50%)';

		// Enhanced styling
		button.style.backgroundColor = 'transparent';
		button.style.color = '#ff9';
		button.style.border = '2px solid #900';
		button.style.padding = '15px 30px';
		button.style.fontSize = '20px';
		button.style.fontFamily = '"Cinzel", "Trajan Pro", serif';
		button.style.fontWeight = 'bold';
		button.style.letterSpacing = '3px';
		button.style.borderRadius = '3px';
		button.style.textTransform = 'uppercase';
		button.style.boxShadow = '0 0 20px rgba(255, 30, 0, 0.6), inset 0 0 10px rgba(255, 50, 0, 0.4)';
		button.style.textShadow = '0 0 10px rgba(255, 150, 0, 0.8), 0 0 5px rgba(255, 100, 0, 0.5)';
		button.style.cursor = 'pointer';
		button.style.zIndex = '100';
		button.style.opacity = '0';
		button.style.transition = 'all 0.5s ease-in-out';
		button.style.background = 'linear-gradient(to bottom, rgba(80, 0, 0, 0.8), rgba(30, 0, 0, 0.9))';
		button.style.backdropFilter = 'blur(3px)';

		// Add enhanced hover effects
		button.addEventListener('mouseover', () => {
			button.style.color = '#fff';
			button.style.borderColor = '#f00';
			button.style.boxShadow = '0 0 25px rgba(255, 50, 0, 0.8), inset 0 0 15px rgba(255, 100, 0, 0.6)';
			button.style.textShadow = '0 0 15px rgba(255, 200, 0, 1), 0 0 10px rgba(255, 150, 0, 0.8)';
			button.style.transform = 'translateX(-50%) scale(1.05)';
			button.style.background = 'linear-gradient(to bottom, rgba(100, 0, 0, 0.9), rgba(50, 0, 0, 1))';
		});

		button.addEventListener('mouseout', () => {
			button.style.color = '#ff9';
			button.style.borderColor = '#900';
			button.style.boxShadow = '0 0 20px rgba(255, 30, 0, 0.6), inset 0 0 10px rgba(255, 50, 0, 0.4)';
			button.style.textShadow = '0 0 10px rgba(255, 150, 0, 0.8), 0 0 5px rgba(255, 100, 0, 0.5)';
			button.style.transform = 'translateX(-50%)';
			button.style.background = 'linear-gradient(to bottom, rgba(80, 0, 0, 0.8), rgba(30, 0, 0, 0.9))';
		});

		// Add active/press effect
		button.addEventListener('mousedown', () => {
			button.style.transform = 'translateX(-50%) scale(0.98)';
			button.style.boxShadow = '0 0 10px rgba(255, 30, 0, 0.8), inset 0 0 8px rgba(255, 100, 0, 0.8)';
		});

		button.addEventListener('mouseup', () => {
			button.style.transform = 'translateX(-50%) scale(1.05)';
			button.style.boxShadow = '0 0 25px rgba(255, 50, 0, 0.8), inset 0 0 15px rgba(255, 100, 0, 0.6)';
		});

		// Add click handler to show server selector
		button.addEventListener('click', () => {
			this.showServerSelector();
		});

		// Add to body
		document.body.appendChild(button);

		// Fade in the button after a short delay
		setTimeout(() => {
			if (button) {
				button.style.opacity = '1';
			}
		}, 1500);
	}

	/**
	 * Initialize and show the server selector
	 */
	private showServerSelector(): void {
		// Play enter sound when opening the menu
		if (this.enterKeySound) {
			// Lower ambient volume
			this.lowerAmbientVolume();

			this.enterKeySound.currentTime = 0;
			this.enterKeySound.volume = 0.3;
			this.enterKeySound.play().catch(err => {
				console.error('Failed to play enter sound:', err);
			});
		}

		// Function to redirect to a selected server
		const redirectToServer = (server: string) => {
			window.location.href = `https://${server}`;
		};

		// Create server selector if it doesn't exist
		if (!this.serverSelector) {
			// Create a modified version of redirectToServer that includes the close sound
			const redirectWithSound = (server: string) => {
				// Play close sound first
				if (this.closeMenuSound) {
					// Lower ambient volume
					this.lowerAmbientVolume();

					this.closeMenuSound.play().catch(err => {
						console.error('Failed to play close sound:', err);
					});

					// Redirect after a short delay to allow the sound to play
					setTimeout(() => {
						redirectToServer(server);
					}, 300);
				} else {
					// If sound failed to load, just redirect
					redirectToServer(server);
				}
			};

			// Create server selector with our modified redirect function
			this.serverSelector = new ServerSelector(config.match, redirectWithSound);

			// Handle close events to play the close sound
			if (this.serverSelector) {
				const originalClose = this.serverSelector.close.bind(this.serverSelector);
				this.serverSelector.close = () => {
					// Play close sound
					if (this.closeMenuSound) {
						// Lower ambient volume
						this.lowerAmbientVolume();

						this.closeMenuSound.currentTime = 0;
						this.closeMenuSound.volume = 0.3;
						this.closeMenuSound.play().catch(err => {
							console.error('Failed to play close sound:', err);
						});
					}
					// Call original close method
					originalClose();
				};
			}
		}

		// Show the selector
		this.serverSelector.show();
	}

	// Call this method if you ever want to restore the original website
	public restoreWebsite(): void {
		if (!this.isInitialized) return;
		this.isActive = false;
		this.isInitialized = false;

		// Remove overlay if it exists
		if (this.overlayElement) {
			this.removeOverlay();
		}

		// Stop animations
		if (this.animationFrameId) {
			cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}

		// Stop message changing
		if (this.messageChangeInterval !== null) {
			clearTimeout(this.messageChangeInterval);
			this.messageChangeInterval = null;
		}

		// Stop sounds
		if (this.zelda3Sound) {
			this.zelda3Sound.pause();
		}
		if (this.periodSound) {
			this.periodSound.pause();
		}
		if (this.ambientSound) {
			this.ambientSound.pause();
		}
		if (this.buttonClickSound) {
			this.buttonClickSound.pause();
		}
		if (this.arrowKeySound) {
			this.arrowKeySound.pause();
		}
		if (this.enterKeySound) {
			this.enterKeySound.pause();
		}
		if (this.closeMenuSound) {
			this.closeMenuSound.pause();
		}

		// Remove server selector if it exists
		if (this.serverSelector) {
			this.serverSelector.close();
			this.serverSelector = null;
		}

		// Remove server button if it exists
		if (this.serverButton && this.serverButton.parentNode) {
			this.serverButton.parentNode.removeChild(this.serverButton);
			this.serverButton = null;
		}

		// Restore original content
		document.body.innerHTML = this.originalBodyContent;

		// Restore original styles
		document.body.style.background = this.originalStyles.bodyBackground || '';
		document.body.style.color = this.originalStyles.bodyColor || '';
		document.body.style.overflow = this.originalStyles.bodyOverflow || '';

		// Re-initialize global event handlers since they may have been lost
		this.globalEventHandlersInitialized = false;
		this.initGlobalEventHandlers();
	}
}