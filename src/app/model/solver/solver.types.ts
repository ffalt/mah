export type TileNeighboursLeftRight = [Tile | undefined, Tile | undefined, Tile | undefined];
export type TileNeighboursAboveBelow = [Tile | undefined, Tile | undefined, Tile | undefined, Tile | undefined, Tile | undefined];

export interface Tile {
	// undefined-terminated arrays of neighbo(u)rs
	left: TileNeighboursLeftRight;
	right: TileNeighboursLeftRight;
	above: TileNeighboursAboveBelow;
	below: TileNeighboursAboveBelow;
	// The group of the tile (0-35)
	value: number;
	// If the tile has been played already by the solver during the routine prune()
	isPlayed: boolean;
}

export interface Group {
	// the pairing of the four tiles (0-5): see prune() for more info
	pairing: number;
	// number of tiles with the value of this group
	nMembers: number;
	// array of tiles of this group
	member: [Tile | undefined, Tile | undefined, Tile | undefined, Tile | undefined];
	// whether all tiles are already played
	isPlayed: boolean;
	// the pairing for the best partial solution found this far
	bestPairing: number;
	// how often the last three tiles are cycled
	rotation: number;
}
