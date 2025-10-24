export class PlayersAliveMonitor {
	private observer: MutationObserver | null = null;
	private lastValue: string | null = null;
	private element: HTMLElement | null = null;

	constructor() { }

	/* Reads the current value */
	public getValue(): string | null {
		return this.element?.textContent?.trim() || null;
	}

	/* Starts observation and waits for the element to be present */
	public startObserving(callback: (newValue: string | null) => void) {
		const tryStart = () => {
			this.element = document.querySelector<HTMLElement>(".js-ui-players-alive") || null;
			if (this.element) {
				global.kxsClient.logger.log("[PlayersAliveMonitor] Html element found :", this.element.outerHTML);
				this.observeElement(callback);
				return true;
			}
			return false;
		};

		if (!tryStart()) {
			global.kxsClient.logger.log("[PlayersAliveMonitor] Html element not found, waiting  MutationObserver...");
			const bodyObserver = new MutationObserver(() => {
				if (tryStart()) {
					bodyObserver.disconnect();
				}
			});
			bodyObserver.observe(document.body, { childList: true, subtree: true });
		}
	}

	/* Observation of the element once found */
	private observeElement(callback: (newValue: string | null) => void) {
		if (!this.element) return;

		this.lastValue = this.element.textContent?.trim() || null;

		this.observer = new MutationObserver(() => {
			const newValue = this.element?.textContent?.trim() || null;
			if (newValue !== this.lastValue) {
				this.lastValue = newValue;
				callback(newValue);
			}
		});

		this.observer.observe(this.element, { childList: true, characterData: true, subtree: true });
		global.kxsClient.logger.log("[PlayersAliveMonitor] Observation started on", this.element.outerHTML);
	}

	/* Stop observing */
	public stopObserving() {
		if (this.observer) {
			this.observer.disconnect();
			global.kxsClient.logger.log("[PlayersAliveMonitor] Observation stopped.");
		}
	}
}
