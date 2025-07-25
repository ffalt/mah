import { TILES, TILES_EXT } from './consts';

export interface Tile {
	v: number;
	groupNr: number;
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
		const groupsNeeded = Math.ceil(amount / 4);
		if (groupsNeeded > tilesMapping.length) {
			const tilesExtraMapping = TILES_EXT.map(row => row.map(id => ({ id })));
			tilesMapping = [...tilesMapping, ...tilesExtraMapping];
			while (tilesMapping.length < groupsNeeded) {
				tilesMapping.push([{ id: `_${tilesMapping.length}a` }, { id: `_${tilesMapping.length}b` }, { id: `_${tilesMapping.length}c` }, { id: `_${tilesMapping.length}d` }]);
			}
		}
		for (const [groupNr, group] of tilesMapping.entries()) {
			const g: TileGroup = { v: groupNr, tiles: [] };
			this.groups.push(g);
			for (const img of group) {
				v++;
				const tile: Tile = { groupNr, v, img };
				g.tiles.push(tile);
				this.list[v] = tile;
			}
		}
	}
}
