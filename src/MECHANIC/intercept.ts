function intercept(link: string, targetUrl: string) {

	const open = XMLHttpRequest.prototype.open;
	XMLHttpRequest.prototype.open = function (method, url) {
		if ((url as string).includes(link)) {
			arguments[1] = targetUrl;
		}
		open.apply(this, arguments as unknown as [string, string | URL, boolean, string?, string?]);
	};

	const originalFetch = window.fetch;
	window.fetch = function (url, options) {
		if ((url as string).includes(link)) {
			url = targetUrl;
		}
		return originalFetch.apply(this, arguments as unknown as [RequestInfo, RequestInit?]);
	};
}

export {
	intercept
}