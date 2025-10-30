export const CONSTS = {
	mY: 18, mX: 38, mZ: 7,
	tileWidth: 75,
	tileHeight: 100
};

export const STATES = {
	idle: 0,
	run: 1,
	pause: 2
};

export const GAME_MODE_EASY: GAME_MODE_ID = 'GAME_MODE_EASY';
export const GAME_MODE_STANDARD: GAME_MODE_ID = 'GAME_MODE_STANDARD';
export const GAME_MODE_EXPERT: GAME_MODE_ID = 'GAME_MODE_EXPERT';
export const GameModes = [
	{
		id: GAME_MODE_EASY,
		features: [
			{ title: 'SHUFFLE' },
			{ title: 'HINT' },
			{ title: 'UNDO' }
		]
	},
	{
		id: GAME_MODE_STANDARD,
		features: [
			{ title: 'HINT' },
			{ title: 'UNDO' }
		]
	},
	{
		id: GAME_MODE_EXPERT,
		features: []
	}
];
export type GAME_MODE_ID = 'GAME_MODE_EASY' | 'GAME_MODE_STANDARD' | 'GAME_MODE_EXPERT';
export const GAME_MODE_ID_DEFAULT: GAME_MODE_ID = 'GAME_MODE_EXPERT';

export const Themes: Array<{ id?: string; name: string }> = [
	{ id: 'ltgreen', name: 'THEME_LIGHT_GREEN' },
	{ id: 'dkgreen', name: 'THEME_DARK_GREEN' },
	{ id: 'ltblue', name: 'THEME_LIGHT_BLUE' },
	{ id: 'dkblue', name: 'THEME_DARK_BLUE' },
	{ id: 'brown', name: 'THEME_BROWN' },
	{ id: 'black', name: 'THEME_BLACK' },
	{ id: 'white', name: 'THEME_WHITE' }
];

export const Backgrounds: Array<{ img?: string; name: string; small?: boolean }> = [
	{ img: undefined, name: 'BACK_NONE' },
	{ img: 'bamboo', name: 'BACK_BAMBOO' },
	{ img: 'blueclouds', name: 'BACK_BLUE_CLOUDS' },
	{ img: 'grayclouds', name: 'BACK_GRAY_CLOUDS' },
	{ img: 'grass-1', name: 'BACK_GRAY_GRASS' },
	{ img: 'stones-1', name: 'BACK_GRAY_STONES' },
	{ img: 'wood', name: 'BACK_GRAY_WOOD' },
	{ img: 'wood-grain-1', name: 'BACK_GRAY_WOOD_GRAIN' }
];

export const ImageSets = [
	{ id: 'riichi', type: 'SVG', name: 'Riichi 2' },
	{ id: 'picasso', type: 'PNG', name: 'Picasso' },
	{ id: 'modern', type: 'PNG', name: 'Modern' },
	{ id: 'animals', type: 'SVG', name: 'Animals' },
	{ id: 'open-fruits', type: 'PNG', name: 'Fruits' },
	{ id: 'riichi-old', type: 'SVG', name: 'Riichi' },
	{ id: 'uni', type: 'SVG', name: 'Uni' },
	{ id: 'cheshire137', type: 'SVG', name: 'Cheshire' },
	{ id: 'recri2', type: 'SVG', name: 'Recri 2' },
	{ id: 'unib', type: 'SVG', name: 'Black & White' },
	{ id: 'recri', type: 'PNG', name: 'Recri' },
	{ id: 'classic', type: 'PNG', name: 'Classic' }
];

export const ImageSetDefault = 'riichi';
export const ThemeDefault = 'ltgreen';
export const LangAuto = 'auto';
export const LangDefault = 'auto';

export const TILES: Array<[string, string, string, string]> = [
	['t_do1', 't_do1', 't_do1', 't_do1'],
	['t_do2', 't_do2', 't_do2', 't_do2'],
	['t_do3', 't_do3', 't_do3', 't_do3'],
	['t_do4', 't_do4', 't_do4', 't_do4'],
	['t_do5', 't_do5', 't_do5', 't_do5'],
	['t_do6', 't_do6', 't_do6', 't_do6'],
	['t_do7', 't_do7', 't_do7', 't_do7'],
	['t_do8', 't_do8', 't_do8', 't_do8'],
	['t_do9', 't_do9', 't_do9', 't_do9'],
	['t_ch1', 't_ch1', 't_ch1', 't_ch1'],
	['t_ch2', 't_ch2', 't_ch2', 't_ch2'],
	['t_ch3', 't_ch3', 't_ch3', 't_ch3'],
	['t_ch4', 't_ch4', 't_ch4', 't_ch4'],
	['t_ch5', 't_ch5', 't_ch5', 't_ch5'],
	['t_ch6', 't_ch6', 't_ch6', 't_ch6'],
	['t_ch7', 't_ch7', 't_ch7', 't_ch7'],
	['t_ch8', 't_ch8', 't_ch8', 't_ch8'],
	['t_ch9', 't_ch9', 't_ch9', 't_ch9'],
	['t_ba1', 't_ba1', 't_ba1', 't_ba1'],
	['t_ba2', 't_ba2', 't_ba2', 't_ba2'],
	['t_ba3', 't_ba3', 't_ba3', 't_ba3'],
	['t_ba4', 't_ba4', 't_ba4', 't_ba4'],
	['t_ba5', 't_ba5', 't_ba5', 't_ba5'],
	['t_ba6', 't_ba6', 't_ba6', 't_ba6'],
	['t_ba7', 't_ba7', 't_ba7', 't_ba7'],
	['t_ba8', 't_ba8', 't_ba8', 't_ba8'],
	['t_ba9', 't_ba9', 't_ba9', 't_ba9'],
	['t_se_spring', 't_se_summer', 't_se_fall', 't_se_winter'],
	['t_wi_north', 't_wi_north', 't_wi_north', 't_wi_north'],
	['t_wi_south', 't_wi_south', 't_wi_south', 't_wi_south'],
	['t_wi_east', 't_wi_east', 't_wi_east', 't_wi_east'],
	['t_wi_west', 't_wi_west', 't_wi_west', 't_wi_west'],
	['t_fl_bamboo', 't_fl_chrysanthemum', 't_fl_orchid', 't_fl_plum'],
	['t_dr_green', 't_dr_green', 't_dr_green', 't_dr_green'],
	['t_dr_white', 't_dr_white', 't_dr_white', 't_dr_white'],
	['t_dr_red', 't_dr_red', 't_dr_red', 't_dr_red']
];

export const TILES_EXT: Array<[string, string, string, string]> = [];
for (let index = 1; index < 19; index++) {
	TILES_EXT.push([`t_g${index}`, `t_g${index}`, `t_g${index}`, `t_g${index}`]);
}
for (let index = 1; index < 10; index++) {
	TILES_EXT.push([`t_e${index}`, `t_e${index}`, `t_e${index}`, `t_e${index}`]);
}
export const TILES_INFOS = [
	{
		name: 'TILES_SUITS',
		groups: [
			{ name: 'TILES_SUIT_CIRCLES', tiles: ['t_do1', 't_do2', 't_do3', 't_do4', 't_do5', 't_do6', 't_do7', 't_do8', 't_do9'] },
			{ name: 'TILES_SUIT_BAMBOO', tiles: ['t_ba1', 't_ba2', 't_ba3', 't_ba4', 't_ba5', 't_ba6', 't_ba7', 't_ba8', 't_ba9'] },
			{ name: 'TILES_SUIT_CHARACTERS', tiles: ['t_ch1', 't_ch2', 't_ch3', 't_ch4', 't_ch5', 't_ch6', 't_ch7', 't_ch8', 't_ch9'] }
		]
	},
	{
		name: 'TILES_BONUS',
		groups: [
			{ name: 'TILES_BONUS_SEASONS', tiles: ['t_se_spring', 't_se_summer', 't_se_fall', 't_se_winter'] },
			{ name: 'TILES_BONUS_FLOWERS', tiles: ['t_fl_bamboo', 't_fl_orchid', 't_fl_plum', 't_fl_chrysanthemum'] }
		]
	},
	{
		name: 'TILES_HONORS',
		groups: [
			{ name: 'TILES_HONORS_WINDS', tiles: ['t_wi_east', 't_wi_south', 't_wi_west', 't_wi_north'] },
			{ name: 'TILES_HONORS_DRAGONS', tiles: ['t_dr_red', 't_dr_green', 't_dr_white'] }
		]
	},
	{
		name: 'TILES_JOKERS',
		groups: [
			{ name: 'TILES_JOKERS_GENERAL', tiles: ['t_g1', 't_g2', 't_g3'] },
			{ name: 'TILES_JOKERS_BLUEGREEN', tiles: ['t_g4', 't_g5', 't_g6', 't_g7', 't_g8'] },
			{ name: 'TILES_JOKERS_RED', tiles: ['t_g9', 't_g10', 't_g11', 't_g12', 't_g13'] },
			{ name: 'TILES_JOKERS_RANK', tiles: ['t_g14', 't_g15', 't_g16', 't_g17', 't_g18'] }
		]
	},
	{
		name: 'TILES_EXTRA',
		groups: [
			{ name: 'TILES_EXTRA', tiles: ['t_e1', 't_e2', 't_e3', 't_e4', 't_e5', 't_e6', 't_e7', 't_e8', 't_e9'] }
		]
	}
];
