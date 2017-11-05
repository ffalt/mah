export class Stone {
	public x: number;
	public y: number;
	public z: number;
	public v: number;
	public hinted: boolean;
	public selected: boolean;
	public groupnr: number;
	public picked: boolean;
	public state: {
		blocked: boolean;
		removable: boolean;
	};
	public group: Array<Stone> = [];
	public img: {
		id: string;
	};
	public nodes: {
		top: Array<Stone>;
		left: Array<Stone>;
		right: Array<Stone>;
		bottom: Array<Stone>;
	};

	private static hasStone(list: Array<Stone>): boolean {
		for (let i = 0; i < list.length; i++) {
			if (!list[i].picked) {
				return true;
			}
		}
		return false;
	}

	constructor(z: number, x: number, y: number, v: number, groupnr: number) {
		this.z = z;
		this.x = x;
		this.y = y;
		this.v = v;
		this.groupnr = groupnr;
		this.picked = false;
	}

	public isBlocked(): boolean {
		return Stone.hasStone(this.nodes.top) || (Stone.hasStone(this.nodes.left) && Stone.hasStone(this.nodes.right));
	}
	//
	// public isLoose(): boolean {
	// 	return !Stone.hasStone(this.nodes.left) && !Stone.hasStone(this.nodes.right) && !Stone.hasStone(this.nodes.bottom);
	// }

}


export const safeGetStone = (stones: Array<Stone>, z: number, x: number, y: number): Stone => {
	for (let i = 0, il = stones.length; i < il; i++) {
		if (stones[i].z === z && stones[i].x === x && stones[i].y === y) {
			return stones[i];
		}
	}
};
