import { NO_ERRORS_SCHEMA } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideTranslateService } from '@ngx-translate/core';
import { LayoutService } from '../../../../service/layout.service';
import * as importModule from '../../model/import';
import { ImportComponent } from './import.component';
import type { Layout, LoadLayout } from '../../../../model/types';
import { Mock, describe, beforeEach, it, expect, vi } from 'vitest';

const mockImportLayouts = vi.spyOn(importModule, 'importLayouts');

beforeEach(() => {
	vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

const makeLayout = (id: string): Layout => ({
	id,
	name: `Layout ${id}`,
	category: 'Custom',
	mapping: []
});

const makeLoadLayout = (id: string): LoadLayout => ({
	id,
	name: `Layout ${id}`,
	cat: 'Custom',
	map: []
});

describe('ImportComponent', () => {
	let component: ImportComponent;
	let fixture: ComponentFixture<ImportComponent>;
	let mockLayoutService: {
		layouts: { items: Array<Layout> };
		expandLayout: Mock;
		storeCustomBoards: Mock;
	};

	beforeEach(async () => {
		mockLayoutService = {
			layouts: { items: [] },
			expandLayout: vi.fn(),
			storeCustomBoards: vi.fn()
		};

		await TestBed.configureTestingModule({
			imports: [ImportComponent],
			providers: [
				provideTranslateService(),
				{ provide: LayoutService, useValue: mockLayoutService }
			],
			schemas: [NO_ERRORS_SCHEMA]
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(ImportComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('selectFiles', () => {
		it('should do nothing when files is null', () => {
			const importFilesSpy = vi.spyOn(component, 'importFiles');
			const event = { currentTarget: { files: null } } as unknown as Event;
			component.selectFiles(event);
			expect(importFilesSpy).not.toHaveBeenCalled();
		});

		it('should call importFiles when files are present', () => {
			const importFilesSpy = vi.spyOn(component, 'importFiles').mockImplementation(() => {
				// nop
			});
			const mockFile = new File(['{}'], 'test.mah');
			const mockFileList = { 0: mockFile, length: 1, item: () => mockFile, [Symbol.iterator]: [][Symbol.iterator] };
			const event = { currentTarget: { files: mockFileList } } as unknown as Event;
			component.selectFiles(event);
			expect(importFilesSpy).toHaveBeenCalledWith([mockFile]);
		});
	});

	describe('importLayouts', () => {
		it('should add to logs and call storeCustomBoards on successful import', async () => {
			const loadLayout = makeLoadLayout('new-id');
			const layout = makeLayout('new-id');
			mockImportLayouts.mockResolvedValue([loadLayout]);
			mockLayoutService.expandLayout.mockReturnValue(layout);
			mockLayoutService.layouts.items = [];
			(LayoutService as unknown as { layout2loadLayout: Mock }).layout2loadLayout = vi.fn().mockReturnValue(loadLayout);

			const mockFile = new File(['{}'], 'boards.mah');
			await component.importLayouts([mockFile]);

			expect(component.logs()).toHaveLength(1);
			expect(component.logs()[0].isError).toBeFalsy();
			expect(mockLayoutService.storeCustomBoards).toHaveBeenCalled();
		});

		// OnPush: the view must re-render once the async import populates the logs signal
		it('should render imported logs in the view after import resolves', async () => {
			const loadLayout = makeLoadLayout('view-id');
			const layout = makeLayout('view-id');
			mockImportLayouts.mockResolvedValue([loadLayout]);
			mockLayoutService.expandLayout.mockReturnValue(layout);
			mockLayoutService.layouts.items = [];
			(LayoutService as unknown as { layout2loadLayout: Mock }).layout2loadLayout = vi.fn().mockReturnValue(loadLayout);

			const mockFile = new File(['{}'], 'boards.mah');
			await component.importLayouts([mockFile]);
			fixture.detectChanges();

			const logEntries = fixture.debugElement.queryAll(By.css('.log-zone p.layout'));
			expect(logEntries).toHaveLength(1);
		});

		it('should add error log for duplicate layout', async () => {
			const loadLayout = makeLoadLayout('dup-id');
			const layout = makeLayout('dup-id');
			mockImportLayouts.mockResolvedValue([loadLayout]);
			mockLayoutService.expandLayout.mockReturnValue(layout);
			mockLayoutService.layouts.items = [layout];

			const mockFile = new File(['{}'], 'boards.mah');
			await component.importLayouts([mockFile]);

			expect(component.logs()).toHaveLength(1);
			expect(component.logs()[0].isError).toBe(true);
			expect(mockLayoutService.storeCustomBoards).not.toHaveBeenCalled();
		});

		it('should add error log when import throws', async () => {
			mockImportLayouts.mockRejectedValue(new Error('Bad file'));

			const mockFile = new File(['bad'], 'broken.mah');
			await component.importLayouts([mockFile]);

			expect(component.logs()).toHaveLength(1);
			expect(component.logs()[0].isError).toBe(true);
			expect(mockLayoutService.storeCustomBoards).not.toHaveBeenCalled();
		});

		it('should clear logs at the start of each import', async () => {
			component.logs.set([{ msg: 'old', isError: true }]);
			mockImportLayouts.mockResolvedValue([]);

			await component.importLayouts([]);

			expect(component.logs()).toHaveLength(0);
		});
	});

	describe('selectLayout', () => {
		it('should emit editEvent when layout with matching id exists', () => {
			const layout = makeLayout('found-id');
			mockLayoutService.layouts.items = [layout];
			const emitted: Array<Layout> = [];
			component.editEvent.subscribe((value: Layout) => {
				emitted.push(value);
			});
			component.selectLayout('found-id');
			expect(emitted).toHaveLength(1);
			expect(emitted[0]).toBe(layout);
		});

		it('should not emit when no layout matches the id', () => {
			mockLayoutService.layouts.items = [];
			const emitted: Array<Layout> = [];
			component.editEvent.subscribe((value: Layout) => {
				emitted.push(value);
			});
			component.selectLayout('missing-id');
			expect(emitted).toHaveLength(0);
		});
	});

	describe('onDropFiles', () => {
		it('should call importFiles with the provided files', () => {
			const importFilesSpy = vi.spyOn(component, 'importFiles').mockImplementation(() => {
				// nop
			});
			const files = [new File(['{}'], 'test.mah')];
			component.onDropFiles(files);
			expect(importFilesSpy).toHaveBeenCalledWith(files);
		});
	});
});
