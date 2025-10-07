export enum ClientType {
	KxsClient = 1,
	KxzClient = 2
}

export interface Client {
	type: ClientType,
	name: 'KxsClient' | 'KxzClient'
	acronym_upper: 'KXZ' | "KXS"
	acronym_start_upper: "Kxz" | "Kxs"
}