class GridSystem {
	private gridSize: number = 20; // Size of each grid cell
	private snapThreshold: number = 15; // Distance in pixels to trigger snap
	private gridVisible: boolean = false;
	private gridContainer: HTMLDivElement;
	private magneticEdges: boolean = true;

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
