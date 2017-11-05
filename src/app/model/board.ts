import {Builder} from './builder';
import {Layout, Mapping} from './layouts';
import {safeGetStone, Stone} from './stone';

interface StoneGroup {
	group: number;
	stones: Array<Stone>;
}

interface Hints {
	groups: Array<StoneGroup>;
	current: StoneGroup;
}

export class Board {
	public builder: Builder = new Builder();
	public free: Array<Stone> = [];
	public stones: Array<Stone> = [];
	public count = 0;
	public hints: Hints = {groups: [], current: null};
	public selected: Stone = null;

	constructor() {
	}

	public clearSelection() {
		if (this.selected) {
			this.selected.selected = false;
		}
		this.selected = null;
	}

	public setStoneSelected(stone: Stone) {
		this.clearSelection();
		if (stone) {
			stone.selected = true;
			this.selected = stone;
		}
	}

	public clearHints() {
		if (this.hints.current) {
			this.hints.current.stones.forEach((stone: Stone) => {
				stone.hinted = false;
			});
		}
		this.hints = {
			groups: [],
			current: null
		};
	}

	public hint() {
		if (this.hints.current) {
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
					this.hints.current.stones.forEach((stone) => {
						stone.hinted = true;
					});
					return;
				}
			}
		}
		this.clearHints();
		if (this.free.length === 0) {
			return;
		}
		const hash: { [index: string]: Array<Stone> } = {};
		this.free.forEach((stone: Stone) => {
			const gn = stone.groupnr.toString();
			hash[gn] = hash[gn] || [];
			hash[gn].push(stone);
		});
		const groups: Array<StoneGroup> = Object.keys(hash).map((key: string) => {
			return {group: hash[key][0].groupnr, stones: hash[key]};
		});
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
			groups: groups,
			current: groups[0]
		};
		this.hints.current.stones.forEach((stone: Stone) => {
			stone.hinted = true;
		});
	}

	public reset() {
		this.clearSelection();
		this.clearHints();
		this.free = [];
		this.count = 0;
		this.stones = [];
	}

	public update() {
		const canRemove = (stone: Stone): boolean => {
			return stone.group.filter((_stone: Stone) => {
				return !_stone.picked && !_stone.isBlocked();
			}).length > 0;
		};

		const free: Array<Stone> = [];
		let count = 0;
		this.stones.forEach((stone: Stone) => {
			stone.state = {
				blocked: !stone.picked && stone.isBlocked(),
				removable: false
			};
			count += stone.picked ? 0 : 1;
		});
		this.stones.forEach((stone) => {
			stone.state.removable = !stone.picked && !stone.state.blocked && canRemove(stone);
			if (stone.state.removable) {
				free.push(stone);
			}
		});
		this.free = free;
		this.count = count;
	}

	public load(mapping: Mapping, undos: Array<Array<number>>) {
		if (!mapping) {
			return;
		}
		const layout = new Layout();
		layout.mapping = mapping;
		const stones = this.builder.build('load', layout);
		undos.forEach((undo: Array<number>) => {
			const stone: Stone = safeGetStone(stones, undo[0], undo[1], undo[2]);
			if (stone) {
				stone.picked = true;
			}
		});
		this.stones = stones;
	}

	public save(): Array<Array<number>> {
		return this.stones.map((stone: Stone) => {
			return [stone.z, stone.x, stone.y, stone.v];
		});
	}

	public applyLayout(layout: Layout, mode: string) {
		this.stones = this.builder.build(mode, layout);
	}
}
