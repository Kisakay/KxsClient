export class ServerSelector {
	private isActive: boolean = false;
	private serverContainer: HTMLElement | null = null;
	private serverCards: HTMLElement[] = [];
	private selectedIndex: number = 0;
	private originalBodyContent: string = '';
	private animation: number | null = null;
	private servers: string[] = [];
	private onServerSelect: ((server: string) => void) | null = null;

	constructor(servers: string[], onServerSelect?: (server: string) => void) {
		this.servers = this.processServerUrls(servers);
		this.onServerSelect = onServerSelect || null;
	}

	/**
	 * Process server URLs from match patterns to display-friendly names
	 */
	private processServerUrls(servers: string[]): string[] {
		return servers.map(server => {
			// Remove wildcards and protocol
			return server.replace(/^\*:\/\//, '')
				// Remove trailing wildcards
				.replace(/\/\*$/, '')
				// Handle special case for IP addresses
				.replace(/\/+$/, '');
		});
	}

	/**
	 * Show the server selection interface
	 */
	public show(): void {
		// If already active, close first to reset properly
		if (this.isActive) {
			this.close();
		}

		this.isActive = true;

		// Store original content if not already stored
		if (!this.originalBodyContent) {
			this.originalBodyContent = document.body.innerHTML;
		}

		// Create overlay
		this.createInterface();

		// Start animations
		this.startAnimations();

		// Add keyboard navigation
		this.setupKeyboardNavigation();
	}

	/**
	 * Create the server selection interface
	 */
	private createInterface(): void {
		// Create overlay container
		const overlay = document.createElement('div');
		overlay.style.position = 'fixed';
		overlay.style.top = '0';
		overlay.style.left = '0';
		overlay.style.width = '100%';
		overlay.style.height = '100%';
		overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
		overlay.style.display = 'flex';
		overlay.style.flexDirection = 'column';
		overlay.style.justifyContent = 'center';
		overlay.style.alignItems = 'center';
		overlay.style.zIndex = '10000';
		overlay.style.perspective = '1000px';
		overlay.style.fontFamily = 'Arial, sans-serif';

		// Create header
		const header = document.createElement('h1');
		header.textContent = 'Select Server';
		header.style.color = '#fff';
		header.style.marginBottom = '40px';
		header.style.fontSize = '36px';
		header.style.textShadow = '0 0 10px rgba(255,0,0,0.8)';
		overlay.appendChild(header);

		// Create server container
		this.serverContainer = document.createElement('div');
		this.serverContainer.style.position = 'relative';
		this.serverContainer.style.width = '80%';
		this.serverContainer.style.height = '300px';
		this.serverContainer.style.display = 'flex';
		this.serverContainer.style.justifyContent = 'center';
		this.serverContainer.style.alignItems = 'center';
		this.serverContainer.style.transformStyle = 'preserve-3d';
		overlay.appendChild(this.serverContainer);

		// Create instructions
		const instructions = document.createElement('div');
		instructions.style.position = 'absolute';
		instructions.style.bottom = '20px';
		instructions.style.color = '#aaa';
		instructions.style.fontSize = '16px';
		instructions.innerHTML = 'Use <strong>←/→</strong> arrows to navigate | <strong>Enter</strong> to select | <strong>Esc</strong> to close';
		overlay.appendChild(instructions);

		// Create server cards
		this.createServerCards();

		// Add the overlay to the body
		document.body.appendChild(overlay);
	}

	/**
	 * Create 3D rotating cards for each server
	 */
	private createServerCards(): void {
		if (!this.serverContainer) return;

		const totalServers = this.servers.length;
		const radius = 300; // Radius of the circle
		const cardWidth = 200;
		const cardHeight = 120;

		this.servers.forEach((server, index) => {
			const card = document.createElement('div');
			card.className = 'server-card';
			card.style.position = 'absolute';
			card.style.width = `${cardWidth}px`;
			card.style.height = `${cardHeight}px`;
			card.style.backgroundColor = index === this.selectedIndex ? '#500' : '#333';
			card.style.color = '#fff';
			card.style.borderRadius = '10px';
			card.style.display = 'flex';
			card.style.flexDirection = 'column';
			card.style.justifyContent = 'center';
			card.style.alignItems = 'center';
			card.style.cursor = 'pointer';
			card.style.boxShadow = '0 10px 20px rgba(0,0,0,0.5)';
			card.style.transition = 'background-color 0.3s ease';
			card.style.padding = '15px';
			card.style.backfaceVisibility = 'hidden';

			// Create server name
			const serverName = document.createElement('h2');
			serverName.textContent = server;
			serverName.style.margin = '0 0 10px 0';
			serverName.style.fontSize = '20px';
			card.appendChild(serverName);

			// Add status indicator
			const status = document.createElement('div');
			status.style.width = '10px';
			status.style.height = '10px';
			status.style.borderRadius = '50%';
			status.style.backgroundColor = '#0f0'; // Green for online
			status.style.marginTop = '10px';
			card.appendChild(status);

			// Add click event
			card.addEventListener('click', () => {
				this.selectedIndex = index;
				this.updateCardPositions();
				this.selectServer();
			});

			this.serverCards.push(card);
			if (this.serverContainer) {
				this.serverContainer.appendChild(card);
			}
		});

		// Position the cards in a circle
		this.updateCardPositions();
	}

	/**
	 * Update the positions of all server cards in a 3D circle
	 */
	private updateCardPositions(): void {
		const totalServers = this.servers.length;
		const radius = Math.max(300, totalServers * 40); // Adjust radius based on number of servers

		this.serverCards.forEach((card, index) => {
			// Calculate position on the circle
			const theta = ((index - this.selectedIndex) / totalServers) * 2 * Math.PI;
			const x = radius * Math.sin(theta);
			const z = radius * Math.cos(theta) - radius;

			// Update card style
			card.style.transform = `translateX(${x}px) translateZ(${z}px) rotateY(${-theta * 180 / Math.PI}deg)`;
			card.style.zIndex = z < 0 ? '-1' : '1';
			card.style.opacity = (1 - Math.abs(index - this.selectedIndex) / totalServers).toString();
			card.style.backgroundColor = index === this.selectedIndex ? '#500' : '#333';

			// Add glow effect to selected card
			if (index === this.selectedIndex) {
				card.style.boxShadow = '0 0 20px rgba(255,0,0,0.8), 0 10px 20px rgba(0,0,0,0.5)';
			} else {
				card.style.boxShadow = '0 10px 20px rgba(0,0,0,0.5)';
			}
		});
	}

	/**
	 * Start animations for the 3D carousel
	 */
	private startAnimations(): void {
		// Subtle continuous movement for more 3D effect using requestAnimationFrame
		let angle = 0;
		let animationId: number;

		const animate = () => {
			angle += 0.005;
			if (this.serverContainer) {
				this.serverContainer.style.transform = `rotateY(${Math.sin(angle) * 5}deg) rotateX(${Math.cos(angle) * 3}deg)`;
			}
			animationId = requestAnimationFrame(animate);
		};

		// Store the animation ID for cleanup
		this.animation = animationId = requestAnimationFrame(animate);
	}

	/**
	 * Set up keyboard navigation
	 */
	private setupKeyboardNavigation(): void {
		const keyHandler = (e: KeyboardEvent) => {
			switch (e.key) {
				case 'ArrowLeft':
					this.navigate(-1);
					break;
				case 'ArrowRight':
					this.navigate(1);
					break;
				case 'Enter':
					this.selectServer();
					break;
				case 'Escape':
					this.close();
					break;
			}
		};

		document.addEventListener('keydown', keyHandler);

		// Store the handler reference so it can be removed when the selector is closed
		(this as any)._keyHandler = keyHandler;
	}

	/**
	 * Navigate between servers
	 */
	private navigate(direction: number): void {
		const totalServers = this.servers.length;
		this.selectedIndex = (this.selectedIndex + direction + totalServers) % totalServers;
		this.updateCardPositions();
	}

	/**
	 * Select current server and close the selector
	 */
	private selectServer(): void {
		const selectedServer = this.servers[this.selectedIndex];

		if (this.onServerSelect && selectedServer) {
			this.onServerSelect(selectedServer);
		}

		this.close();
	}

	/**
	 * Close the server selector
	 */
	public close(): void {
		if (!this.isActive) return;
		this.isActive = false;

		// Stop animations
		if (this.animation !== null) {
			clearInterval(this.animation);
			this.animation = null;
		}

		// Remove keyboard event listener
		if ((this as any)._keyHandler) {
			document.removeEventListener('keydown', (this as any)._keyHandler);
			(this as any)._keyHandler = null;
		}

		// Remove the overlay
		document.querySelectorAll('div.server-card').forEach(el => el.remove());
		if (this.serverContainer && this.serverContainer.parentNode) {
			const parent = this.serverContainer.parentNode;
			if (parent && parent instanceof HTMLElement) {
				parent.remove();
			} else if (parent) {
				// Fallback if parentNode exists but isn't an HTMLElement
				const parentEl = parent as unknown as Element;
				parentEl.parentNode?.removeChild(parentEl);
			}
		}

		// Reset state for next use
		this.serverContainer = null;
		this.serverCards = [];
		this.selectedIndex = 0;
	}
}
