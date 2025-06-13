import type KxsNetwork from "kxs.rip";
import type { CommandType } from "./baseStructure";
import config from "../config.json";

declare module "kxs.rip" {
	interface KxsNetwork {
		commands: Map<string, CommandType>;
		config: typeof config;
	}
}