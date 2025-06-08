/**
 * LoadingScreen.ts
 * 
 * This module provides a loading animation with a logo and a rotating loading circle
 * that displays during the loading of game resources.
 */

export class LoadingScreen {
	private container: HTMLDivElement;
	private logoUrl: string;

	/**
	 * Creates a new instance of the loading screen
	 * @param logoUrl URL of the Kxs logo to display
	 */
	constructor(logoUrl: string) {
		this.logoUrl = logoUrl;
		this.container = document.createElement('div');
		this.initializeStyles();
		this.createContent();
	}

	/**
	 * Initializes CSS styles for the loading screen
	 */
	private initializeStyles(): void {
		// Styles for the main container
		Object.assign(this.container.style, {
			position: 'fixed',
			top: '0',
			left: '0',
			width: '100%',
			height: '100%',
			backgroundColor: 'rgba(0, 0, 0, 0.9)',
			display: 'flex',
			flexDirection: 'column',
			justifyContent: 'center',
			alignItems: 'center',
			zIndex: '9999',
			transition: 'opacity 0.5s ease-in-out',
			animation: 'fadeIn 0.5s ease-in-out',
			backdropFilter: 'blur(5px)'
		});
	}

	/**
	 * Creates the loading screen content (logo and loading circle)
	 */
	private createContent(): void {
		// Create container for the logo
		const logoContainer = document.createElement('div');
		Object.assign(logoContainer.style, {
			width: '200px',
			height: '200px',
			marginBottom: '20px',
			position: 'relative',
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center'
		});

		// Create the logo element
		const logo = document.createElement('img');
		logo.src = this.logoUrl;
		Object.assign(logo.style, {
			width: '150px',
			height: '150px',
			objectFit: 'contain',
			position: 'absolute',
			zIndex: '2',
			animation: 'pulse 2s ease-in-out infinite'
		});

		// Create the main loading circle
		const loadingCircle = document.createElement('div');
		Object.assign(loadingCircle.style, {
			width: '180px',
			height: '180px',
			border: '4px solid transparent',
			borderTopColor: '#3498db',
			borderRadius: '50%',
			animation: 'spin 1.5s linear infinite',
			position: 'absolute',
			zIndex: '1'
		});

		// Create a second loading circle (rotating in the opposite direction)
		const loadingCircle2 = document.createElement('div');
		Object.assign(loadingCircle2.style, {
			width: '200px',
			height: '200px',
			border: '2px solid transparent',
			borderLeftColor: '#e74c3c',
			borderRightColor: '#e74c3c',
			borderRadius: '50%',
			animation: 'spin-reverse 3s linear infinite',
			position: 'absolute',
			zIndex: '0'
		});

		// Add animations
		const styleSheet = document.createElement('style');
		styleSheet.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            @keyframes spin-reverse {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(-360deg); }
            }
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            @keyframes fadeIn {
                0% { opacity: 0; }
                100% { opacity: 1; }
            }
        `;
		document.head.appendChild(styleSheet);

		// Ajout d'un texte de chargement
		const loadingText = document.createElement('div');
		loadingText.textContent = 'Loading...';
		Object.assign(loadingText.style, {
			color: 'white',
			fontFamily: 'Arial, sans-serif',
			fontSize: '18px',
			marginTop: '20px',
			animation: 'pulse 1.5s ease-in-out infinite'
		});

		// Ajout d'un sous-texte
		const subText = document.createElement('div');
		subText.textContent = 'Initializing resources...';
		Object.assign(subText.style, {
			color: 'rgba(255, 255, 255, 0.7)',
			fontFamily: 'Arial, sans-serif',
			fontSize: '14px',
			marginTop: '5px'
		});

		// Assemble the elements
		logoContainer.appendChild(loadingCircle2);
		logoContainer.appendChild(loadingCircle);
		logoContainer.appendChild(logo);
		this.container.appendChild(logoContainer);
		this.container.appendChild(loadingText);
		this.container.appendChild(subText);
	}

	/**
	 * Shows the loading screen
	 */
	public show(): void {
		document.body.appendChild(this.container);
	}

	/**
	 * Hides the loading screen with a fade transition
	 */
	public hide(): void {
		this.container.style.opacity = '0';
		// Optimized: use event listener for transition end instead of setTimeout
		this.container.addEventListener('transitionend', () => {
			if (this.container.parentNode) {
				document.body.removeChild(this.container);
			}
		}, { once: true });
	}
}
