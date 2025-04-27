// --- HOOK GLOBAL WEBSOCKET POUR INTERCEPTION gameId & PTC monitoring ---
(function () {
	const OriginalWebSocket = window.WebSocket;

	function HookedWebSocket(this: WebSocket, url: string | URL, protocols?: string | string[]) {
		const ws = protocols !== undefined
			? new OriginalWebSocket(url, protocols)
			: new OriginalWebSocket(url);
		if (typeof url === "string" && url.includes("gameId=")) {
			console.log(url);
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