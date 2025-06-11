import KxsClient from "../KxsClient";
import gt from 'semver/functions/gt';

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

	private async copyScriptToClipboard(): Promise<void> {
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
				throw new Error("Error retrieving script: " + response.statusText);
			}
			const scriptContent = await response.text();
			await navigator.clipboard.writeText(scriptContent);
			this.kxsClient.nm.showNotification("Script copied to clipboard!", "success", 2300);
		} catch (error: any) {
			throw new Error("Error copying script to clipboard: " + error);
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
		modal.style.width = "500px";
		modal.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
		modal.style.border = "1px solid rgb(229, 229, 229)";
		modal.style.zIndex = "10000";

		const header = document.createElement("div");
		header.style.display = "flex";
		header.style.alignItems = "center";
		header.style.marginBottom = "15px";

		const title = document.createElement("h3");
		title.textContent = "Update Available";
		title.style.margin = "0";
		title.style.fontSize = "18px";
		title.style.fontWeight = "600";
		header.appendChild(title);

		const closeButton = document.createElement("button");
		closeButton.innerHTML = "×";
		closeButton.style.marginLeft = "auto";
		closeButton.style.border = "none";
		closeButton.style.background = "none";
		closeButton.style.fontSize = "24px";
		closeButton.style.cursor = "pointer";
		closeButton.style.padding = "0 5px";
		closeButton.onclick = () => modal.remove();
		header.appendChild(closeButton);

		const content = document.createElement("div");
		content.innerHTML = `<div style="margin-bottom: 20px;">
			<p style="margin-bottom: 10px; font-weight: 500;">A new version of KxsClient is available!</p>
			<p style="margin-bottom: 10px;">
				Current version: <span style="font-weight: 500;">${this.getCurrentScriptVersion()}</span> | 
				New version: <span style="font-weight: 500; color: #4f46e5;">${this.hostedScriptVersion}</span>
			</p>
			<p style="margin-bottom: 15px;">To update, follow these steps:</p>
			<ol style="margin-left: 20px; margin-bottom: 15px;">
				<li style="margin-bottom: 8px;">Click "Copy Script" below</li>
				<li style="margin-bottom: 8px;">Open your script manager (Tampermonkey, Violentmonkey, etc.)</li>
				<li style="margin-bottom: 8px;">Overwrite the current script with the new one and paste the content</li>
				<li style="margin-bottom: 8px;">Save the script (Ctrl+S or Cmd+S)</li>
				<li>Reload the game page</li>
			</ol>
		</div>`;
		content.style.color = "rgb(75, 85, 99)";
		content.style.fontSize = "14px";
		content.style.lineHeight = "1.5";

		const updateButton = document.createElement("button");
		updateButton.textContent = "Copy Script";
		updateButton.style.backgroundColor = "rgb(79, 70, 229)";
		updateButton.style.color = "white";
		updateButton.style.padding = "10px 16px";
		updateButton.style.borderRadius = "6px";
		updateButton.style.border = "none";
		updateButton.style.cursor = "pointer";
		updateButton.style.width = "100%";
		updateButton.style.fontWeight = "500";
		updateButton.style.fontSize = "15px";
		updateButton.style.transition = "background-color 0.2s ease";
		updateButton.onmouseover = () => updateButton.style.backgroundColor = "rgb(67, 56, 202)";
		updateButton.onmouseout = () => updateButton.style.backgroundColor = "rgb(79, 70, 229)";
		updateButton.onclick = async () => {
			try {
				await this.copyScriptToClipboard();
				updateButton.textContent = "Script copied!";
				updateButton.style.backgroundColor = "rgb(16, 185, 129)";
				setTimeout(() => {
					if (updateButton.isConnected) {
						updateButton.textContent = "Copy Script";
						updateButton.style.backgroundColor = "rgb(79, 70, 229)";
					}
				}, 3000);
			} catch (error) {
				this.kxsClient.nm.showNotification("Error: " + (error as any).message, "error", 5000);
			}
		};

		modal.appendChild(header);
		modal.appendChild(content);
		modal.appendChild(updateButton);
		document.body.appendChild(modal);
	}

	private getCurrentScriptVersion() {
		return this.kxsClient.pkg.version;
	}
}

export {
	UpdateChecker
}