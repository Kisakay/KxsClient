import KxsClient from "../KxsClient";

class KillLeaderTracker {
	private warningElement: HTMLDivElement | null;
	private encouragementElement: HTMLDivElement | null;
	private offsetX: number = 20;
	private offsetY: number = 20;
	private lastKnownKills: number = 0;
	private wasKillLeader: boolean = false;
	kxsClient: KxsClient;
	killLeaderKillCount: number;
	private readonly MINIMUM_KILLS_FOR_LEADER = 3;

	constructor(kxsClient: KxsClient) {
		this.kxsClient = kxsClient;
		this.warningElement = null;
		this.encouragementElement = null;
		this.killLeaderKillCount = 0;
		this.wasKillLeader = false;
		this.createEncouragementElement();
		this.initMouseTracking();
	}

	private createEncouragementElement() {
		const encouragement = document.createElement("div");
		encouragement.style.cssText = `
            position: fixed;
            background: rgba(0, 255, 0, 0.1);
            border: 2px solid #00ff00;
            border-radius: 5px;
            padding: 10px 15px;
            color: #00ff00;
            font-family: Arial, sans-serif;
            font-size: 14px;
            z-index: 9999;
            display: none;
            backdrop-filter: blur(5px);
            transition: all 0.3s ease;
            pointer-events: none;
            box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
        `;

		const content = document.createElement("div");
		content.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
        `;

		const icon = document.createElement("div");
		icon.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
            </svg>
        `;

		const text = document.createElement("span");
		text.textContent = "Nice Kill!";

		content.appendChild(icon);
		content.appendChild(text);
		encouragement.appendChild(content);
		document.body.appendChild(encouragement);

		this.encouragementElement = encouragement;
		this.addEncouragementAnimation();
	}

	private initMouseTracking() {
		document.addEventListener("mousemove", (e: MouseEvent) => {
			this.updateElementPosition(this.warningElement, e);
			this.updateElementPosition(this.encouragementElement, e);
		});
	}

	private updateElementPosition(element: HTMLDivElement | null, e: MouseEvent) {
		if (!element || element.style.display === "none") return;

		const x = e.clientX + this.offsetX;
		const y = e.clientY + this.offsetY;

		const rect = element.getBoundingClientRect();
		const maxX = window.innerWidth - rect.width;
		const maxY = window.innerHeight - rect.height;

		const finalX = Math.min(Math.max(0, x), maxX);
		const finalY = Math.min(Math.max(0, y), maxY);

		element.style.transform = `translate(${finalX}px, ${finalY}px)`;
	}

	private addEncouragementAnimation() {
		const keyframes = `
            @keyframes encouragementPulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.8; }
                100% { transform: scale(1); opacity: 1; }
            }
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateY(20px); }
                10% { opacity: 1; transform: translateY(0); }
                90% { opacity: 1; transform: translateY(0); }
                100% { opacity: 0; transform: translateY(-20px); }
            }
        `;

		const style = document.createElement("style");
		style.textContent = keyframes;
		document.head.appendChild(style);

		if (this.encouragementElement) {
			this.encouragementElement.style.animation = "fadeInOut 3s forwards";
		}
	}

	private showEncouragement(
		killsToLeader: number,
		isDethrone: boolean = false,
		noKillLeader: boolean = false
	) {
		if (!this.encouragementElement) return;

		let message: string;
		if (isDethrone && killsToLeader !== 0) {
			message = "Oh no! You've been dethroned!";
			this.encouragementElement.style.borderColor = "#ff0000";
			this.encouragementElement.style.color = "#ff0000";
			this.encouragementElement.style.background = "rgba(255, 0, 0, 0.1)";
		} else if (noKillLeader) {
			const killsNeeded = this.MINIMUM_KILLS_FOR_LEADER - this.lastKnownKills;
			message = `Nice Kill! Get ${killsNeeded} more kills to become the first Kill Leader!`;
		} else {
			message =
				killsToLeader <= 0
					? "You're the Kill Leader! 👑"
					: `Nice Kill! ${killsToLeader} more to become Kill Leader!`;
		}

		const span = this.encouragementElement.querySelector("span");
		if (span) span.textContent = message;

		this.encouragementElement.style.display = "block";
		this.encouragementElement.style.animation = "fadeInOut 3s forwards";

		setTimeout(() => {
			if (this.encouragementElement) {
				this.encouragementElement.style.display = "none";
				// Reset colors
				this.encouragementElement.style.borderColor = "#00ff00";
				this.encouragementElement.style.color = "#00ff00";
				this.encouragementElement.style.background = "rgba(0, 255, 0, 0.1)";
			}
		}, 7000);
	}

	private isKillLeader(): boolean {
		const killLeaderNameElement = document.querySelector("#ui-kill-leader-name");
		return this.kxsClient.getUsername() === killLeaderNameElement?.textContent;
	}

	public update(myKills: number) {
		if (!this.kxsClient.isKillLeaderTrackerEnabled) return;

		const killLeaderElement = document.querySelector("#ui-kill-leader-count");
		this.killLeaderKillCount = parseInt(killLeaderElement?.textContent || "0", 10);

		if (myKills > this.lastKnownKills) {
			if (this.killLeaderKillCount === 0) {
				// Pas encore de kill leader, encourager le joueur à atteindre 3 kills
				this.showEncouragement(0, false, true);
			} else if (this.killLeaderKillCount < this.MINIMUM_KILLS_FOR_LEADER) {
				// Ne rien faire si le kill leader n'a pas atteint le minimum requis
				return;
			} else if (this.isKillLeader() && myKills > 0) {
				this.showEncouragement(0);
				this.wasKillLeader = true;
			} else {
				const killsNeeded = this.killLeaderKillCount + 1 - myKills;
				this.showEncouragement(killsNeeded);
			}
		} else if (this.wasKillLeader && !this.isKillLeader()) {
			// Détroné
			this.showEncouragement(0, true);
			this.wasKillLeader = false;
		}

		this.lastKnownKills = myKills;
	}
}

export { KillLeaderTracker };
