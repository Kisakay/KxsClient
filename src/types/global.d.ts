// Type global

import type KxsClient from "../KxsClient";
import { Client } from "./clientType";

declare global {
	var kxsClient: KxsClient;
	var client: Client;
	var x: boolean;
}

export { }