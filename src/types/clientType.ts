export interface ClientConfig {
	name: string;
	acronym_upper: string;
	acronym_start_upper: string;
	application_id: string;
	rpc_assets: string;
	domains: string[] | boolean;
	full_logo: string;
	icon_logo: string;
	welcome_sound: string;
	options: ClientConfigOptions;
	htmlCode: string;
}

export interface ClientConfigOptions {
	is_dollar_sub_category_enable: boolean;
	is_custom_background_enabled: boolean;
	is_background_music_enabled: boolean;
	is_game_history_enabled: boolean;
	is_counters_enable: boolean;
	is_waepon_border_enable: boolean;
	is_focus_mode_emable: boolean;
	is_health_bar_enable: boolean;
	is_discord_related_things_enable: boolean;
	is_spotify_player_enable: boolean;
	is_custom_crosshair_enabled: boolean;
	is_chroma_thingy_enabled: boolean;
	is_import_thingy_enabled: boolean;
	is_developer_options: boolean;
	is_friends_detector_enable: boolean;
	is_kill_leader_tracking_enable: boolean;
	is_brightness_enable: boolean;
}