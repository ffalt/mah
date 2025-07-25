export interface StonePosition {
	x: number;
	y: number;
	z: number;
	v: number;
	groupNr: number;
}

export class Stone implements StonePosition {
	x: number;
	y: number;
	z: number;
	v: number;
	groupNr: number;
	hinted: boolean;
	selected: boolean;
	picked: boolean = false;
	state: {
		blocked: boolean;
		removable: boolean;
	};
	group: Array<Stone> = [];
	img: {
		id?: string;
	};
	nodes: {
		top: Array<Stone>;
		left: Array<Stone>;
		right: Array<Stone>;
		bottom: Array<Stone>;
	};

	constructor(z: number, x: number, y: number, v: number, groupNr: number) {
		this.z = z;
		this.x = x;
		this.y = y;
		this.v = v;
		this.groupNr = groupNr;
	}

	toPosition(): StonePosition {
		return {z: this.z, x: this.x, y: this.y, v: this.v, groupNr: this.groupNr};
	}

	isBlocked(): boolean {
		return Stone.hasStone(this.nodes.top) || (Stone.hasStone(this.nodes.left) && Stone.hasStone(this.nodes.right));
	}

	// isLoose(): boolean {
	// 	return !Stone.hasStone(this.nodes.left) && !Stone.hasStone(this.nodes.right) && !Stone.hasStone(this.nodes.bottom);
	// }

	private static hasStone(list: Array<Stone>): boolean {
		for (const stone of list) {
			if (!stone.picked) {
				return true;
			}
		}
		return false;
	}
}

export const safeGetStone = (stones: Array<Stone>, z: number, x: number, y: number): Stone | undefined => {
	for (const stone of stones) {
		if (stone.z === z && stone.x === x && stone.y === y) {
			return stone;
		}
	}
	return;
};
