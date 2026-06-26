import { NO_ERRORS_SCHEMA } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { ExportComponent } from './export.component';
import { LayoutService } from '../../../../service/layout.service';
import * as exportModel from '../../model/export';
import type { EditLayout } from '../../model/edit-layout';
import { describe, it, beforeEach, expect, vi } from 'vitest';

const editLayout: EditLayout = {
	id: '',
	name: 'Test Board',
	by: 'Author',
	category: 'Custom',
	mapping: [[0, 0, 0], [0, 2, 0], [0, 4, 0], [0, 6, 0]]
};

const mockLayoutService = {
	layouts: { items: [] },
	storeCustomBoards: vi.fn(),
	removeCustomLayout: vi.fn()
};

describe('ExportComponent', () => {
	let component: ExportComponent;
	let fixture: ComponentFixture<ExportComponent>;
	let layoutService: typeof mockLayoutService;
	let translateService: TranslateService;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [ExportComponent],
			providers: [
				provideTranslateService(),
				{ provide: LayoutService, useValue: mockLayoutService }
			],
			schemas: [NO_ERRORS_SCHEMA]
		}).compileComponents();

		fixture = TestBed.createComponent(ExportComponent);
		layoutService = TestBed.inject(LayoutService) as unknown as typeof mockLayoutService;
		translateService = TestBed.inject(TranslateService);
	});

	const init = (layout: EditLayout = editLayout): void => {
		fixture.componentRef.setInput('layout', layout);
		component = fixture.componentInstance;
		fixture.detectChanges();
	};

	it('should create', () => {
		init();
		expect(component).toBeTruthy();
	});

	describe('update()', () => {
		it('sets filename with current format extension', () => {
			init();
			expect(component.filename()).toBe('test_board.mah');
		});

		it('sets result as non-empty string', () => {
			init();
			expect(typeof component.result()).toBe('string');
			expect(component.result().length).toBeGreaterThan(0);
		});

		it('sets exportLayout with id and name', () => {
			init();
			expect(component.exportLayout()).toBeDefined();
			expect(component.exportLayout()?.name).toBe('Test Board');
		});
	});

	describe('chooseFormat()', () => {
		it('changes format and updates filename extension', () => {
			init();
			const kyodaiFormat = component.exportFormats[1];
			component.chooseFormat(kyodaiFormat);
			expect(component.format()).toBe(kyodaiFormat);
			expect(component.filename()).toBe('test_board.lay');
		});

		it('switches to kmahjongg format', () => {
			init();
			const kmahFormat = component.exportFormats[2];
			component.chooseFormat(kmahFormat);
			expect(component.format().ext).toBe('layout');
		});
	});

	describe('download()', () => {
		it('calls downloadLayout and emits savedEvent', () => {
			init();
			const downloadSpy = vi.spyOn(exportModel, 'downloadLayout').mockImplementation(() => undefined);
			const savedEvents: Array<boolean> = [];
			component.savedEvent.subscribe((isCalled: boolean) => {
				savedEvents.push(isCalled);
			});

			component.download();

			expect(downloadSpy).toHaveBeenCalledWith(component.filename(), component.result(), component.format().type);
			expect(savedEvents).toHaveLength(1);
			expect(savedEvents[0]).toBe(true);
		});
	});

	describe('saveAsCopy()', () => {
		it('calls storeCustomBoards, sets originalId, and emits savedEvent', () => {
			const layout = { ...editLayout };
			init(layout);
			const savedEvents: Array<boolean> = [];
			component.savedEvent.subscribe((isCalled: boolean) => {
				savedEvents.push(isCalled);
			});

			component.saveAsCopy();

			expect(layoutService.storeCustomBoards).toHaveBeenCalledWith([component.exportLayout()]);
			expect(layout.originalId).toBe(component.exportLayout()?.id);
			expect(savedEvents).toHaveLength(1);
			expect(savedEvents[0]).toBe(true);
		});
	});

	describe('save()', () => {
		it('calls removeCustomLayout and saveAsCopy when not a built-in layout', () => {
			mockLayoutService.layouts = { items: [{ id: 'other-id', custom: false } as unknown as never] };
			const layout = { ...editLayout };
			init(layout);
			const saveAsCopySpy = vi.spyOn(component, 'saveAsCopy');

			component.save();

			expect(layoutService.removeCustomLayout).toHaveBeenCalled();
			expect(saveAsCopySpy).toHaveBeenCalled();
		});

		it('removes originalId as well if present', () => {
			mockLayoutService.layouts = { items: [] };
			const layout: EditLayout = { ...editLayout, originalId: 'original-id' };
			init(layout);

			component.save();

			const call = (layoutService.removeCustomLayout).mock.calls[0][0] as Array<string>;
			expect(call).toContain('original-id');
		});

		it('shows alert and returns when layout id matches a built-in item', () => {
			init();
			const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);
			vi.spyOn(translateService, 'instant').mockReturnValue('built-in exists');
			const exportId = component.exportLayout()!.id;
			mockLayoutService.layouts = {
				items: [{ id: exportId, custom: false } as unknown as never]
			};

			component.save();

			expect(alertSpy).toHaveBeenCalledWith('built-in exists');
			expect(layoutService.removeCustomLayout).not.toHaveBeenCalled();
		});
	});
});
