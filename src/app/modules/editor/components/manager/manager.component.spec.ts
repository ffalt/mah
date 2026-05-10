import { NO_ERRORS_SCHEMA } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { LayoutService } from '../../../../service/layout.service';
import { WorkerService } from '../../../../service/worker.service';
import { ManagerComponent } from './manager.component';
import type { Layout } from '../../../../model/types';

const makeLayout = (name: string, overrides: Partial<Layout> = {}): Layout => ({
	id: name,
	name,
	by: 'Author',
	category: 'Cat',
	mapping: [[0, 1, 1]],
	...overrides
});

describe('ManagerComponent', () => {
	let component: ManagerComponent;
	let fixture: ComponentFixture<ManagerComponent>;
	let mockLayoutService: {
		layouts: { items: Array<Layout> };
		removeCustomLayout: jest.Mock;
		removeAllCustomLayouts: jest.Mock;
	};
	let mockWorkerService: { solve: jest.Mock };

	beforeEach(async () => {
		mockLayoutService = {
			layouts: { items: [] },
			removeCustomLayout: jest.fn(),
			removeAllCustomLayouts: jest.fn()
		};
		mockWorkerService = { solve: jest.fn() };

		await TestBed.configureTestingModule({
			imports: [ManagerComponent, TranslateModule.forRoot()],
			providers: [
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
			component.editEvent.subscribe((value: Layout) => emitted.push(value));
			component.editLayout(layout);
			expect(emitted).toHaveLength(1);
			expect(emitted[0]).toBe(layout);
		});
	});

	describe('toggleBuildIn', () => {
		it('should toggle showBuildIn flag', () => {
			expect(component.showBuildIn).toBe(true);
			component.toggleBuildIn();
			expect(component.showBuildIn).toBe(false);
			component.toggleBuildIn();
			expect(component.showBuildIn).toBe(true);
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
			component.sortDesc = true;
			component.sortBy(1);
			expect(component.layouts[0].name).toBe('Alpha');
			expect(component.layouts[2].name).toBe('Zebra');
		});

		it('should sort by name with sortDesc false (Z first)', () => {
			component.sortDesc = false;
			component.sortBy(1);
			expect(component.layouts[0].name).toBe('Zebra');
		});

		it('should sort by author (column 2) with sortDesc true', () => {
			component.sortDesc = true;
			component.sortBy(2);
			expect(component.layouts[0].by).toBe('Adam');
		});

		it('should sort by category (column 3) with sortDesc true', () => {
			component.sortDesc = true;
			component.sortBy(3);
			expect(component.layouts[0].category).toBe('A');
		});

		it('should sort by tile count (column 4) with sortDesc true', () => {
			component.sortDesc = true;
			component.sortBy(4);
			expect(component.layouts[0].mapping).toHaveLength(1);
			expect(component.layouts[2].mapping).toHaveLength(3);
		});
	});

	describe('clickSortBy', () => {
		beforeEach(() => {
			const layouts: Array<Layout> = [makeLayout('Alpha'), makeLayout('Beta')];
			fixture.componentRef.setInput('inputLayouts', layouts);
			fixture.detectChanges();
		});

		it('should toggle sortDesc when clicking the same column', () => {
			component.sortColumn = 1;
			component.sortDesc = true;
			const event = { stopPropagation: jest.fn() } as unknown as MouseEvent;
			component.clickSortBy(event, 1);
			expect(component.sortDesc).toBe(false);
		});

		it('should not toggle sortDesc when clicking a different column', () => {
			component.sortColumn = 1;
			component.sortDesc = true;
			const event = { stopPropagation: jest.fn() } as unknown as MouseEvent;
			component.clickSortBy(event, 2);
			expect(component.sortDesc).toBe(true);
		});
	});

	describe('update', () => {
		it('should populate layouts from inputLayouts input', () => {
			const layouts: Array<Layout> = [makeLayout('BoardA'), makeLayout('BoardB')];
			fixture.componentRef.setInput('inputLayouts', layouts);
			fixture.detectChanges();
			expect(component.layouts).toHaveLength(2);
		});

		it('should filter out built-in layouts when showBuildIn is false', () => {
			const layouts: Array<Layout> = [
				makeLayout('Custom', { custom: true }),
				makeLayout('BuiltIn', { custom: false })
			];
			fixture.componentRef.setInput('inputLayouts', layouts);
			component.showBuildIn = false;
			component.update();
			expect(component.layouts).toHaveLength(1);
			expect(component.layouts[0].custom).toBe(true);
		});
	});

	describe('removeCustomBoard', () => {
		it('should call layoutService.removeCustomLayout and stop propagation', () => {
			const layout = makeLayout('Custom', { custom: true });
			const event = { stopPropagation: jest.fn() } as unknown as MouseEvent;
			component.removeCustomBoard(event, layout);
			expect(mockLayoutService.removeCustomLayout).toHaveBeenCalledWith([layout.id]);
			expect((event.stopPropagation as jest.Mock)).toHaveBeenCalled();
		});
	});

	describe('removeCustomLayouts', () => {
		it('should call layoutService.removeAllCustomLayouts and stop propagation', () => {
			const event = { stopPropagation: jest.fn() } as unknown as MouseEvent;
			component.removeCustomLayouts(event);
			expect(mockLayoutService.removeAllCustomLayouts).toHaveBeenCalled();
			expect((event.stopPropagation as jest.Mock)).toHaveBeenCalled();
		});
	});

	describe('ngOnDestroy', () => {
		it('should terminate and clear worker on destroy', () => {
			const mockWorker = { terminate: jest.fn() } as unknown as Worker;
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
