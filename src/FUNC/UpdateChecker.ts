import KxsClient from "../KxsClient";
import gt from 'semver/functions/gt';

import packageInfo from "../../package.json";
import config from "../../config.json";

class UpdateChecker {
	private readonly remoteScriptUrl = config.api_url + "/getLatestVersion";
	kxsClient: KxsClient;
	hostedScriptVersion: string | undefined;

	constructor(kxsClient: KxsClient) {
		this.kxsClient = kxsClient;

		if (this.kxsClient.isAutoUpdateEnabled) {
			this.checkForUpdate();
		}
	}

	private async downloadScript(): Promise<void> {
		try {
			const response: Response = await fetch(this.remoteScriptUrl, {
				method: "GET",
				headers: {
					"cache-control": "no-cache, no-store, must-revalidate",
					"pragma": "no-cache",
					"expires": "0"
				}
			});
			if (!response.ok) {
				throw new Error("Error downloading script: " + response.statusText);
			}
			const blob = await response.blob();
			const downloadUrl = window.URL.createObjectURL(blob);
			const downloadLink = document.createElement('a');
			downloadLink.href = downloadUrl;
			downloadLink.download = 'KxsClient.user.js';
			document.body.appendChild(downloadLink);
			downloadLink.click();
			document.body.removeChild(downloadLink);
			window.URL.revokeObjectURL(downloadUrl);
		} catch (error: any) {
			throw new Error("Error during script download: " + error);
		}
	}

	private async getNewScriptVersion(): Promise<string> {
		try {
			const response: Response = await fetch(this.remoteScriptUrl, {
				method: "GET",
				headers: {
					"cache-control": "no-cache, no-store, must-revalidate",
					"pragma": "no-cache",
					"expires": "0"
				}
			});
			if (!response.ok) {
				throw new Error("Error retrieving remote script: " + response.statusText);
			}
			const scriptContent = await response.text();
			const versionMatch = scriptContent.match(/\/\/\s*@version\s+([\d.]+)/);
			if (versionMatch && versionMatch[1]) {
				return versionMatch[1];
			} else {
				throw new Error("Script version was not found in the file.");
			}
		} catch (error: any) {
			throw new Error("Error retrieving remote script: " + error);
		}
	}

	private async checkForUpdate() {
		const localScriptVersion = await this.getCurrentScriptVersion();
		const hostedScriptVersion = await this.getNewScriptVersion();
		this.hostedScriptVersion = hostedScriptVersion;

		// Vérifie si la version hébergée est supérieure à la version locale
		if (gt(hostedScriptVersion, localScriptVersion)) {
			this.displayUpdateNotification();
		} else {
			this.kxsClient.nm.showNotification("Client is up to date", "success", 2300);
		}
	}

	private displayUpdateNotification() {
		const modal = document.createElement("div");
		modal.style.position = "fixed";
		modal.style.top = "50%";
		modal.style.left = "50%";
		modal.style.transform = "translate(-50%, -50%)";
		modal.style.backgroundColor = "rgb(250, 250, 250)";
		modal.style.borderRadius = "10px";
		modal.style.padding = "20px";
		modal.style.width = "400px";
		modal.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
		modal.style.border = "1px solid rgb(229, 229, 229)";

		const header = document.createElement("div");
		header.style.display = "flex";
		header.style.alignItems = "center";
		header.style.marginBottom = "15px";

		const title = document.createElement("h3");
		title.textContent = "Download Update";
		title.style.margin = "0";
		title.style.fontSize = "16px";
		title.style.fontWeight = "600";
		header.appendChild(title);

		const closeButton = document.createElement("button");
		closeButton.innerHTML = "×";
		closeButton.style.marginLeft = "auto";
		closeButton.style.border = "none";
		closeButton.style.background = "none";
		closeButton.style.fontSize = "20px";
		closeButton.style.cursor = "pointer";
		closeButton.style.padding = "0 5px";
		closeButton.onclick = () => modal.remove();
		header.appendChild(closeButton);

		const content = document.createElement("div");
		content.innerHTML = `A new version of KxsClient is available!<br>
    Locale: ${this.getCurrentScriptVersion()} | On web: ${this.hostedScriptVersion}<br>
    Click the button below to update now.`;
		content.style.marginBottom = "20px";
		content.style.color = "rgb(75, 85, 99)";

		const updateButton = document.createElement("button");
		updateButton.textContent = "Update Now";
		updateButton.style.backgroundColor = "rgb(59, 130, 246)";
		updateButton.style.color = "white";
		updateButton.style.padding = "8px 16px";
		updateButton.style.borderRadius = "6px";
		updateButton.style.border = "none";
		updateButton.style.cursor = "pointer";
		updateButton.style.width = "100%";
		updateButton.onclick = async () => {
			try {
				await this.downloadScript();
				this.kxsClient.nm.showNotification("Download started", "success", 2300);
				modal.remove();
			} catch (error) {
				this.kxsClient.nm.showNotification("Download failed: " + (error as any).message, "info", 5000);
			}
		};

		modal.appendChild(header);
		modal.appendChild(content);
		modal.appendChild(updateButton);
		document.body.appendChild(modal);
	}

	private getCurrentScriptVersion() {
		return packageInfo.version;
	}
}

export {
	UpdateChecker
}