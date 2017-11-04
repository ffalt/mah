const TILES = [
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

export interface Tile {
	v: number;
	groupnr: number;
	img: {id: string};
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
