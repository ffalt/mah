import { NO_ERRORS_SCHEMA } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { BoardComponent } from './board.component';
import { Matrix } from '../../model/matrix';
import { Stone } from '../../../../model/stone';
import type { Draw } from '../../../../model/draw';
import { Mock } from 'vitest';

describe('BoardComponent', () => {
	let component: BoardComponent;
	let fixture: ComponentFixture<BoardComponent>;
	let matrix: Matrix;

	beforeEach(async () => {
		matrix = new Matrix();
		matrix.init(10, 10, 3);
		await TestBed.configureTestingModule({
			imports: [BoardComponent],
			schemas: [NO_ERRORS_SCHEMA]
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(BoardComponent);
		fixture.componentRef.setInput('matrix', matrix);
		fixture.detectChanges();
		component = fixture.componentInstance;
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('gridID', () => {
		it('should return correct string for a draw item', () => {
			const draw = { z: 1, x: 2, y: 3 } as Draw;
			expect(component.gridID(draw)).toBe('1-2-3');
		});

		it('should return zero-based string for origin', () => {
			const draw = { z: 0, x: 0, y: 0 } as Draw;
			expect(component.gridID(draw)).toBe('0-0-0');
		});
	});

	describe('drawClass', () => {
		it('should return empty string for in-bounds empty cell', () => {
			const result = component.drawClass(0, 1, 1);
			expect(result).toBe('');
		});

		it('should return "invalid" when inBounds returns false', () => {
			const safeMockMatrix: Matrix = {
				...matrix,
				inBounds: (_z: number, _x: number, _y: number) => false,
				isTile: (_z: number, _x: number, _y: number) => false,
				isTilePosBlocked: (_z: number, _x: number, _y: number) => false,
				isTilePosInvalid: (_z: number, _x: number, _y: number) => false
			} as unknown as Matrix;
			fixture.componentRef.setInput('matrix', safeMockMatrix);
			fixture.detectChanges();
			const result = component.drawClass(0, 0, 0);
			expect(result).toBe('invalid');
		});

		it('should return "tile" when matrix has a tile', () => {
			matrix.setValue(0, 1, 1, 1);
			const result = component.drawClass(0, 1, 1);
			expect(result).toBe('tile');
		});

		it('should include "below" when lower layer has a tile', () => {
			matrix.setValue(0, 2, 2, 1);
			const result = component.drawClass(1, 2, 2);
			expect(result).toContain('below');
		});
	});

	describe('onClickStone', () => {
		it('should emit stone source when draw is provided', () => {
			const stone = new Stone(0, 1, 2, 3, 0);
			const draw = { source: stone } as Draw;
			const emitted: Array<Stone | undefined> = [];
			component.clickStoneEvent.subscribe((value: Stone | undefined) => {
				emitted.push(value);
			});
			const event = { stopPropagation: vi.fn() } as unknown as MouseEvent;
			component.onClickStone(event, draw);
			expect(emitted).toHaveLength(1);
			expect(emitted[0]).toBe(stone);
			expect((event.stopPropagation as Mock)).toHaveBeenCalled();
		});

		it('should emit undefined when no draw is provided', () => {
			const emitted: Array<Stone | undefined> = [];
			component.clickStoneEvent.subscribe((value: Stone | undefined) => {
				emitted.push(value);
			});
			const event = { stopPropagation: vi.fn() } as unknown as MouseEvent;
			component.onClickStone(event);
			expect(emitted).toHaveLength(1);
			expect(emitted[0]).toBeUndefined();
		});
	});

	describe('onClickBoard', () => {
		it('should emit clickBoardEvent', () => {
			const listener = vi.fn();
			component.clickBoardEvent.subscribe(listener);
			const event = {} as MouseEvent;
			component.onClickBoard(event);
			expect(listener).toHaveBeenCalledTimes(1);
		});
	});

	describe('onClickDraw', () => {
		it('should emit draw and stop propagation', () => {
			const draw = { z: 0, x: 1, y: 1 } as Draw;
			const emitted: Array<Draw> = [];
			component.clickDrawEvent.subscribe((value: Draw) => {
				emitted.push(value);
			});
			const event = { stopPropagation: vi.fn() } as unknown as MouseEvent;
			component.onClickDraw(event, draw);
			expect(emitted).toHaveLength(1);
			expect(emitted[0]).toBe(draw);
			expect((event.stopPropagation as Mock)).toHaveBeenCalled();
		});
	});

	describe('ngOnInit', () => {
		it('should update drawCells when level is set', async () => {
			const level = { z: 0, rows: [[1, 0], [0, 1]] };
			fixture.componentRef.setInput('level', level);
			fixture.detectChanges();
			await fixture.whenStable();
			expect(component.drawCells.length).toBeGreaterThan(0);
		});

		it('should not populate drawCells when no level is set', () => {
			expect(component.drawCells).toHaveLength(0);
		});
	});

	describe('ngOnChanges', () => {
		it('should update drawCells when level changes', () => {
			const level = { z: 0, rows: [[1, 0], [0, 0]] };
			fixture.componentRef.setInput('level', level);
			fixture.detectChanges();
			expect(component.drawCells.length).toBeGreaterThan(0);
		});

		it('should clear drawCells when level has empty rows', () => {
			fixture.componentRef.setInput('level', { z: 0, rows: [] });
			fixture.detectChanges();
			expect(component.drawCells).toHaveLength(0);
		});

		it('should populate drawStones only for cells with v > 0', () => {
			const level = { z: 0, rows: [[1, 0], [0, 2]] };
			fixture.componentRef.setInput('level', level);
			fixture.detectChanges();
			expect(component.drawStones).toHaveLength(2);
		});
	});
});
