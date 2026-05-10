import { NO_ERRORS_SCHEMA } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { LayoutService } from '../../../../service/layout.service';
import { EditorComponent } from './editor.component';
import type { Layout } from '../../../../model/types';

jest.mock('../../model/export', () => ({
	downloadMahLayouts: jest.fn()
}));

import { downloadMahLayouts } from '../../model/export';

const mockLayoutService = {
	layouts: { items: [] as Array<Layout> }
};

describe('EditorComponent', () => {
	let component: EditorComponent;
	let fixture: ComponentFixture<EditorComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [EditorComponent, TranslateModule.forRoot()],
			providers: [
				{ provide: LayoutService, useValue: mockLayoutService }
			],
			schemas: [NO_ERRORS_SCHEMA]
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(EditorComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create with mode manager', () => {
		expect(component).toBeTruthy();
		expect(component.mode).toBe('manager');
	});

	describe('close', () => {
		it('should emit closeEvent when in manager mode', () => {
			const listener = jest.fn();
			component.closeEvent.subscribe(listener);
			component.close();
			expect(listener).toHaveBeenCalledTimes(1);
		});

		it('should set mode to manager when in edit mode with no layout', () => {
			component.mode = 'edit';
			component.layout = undefined;
			component.close();
			expect(component.mode).toBe('manager');
		});

		it('should set mode to manager when edit has no unsaved changes', () => {
			component.mode = 'edit';
			component.layout = {
				id: '',
				originalId: 'test',
				name: 'Test',
				by: '',
				category: 'Custom',
				mapping: []
			};
			component.close();
			expect(component.mode).toBe('manager');
		});
	});

	describe('editLayout', () => {
		it('should set mode to edit and populate layout from a custom layout', () => {
			const layout: Layout = {
				id: 'abc',
				name: 'My Board',
				by: 'Author',
				category: 'Classic',
				custom: true,
				mapping: [[0, 1, 2]]
			};
			component.editLayout(layout);
			expect(component.mode).toBe('edit');
			expect(component.layout).toBeDefined();
			expect(component.layout?.originalId).toBe('abc');
			expect(component.layout?.name).toBe('My Board');
			expect(component.layout?.by).toBe('Author');
			expect(component.layout?.category).toBe('Classic');
			expect(component.layout?.mapping).toHaveLength(1);
		});

		it('should default category to Custom for non-custom layout', () => {
			const layout: Layout = {
				id: 'xyz',
				name: 'Board',
				by: '',
				category: 'Classic',
				custom: false,
				mapping: []
			};
			component.editLayout(layout);
			expect(component.layout?.category).toBe('Custom');
		});
	});

	describe('newLayout', () => {
		it('should create an empty edit layout', () => {
			component.newLayout();
			expect(component.mode).toBe('edit');
			expect(component.layout?.name).toBe('New Board');
			expect(component.layout?.mapping).toHaveLength(0);
			expect(component.layout?.category).toBe('Custom');
		});
	});

	describe('onDragFiles', () => {
		it('should set mode to import', () => {
			component.onDragFiles();
			expect(component.mode).toBe('import');
		});
	});

	describe('onDropFiles', () => {
		it('should do nothing', () => {
			expect(() => {
				component.onDropFiles();
			}).not.toThrow();
			expect(component.mode).toBe('manager');
		});
	});

	describe('exportLayouts', () => {
		it('should call downloadMahLayouts with layout items', () => {
			const items: Array<Layout> = [{ id: '1', name: 'L', category: 'Cat', mapping: [] }];
			mockLayoutService.layouts.items = items;
			component.exportLayouts();
			expect(downloadMahLayouts).toHaveBeenCalledWith(items);
		});
	});
});
