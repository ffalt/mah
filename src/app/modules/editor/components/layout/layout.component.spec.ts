import { NO_ERRORS_SCHEMA } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { LayoutComponent } from './layout.component';
import { WorkerService } from '../../../../service/worker.service';
import { LayoutService } from '../../../../service/layout.service';
import type { EditLayout } from '../../model/edit-layout';
import type { Cell } from '../../model/cell';
import type { Stone } from '../../../../model/stone';

const mockWorkerService = {
	solve: jest.fn().mockReturnValue(undefined)
};

const mockLayoutService = {
	generatePreview: jest.fn().mockReturnValue('svg:preview'),
	storeCustomBoards: jest.fn(),
	layouts: { items: [] }
};

const makeEditLayout = (): EditLayout => ({
	id: '',
	name: 'Test',
	by: '',
	category: 'Custom',
	mapping: [[0, 0, 0], [0, 2, 0], [0, 4, 0], [0, 6, 0]] as Array<[number, number, number]>
});

describe('LayoutComponent', () => {
	let component: LayoutComponent;
	let fixture: ComponentFixture<LayoutComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [LayoutComponent, TranslateModule.forRoot()],
			providers: [
				{ provide: WorkerService, useValue: mockWorkerService },
				{ provide: LayoutService, useValue: mockLayoutService }
			],
			schemas: [NO_ERRORS_SCHEMA]
		}).compileComponents();

		fixture = TestBed.createComponent(LayoutComponent);
	});

	const init = (layout: EditLayout = makeEditLayout()): void => {
		fixture.componentRef.setInput('layout', layout);
		component = fixture.componentInstance;
		fixture.detectChanges();
	};

	it('should create', () => {
		init();
		expect(component).toBeTruthy();
	});

	describe('refresh()', () => {
		it('updates stats after refresh', () => {
			init();
			expect(component.stats).toBeDefined();
			expect(component.stats.totalCount).toBe(4);
		});

		it('sets svg preview via layoutService', () => {
			init();
			expect(mockLayoutService.generatePreview).toHaveBeenCalled();
			expect(component.svg).toBe('svg:preview');
		});

		it('sets hasChanged to true', () => {
			init();
			expect(component.hasChanged).toBe(false);
			component.refresh();
			expect(component.hasChanged).toBe(true);
		});
	});

	describe('addStone()', () => {
		it('adds a stone to the mapping', () => {
			const layout = makeEditLayout();
			init(layout);
			const before = layout.mapping.length;
			component.addStone(0, 10, 10);
			expect(layout.mapping).toHaveLength(before + 1);
		});
	});

	describe('removeStone()', () => {
		it('removes a stone from the mapping', () => {
			const layout = makeEditLayout();
			init(layout);
			component.removeStone(0, 0, 0);
			const found = layout.mapping.some(m => m[0] === 0 && m[1] === 0 && m[2] === 0);
			expect(found).toBe(false);
		});
	});

	describe('mirrorXValue()', () => {
		it('returns totalX - 2 - x', () => {
			init();
			expect(component.mirrorXValue(0)).toBe(component.totalX - 2);
			expect(component.mirrorXValue(5)).toBe(component.totalX - 7);
		});
	});

	describe('mirrorYValue()', () => {
		it('returns totalY - 2 - y', () => {
			init();
			expect(component.mirrorYValue(0)).toBe(component.totalY - 2);
			expect(component.mirrorYValue(3)).toBe(component.totalY - 5);
		});
	});

	describe('selectLevel()', () => {
		it('sets currentZ and level', () => {
			init();
			component.selectLevel(0);
			expect(component.currentZ).toBe(0);
			expect(component.level).toBeDefined();
			expect(component.level.z).toBe(0);
		});
	});

	describe('toggleSave()', () => {
		it('toggles saveDialog from false to true', () => {
			init();
			expect(component.saveDialog).toBe(false);
			component.toggleSave();
			expect(component.saveDialog).toBe(true);
		});

		it('toggles saveDialog from true to false', () => {
			init();
			component.saveDialog = true;
			component.toggleSave();
			expect(component.saveDialog).toBe(false);
		});
	});

	describe('toggleAfterSave()', () => {
		it('sets saveDialog to false and hasChanged to false', () => {
			init();
			component.saveDialog = true;
			component.hasChanged = true;
			component.toggleAfterSave();
			expect(component.saveDialog).toBe(false);
			expect(component.hasChanged).toBe(false);
		});
	});

	describe('cancelSolve()', () => {
		it('terminates solveWorker if present', () => {
			init();
			const fakeWorker = { terminate: jest.fn() } as unknown as Worker;
			component.solveWorker = fakeWorker;
			component.cancelSolve();
			expect(fakeWorker.terminate).toHaveBeenCalled();
			expect(component.solveWorker).toBeUndefined();
		});

		it('does nothing when solveWorker is absent', () => {
			init();
			component.solveWorker = undefined;
			expect(() => component.cancelSolve()).not.toThrow();
		});
	});

	describe('solve()', () => {
		it('calls workerService.solve with mapping and emits solveStats', () => {
			init();
			component.solve();
			expect(mockWorkerService.solve).toHaveBeenCalledWith(
				component.layout().mapping,
				1000,
				expect.any(Function),
				expect.any(Function)
			);
			expect(component.solveStats).toBeDefined();
		});

		it('does nothing if solveWorker already exists', () => {
			init();
			const fakeWorker = { terminate: jest.fn() } as unknown as Worker;
			component.solveWorker = fakeWorker;
			component.solve();
			expect(mockWorkerService.solve).not.toHaveBeenCalled();
		});
	});

	describe('moveX()', () => {
		it('moves all tiles along x axis by delta', () => {
			const layout = makeEditLayout();
			init(layout);
			const before = layout.mapping[0][1];
			component.moveX(2);
			expect(layout.mapping[0][1]).toBe(before + 2);
		});

		it('does not move when out of bounds', () => {
			const layout: EditLayout = {
				id: '',
				name: 'Test',
				by: '',
				category: 'Custom',
				mapping: [[0, 36, 0]] as Array<[number, number, number]>
			};
			init(layout);
			const before = layout.mapping[0][1];
			component.moveX(2);
			expect(layout.mapping[0][1]).toBe(before);
		});
	});

	describe('moveY()', () => {
		it('moves all tiles along y axis by delta', () => {
			const layout: EditLayout = {
				id: '',
				name: 'Test',
				by: '',
				category: 'Custom',
				mapping: [[0, 0, 4], [0, 2, 4]] as Array<[number, number, number]>
			};
			init(layout);
			const before = layout.mapping[0][2];
			component.moveY(2);
			expect(layout.mapping[0][2]).toBe(before + 2);
		});
	});

	describe('moveLayer()', () => {
		it('moves tiles in current layer along x axis', () => {
			const layout: EditLayout = {
				id: '',
				name: 'Test',
				by: '',
				category: 'Custom',
				mapping: [[0, 5, 5], [0, 7, 5], [1, 5, 5]] as Array<[number, number, number]>
			};
			init(layout);
			component.currentZ = 0;
			component.moveLayer(true, 2);
			expect(layout.mapping[0][1]).toBe(7);
			expect(layout.mapping[1][1]).toBe(9);
			expect(layout.mapping[2][1]).toBe(5);
		});

		it('moves tiles in current layer along y axis', () => {
			const layout: EditLayout = {
				id: '',
				name: 'Test',
				by: '',
				category: 'Custom',
				mapping: [[0, 5, 5], [1, 5, 5]] as Array<[number, number, number]>
			};
			init(layout);
			component.currentZ = 0;
			component.moveLayer(false, 2);
			expect(layout.mapping[0][2]).toBe(7);
			expect(layout.mapping[1][2]).toBe(5);
		});
	});

	describe('moveLayerX()', () => {
		it('delegates to moveLayer with xAxis=true', () => {
			init();
			const moveLayerSpy = jest.spyOn(component, 'moveLayer');
			component.moveLayerX(1);
			expect(moveLayerSpy).toHaveBeenCalledWith(true, 1);
		});
	});

	describe('moveLayerY()', () => {
		it('delegates to moveLayer with xAxis=false', () => {
			init();
			const moveLayerSpy = jest.spyOn(component, 'moveLayer');
			component.moveLayerY(1);
			expect(moveLayerSpy).toHaveBeenCalledWith(false, 1);
		});
	});

	describe('toggleMirrorX()', () => {
		it('toggles mirrorX', () => {
			init();
			expect(component.mirrorX).toBe(false);
			component.toggleMirrorX();
			expect(component.mirrorX).toBe(true);
			component.toggleMirrorX();
			expect(component.mirrorX).toBe(false);
		});
	});

	describe('toggleMirrorY()', () => {
		it('toggles mirrorY', () => {
			init();
			expect(component.mirrorY).toBe(false);
			component.toggleMirrorY();
			expect(component.mirrorY).toBe(true);
			component.toggleMirrorY();
			expect(component.mirrorY).toBe(false);
		});
	});

	describe('duplicateLayerZ()', () => {
		it('duplicates a layer by inserting a copy above it', () => {
			const layout: EditLayout = {
				id: '',
				name: 'Test',
				by: '',
				category: 'Custom',
				mapping: [[0, 2, 2], [0, 4, 2], [1, 2, 4]] as Array<[number, number, number]>
			};
			init(layout);
			const before = layout.mapping.length;
			component.duplicateLayerZ(0);
			expect(layout.mapping.length).toBeGreaterThan(before);
			const layer1Tiles = layout.mapping.filter(m => m[0] === 1);
			expect(layer1Tiles.length).toBeGreaterThan(0);
		});
	});

	describe('clearLayerZ()', () => {
		it('removes all tiles from the specified layer', () => {
			const layout: EditLayout = {
				id: '',
				name: 'Test',
				by: '',
				category: 'Custom',
				mapping: [[0, 2, 2], [0, 4, 2], [1, 2, 4]] as Array<[number, number, number]>
			};
			init(layout);
			component.clearLayerZ(0);
			const layer0Tiles = layout.mapping.filter(m => m[0] === 0);
			expect(layer0Tiles).toHaveLength(0);
		});

		it('keeps tiles in other layers', () => {
			const layout: EditLayout = {
				id: '',
				name: 'Test',
				by: '',
				category: 'Custom',
				mapping: [[0, 2, 2], [1, 4, 2]] as Array<[number, number, number]>
			};
			init(layout);
			component.clearLayerZ(0);
			const layer1Tiles = layout.mapping.filter(m => m[0] === 1);
			expect(layer1Tiles).toHaveLength(1);
		});
	});

	describe('deleteLayerZ()', () => {
		it('removes the layer and renumbers higher layers', () => {
			const layout: EditLayout = {
				id: '',
				name: 'Test',
				by: '',
				category: 'Custom',
				mapping: [[0, 2, 2], [1, 4, 2], [2, 6, 2]] as Array<[number, number, number]>
			};
			init(layout);
			component.deleteLayerZ(0);
			const layer0Tiles = layout.mapping.filter(m => m[0] === 0);
			expect(layer0Tiles.length).toBeGreaterThan(0);
			const originalLayer0 = layout.mapping.find(m => m[1] === 2 && m[2] === 2);
			expect(originalLayer0).toBeUndefined();
		});

		it('decreases totalZ but not below 1', () => {
			const layout: EditLayout = {
				id: '',
				name: 'Test',
				by: '',
				category: 'Custom',
				mapping: [[0, 2, 2]] as Array<[number, number, number]>
			};
			init(layout);
			const before = component.totalZ;
			component.deleteLayerZ(0);
			expect(component.totalZ).toBe(Math.max(before - 1, 1));
		});
	});

	describe('newLayerBelow()', () => {
		it('increases totalZ', () => {
			init();
			const before = component.totalZ;
			component.newLayerBelow(0);
			expect(component.totalZ).toBe(before + 1);
		});

		it('shifts tiles above the layer up by 1', () => {
			const layout: EditLayout = {
				id: '',
				name: 'Test',
				by: '',
				category: 'Custom',
				mapping: [[0, 2, 2], [1, 4, 2]] as Array<[number, number, number]>
			};
			init(layout);
			component.newLayerBelow(0);
			const tile1 = layout.mapping.find(m => m[1] === 4 && m[2] === 2);
			expect(tile1?.[0]).toBe(2);
		});
	});

	describe('moveLayerZ()', () => {
		it('swaps tiles between two adjacent layers', () => {
			const layout: EditLayout = {
				id: '',
				name: 'Test',
				by: '',
				category: 'Custom',
				mapping: [[0, 2, 2], [1, 4, 2]] as Array<[number, number, number]>
			};
			init(layout);
			component.moveLayerZ(1, 0);
			const tile = layout.mapping.find(m => m[1] === 2 && m[2] === 2);
			expect(tile?.[0]).toBe(1);
		});

		it('does nothing when target layer is out of bounds', () => {
			const layout: EditLayout = {
				id: '',
				name: 'Test',
				by: '',
				category: 'Custom',
				mapping: [[0, 2, 2]] as Array<[number, number, number]>
			};
			init(layout);
			const before = JSON.stringify(layout.mapping);
			component.moveLayerZ(-1, 0);
			expect(JSON.stringify(layout.mapping)).toBe(before);
		});
	});

	describe('onPosClick()', () => {
		it('adds a stone when position is empty and valid', () => {
			const layout: EditLayout = {
				id: '',
				name: 'Test',
				by: '',
				category: 'Custom',
				mapping: [[0, 0, 0], [0, 2, 0], [0, 4, 0], [0, 6, 0]] as Array<[number, number, number]>
			};
			init(layout);
			const before = layout.mapping.length;
			component.onPosClick(0, 10, 10);
			expect(layout.mapping).toHaveLength(before + 1);
		});

		it('removes a stone when position is already occupied', () => {
			const layout: EditLayout = {
				id: '',
				name: 'Test',
				by: '',
				category: 'Custom',
				mapping: [[0, 0, 0], [0, 2, 0], [0, 4, 0], [0, 6, 0]] as Array<[number, number, number]>
			};
			init(layout);
			const before = layout.mapping.length;
			component.onPosClick(0, 0, 0);
			expect(layout.mapping).toHaveLength(before - 1);
		});
	});

	describe('onCellClick()', () => {
		it('delegates to onPosClick with cell coordinates', () => {
			init();
			const onPosClickSpy = jest.spyOn(component, 'onPosClick');
			const cell: Cell = { z: 0, x: 10, y: 10 };
			component.onCellClick(cell);
			expect(onPosClickSpy).toHaveBeenCalledWith(0, 10, 10);
		});
	});

	describe('onStoneClick()', () => {
		it('delegates to onPosClick when stone is provided', () => {
			init();
			const onPosClickSpy = jest.spyOn(component, 'onPosClick');
			const stone = { z: 0, x: 10, y: 10 } as unknown as Stone;
			component.onStoneClick(stone);
			expect(onPosClickSpy).toHaveBeenCalledWith(0, 10, 10);
		});

		it('does nothing when stone is undefined', () => {
			init();
			const onPosClickSpy = jest.spyOn(component, 'onPosClick');
			component.onStoneClick(undefined);
			expect(onPosClickSpy).not.toHaveBeenCalled();
		});
	});

	describe('mirror functionality', () => {
		it('adds mirrored tile on X axis when mirrorX is true', () => {
			const layout: EditLayout = {
				id: '',
				name: 'Test',
				by: '',
				category: 'Custom',
				mapping: [] as Array<[number, number, number]>
			};
			init(layout);
			component.mirrorX = true;
			const before = layout.mapping.length;
			component.onPosClick(0, 10, 10);
			expect(layout.mapping.length).toBeGreaterThan(before);
		});

		it('adds mirrored tile on Y axis when mirrorY is true', () => {
			const layout: EditLayout = {
				id: '',
				name: 'Test',
				by: '',
				category: 'Custom',
				mapping: [] as Array<[number, number, number]>
			};
			init(layout);
			component.mirrorY = true;
			const before = layout.mapping.length;
			component.onPosClick(0, 10, 10);
			expect(layout.mapping.length).toBeGreaterThan(before);
		});
	});
});
