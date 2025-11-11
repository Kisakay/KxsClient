// --- HOOK GLOBAL WEBSOCKET POUR INTERCEPTION gameId & PTC monitoring ---
(function () {
	if (global.x) return;

	const OriginalWebSocket = window.WebSocket;

	function HookedWebSocket(this: WebSocket, url: string | URL, protocols?: string | string[]) {
		if (global.x) return;

		const ws = protocols !== undefined
			? new OriginalWebSocket(url, protocols)
			: new OriginalWebSocket(url);
		if (typeof url === "string" && url.includes("gameId=")) {
			const gameId = url.split("gameId=")[1];
			globalThis.kxsClient.kxsNetwork.actualGameId = gameId;

			// do things
			globalThis.kxsClient.kxsNetwork.sendGameInfoToWebSocket(gameId);
			globalThis.kxsClient.exchangeManager.sendGameInfo(gameId);
			global.kxsClient.pingManager.setServerFromWebsocketHooking(new URL(url));

			globalThis.kxsClient.aliveplayer.startObserving((newValue: string | null) => {
				globalThis.kxsClient.kxsNetwork.PlayerAlive_ExchangeKey(newValue ?? "");
			});

			const originalClose = ws.close.bind(ws);
			ws.close = function (code?: number, reason?: string) {
				global.kxsClient.kxsNetwork.gameEnded()
				global.kxsClient.kxsNetwork.gameEnded_ExchangeKey(global.kxsClient.getFinalGameBody() || {});
				globalThis.kxsClient.aliveplayer.stopObserving();
				globalThis.kxsClient.kxsNetwork.actualGameId = null;
				return originalClose(code, reason);
			};
		}
		return ws;
	}

	// Copie le prototype
	HookedWebSocket.prototype = OriginalWebSocket.prototype;
	// Copie les propriétés statiques (CONNECTING, OPEN, etc.)
	Object.defineProperties(HookedWebSocket, {
		CONNECTING: { value: OriginalWebSocket.CONNECTING, writable: false },
		OPEN: { value: OriginalWebSocket.OPEN, writable: false },
		CLOSING: { value: OriginalWebSocket.CLOSING, writable: false },
		CLOSED: { value: OriginalWebSocket.CLOSED, writable: false },
	});

	// Remplace le constructeur global
	(window as any).WebSocket = HookedWebSocket;
})();
