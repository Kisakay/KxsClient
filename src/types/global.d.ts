// Type global

import type KxsClient from "../KxsClient";
import { ClientConfig } from "./clientType";

declare global {
	var kxsClient: KxsClient;
	var client: ClientConfig;
	var x: boolean;
}

export { }