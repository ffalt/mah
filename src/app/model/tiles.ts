export const TILES = [
	['ball_1', 'ball_1', 'ball_1', 'ball_1'],
	['ball_2', 'ball_2', 'ball_2', 'ball_2'],
	['ball_3', 'ball_3', 'ball_3', 'ball_3'],
	['ball_4', 'ball_4', 'ball_4', 'ball_4'],
	['ball_5', 'ball_5', 'ball_5', 'ball_5'],
	['ball_6', 'ball_6', 'ball_6', 'ball_6'],
	['ball_7', 'ball_7', 'ball_7', 'ball_7'],
	['ball_8', 'ball_8', 'ball_8', 'ball_8'],
	['ball_9', 'ball_9', 'ball_9', 'ball_9'],
	['character_1', 'character_1', 'character_1', 'character_1'],
	['character_2', 'character_2', 'character_2', 'character_2'],
	['character_3', 'character_3', 'character_3', 'character_3'],
	['character_4', 'character_4', 'character_4', 'character_4'],
	['character_5', 'character_5', 'character_5', 'character_5'],
	['character_6', 'character_6', 'character_6', 'character_6'],
	['character_7', 'character_7', 'character_7', 'character_7'],
	['character_8', 'character_8', 'character_8', 'character_8'],
	['character_9', 'character_9', 'character_9', 'character_9'],
	['bamboo_1', 'bamboo_1', 'bamboo_1', 'bamboo_1'],
	['bamboo_2', 'bamboo_2', 'bamboo_2', 'bamboo_2'],
	['bamboo_3', 'bamboo_3', 'bamboo_3', 'bamboo_3'],
	['bamboo_4', 'bamboo_4', 'bamboo_4', 'bamboo_4'],
	['bamboo_5', 'bamboo_5', 'bamboo_5', 'bamboo_5'],
	['bamboo_6', 'bamboo_6', 'bamboo_6', 'bamboo_6'],
	['bamboo_7', 'bamboo_7', 'bamboo_7', 'bamboo_7'],
	['bamboo_8', 'bamboo_8', 'bamboo_8', 'bamboo_8'],
	['bamboo_9', 'bamboo_9', 'bamboo_9', 'bamboo_9'],
	['season_spring', 'season_summer', 'season_fall', 'season_winter'],
	['wind_north', 'wind_north', 'wind_north', 'wind_north'],
	['wind_south', 'wind_south', 'wind_south', 'wind_south'],
	['wind_east', 'wind_east', 'wind_east', 'wind_east'],
	['wind_west', 'wind_west', 'wind_west', 'wind_west'],
	['flower_bamboo', 'flower_chrysanthemum', 'flower_orchid', 'flower_plum'],
	['dragon_green', 'dragon_green', 'dragon_green', 'dragon_green'],
	['dragon_white', 'dragon_white', 'dragon_white', 'dragon_white'],
	['dragon_red', 'dragon_red', 'dragon_red', 'dragon_red']
];

export const TILES_INFO = {
	suits: [
		{
			name: 'Circles', tiles: [
			{name: 'Pearl', char: 'Chu', img: 'ball_1'},
			{name: 'Pine tree', char: 'Sung', img: 'ball_2'},
			{name: 'Phoenix', char: 'Feng', img: 'ball_3'},
			{name: 'Jade', char: 'Yü', img: 'ball_4'},
			{name: 'Dragon', char: 'Lung', img: 'ball_5'},
			{name: 'Peach', char: 'Tao', img: 'ball_6'},
			{name: 'Insect', char: 'Ch\'ung', img: 'ball_7'},
			{name: 'White Tiger', char: 'Hu', img: 'ball_8'},
			{name: 'Unicorn', char: 'Ch\'i', img: 'ball_9'}
		]
		}, {
			name: 'Bamboo', tiles: [
				{name: 'Peacock', char: 'K\'ung', img: 'bamboo_1'},
				{name: 'Duck', char: 'Ya', img: 'bamboo_2'},
				{name: 'Toad', char: 'Min', img: 'bamboo_3'},
				{name: 'Carp', char: 'Li', img: 'bamboo_4'},
				{name: 'Lotus flower', char: 'Lien', img: 'bamboo_5'},
				{name: 'Water', char: 'Shui', img: 'bamboo_6'},
				{name: 'Tortoise', char: 'Kuei', img: 'bamboo_7'},
				{name: 'Mushroom', char: 'Chün', img: 'bamboo_8'},
				{name: 'Willow tree', char: 'Liu', img: 'bamboo_9'}
			]
		}, {
			name: 'Characters', tiles: [
				{name: 'Bar of door', char: 'Ju', img: 'character_1'},
				{name: 'Sword', char: 'Chien', img: 'character_2'},
				{name: 'Earth', char: 'Ti', img: 'character_3'},
				{name: 'Lute', char: 'Ch\'in', img: 'character_4'},
				{name: 'House', char: 'Fang', img: 'character_5'},
				{name: 'Fire', char: 'Huo', img: 'character_6'},
				{name: 'Seven stars', char: 'Tuo', img: 'character_7'},
				{name: 'Knot', char: 'Chieh', img: 'character_8'},
				{name: 'Heaven', char: 'Tien', img: 'character_9'}
			]
		}
	],

	bonus: [
		{
			name: 'Seasons', tiles: [{name: 'Spring', char: 'Yu', img: 'season_spring'},
			{name: 'Summer', char: 'Ch\'iao', img: 'season_summer'},
			{name: 'Fall', char: 'Keng', img: 'season_fall'},
			{name: 'Winter', char: 'Tu', img: 'season_winter'},
		]
		},
		{
			name: 'Flowers', tiles: [{name: 'Bamboo', char: 'Chu', img: 'flower_bamboo'},
			{name: 'Orchid', char: 'Lan', img: 'flower_orchid'},
			{name: 'Plum Blossom', char: 'Li', img: 'flower_plum'},
			{name: 'Chrysan&shy;themum', char: 'Chü', img: 'flower_chrysanthemum'}]
		}
	],

	honors: [
		{
			name: 'Winds', tiles: [{name: 'East', char: 'Tung', img: 'wind_east'},
			{name: 'South', char: 'Nan', img: 'wind_south'},
			{name: 'West', char: 'Hsi', img: 'wind_west'},
			{name: 'North', char: 'Pei', img: 'wind_north'}]
		},
		{
			name: 'Dragons', tiles: [{name: 'Red', char: 'Chung', img: 'dragon_red'},
			{name: 'Green', char: 'Fa', img: 'dragon_green'},
			{name: 'White', char: 'Pai', img: 'dragon_white'}]
		}
	]
};

export interface Tile {
	v: number;
	groupnr: number;
	img: { id: string };
}

export interface TileGroup {
	v: number;
	tiles: Array<Tile>;
}

export class Tiles {
	public list: Array<Tile> = [];
	public groups: Array<TileGroup> = [];

	constructor() {
		let n = 0;
		const tiles_mapping = TILES.map(row => {
			return row.map(id => {
				return {id: id};
			});
		});
		tiles_mapping.forEach((group, group_nr) => {
			const g: TileGroup = {
				v: group_nr,
				tiles: []
			};
			this.groups.push(g);
			group.forEach((img) => {
				n++;
				const tile = {
					groupnr: group_nr,
					v: n,
					img: img
				};
				g.tiles.push(tile);
				this.list[n] = tile;
			});
		});
	}
}
