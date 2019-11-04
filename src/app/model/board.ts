import {Builder} from './builder';
import {safeGetStone, Stone} from './stone';
import {Mapping} from './types';

interface StoneGroup {
	group: number;
	stones: Array<Stone>;
}

interface Hints {
	groups: Array<StoneGroup>;
	current: StoneGroup;
}

export class Board {
	builder: Builder = new Builder();
	free: Array<Stone> = [];
	stones: Array<Stone> = [];
	count = 0;
	hints: Hints = {groups: [], current: undefined};
	selected: Stone = undefined;

	clearSelection(): void {
		if (this.selected) {
			this.selected.selected = false;
		}
		this.selected = undefined;
	}

	setStoneSelected(stone: Stone): void {
		this.clearSelection();
		if (stone) {
			stone.selected = true;
			this.selected = stone;
		}
	}

	clearHints(): void {
		if (this.hints.current) {
			this.hints.current.stones.forEach((stone: Stone) => {
				stone.hinted = false;
			});
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
			const prefer = this.selected.groupnr;
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
		this.hints = {
			groups,
			current: groups[0]
		};
		this.hints.current.stones.forEach((stone: Stone) => {
			stone.hinted = true;
		});
	}

	reset(): void {
		this.clearSelection();
		this.clearHints();
		this.free = [];
		this.count = 0;
		this.stones = [];
	}

	update(): void {
		const canRemove = (stone: Stone): boolean =>
			stone.group.filter((_stone: Stone) =>
				!_stone.picked && !_stone.isBlocked()).length > 0;

		const free: Array<Stone> = [];
		let count = 0;
		this.stones.forEach((stone: Stone) => {
			stone.state = {
				blocked: !stone.picked && stone.isBlocked(),
				removable: false
			};
			count += stone.picked ? 0 : 1;
		});
		this.stones.forEach(stone => {
			stone.state.removable = !stone.picked && !stone.state.blocked && canRemove(stone);
			if (stone.state.removable) {
				free.push(stone);
			}
		});
		this.free = free;
		this.count = count;
	}

	load(mapping: Mapping, undos: Array<Array<number>>): void {
		if (!mapping) {
			return;
		}
		const stones = this.builder.build('load', mapping);
		undos.forEach((undo: Array<number>) => {
			const stone: Stone = safeGetStone(stones, undo[0], undo[1], undo[2]);
			if (stone) {
				stone.picked = true;
			}
		});
		this.stones = stones;
	}

	save(): Array<Array<number>> {
		return this.stones.map((stone: Stone) =>
			[stone.z, stone.x, stone.y, stone.v]);
	}

	applyMapping(mapping: Mapping, mode: string): void {
		this.stones = this.builder.build(mode, mapping);
	}

	private hintNext(): boolean {
		if (!this.hints.current) {
			return false;
		}
		this.hints.current.stones.forEach((stone: Stone) => {
			stone.hinted = false;
		});
		let i = this.hints.groups.indexOf(this.hints.current);
		if (i >= 0) {
			i++;
			if (i >= this.hints.groups.length) {
				i = 0;
			}
			if (i < this.hints.groups.length) {
				this.hints.current = this.hints.groups[i];
				this.hints.current.stones.forEach(stone => {
					stone.hinted = true;
				});
				return true;
			}
		}
		return false;
	}

	private collectHints(): Array<StoneGroup> {
		const hash: { [index: string]: Array<Stone> } = {};
		this.free.forEach((stone: Stone) => {
			const gn = stone.groupnr.toString();
			hash[gn] = hash[gn] || [];
			hash[gn].push(stone);
		});
		return Object.keys(hash).map((key: string) =>
			({group: hash[key][0].groupnr, stones: hash[key]}));
	}
}
