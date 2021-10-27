/* eslint-disable @typescript-eslint/naming-convention */

export const Consts = {
	mY: 18, mX: 38, mZ: 7,
	tileWidth: 75,
	tileHeight: 100
};

export const STATES = {
	idle: 0,
	run: 1,
	pause: 2,
	freeze: 3
};

export const Backgrounds: Array<{ img?: string; name: string; small?: boolean }> = [
	{img: undefined, name: 'BACK_NONE'},
	{img: 'bamboo.jpg', name: 'BACK_BAMBOO'},
	{img: 'blueclouds.jpg', name: 'BACK_BLUE_CLOUDS'},
	{img: 'grayclouds.jpg', name: 'BACK_GRAY_CLOUDS'},
	{img: 'grass-1.jpg', name: 'BACK_GRAY_GRASS'},
	{img: 'stones-1.jpg', name: 'BACK_GRAY_STONES'},
	{img: 'wood.jpg', name: 'BACK_GRAY_WOOD'},
	{img: 'wood-grain-1.jpg', name: 'BACK_GRAY_WOOD_GRAIN'}
];

export const ImageSets = [
	{id: 'riichi', type: 'SVG', name: 'Riichi', url: 'https://github.com/FluffyStuff/riichi-mahjong-tiles'},
	{id: 'uni', type: 'SVG', name: 'Uni', url: 'https://commons.wikimedia.org/wiki/Category:Unicode_1F000-1F02F_Mahjong_Tiles_(color)'},
	{id: 'bzhmaddog', type: 'SVG', name: 'Bzhmaddog', url: 'https://github.com/bzhmaddog/html5-mahjong-solitaire/tree/master/res/skins/default/tiles'},
	{id: 'cheshire137', type: 'SVG', name: 'Cheshire', url: 'https://github.com/cheshire137/Mahjong/tree/master/app/assets/images/tiles'},
	{id: 'recri2', type: 'SVG', name: 'Recri', url: 'https://github.com/recri/mahjong'},
	{id: 'unib', type: 'SVG', name: 'Black', url: 'https://commons.wikimedia.org/wiki/Category:Unicode_1F000-1F02F_Mahjong_Tiles'},
	{id: 'gleitz', type: 'PNG', name: 'Gleitz', url: 'https://github.com/gleitz/mahjong/tree/master/public/img/tiles'},
	{id: 'recri', type: 'PNG', name: 'Recri', url: 'https://github.com/recri/mahjong'},
	{id: 'open-fruits', type: 'PNG', name: 'Fruits', url: 'https://github.com/xunkar/open-mahjong/tree/master/resources/tiles/fruits'},
	{id: 'picasso', type: 'PNG', name: 'Picasso', url: 'http://star.physics.yale.edu/~ullrich/software/SolitaireMahjong/'},
	{id: 'modern', type: 'PNG', name: 'Modern', url: 'http://star.physics.yale.edu/~ullrich/software/SolitaireMahjong/'},
	{id: 'classic', type: 'PNG', name: 'Classic', url: 'http://star.physics.yale.edu/~ullrich/software/SolitaireMahjong/'}
];

export const ImageSetDefault = 'riichi';

export const TILES = [
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

export const TILES_INFOS = [
	{
		name: 'TILES_SUITS',
		groups: [
			{name: 'TILES_SUIT_CIRCLES', tiles: ['t_do1', 't_do2', 't_do3', 't_do4', 't_do5', 't_do6', 't_do7', 't_do8', 't_do9']},
			{name: 'TILES_SUIT_BAMBOO', tiles: ['t_ba1', 't_ba2', 't_ba3', 't_ba4', 't_ba5', 't_ba6', 't_ba7', 't_ba8', 't_ba9']},
			{name: 'TILES_SUIT_CHARACTERS', tiles: ['t_ch1', 't_ch2', 't_ch3', 't_ch4', 't_ch5', 't_ch6', 't_ch7', 't_ch8', 't_ch9']}
		]
	},
	{
		name: 'TILES_BONUS',
		groups: [
			{name: 'TILES_BONUS_SEASONS', tiles: ['t_se_spring', 't_se_summer', 't_se_fall', 't_se_winter']},
			{name: 'TILES_BONUS_FLOWERS', tiles: ['t_fl_bamboo', 't_fl_orchid', 't_fl_plum', 't_fl_chrysanthemum']}
		]
	}, {
		name: 'TILES_HONORS',
		groups: [
			{name: 'TILES_HONORS_WINDS', tiles: ['t_wi_east', 't_wi_south', 't_wi_west', 't_wi_north']},
			{name: 'TILES_HONORS_DRAGONS', tiles: ['t_dr_red', 't_dr_green', 't_dr_white']}
		]
	}
];

export const TILES_INFO = {
	t_do1: 'Chu',
	t_do2: 'Sung',
	t_do3: 'Feng',
	t_do4: 'Yü',
	t_do5: 'Lung',
	t_do6: 'Tao',
	t_do7: 'Ch\'ung',
	t_do8: 'Hu',
	t_do9: 'Ch\'i',
	t_ba1: 'K\'ung',
	t_ba2: 'Ya',
	t_ba3: 'Min',
	t_ba4: 'Li',
	t_ba5: 'Lien',
	t_ba6: 'Shui',
	t_ba7: 'Kuei',
	t_ba8: 'Chün',
	t_ba9: 'Liu',
	t_ch1: 'Ju',
	t_ch2: 'Chien',
	t_ch3: 'Ti',
	t_ch4: 'Ch\'in',
	t_ch5: 'Fang',
	t_ch6: 'Huo',
	t_ch7: 'Tuo',
	t_ch8: 'Chieh',
	t_ch9: 'Tien',
	t_se_spring: 'Yu',
	t_se_summer: 'Ch\'iao',
	t_se_fall: 'Keng',
	t_se_winter: 'Tu',
	t_fl_bamboo: 'Chu',
	t_fl_orchid: 'Lan',
	t_fl_plum: 'Li',
	t_fl_chrysanthemum: 'Chü',
	t_wi_east: 'Tung',
	t_wi_south: 'Nan',
	t_wi_west: 'Hsi',
	t_wi_north: 'Pei',
	t_dr_red: 'Chung',
	t_dr_green: 'Fa',
	t_dr_white: 'Pai'
};
