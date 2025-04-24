class MenuButton {
	private button: HTMLButtonElement;
	private isEnabled: boolean;

	constructor(params: {
		text: string;
		initialState?: boolean;
		color?: string;
		onClick: () => void;
		updateText?: boolean;
	}) {
		this.isEnabled = params.initialState ?? false;
		this.button = this.createButton(params);
	}

	private createButton(params: {
		text: string;
		color?: string;
		onClick: () => void;
		updateText?: boolean;
	}): HTMLButtonElement {
		const button = document.createElement("button");

		// Set initial text
		this.updateButtonText(button, params.text);

		// Set styles
		Object.assign(button.style, {
			backgroundColor: this.getBackgroundColor(params.color),
			border: "none",
			color: "#fff",
			padding: "10px",
			borderRadius: "5px",
			width: "100%",
			marginBottom: "10px",
			fontSize: "14px",
			cursor: "pointer",
		});

		// Set click handler
		button.onclick = () => {
			this.isEnabled = !this.isEnabled;
			params.onClick();

			if (params.updateText !== false) {
				this.updateButtonText(button, params.text);
				this.updateButtonColor(button, params.color);
			}
		};

		return button;
	}

	private updateButtonText(button: HTMLButtonElement, baseText: string) {
		button.textContent = `${baseText} ${this.isEnabled ? "✅" : "❌"}`;
	}

	private getBackgroundColor(color?: string): string {
		if (color) return color;
		return this.isEnabled ? "#4CAF50" : "#FF0000";
	}

	private updateButtonColor(button: HTMLButtonElement, color?: string) {
		button.style.backgroundColor = this.getBackgroundColor(color);
	}

	public getElement(): HTMLButtonElement {
		return this.button;
	}

	public setState(enabled: boolean) {
		this.isEnabled = enabled;
		this.updateButtonColor(this.button);
	}
}

class MenuManager {
	private menu: HTMLElement;
	private buttons: { [key: string]: MenuButton } = {};

	constructor(menu: HTMLElement) {
		this.menu = menu;
	}

	public addToggleButton(params: {
		id: string;
		text: string;
		initialState?: boolean;
		color?: string;
		onClick: () => void;
		updateText?: boolean;
	}) {
		const button = new MenuButton({
			text: params.text,
			initialState: params.initialState,
			color: params.color,
			onClick: params.onClick,
			updateText: params.updateText,
		});

		this.buttons[params.id] = button;
		this.menu.appendChild(button.getElement());
		return button;
	}

	public addButton(params: {
		id: string;
		text: string;
		color?: string;
		onClick: () => void;
	}) {
		const button = document.createElement("button");

		// Set initial text
		button.textContent = params.text;

		// Set styles
		Object.assign(button.style, {
			backgroundColor: params.color ?? "#007BFF", // Default color
			border: "none",
			color: "#fff",
			padding: "10px",
			borderRadius: "5px",
			width: "100%",
			marginBottom: "10px",
			fontSize: "14px",
			cursor: "pointer",
		});

		// Set click handler
		button.onclick = params.onClick;

		this.menu.appendChild(button);
	}

	public getButton(id: string): MenuButton | undefined {
		return this.buttons[id];
	}
}

export { MenuManager, MenuButton };
