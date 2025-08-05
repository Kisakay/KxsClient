import { kxs_settings } from "../UTILS/vars";

export function isFirstTime(): boolean {
	return kxs_settings.get("used") ? true : false
}