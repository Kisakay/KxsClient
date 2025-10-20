export enum ClientType {
	KxsClient = 1,
	KxzClient = 2,
	KxcClient = 3
}

export interface ClientConfig {
	type: ClientType;
	name: string;
	acronym_upper: string;
	acronym_start_upper: string;
	application_id: string;
	rpc_assets: string;
	domains: string[] | boolean;
}