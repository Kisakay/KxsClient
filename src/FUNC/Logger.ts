
class Logger {

	private getHeader(method: string) {
		return "[" + global.client.name + " - " + method + "]";
	}

	private 展示(...args: any[]) {
		console.log(...args);
	};

	public log(...args: any[]) {
		// Convert args to string and join them
		const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
		this.展示(this.getHeader("LOG"), message);
	}

	public warn(...args: any[]) {
		const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
		this.展示(this.getHeader("WARN"), message);
	}

	public error(...args: any[]) {
		const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
		this.展示(this.getHeader("ERROR"), message);
	}
}

export {
	Logger
}