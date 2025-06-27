import { TILES, TILES_EXT } from './consts';

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

	constructor(amount: number) {
		let v = 0;
		let tilesMapping = TILES.map(row => row.map(id => ({ id })));
		const groups_needed = Math.ceil(amount / 4);
		if (groups_needed > tilesMapping.length) {
			const tilesExtraMapping = TILES_EXT.map(row => row.map(id => ({ id })));
			tilesMapping = tilesMapping.concat(tilesExtraMapping);
			while (tilesMapping.length < groups_needed) {
				tilesMapping.push([{ id: `_${tilesMapping.length}a` }, { id: `_${tilesMapping.length}b` }, { id: `_${tilesMapping.length}c` }, { id: `_${tilesMapping.length}d` }]);
			}
		}
		tilesMapping.forEach((group, groupnr) => {
			const g: TileGroup = { v: groupnr, tiles: [] };
			this.groups.push(g);
			group.forEach(img => {
				v++;
				const tile = { groupnr, v, img };
				g.tiles.push(tile);
				this.list[v] = tile;
			});
		});
	}
}
