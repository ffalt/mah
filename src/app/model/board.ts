import { signal } from '@angular/core';
import { type BUILD_MODE_ID, Builder, MODE_SOLVABLE } from './builder';
import { type Stone, safeGetStone } from './stone';
import type { Mapping, Place, StoneMapping, StonePlace } from './types';
import { StoneTiles, Tiles } from './tiles';
import { BuilderBase } from './builder/base';
import { log } from './log';

interface StoneGroup {
	group: number;
	stones: Array<Stone>;
}

interface Hints {
	groups: Array<StoneGroup>;
	current?: StoneGroup;
}

export class Board {
	readonly free = signal<Array<Stone>>([]);
	readonly stones = signal<Array<Stone>>([]);
	readonly count = signal(0);
	hints: Hints = { groups: [], current: undefined };
	selected?: Stone = undefined;
	readonly undo = signal<Array<Place>>([]);
	buildMode: BUILD_MODE_ID = MODE_SOLVABLE;

	clearSelection(): void {
		if (this.selected) {
			this.selected.selected.set(false);
		}
		this.selected = undefined;
	}

	setStoneSelected(stone?: Stone): void {
		this.clearSelection();
		if (stone) {
			stone.selected.set(true);
			this.selected = stone;
		}
	}

	clearHints(): void {
		if (this.hints.current) {
			for (const stone of this.hints.current.stones) {
				stone.hinted.set(false);
			}
		}
		this.hints = {
			groups: [],
			current: undefined
		};
	}

	highlightMatches(stone: Stone): void {
		for (const partner of this.free()) {
			if (partner !== stone && partner.groupNr === stone.groupNr) {
				partner.matched.set(true);
			}
		}
	}

	clearMatches(): void {
		for (const stone of this.stones()) {
			if (stone.matched()) {
				stone.matched.set(false);
			}
		}
	}

	hint(): void {
		if (this.hintNext()) {
			return;
		}
		this.clearHints();
		if (this.free().length === 0) {
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
			stone.hinted.set(true);
		}
	}

	reset(): void {
		this.clearSelection();
		this.clearHints();
		this.free.set([]);
		this.count.set(0);
		this.stones.set([]);
		this.undo.set([]);
	}

	canRemove(stone: Stone): boolean {
		return stone.group.some((groupStone: Stone) => !groupStone.picked() && !groupStone.isBlocked());
	}

	update(): void {
		const free: Array<Stone> = [];
		let count = 0;
		for (const stone of this.stones()) {
			const blocked = !stone.picked() && stone.isBlocked();
			const removable = !stone.picked() && !blocked && this.canRemove(stone);
			stone.state.set({ blocked, removable });
			if (removable) {
				free.push(stone);
			}
			count += stone.picked() ? 0 : 1;
		}
		this.free.set(free);
		this.count.set(count);
	}

	back(): boolean {
		const undo = this.undo();
		if (undo.length < 2) {
			return false;
		}
		const n1 = undo.at(-1);
		const n2 = undo.at(-2);
		if (!n1 || !n2) {
			return false;
		}
		this.clearSelection();
		this.clearHints();
		this.undo.set(undo.slice(0, -2));
		for (const stone of this.stones()) {
			if (
				((stone.z === n1[0]) && (stone.x === n1[1]) && (stone.y === n1[2])) ||
				((stone.z === n2[0]) && (stone.x === n2[1]) && (stone.y === n2[2]))
			) {
				stone.picked.set(false);
			}
		}
		this.update();
		return true;
	}

	shuffle(): boolean {
		this.clearSelection();
		this.clearHints();
		const currentStones = this.stones();
		const usedStones = currentStones.filter(s => s.picked());
		const unusedStones = currentStones.filter(s => !s.picked());
		const tiles = new StoneTiles(unusedStones);
		const mapping: Mapping = unusedStones.map(s => [s.z, s.x, s.y]);
		const builder: Builder = new Builder(tiles);
		const stones = builder.build(this.buildMode, mapping);
		if (!stones) {
			return false;
		}
		const newStones = [...stones, ...usedStones];
		BuilderBase.fillStones(newStones, new Tiles(currentStones.length));
		this.stones.set(newStones);
		this.update();
		return true;
	}

	load(mapping: StoneMapping, undos: Array<Place>): boolean {
		if (!mapping?.length) {
			log.warn('Board.load() failed: mapping is empty, null or undefined');
			return false;
		}
		const highestValue = Math.max(0, ...mapping.map(place => place[3]));
		const builder: Builder = new Builder(new Tiles(Math.max(mapping.length, highestValue)));
		const stones = builder.load(mapping);
		if (stones?.length !== mapping.length) {
			log.warn('Board.load() failed: stored stones could not be restored', { expected: mapping.length, restored: stones?.length ?? 0 });
			return false;
		}
		this.undo.set(undos);
		for (const undo of undos) {
			const stone: Stone | undefined = safeGetStone(stones, undo[0], undo[1], undo[2]);
			if (stone) {
				stone.picked.set(true);
			}
		}
		this.stones.set(stones);
		this.update();
		return true;
	}

	save(): Array<StonePlace> {
		return this.stones().map((stone: Stone) => [stone.z, stone.x, stone.y, stone.v]);
	}

	applyMapping(mapping: Mapping, mode: BUILD_MODE_ID): void {
		this.buildMode = mode;
		const builder: Builder = new Builder(new Tiles(mapping.length));
		this.stones.set(builder.build(mode, mapping) || []);
	}

	pick(sel: Stone, stone: Stone) {
		this.clearSelection();
		this.undo.update(list => [...list, [sel.z, sel.x, sel.y], [stone.z, stone.x, stone.y]]);
		this.clearHints();
		sel.picked.set(true);
		stone.picked.set(true);
		this.update();
	}

	countUnblocked(): number {
		return this.stones().filter(s => !s.picked() && !s.isBlocked()).length;
	}

	private hintNext(): boolean {
		if (!this.hints.current) {
			return false;
		}
		for (const stone of this.hints.current.stones) {
			stone.hinted.set(false);
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
					stone.hinted.set(true);
				}
				return true;
			}
		}
		return false;
	}

	private collectHints(): Array<StoneGroup> {
		const hash: { [index: string]: Array<Stone> } = {};
		for (const stone of this.free()) {
			const gn = stone.groupNr.toString();
			hash[gn] ||= [];
			hash[gn].push(stone);
		}
		return Object.keys(hash)
			.map((key: string) => {
				const stones = hash[key];
				const firstStone = stones[0];
				return {
					group: firstStone?.groupNr ?? 0,
					stones
				};
			})
			.filter((group: StoneGroup) => group.stones.length > 0);
	}
}
