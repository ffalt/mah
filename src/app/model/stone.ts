export class Stone {
	x: number;
	y: number;
	z: number;
	v: number;
	hinted: boolean;
	selected: boolean;
	groupnr: number;
	picked: boolean = false;
	state: {
		blocked: boolean;
		removable: boolean;
	};
	group: Array<Stone> = [];
	img: {
		id: string;
	};
	nodes: {
		top: Array<Stone>;
		left: Array<Stone>;
		right: Array<Stone>;
		bottom: Array<Stone>;
	};

	constructor(z: number, x: number, y: number, v: number, groupnr: number) {
		this.z = z;
		this.x = x;
		this.y = y;
		this.v = v;
		this.groupnr = groupnr;
	}

	private static hasStone(list: Array<Stone>): boolean {
		for (const stone of list) {
			if (!stone.picked) {
				return true;
			}
		}
		return false;
	}

	isBlocked(): boolean {
		return Stone.hasStone(this.nodes.top) || (Stone.hasStone(this.nodes.left) && Stone.hasStone(this.nodes.right));
	}

	isLoose(): boolean {
		return !Stone.hasStone(this.nodes.left) && !Stone.hasStone(this.nodes.right) && !Stone.hasStone(this.nodes.bottom);
	}
}

export const safeGetStone = (stones: Array<Stone>, z: number, x: number, y: number): Stone => {
	for (let i = 0, il = stones.length; i < il; i++) {
		if (stones[i].z === z && stones[i].x === x && stones[i].y === y) {
			return stones[i];
		}
	}
};
