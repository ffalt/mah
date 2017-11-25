import {TILES} from './consts';

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
