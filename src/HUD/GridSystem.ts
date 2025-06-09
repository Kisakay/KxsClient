class GridSystem {
	private gridSize: number = 20; // Size of each grid cell
	private snapThreshold: number = 15; // Distance in pixels to trigger snap
	private gridVisible: boolean = false;
	private gridContainer: HTMLDivElement;
	private magneticEdges: boolean = true;
	private counterElements: Record<string, HTMLElement> = {};

	constructor() {
		this.gridContainer = this.createGridOverlay();
		this.setupKeyBindings();
	}

	private createGridOverlay(): HTMLDivElement {
		const container = document.createElement("div");
		container.id = "grid-overlay";
		Object.assign(container.style, {
			position: "fixed",
			top: "0",
			left: "0",
			width: "100%",
			height: "100%",
			pointerEvents: "none",
			zIndex: "9999",
			display: "none",
			opacity: "0.2",
		});

		// Create vertical lines
		for (let x = this.gridSize; x < window.innerWidth; x += this.gridSize) {
			const vLine = document.createElement("div");
			Object.assign(vLine.style, {
				position: "absolute",
				left: `${x}px`,
				top: "0",
				width: "1px",
				height: "100%",
				backgroundColor: "#4CAF50",
			});
			container.appendChild(vLine);
		}

		// Create horizontal lines
		for (let y = this.gridSize; y < window.innerHeight; y += this.gridSize) {
			const hLine = document.createElement("div");
			Object.assign(hLine.style, {
				position: "absolute",
				left: "0",
				top: `${y}px`,
				width: "100%",
				height: "1px",
				backgroundColor: "#4CAF50",
			});
			container.appendChild(hLine);
		}

		document.body.appendChild(container);
		return container;
	}

	private setupKeyBindings(): void {
		document.addEventListener("keydown", (e) => {
			if (e.key === "g" && e.altKey) {
				this.toggleGrid();
			}
		});
	}

	public toggleGrid(): void {
		this.gridVisible = !this.gridVisible;
		this.gridContainer.style.display = this.gridVisible ? "block" : "none";
	}

	public registerCounter(id: string, element: HTMLElement | null): void {
		if (element) {
			this.counterElements[id] = element;
		} else {
			delete this.counterElements[id];
		}
	}

	private areElementsAdjacent(element1: HTMLElement, element2: HTMLElement): { isAdjacent: boolean, position: string } {
		const rect1 = element1.getBoundingClientRect();
		const rect2 = element2.getBoundingClientRect();

		// Tolérance plus généreuse pour détecter l'adjacence
		const tolerance = 15;

		// Calculer les distances entre les éléments
		const horizontalGap = Math.min(
			Math.abs(rect1.right - rect2.left),
			Math.abs(rect2.right - rect1.left)
		);
		const verticalGap = Math.min(
			Math.abs(rect1.bottom - rect2.top),
			Math.abs(rect2.bottom - rect1.top)
		);

		// Vérification de l'adjacence horizontale
		const isLeftAdjacent = Math.abs(rect1.right - rect2.left) <= tolerance;
		const isRightAdjacent = Math.abs(rect2.right - rect1.left) <= tolerance;

		// Vérification de l'adjacence verticale
		const isTopAdjacent = Math.abs(rect1.bottom - rect2.top) <= tolerance;
		const isBottomAdjacent = Math.abs(rect2.bottom - rect1.top) <= tolerance;

		// Vérification du chevauchement avec une marge plus généreuse
		const overlapMargin = 20;
		const overlapVertically =
			(rect1.top - overlapMargin < rect2.bottom && rect1.bottom + overlapMargin > rect2.top);
		const overlapHorizontally =
			(rect1.left - overlapMargin < rect2.right && rect1.right + overlapMargin > rect2.left);

		// Debug: afficher les informations d'adjacence

		let position = "";
		if (isLeftAdjacent && overlapVertically) {
			position = "left";
		} else if (isRightAdjacent && overlapVertically) {
			position = "right";
		} else if (isTopAdjacent && overlapHorizontally) {
			position = "top";
		} else if (isBottomAdjacent && overlapHorizontally) {
			position = "bottom";
		}

		return {
			isAdjacent: position !== "",
			position
		};
	}

	public updateCounterCorners(): void {
		const counterIds = Object.keys(this.counterElements);

		// Reset all counters to default styling
		counterIds.forEach(id => {
			const container = this.counterElements[id];
			const counter = container.querySelector('div') as HTMLElement;
			if (counter) {
				// Maintenir la transition fluide
				counter.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
				container.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

				// Supprimer les attributs de debug
				counter.removeAttribute('data-fused');
				counter.removeAttribute('data-fused-position');

				// Reset to default rounded corners
				counter.style.borderRadius = '8px';

				// Reset borders to default
				counter.style.borderLeft = '1px solid rgba(255, 255, 255, 0.2)';
				counter.style.borderRight = '1px solid rgba(255, 255, 255, 0.2)';
				counter.style.borderTop = '1px solid rgba(255, 255, 255, 0.2)';
				counter.style.borderBottom = '1px solid rgba(255, 255, 255, 0.2)';

				// Reset any fusion effects
				counter.style.marginLeft = '0';
				counter.style.marginRight = '0';
				counter.style.marginTop = '0';
				counter.style.marginBottom = '0';

				// Reset container transformations
				container.style.transform = 'none';
				container.style.zIndex = '10000';

				// Reset to default glassmorphism effect
				counter.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
				counter.style.backdropFilter = 'blur(8px)';
				(counter.style as any)['-webkit-backdrop-filter'] = 'blur(8px)';
				counter.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
			}
		});

		// Apply fusion effects for adjacent counters
		for (let i = 0; i < counterIds.length; i++) {
			for (let j = i + 1; j < counterIds.length; j++) {
				const container1 = this.counterElements[counterIds[i]];
				const container2 = this.counterElements[counterIds[j]];
				const counter1 = container1.querySelector('div') as HTMLElement;
				const counter2 = container2.querySelector('div') as HTMLElement;

				if (counter1 && counter2) {
					const { isAdjacent, position } = this.areElementsAdjacent(container1, container2);

					if (isAdjacent) {
						this.applyFusionEffect(counter1, counter2, position);
					}
				}
			}
		}
	}

	private applyFusionEffect(counter1: HTMLElement, counter2: HTMLElement, position: string): void {
		// Transition fluide pour l'effet de fusion
		const transitionStyle = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
		counter1.style.transition = transitionStyle;
		counter2.style.transition = transitionStyle;

		// Obtenir les conteneurs parents
		const container1 = counter1.parentElement as HTMLElement;
		const container2 = counter2.parentElement as HTMLElement;

		// Appliquer les transitions aux conteneurs aussi
		if (container1) container1.style.transition = transitionStyle;
		if (container2) container2.style.transition = transitionStyle;

		// Debug: marquer les éléments comme fusionnés
		counter1.setAttribute('data-fused', 'true');
		counter2.setAttribute('data-fused', 'true');
		counter1.setAttribute('data-fused-position', position);
		counter2.setAttribute('data-fused-position', position);

		switch (position) {
			case "left":
				// Counter1 est à gauche de counter2
				counter1.style.borderTopRightRadius = '0';
				counter1.style.borderBottomRightRadius = '0';
				counter1.style.borderRight = 'none';
				counter1.style.marginRight = '-3px';

				counter2.style.borderTopLeftRadius = '0';
				counter2.style.borderBottomLeftRadius = '0';
				counter2.style.borderLeft = 'none';
				counter2.style.marginLeft = '-3px';
				break;

			case "right":
				// Counter1 est à droite de counter2
				counter1.style.borderTopLeftRadius = '0';
				counter1.style.borderBottomLeftRadius = '0';
				counter1.style.borderLeft = 'none';
				counter1.style.marginLeft = '-3px';

				counter2.style.borderTopRightRadius = '0';
				counter2.style.borderBottomRightRadius = '0';
				counter2.style.borderRight = 'none';
				counter2.style.marginRight = '-3px';
				break;

			case "top":
				// Counter1 est au-dessus de counter2
				counter1.style.borderBottomLeftRadius = '0';
				counter1.style.borderBottomRightRadius = '0';
				counter1.style.borderBottom = 'none';
				counter1.style.marginBottom = '-3px';

				counter2.style.borderTopLeftRadius = '0';
				counter2.style.borderTopRightRadius = '0';
				counter2.style.borderTop = 'none';
				counter2.style.marginTop = '-3px';
				break;

			case "bottom":
				// Counter1 est en dessous de counter2
				counter1.style.borderTopLeftRadius = '0';
				counter1.style.borderTopRightRadius = '0';
				counter1.style.borderTop = 'none';
				counter1.style.marginTop = '-3px';

				counter2.style.borderBottomLeftRadius = '0';
				counter2.style.borderBottomRightRadius = '0';
				counter2.style.borderBottom = 'none';
				counter2.style.marginBottom = '-3px';
				break;
		}

		// Effet glassmorphism unifié pour les compteurs fusionnés
		const fusedBackground = 'rgba(255, 255, 255, 0.22)';
		const fusedBlur = 'blur(16px)';
		const fusedShadow = '0 8px 32px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.25)';

		counter1.style.backgroundColor = fusedBackground;
		counter2.style.backgroundColor = fusedBackground;
		counter1.style.backdropFilter = fusedBlur;
		counter2.style.backdropFilter = fusedBlur;
		(counter1.style as any)['-webkit-backdrop-filter'] = fusedBlur;
		(counter2.style as any)['-webkit-backdrop-filter'] = fusedBlur;
		counter1.style.boxShadow = fusedShadow;
		counter2.style.boxShadow = fusedShadow;

		// Augmenter le z-index pour les compteurs fusionnés
		if (container1) container1.style.zIndex = '10001';
		if (container2) container2.style.zIndex = '10001';
	}

	public snapToGrid(
		element: HTMLElement,
		x: number,
		y: number,
	): { x: number; y: number } {
		const rect = element.getBoundingClientRect();
		const elementWidth = rect.width;
		const elementHeight = rect.height;

		// Snap to grid
		let snappedX = Math.round(x / this.gridSize) * this.gridSize;
		let snappedY = Math.round(y / this.gridSize) * this.gridSize;

		// Edge snapping
		if (this.magneticEdges) {
			const screenEdges = {
				left: 0,
				right: window.innerWidth - elementWidth,
				center: (window.innerWidth - elementWidth) / 2,
				top: 0,
				bottom: window.innerHeight - elementHeight,
				middle: (window.innerHeight - elementHeight) / 2,
			};

			// Snap to horizontal edges
			if (Math.abs(x - screenEdges.left) < this.snapThreshold) {
				snappedX = screenEdges.left;
			} else if (Math.abs(x - screenEdges.right) < this.snapThreshold) {
				snappedX = screenEdges.right;
			} else if (Math.abs(x - screenEdges.center) < this.snapThreshold) {
				snappedX = screenEdges.center;
			}

			// Snap to vertical edges
			if (Math.abs(y - screenEdges.top) < this.snapThreshold) {
				snappedY = screenEdges.top;
			} else if (Math.abs(y - screenEdges.bottom) < this.snapThreshold) {
				snappedY = screenEdges.bottom;
			} else if (Math.abs(y - screenEdges.middle) < this.snapThreshold) {
				snappedY = screenEdges.middle;
			}
		}

		// Optimized: use requestAnimationFrame instead of setTimeout
		requestAnimationFrame(() => this.updateCounterCorners());

		return { x: snappedX, y: snappedY };
	}

	public highlightNearestGridLine(x: number, y: number): void {
		if (!this.gridVisible) return;

		// Remove existing highlights
		const highlights = document.querySelectorAll(".grid-highlight");
		highlights.forEach((h) => h.remove());

		// Create highlight for nearest vertical line
		const nearestX = Math.round(x / this.gridSize) * this.gridSize;
		if (Math.abs(x - nearestX) < this.snapThreshold) {
			const vHighlight = document.createElement("div");
			Object.assign(vHighlight.style, {
				position: "absolute",
				left: `${nearestX}px`,
				top: "0",
				width: "2px",
				height: "100%",
				backgroundColor: "#FFD700",
				zIndex: "10000",
				pointerEvents: "none",
			});
			vHighlight.classList.add("grid-highlight");
			this.gridContainer.appendChild(vHighlight);
		}

		// Create highlight for nearest horizontal line
		const nearestY = Math.round(y / this.gridSize) * this.gridSize;
		if (Math.abs(y - nearestY) < this.snapThreshold) {
			const hHighlight = document.createElement("div");
			Object.assign(hHighlight.style, {
				position: "absolute",
				left: "0",
				top: `${nearestY}px`,
				width: "100%",
				height: "2px",
				backgroundColor: "#FFD700",
				zIndex: "10000",
				pointerEvents: "none",
			});
			hHighlight.classList.add("grid-highlight");
			this.gridContainer.appendChild(hHighlight);
		}
	}
}

export { GridSystem };
