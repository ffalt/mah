import { NO_ERRORS_SCHEMA } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { LayoutService } from '../../../../service/layout.service';
import { WorkerService } from '../../../../service/worker.service';
import { ManagerComponent } from './manager.component';
import type { Layout } from '../../../../model/types';
import { type Mock, describe, beforeEach, it, expect, vi } from 'vitest';

const makeLayout = (name: string, overrides: Partial<Layout> = {}): Layout => ({
	id: name,
	name,
	by: 'Author',
	category: 'Cat',
	mapping: [[0, 1, 1]],
	custom: true,
	...overrides
});

describe('ManagerComponent', () => {
	let component: ManagerComponent;
	let fixture: ComponentFixture<ManagerComponent>;
	let mockLayoutService: {
		layouts: { items: Array<Layout> };
		getPreview: Mock;
		removeCustomLayout: Mock;
		removeAllCustomLayouts: Mock;
	};
	let mockWorkerService: { solve: Mock };

	beforeEach(async () => {
		mockLayoutService = {
			layouts: { items: [] },
			getPreview: vi.fn(),
			removeCustomLayout: vi.fn(),
			removeAllCustomLayouts: vi.fn()
		};
		mockWorkerService = { solve: vi.fn() };

		await TestBed.configureTestingModule({
			imports: [ManagerComponent],
			providers: [
				provideTranslateService(),
				{ provide: LayoutService, useValue: mockLayoutService },
				{ provide: WorkerService, useValue: mockWorkerService }
			],
			schemas: [NO_ERRORS_SCHEMA]
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(ManagerComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('editLayout', () => {
		it('should emit the layout via editEvent', () => {
			const layout = makeLayout('Alpha');
			const emitted: Array<Layout> = [];
			component.editEvent.subscribe((value: Layout) => {
				emitted.push(value);
			});
			component.editLayout(layout);
			expect(emitted).toHaveLength(1);
			expect(emitted[0]).toBe(layout);
		});
	});

	describe('toggleBuiltIn', () => {
		it('should toggle showBuiltIn flag', () => {
			expect(component.showBuiltIn()).toBe(false);
			component.toggleBuiltIn();
			expect(component.showBuiltIn()).toBe(true);
			component.toggleBuiltIn();
			expect(component.showBuiltIn()).toBe(false);
		});
	});

	describe('sortBy', () => {
		beforeEach(() => {
			const layouts: Array<Layout> = [
				makeLayout('Zebra', { by: 'Zoe', category: 'Z', mapping: [[0, 1, 1], [0, 2, 2]] }),
				makeLayout('Alpha', { by: 'Adam', category: 'A', mapping: [[0, 1, 1]] }),
				makeLayout('Mango', { by: 'Mike', category: 'M', mapping: [[0, 1, 1], [0, 2, 2], [0, 3, 3]] })
			];
			fixture.componentRef.setInput('inputLayouts', layouts);
			fixture.detectChanges();
		});

		it('should sort by name with sortDesc true (A first)', () => {
			component.sortDesc.set(true);
			component.sortBy(1);
			expect(component.layouts()[0].name).toBe('Alpha');
			expect(component.layouts()[2].name).toBe('Zebra');
		});

		it('should sort by name with sortDesc false (Z first)', () => {
			component.sortDesc.set(false);
			component.sortBy(1);
			expect(component.layouts()[0].name).toBe('Zebra');
		});

		it('should sort by author (column 2) with sortDesc true', () => {
			component.sortDesc.set(true);
			component.sortBy(2);
			expect(component.layouts()[0].by).toBe('Adam');
		});

		it('should sort by category (column 3) with sortDesc true', () => {
			component.sortDesc.set(true);
			component.sortBy(3);
			expect(component.layouts()[0].category).toBe('A');
		});

		it('should sort by tile count (column 4) with sortDesc true', () => {
			component.sortDesc.set(true);
			component.sortBy(4);
			expect(component.layouts()[0].mapping).toHaveLength(1);
			expect(component.layouts()[2].mapping).toHaveLength(3);
		});
	});

	describe('clickSortBy', () => {
		beforeEach(() => {
			const layouts: Array<Layout> = [makeLayout('Alpha'), makeLayout('Beta')];
			fixture.componentRef.setInput('inputLayouts', layouts);
			fixture.detectChanges();
		});

		it('should toggle sortDesc when clicking the same column', () => {
			component.sortColumn.set(1);
			component.sortDesc.set(true);
			const event = { stopPropagation: vi.fn() } as unknown as MouseEvent;
			component.clickSortBy(event, 1);
			expect(component.sortDesc()).toBe(false);
		});

		it('should not toggle sortDesc when clicking a different column', () => {
			component.sortColumn.set(1);
			component.sortDesc.set(true);
			const event = { stopPropagation: vi.fn() } as unknown as MouseEvent;
			component.clickSortBy(event, 2);
			expect(component.sortDesc()).toBe(true);
		});
	});

	describe('update', () => {
		it('should populate layouts from inputLayouts input', () => {
			const layouts: Array<Layout> = [makeLayout('BoardA'), makeLayout('BoardB')];
			fixture.componentRef.setInput('inputLayouts', layouts);
			fixture.detectChanges();
			expect(component.layouts()).toHaveLength(2);
		});

		it('should filter out built-in layouts when showBuiltIn is false', () => {
			const layouts: Array<Layout> = [
				makeLayout('Custom', { custom: true }),
				makeLayout('BuiltIn', { custom: false })
			];
			fixture.componentRef.setInput('inputLayouts', layouts);
			component.showBuiltIn.set(false);
			component.update();
			expect(component.layouts()).toHaveLength(1);
			expect(component.layouts()[0].custom).toBe(true);
		});
	});

	describe('removeCustomBoard', () => {
		it('should call layoutService.removeCustomLayout and stop propagation when confirmed', () => {
			vi.spyOn(window, 'confirm').mockReturnValue(true);
			const layout = makeLayout('Custom', { custom: true });
			const event = { stopPropagation: vi.fn() } as unknown as MouseEvent;
			component.removeCustomBoard(event, layout);
			expect(mockLayoutService.removeCustomLayout).toHaveBeenCalledWith([layout.id]);
			expect((event.stopPropagation as Mock)).toHaveBeenCalled();
		});

		it('should not remove anything when the confirmation is declined', () => {
			vi.spyOn(window, 'confirm').mockReturnValue(false);
			const layout = makeLayout('Custom', { custom: true });
			const event = { stopPropagation: vi.fn() } as unknown as MouseEvent;
			component.removeCustomBoard(event, layout);
			expect(mockLayoutService.removeCustomLayout).not.toHaveBeenCalled();
		});
	});

	describe('removeCustomLayouts', () => {
		it('should call layoutService.removeAllCustomLayouts and stop propagation when confirmed', () => {
			vi.spyOn(window, 'confirm').mockReturnValue(true);
			const event = { stopPropagation: vi.fn() } as unknown as MouseEvent;
			component.removeCustomLayouts(event);
			expect(mockLayoutService.removeAllCustomLayouts).toHaveBeenCalled();
			expect((event.stopPropagation as Mock)).toHaveBeenCalled();
		});

		it('should not remove anything when the confirmation is declined', () => {
			vi.spyOn(window, 'confirm').mockReturnValue(false);
			const event = { stopPropagation: vi.fn() } as unknown as MouseEvent;
			component.removeCustomLayouts(event);
			expect(mockLayoutService.removeAllCustomLayouts).not.toHaveBeenCalled();
		});
	});

	describe('startTestLayout', () => {
		// OnPush: the async worker callbacks must update the test signal so the view re-renders
		it('updates the test signal when the worker reports progress and finishes', () => {
			const layout = makeLayout('Solvable', { custom: true });
			let progressCallback: ((progress: [number, number]) => void) | undefined;
			let finishCallback: ((finish: [number, number]) => void) | undefined;
			mockWorkerService.solve.mockImplementation((_mapping, _max, progress, finish) => {
				progressCallback = progress;
				finishCallback = finish;
				return { terminate: vi.fn() } as unknown as Worker;
			});

			component.startTestLayout(layout);
			progressCallback?.([2, 1]);
			expect(component.test()[layout.id]).toEqual({ win: 2, fail: 1 });

			finishCallback?.([5, 0]);
			expect(component.test()[layout.id]).toEqual({ win: 5, fail: 0 });
			expect(component.worker).toBeUndefined();
		});
	});

	describe('testLayout() / testLayouts() switching targets', () => {
		const workersById = new Map<string, { terminate: Mock }>();

		beforeEach(() => {
			workersById.clear();
			mockWorkerService.solve.mockImplementation((mapping: Array<[number, number, number]>) => {
				const id = String(mapping[0]?.[2] ?? 'unknown');
				const worker = { terminate: vi.fn() };
				workersById.set(id, worker);
				return worker as unknown as Worker;
			});
		});

		it('switches to a different layout instead of just cancelling the running one', () => {
			const layoutA = makeLayout('a', { mapping: [[0, 0, 1]] });
			const layoutB = makeLayout('b', { mapping: [[0, 0, 2]] });

			component.testLayout(new MouseEvent('click'), layoutA);
			expect(component.worker).toBe(workersById.get('1'));

			component.testLayout(new MouseEvent('click'), layoutB);

			expect(workersById.get('1')?.terminate).toHaveBeenCalled();
			expect(component.worker).toBe(workersById.get('2'));
		});

		it('cancels a running single test and starts the batch when Test All is clicked', () => {
			const layoutA = makeLayout('a', { mapping: [[0, 0, 1]] });
			mockLayoutService.layouts.items = [layoutA];
			fixture.componentRef.setInput('inputLayouts', [layoutA]);
			component.ngOnChanges({ inputLayouts: {} } as never);

			component.testLayout(new MouseEvent('click'), layoutA);
			const singleWorker = workersById.get('1');

			component.testLayouts(new MouseEvent('click'));

			expect(singleWorker?.terminate).toHaveBeenCalled();
			expect(component.worker).toBe(workersById.get('1'));
		});
	});

	describe('batch test with a synchronous finish', () => {
		it('should keep the worker started by the chained layout', () => {
			const liveWorker = { terminate: vi.fn() } as unknown as Worker;
			mockLayoutService.layouts.items = [makeLayout('a'), makeLayout('b')];
			component.ngOnChanges({ inputLayouts: {} } as never);
			fixture.componentRef.setInput('inputLayouts', mockLayoutService.layouts.items);
			component.ngOnChanges({ inputLayouts: {} } as never);

			let call = 0;
			mockWorkerService.solve.mockImplementation((
				_mapping: unknown, _rounds: number, _progress: unknown, finish: (result: Array<number>) => void
			) => {
				call++;
				if (call === 1) {
					finish([0, 10]);
					return undefined;
				}
				return liveWorker;
			});

			component.testLayouts(new MouseEvent('click'));

			expect(call).toBe(2);
			expect(component.worker).toBe(liveWorker);
		});

		it('should leave no worker behind when every layout finishes synchronously', () => {
			mockLayoutService.layouts.items = [makeLayout('a'), makeLayout('b')];
			fixture.componentRef.setInput('inputLayouts', mockLayoutService.layouts.items);
			component.ngOnChanges({ inputLayouts: {} } as never);

			mockWorkerService.solve.mockImplementation((
				_mapping: unknown, _rounds: number, _progress: unknown, finish: (result: Array<number>) => void
			) => {
				finish([0, 10]);
				return undefined;
			});

			component.testLayouts(new MouseEvent('click'));

			expect(component.worker).toBeUndefined();
			expect(component.test().a).toEqual({ win: 0, fail: 10 });
			expect(component.test().b).toEqual({ win: 0, fail: 10 });
		});
	});

	describe('ngOnDestroy', () => {
		it('should terminate and clear worker on destroy', () => {
			const mockWorker = { terminate: vi.fn() } as unknown as Worker;
			component.worker = mockWorker;
			component.ngOnDestroy();
			expect(mockWorker.terminate).toHaveBeenCalled();
			expect(component.worker).toBeUndefined();
		});

		it('should not throw when worker is undefined', () => {
			component.worker = undefined;
			expect(() => {
				component.ngOnDestroy();
			}).not.toThrow();
		});
	});
});
