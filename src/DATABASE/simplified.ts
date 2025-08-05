export interface Browser1Constructor {
	database: string;
};

class SimplifiedDatabase {
	private data: any;
	private database: string;

	constructor(options: Browser1Constructor) {
		this.database = options.database
		this.data = {};

		this.fetchDataFromFile();
	}

	// FIX: Return only the localStorage string, not this.data
	private read(): string | null {
		return localStorage.getItem(this.database);
	}

	private write() {
		return localStorage.setItem(this.database, JSON.stringify(this.data))
	}

	private setNestedProperty = (object: any, key: string, value: any) => {
		const properties = key.split('.');
		let currentObject = object;

		for (let i = 0; i < properties.length - 1; i++) {
			const property = properties[i];

			if (typeof currentObject[property] !== 'object' || currentObject[property] === null) {
				currentObject[property] = {};
			}

			currentObject = currentObject[property];
		}

		currentObject[properties[properties.length - 1]] = value;
	};

	private getNestedProperty = (object: any, key: string) => {
		const properties = key.split('.');
		let index = 0;

		for (; index < properties.length; ++index) {
			object = object && object[properties[index]];
		}

		return object;
	};

	// FIX: Properly handle localStorage data loading
	private fetchDataFromFile() {
		try {
			const content = this.read();
			if (content && content !== "null" && content !== "") {
				this.data = JSON.parse(content);
				console.log("Loaded data from localStorage:", this.data);
			} else {
				this.data = {};
				console.log("No data in localStorage, using empty object");
			}
		} catch (error) {
			this.data = {};
		}
	}

	private updateNestedProperty(
		key: string,
		operation: 'get' | 'set' | 'add' | 'sub' | 'delete' | 'pull',
		value?: any
	) {
		const [id, ...rest] = key.split('.');
		const nestedPath = rest.join('.');

		if (!this.data[id] && operation !== 'get') {
			this.data[id] = nestedPath ? {} : undefined;
		}

		if (this.data[id] === undefined && operation === 'get') {
			return undefined;
		}

		switch (operation) {
			case 'get':
				return nestedPath ? this.getNestedProperty(this.data[id], nestedPath) : this.data[id];
			case 'set':
				if (nestedPath) {
					if (typeof this.data[id] !== 'object' || this.data[id] === null) {
						this.data[id] = {};
					}
					this.setNestedProperty(this.data[id], nestedPath, value);
				} else {
					this.data[id] = value;
				}
				this.write();
				break;
			case 'add':
				if (!nestedPath) {
					this.data[id] = (typeof this.data[id] === 'number' ? this.data[id] : 0) + value;
				} else {
					if (typeof this.data[id] !== 'object' || this.data[id] === null) {
						this.data[id] = {};
					}
					const existingValue = this.getNestedProperty(this.data[id], nestedPath);
					if (typeof existingValue !== 'number' && existingValue !== undefined) {
						throw new TypeError('The existing value is not a number.');
					}

					this.setNestedProperty(this.data[id], nestedPath, (typeof existingValue === 'number' ? existingValue : 0) + value);
				}
				this.write();
				break;
			case 'sub':
				if (!nestedPath) {
					this.data[id] = (typeof this.data[id] === 'number' ? this.data[id] : 0) - value;
				} else {
					if (typeof this.data[id] !== 'object' || this.data[id] === null) {
						this.data[id] = {};
					}
					const existingValue = this.getNestedProperty(this.data[id], nestedPath);
					if (typeof existingValue !== 'number' && existingValue !== undefined && existingValue !== null) {
						throw new TypeError('The existing value is not a number.');
					}
					this.setNestedProperty(this.data[id], nestedPath, (typeof existingValue === 'number' ? existingValue : 0) - value);
				}
				this.write();
				break;
			case 'delete':
				if (nestedPath) {
					if (typeof this.data[id] !== 'object' || this.data[id] === null) {
						return;
					}
					const properties = nestedPath.split('.');
					let currentObject = this.data[id];

					for (let i = 0; i < properties.length - 1; i++) {
						const property = properties[i];
						if (!currentObject[property]) {
							return;
						}
						currentObject = currentObject[property];
					}

					delete currentObject[properties[properties.length - 1]];
				} else {
					delete this.data[id];
				}
				this.write();
				break;
			case 'pull':
				const existingArray = nestedPath ?
					this.getNestedProperty(this.data[id], nestedPath) :
					this.data[id];

				if (!Array.isArray(existingArray)) {
					throw new Error('The stored value is not an array');
				}
				const newArray = existingArray.filter((item) => item !== value);
				if (nestedPath) {
					this.setNestedProperty(this.data[id], nestedPath, newArray);
				} else {
					this.data[id] = newArray;
				}
				this.write();
				break;
		}
	}

	public get(key: string) {
		return this.updateNestedProperty(key, 'get');
	}

	public set(key: string, value: any) {
		if (key.includes(" ") || !key || key === "") {
			throw new SyntaxError("Key can't be null or contain a space.");
		}

		this.updateNestedProperty(key, 'set', value);
	}

	public pull(key: string, value: any) {
		if (key.includes(" ") || !key || key === "") {
			throw new SyntaxError("Key can't be null or contain a space.");
		}

		this.updateNestedProperty(key, 'pull', value);
	}

	public add(key: string, count: number) {
		if (key.includes(" ") || !key || key === "") {
			throw new SyntaxError("Key can't be null or contain a space.");
		}

		if (isNaN(count)) {
			throw new SyntaxError("The value is NaN.");
		}

		this.updateNestedProperty(key, 'add', count);
	}

	public sub(key: string, count: number) {
		if (key.includes(" ") || !key || key === "") {
			throw new SyntaxError("Key can't be null or contain a space.");
		}

		if (isNaN(count)) {
			throw new SyntaxError("The value is NaN.");
		}

		this.updateNestedProperty(key, 'sub', count);
	}

	public delete(key: string) {
		this.updateNestedProperty(key, 'delete');
	}

	public cache(key: string, value: any, time: number) {
		if (key.includes(" ") || !key || key === "") {
			throw new SyntaxError("Key can't be null ou contain a space.");
		}

		if (!time || isNaN(time)) {
			throw new SyntaxError("The time needs to be a number. (ms)");
		}

		this.updateNestedProperty(key, 'set', value);

		setTimeout(() => {
			this.updateNestedProperty(key, 'delete');
		}, time);
	}

	public push(key: string, element: any) {
		if (key.includes(" ") || !key || key === "") {
			throw new SyntaxError("Key can't be null or contain a space.");
		}

		const [id, ...rest] = key.split('.');
		const nestedPath = rest.join('.');

		if (!this.data[id]) {
			this.data[id] = nestedPath ? {} : [];
		}

		if (nestedPath) {
			const existingArray = this.getNestedProperty(this.data[id], nestedPath);
			if (!existingArray) {
				this.setNestedProperty(this.data[id], nestedPath, [element]);
			} else if (!Array.isArray(existingArray)) {
				throw new Error('The stored value is not an array');
			} else {
				existingArray.push(element);
				this.setNestedProperty(this.data[id], nestedPath, existingArray);
			}
		} else {
			if (!Array.isArray(this.data[id])) {
				this.data[id] = [];
			}
			this.data[id].push(element);
		}

		this.write();
	}

	public has(key: string) {
		return (this.get(key)) != null;
	}

	public deleteAll() {
		this.data = {};
		this.write();
	}

	public all(): Record<string, any> {
		return this.data;
	}
}

export { SimplifiedDatabase };