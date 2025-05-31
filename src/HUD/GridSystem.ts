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

		const tolerance = 5;

		const isLeftAdjacent = Math.abs((rect1.left + rect1.width) - rect2.left) < tolerance;
		const isRightAdjacent = Math.abs((rect2.left + rect2.width) - rect1.left) < tolerance;

		const isTopAdjacent = Math.abs((rect1.top + rect1.height) - rect2.top) < tolerance;
		const isBottomAdjacent = Math.abs((rect2.top + rect2.height) - rect1.top) < tolerance;

		const overlapVertically =
			(rect1.top < rect2.bottom && rect1.bottom > rect2.top) ||
			(rect2.top < rect1.bottom && rect2.bottom > rect1.top);
		const overlapHorizontally =
			(rect1.left < rect2.right && rect1.right > rect2.left) ||
			(rect2.left < rect1.right && rect2.right > rect1.left);

		let position = "";
		if (isLeftAdjacent && overlapVertically) position = "left";
		else if (isRightAdjacent && overlapVertically) position = "right";
		else if (isTopAdjacent && overlapHorizontally) position = "top";
		else if (isBottomAdjacent && overlapHorizontally) position = "bottom";

		return {
			isAdjacent: (isLeftAdjacent || isRightAdjacent) && overlapVertically ||
				(isTopAdjacent || isBottomAdjacent) && overlapHorizontally,
			position
		};
	}

	public updateCounterCorners(): void {
		const counterIds = Object.keys(this.counterElements);

		counterIds.forEach(id => {
			const container = this.counterElements[id];
			const counter = container.querySelector('div') as HTMLElement;
			if (counter) {
				counter.style.borderRadius = '5px';
			}
		});

		for (let i = 0; i < counterIds.length; i++) {
			for (let j = i + 1; j < counterIds.length; j++) {
				const container1 = this.counterElements[counterIds[i]];
				const container2 = this.counterElements[counterIds[j]];
				const counter1 = container1.querySelector('div') as HTMLElement;
				const counter2 = container2.querySelector('div') as HTMLElement;

				if (counter1 && counter2) {
					const { isAdjacent, position } = this.areElementsAdjacent(container1, container2);

					if (isAdjacent) {
						switch (position) {
							case "left":
								counter1.style.borderTopRightRadius = '0';
								counter1.style.borderBottomRightRadius = '0';
								counter2.style.borderTopLeftRadius = '0';
								counter2.style.borderBottomLeftRadius = '0';
								break;
							case "right":
								counter1.style.borderTopLeftRadius = '0';
								counter1.style.borderBottomLeftRadius = '0';
								counter2.style.borderTopRightRadius = '0';
								counter2.style.borderBottomRightRadius = '0';
								break;
							case "top":
								counter1.style.borderBottomLeftRadius = '0';
								counter1.style.borderBottomRightRadius = '0';
								counter2.style.borderTopLeftRadius = '0';
								counter2.style.borderTopRightRadius = '0';
								break;
							case "bottom":
								counter1.style.borderTopLeftRadius = '0';
								counter1.style.borderTopRightRadius = '0';
								counter2.style.borderBottomLeftRadius = '0';
								counter2.style.borderBottomRightRadius = '0';
								break;
						}
					}
				}
			}
		}
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

		setTimeout(() => this.updateCounterCorners(), 10);

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
