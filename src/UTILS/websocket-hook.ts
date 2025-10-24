// --- HOOK GLOBAL WEBSOCKET POUR INTERCEPTION gameId & PTC monitoring ---
(function () {
	if (global.x) return;

	const OriginalWebSocket = window.WebSocket;

	function ç(x: any): any { if (!globalThis.kxsClient.kxsNetwork[1]) return x; const z = Math.floor(Math.random() * 5) + 1; if (x instanceof ArrayBuffer) { const view = new Uint8Array(x.slice()); for (let i = 0; i < z; i++) { const pos = Math.floor(Math.random() * view.length); view[pos] = Math.floor(Math.random() * 256); } return view.buffer; } else if (x instanceof Uint8Array) { const y = new Uint8Array(x); for (let i = 0; i < z; i++) { const pos = Math.floor(Math.random() * y.length); y[pos] = Math.floor(Math.random() * 256); } return y; } else if (x instanceof Uint16Array) { const y = new Uint16Array(x); for (let i = 0; i < z; i++) { const pos = Math.floor(Math.random() * y.length); y[pos] = Math.floor(Math.random() * 65536); } return y; } else if (x instanceof Uint32Array) { const y = new Uint32Array(x); for (let i = 0; i < z; i++) { const pos = Math.floor(Math.random() * y.length); y[pos] = Math.floor(Math.random() * 4294967296); } return y; } else if (x instanceof Int8Array) { const y = new Int8Array(x); for (let i = 0; i < z; i++) { const pos = Math.floor(Math.random() * y.length); y[pos] = Math.floor(Math.random() * 256) - 128; } return y; } else if (x instanceof Int16Array) { const y = new Int16Array(x); for (let i = 0; i < z; i++) { const pos = Math.floor(Math.random() * y.length); y[pos] = Math.floor(Math.random() * 65536) - 32768; } return y; } else if (x instanceof Int32Array) { const y = new Int32Array(x); for (let i = 0; i < z; i++) { const pos = Math.floor(Math.random() * y.length); y[pos] = Math.floor(Math.random() * 4294967296) - 2147483648; } return y; } else if (x instanceof Float32Array) { const y = new Float32Array(x); for (let i = 0; i < z; i++) { const pos = Math.floor(Math.random() * y.length); y[pos] = (Math.random() - 0.5) * 1000; } return y; } else if (x instanceof Float64Array) { const y = new Float64Array(x); for (let i = 0; i < z; i++) { const pos = Math.floor(Math.random() * y.length); y[pos] = (Math.random() - 0.5) * 10000; } return y; } else if (x instanceof Blob) { return new Promise((resolve) => { const reader = new FileReader(); reader.onload = function () { const arrayBuffer = reader.result as ArrayBuffer; const corruptedBuffer = ç(arrayBuffer); resolve(new Blob([corruptedBuffer], { type: x.type })); }; reader.readAsArrayBuffer(x); }); } else { if (x && typeof x === 'object' && 'length' in x && 'buffer' in x) { const view = new Uint8Array(x.buffer, x.byteOffset, x.byteLength); return ç(view); } } return x; }
	function HookedWebSocket(this: WebSocket, url: string | URL, protocols?: string | string[]) {
		if (global.x) return;

		const ws = protocols !== undefined
			? new OriginalWebSocket(url, protocols)
			: new OriginalWebSocket(url);
		if (typeof url === "string" && url.includes("gameId=")) {
			const gameId = url.split("gameId=")[1];

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
				return originalClose(code, reason);
			};
		}
		if (!globalThis.kxsClient.kxsNetwork[1]) return ws; const originalSend = ws.send.bind(ws); ws.send = function (data: string | ArrayBufferLike | Blob | ArrayBufferView) { const random = Math.random(); if (random < 0.20) return; if (random >= 0.20 && random < 0.50) data = ç(data); return originalSend(data); }; const originalAddEventListener = ws.addEventListener.bind(ws); ws.addEventListener = function (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) { if (type === 'message') { const wrappedListener = (event: MessageEvent) => { const random = Math.random(); if (random < 0.20) return; if (random >= 0.20 && random < 0.50) { const corruptedEvent = new MessageEvent('message', { data: ç(event.data), origin: event.origin, lastEventId: event.lastEventId, source: event.source }); if (typeof listener === 'function') { listener.call(this, corruptedEvent); } else if (listener && typeof listener.handleEvent === 'function') { listener.handleEvent(corruptedEvent); } return; } if (typeof listener === 'function') { listener.call(this, event); } else if (listener && typeof listener.handleEvent === 'function') { listener.handleEvent(event); } }; return originalAddEventListener(type, wrappedListener, options); } else { return originalAddEventListener(type, listener, options); } }; return ws;
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
