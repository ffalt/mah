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
	list: Array<Tile> = [];
	groups: Array<TileGroup> = [];

	constructor() {
		let v = 0;
		const tilesMapping = TILES.map(row => row.map(id => ({id})));
		tilesMapping.forEach((group, groupnr) => {
			const g: TileGroup = {v: groupnr, tiles: []};
			this.groups.push(g);
			group.forEach(img => {
				v++;
				const tile = {groupnr, v, img};
				g.tiles.push(tile);
				this.list[v] = tile;
			});
		});
	}
}
