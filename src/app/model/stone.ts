export interface StonePosition {
	x: number;
	y: number;
	z: number;
	v: number;
	groupNr: number;
}

export interface StoneState {
	blocked: boolean;
	removable: boolean;
}

export interface StoneEffects {
	wiggle?: boolean;
}

export interface StoneImg {
	id?: string;
}

export interface StoneNodes {
	top: Array<Stone>;
	left: Array<Stone>;
	right: Array<Stone>;
	bottom: Array<Stone>;
}

export class Stone implements StonePosition {
	x: number;
	y: number;
	z: number;
	v: number;
	groupNr: number;
	hinted: boolean = false;
	selected: boolean = false;
	picked: boolean = false;
	state: StoneState = { blocked: false, removable: false };
	group: Array<Stone> = [];
	img: StoneImg = {};
	nodes: StoneNodes = { top: [], left: [], right: [], bottom: [] };
	effects?: StoneEffects;

	constructor(z: number, x: number, y: number, v: number, groupNr: number) {
		this.z = z;
		this.x = x;
		this.y = y;
		this.v = v;
		this.groupNr = groupNr;
	}

	toPosition(): StonePosition {
		return { z: this.z, x: this.x, y: this.y, v: this.v, groupNr: this.groupNr };
	}

	isBlocked(): boolean {
		return Stone.hasStone(this.nodes.top) || (Stone.hasStone(this.nodes.left) && Stone.hasStone(this.nodes.right));
	}

	private static hasStone(list: Array<Stone>): boolean {
		return list.some(stone => !stone.picked);
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
