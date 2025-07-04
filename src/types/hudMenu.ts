export const category = ["ALL", "HUD", "SERVER", "MECHANIC", "MISC", "CONFIG"] as const;
export type Category = typeof category[number];

export const X0 = ["Kxs Network", "Developer Options"];

export enum ModType {
	Toggle = 1,
	Input = 2,
	Click = 3,
	Info = 4,
	Slider = 5,
	Sub = 6
}

export interface Mod {
	label: string;
	value: string | boolean | number;
	type: ModType;
	onChange?: (value: string | boolean | number) => void;
	icon: string;
	placeholder?: string;
	min?: number; // Valeur minimale pour slider
	max?: number; // Valeur maximale pour slider
	step?: number; // Pas pour slider
}

export interface MenuOption {
	label: string;
	value: string | boolean | number;
	type: ModType;
	onChange?: (value: string | boolean | number) => void;
	icon: string;
	placeholder?: string;
	fields?: Mod[];
	min?: number; // Valeur minimale pour slider
	max?: number; // Valeur maximale pour slider
	step?: number; // Pas pour slider
}

export interface MenuSection {
	options: MenuOption[];
	element?: HTMLDivElement;
	category: Category;
}