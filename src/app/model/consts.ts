export const Consts = {
	mY: 18, mX: 38, mZ: 7,
	tile_width: 75,
	tile_height: 100
};

export const STATES = {
	idle: 0,
	run: 1,
	pause: 2,
	freeze: 3
};

export const Backgrounds: Array<{ img: string, name: string, small?: boolean }> = [
	{img: null, name: 'None'},
	{img: 'grass-1.jpg', name: 'Grass'},
	{img: 'stones-1.jpg', name: 'Stones'},
	{img: 'wood.jpg', name: 'Wood 1'},
	{img: 'wood-grain-1.jpg', name: 'Wood 2'}
];

export const ImageSets = [
	{id: 'riichi', name: 'SVG Riichi'},
	{id: 'uni', name: 'SVG Uni'},
	{id: 'bzhmaddog', name: 'SVG Bzhmaddog'},
	{id: 'cheshire137', name: 'SVG Cheshire137'},
	{id: 'recri2', name: 'SVG Recri'},
	{id: 'unib', name: 'SVG Black'},
	{id: 'gleitz', name: 'PNG Gleitz'},
	{id: 'recri', name: 'PNG Recri'}
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

export const TILES_INFO = {
	suits: [
		{
			name: 'Circles', tiles: [
			{name: 'Pearl', char: 'Chu', img: 't_do1'},
			{name: 'Pine tree', char: 'Sung', img: 't_do2'},
			{name: 'Phoenix', char: 'Feng', img: 't_do3'},
			{name: 'Jade', char: 'Yü', img: 't_do4'},
			{name: 'Dragon', char: 'Lung', img: 't_do5'},
			{name: 'Peach', char: 'Tao', img: 't_do6'},
			{name: 'Insect', char: 'Ch\'ung', img: 't_do7'},
			{name: 'White Tiger', char: 'Hu', img: 't_do8'},
			{name: 'Unicorn', char: 'Ch\'i', img: 't_do9'}
		]
		}, {
			name: 'Bamboo', tiles: [
				{name: 'Peacock', char: 'K\'ung', img: 't_ba1'},
				{name: 'Duck', char: 'Ya', img: 't_ba2'},
				{name: 'Toad', char: 'Min', img: 't_ba3'},
				{name: 'Carp', char: 'Li', img: 't_ba4'},
				{name: 'Lotus flower', char: 'Lien', img: 't_ba5'},
				{name: 'Water', char: 'Shui', img: 't_ba6'},
				{name: 'Tortoise', char: 'Kuei', img: 't_ba7'},
				{name: 'Mushroom', char: 'Chün', img: 't_ba8'},
				{name: 'Willow tree', char: 'Liu', img: 't_ba9'}
			]
		}, {
			name: 'Characters', tiles: [
				{name: 'Bar of door', char: 'Ju', img: 't_ch1'},
				{name: 'Sword', char: 'Chien', img: 't_ch2'},
				{name: 'Earth', char: 'Ti', img: 't_ch3'},
				{name: 'Lute', char: 'Ch\'in', img: 't_ch4'},
				{name: 'House', char: 'Fang', img: 't_ch5'},
				{name: 'Fire', char: 'Huo', img: 't_ch6'},
				{name: 'Seven stars', char: 'Tuo', img: 't_ch7'},
				{name: 'Knot', char: 'Chieh', img: 't_ch8'},
				{name: 'Heaven', char: 'Tien', img: 't_ch9'}
			]
		}
	],

	bonus: [
		{
			name: 'Seasons', tiles: [{name: 'Spring', char: 'Yu', img: 't_se_spring'},
			{name: 'Summer', char: 'Ch\'iao', img: 't_se_summer'},
			{name: 'Fall', char: 'Keng', img: 't_se_fall'},
			{name: 'Winter', char: 'Tu', img: 't_se_winter'},
		]
		},
		{
			name: 'Flowers', tiles: [{name: 'Bamboo', char: 'Chu', img: 't_fl_bamboo'},
			{name: 'Orchid', char: 'Lan', img: 't_fl_orchid'},
			{name: 'Plum Blossom', char: 'Li', img: 't_fl_plum'},
			{name: 'Chrysan&shy;themum', char: 'Chü', img: 't_fl_chrysanthemum'}]
		}
	],

	honors: [
		{
			name: 'Winds', tiles: [{name: 'East', char: 'Tung', img: 't_wi_east'},
			{name: 'South', char: 'Nan', img: 't_wi_south'},
			{name: 'West', char: 'Hsi', img: 't_wi_west'},
			{name: 'North', char: 'Pei', img: 't_wi_north'}]
		},
		{
			name: 'Dragons', tiles: [{name: 'Red', char: 'Chung', img: 't_dr_red'},
			{name: 'Green', char: 'Fa', img: 't_dr_green'},
			{name: 'White', char: 'Pai', img: 't_dr_white'}]
		}
	]
};
