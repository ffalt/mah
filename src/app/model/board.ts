import { type BUILD_MODE_ID, Builder, MODE_SOLVABLE } from './builder';
import { Stone, safeGetStone } from './stone';
import type { Mapping, Place, StoneMapping, StonePlace } from './types';
import { StoneTiles, Tiles } from './tiles';
import { BuilderBase } from './builder/base';

interface StoneGroup {
	group: number;
	stones: Array<Stone>;
}

interface Hints {
	groups: Array<StoneGroup>;
	current?: StoneGroup;
}

export class Board {
	free: Array<Stone> = [];
	stones: Array<Stone> = [];
	count = 0;
	hints: Hints = { groups: [], current: undefined };
	selected?: Stone = undefined;
	undo: Array<Place> = [];

	clearSelection(): void {
		if (this.selected) {
			this.selected.selected = false;
		}
		this.selected = undefined;
	}

	setStoneSelected(stone?: Stone): void {
		this.clearSelection();
		if (stone) {
			stone.selected = true;
			this.selected = stone;
		}
	}

	clearHints(): void {
		if (this.hints.current) {
			for (const stone of this.hints.current.stones) {
				stone.hinted = false;
			}
		}
		this.hints = {
			groups: [],
			current: undefined
		};
	}

	hint(): void {
		if (this.hintNext()) {
			return;
		}
		this.clearHints();
		if (this.free.length === 0) {
			return;
		}
		const groups: Array<StoneGroup> = this.collectHints();
		if (this.selected) {
			const prefer = this.selected.groupNr;
			groups.sort((a: StoneGroup, b: StoneGroup) => {
				if (a.group === prefer) {
					return -1;
				}
				if (b.group === prefer) {
					return 1;
				}
				return 0;
			});
		}
		const current = groups[0];
		this.hints = { groups, current };
		for (const stone of current.stones) {
			stone.hinted = true;
		}
	}

	reset(): void {
		this.clearSelection();
		this.clearHints();
		this.free = [];
		this.count = 0;
		this.stones = [];
		this.undo = [];
	}

	canRemove(stone: Stone): boolean {
		return stone.group.some((groupStone: Stone) => !groupStone.picked && !groupStone.isBlocked());
	}

	update(): void {
		const free: Array<Stone> = [];
		let count = 0;
		for (const stone of this.stones) {
			stone.state = {
				blocked: !stone.picked && stone.isBlocked(),
				removable: false
			};
			count += stone.picked ? 0 : 1;
		}
		for (const stone of this.stones) {
			stone.state.removable = !stone.picked && !stone.state.blocked && this.canRemove(stone);
			if (stone.state.removable) {
				free.push(stone);
			}
		}
		this.free = free;
		this.count = count;
	}

	back(): void {
		if (this.undo.length < 2) {
			return;
		}
		this.clearSelection();
		this.clearHints();
		const n1 = this.undo.pop();
		const n2 = this.undo.pop();
		if (!n1 || !n2) {
			return;
		}
		for (const stone of this.stones) {
			if (
				((stone.z === n1[0]) && (stone.x === n1[1]) && (stone.y === n1[2])) ||
				((stone.z === n2[0]) && (stone.x === n2[1]) && (stone.y === n2[2]))
			) {
				stone.picked = false;
			}
		}
		this.update();
	}

	shuffle() {
		this.clearSelection();
		this.clearHints();
		const usedStones = this.stones.filter(s => s.picked);
		const unusedStones = this.stones.filter(s => !s.picked);
		const tiles = new StoneTiles(unusedStones);
		const mapping: Mapping = unusedStones.map(s => [s.z, s.x, s.y]);
		const builder: Builder = new Builder(tiles);
		const stones = builder.build(MODE_SOLVABLE, mapping);
		if (!stones) {
			return;
		}
		const newStones = [...stones, ...usedStones];
		BuilderBase.fillStones(newStones, new Tiles(this.stones.length));
		this.stones = newStones;
		this.update();
	}

	load(mapping: StoneMapping, undos: Array<Place>): void {
		if (!mapping) {
			return;
		}
		this.undo = undos;
		const builder: Builder = new Builder(new Tiles(mapping.length + undos.length));
		const stones = builder.load(mapping);
		if (!stones) {
			return;
		}
		for (const undo of undos) {
			const stone: Stone | undefined = safeGetStone(stones, undo[0], undo[1], undo[2]);
			if (stone) {
				stone.picked = true;
			}
		}
		this.stones = stones;
		this.update();
	}

	save(): Array<StonePlace> {
		return this.stones.map((stone: Stone) => [stone.z, stone.x, stone.y, stone.v]);
	}

	applyMapping(mapping: Mapping, mode: BUILD_MODE_ID): void {
		const builder: Builder = new Builder(new Tiles(mapping.length));
		this.stones = builder.build(mode, mapping) || [];
	}

	pick(sel: Stone, stone: Stone) {
		this.clearSelection();
		this.undo.push([sel.z, sel.x, sel.y], [stone.z, stone.x, stone.y]);
		this.clearHints();
		sel.picked = true;
		stone.picked = true;
		this.update();
	}

	countUnblocked(): number {
		return this.stones.filter(s => !s.picked && !s.isBlocked()).length;
	}

	private hintNext(): boolean {
		if (!this.hints.current) {
			return false;
		}
		for (const stone of this.hints.current.stones) {
			stone.hinted = false;
		}
		let index = this.hints.groups.indexOf(this.hints.current);
		if (index >= 0) {
			index++;
			if (index >= this.hints.groups.length) {
				index = 0;
			}
			if (index < this.hints.groups.length) {
				this.hints.current = this.hints.groups[index];
				for (const stone of this.hints.current.stones) {
					stone.hinted = true;
				}
				return true;
			}
		}
		return false;
	}

	private collectHints(): Array<StoneGroup> {
		const hash: { [index: string]: Array<Stone> } = {};
		for (const stone of this.free) {
			const gn = stone.groupNr.toString();
			hash[gn] = hash[gn] || [];
			hash[gn].push(stone);
		}
		return Object.keys(hash).map((key: string) =>
			({ group: hash[key][0].groupNr, stones: hash[key] }));
	}
}
