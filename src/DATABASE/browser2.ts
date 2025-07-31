export interface Browser2DatabaseConstructor {
	tableName: string;
	database?: string;
};

class Browser2Database {
	private data: any;
	private currentTable: string;
	private options?: Browser2DatabaseConstructor;
	private database: string;

	constructor(options?: Browser2DatabaseConstructor) {
		this.currentTable = options?.tableName || "json";
		this.database = options?.database || "kxs";
		this.data = {
			[this.currentTable]: []
		};

		this.fetchDataFromFile();
	}

	private read() { return localStorage.getItem(this.database) || this.data; }
	private write() { return localStorage.setItem(this.database, JSON.stringify(this.data)) }

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

	private fetchDataFromFile() {
		try {
			const content = this.read();
			this.data = JSON.parse(content);
		} catch (error) {
			this.data = { [this.currentTable]: [] };
		}
	}

	private updateNestedProperty(
		key: string,
		operation: 'get' | 'set' | 'add' | 'sub' | 'delete' | 'pull',
		value?: any
	) {
		const [id, ...rest] = key.split('.');
		const nestedPath = rest.join('.');

		let currentValue = this.data[this.currentTable].find((entry: any) => entry.id === id);

		if (!currentValue && operation !== 'get') {
			currentValue = { id, value: {} };
			this.data[this.currentTable].push(currentValue);
		}

		if (!currentValue && operation === 'get') {
			return undefined;
		}

		switch (operation) {
			case 'get':
				return nestedPath ? this.getNestedProperty(currentValue.value, nestedPath) : currentValue.value;
			case 'set':
				if (nestedPath) {
					this.setNestedProperty(currentValue.value, nestedPath, value);
				} else {
					currentValue.value = value;
				}
				this.write();
				break;
			case 'add':
				if (!nestedPath) {
					currentValue.value = (typeof currentValue.value === 'number' ? currentValue.value : 0) + value;
				} else {
					const existingValue = this.getNestedProperty(currentValue.value, nestedPath);
					if (typeof existingValue !== 'number' && existingValue !== undefined) {
						throw new TypeError('The existing value is not a number.');
					}

					this.setNestedProperty(currentValue.value, nestedPath, (typeof existingValue === 'number' ? existingValue : 0) + value);
				}
				this.write();
				break;
			case 'sub':
				if (!nestedPath) {
					currentValue.value = (typeof currentValue.value === 'number' ? currentValue.value : 0) - value;
				} else {
					const existingValue = this.getNestedProperty(currentValue.value, nestedPath);
					if (typeof existingValue !== 'number' && existingValue !== undefined && existingValue !== null) {
						throw new TypeError('The existing value is not a number.');
					}
					this.setNestedProperty(currentValue.value, nestedPath, (typeof existingValue === 'number' ? existingValue : 0) - value);
				}
				this.write();
				break;
			case 'delete':
				if (nestedPath) {
					const properties = nestedPath.split('.');
					let currentObject = currentValue.value;

					for (let i = 0; i < properties.length - 1; i++) {
						const property = properties[i];
						if (!currentObject[property]) {
							return;
						}
						currentObject = currentObject[property];
					}

					delete currentObject[properties[properties.length - 1]];
				} else {
					const index = this.data[this.currentTable].findIndex((entry: any) => entry.id === id);
					if (index !== -1) {
						this.data[this.currentTable].splice(index, 1);
					}
				}
				this.write();
				break;
			case 'pull':
				const existingArray = nestedPath ? this.getNestedProperty(currentValue.value, nestedPath) : currentValue.value;
				if (!Array.isArray(existingArray)) {
					throw new Error('The stored value is not an array');
				}
				const newArray = existingArray.filter((item) => item !== value);
				if (nestedPath) {
					this.setNestedProperty(currentValue.value, nestedPath, newArray);
				} else {
					currentValue.value = newArray;
				}
				this.write();
				break;
		}
	}

	public table(tableName: string) {
		if (tableName.includes(" ") || !tableName || tableName === "") {
			throw new SyntaxError("Key can't be null or contain a space.");
		}

		if (!this.data[tableName]) {
			this.data[tableName] = [];
		}

		return new Browser2Database(this.options);
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

		let currentValue = this.data[this.currentTable].find((entry: any) => entry.id === id);

		if (!currentValue) {
			currentValue = { id, value: nestedPath ? {} : [] };
			this.data[this.currentTable].push(currentValue);
		}

		if (nestedPath) {
			const existingArray = this.getNestedProperty(currentValue.value, nestedPath);
			if (!existingArray) {
				this.setNestedProperty(currentValue.value, nestedPath, [element]);
			} else if (!Array.isArray(existingArray)) {
				throw new Error('The stored value is not an array');
			} else {
				existingArray.push(element);
				this.setNestedProperty(currentValue.value, nestedPath, existingArray);
			}
		} else {
			if (!Array.isArray(currentValue.value)) {
				currentValue.value = [];
			}
			currentValue.value.push(element);
		}

		this.write();
	}

	public has(key: string) {
		return (this.get(key)) != null;
	}

	public deleteAll() {
		this.data[this.currentTable] = [];
		this.write();
	}

	public all(): { id: string; value: any }[] {
		return this.data[this.currentTable];
	}
}

export { Browser2Database };
