import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { LayoutPreviewComponent } from './layout-preview.component';
import { LayoutService } from '../../service/layout.service';
import type { Layout, SafeUrlSVG } from '../../model/types';
import { Mock, describe, beforeEach, it, expect, vi } from 'vitest';

describe('LayoutPreviewComponent', () => {
	let component: LayoutPreviewComponent;
	let fixture: ComponentFixture<LayoutPreviewComponent>;
	let mockLayoutService: { getPreview: Mock };

	beforeEach(async () => {
		mockLayoutService = { getPreview: vi.fn() };
		return TestBed.configureTestingModule({
			imports: [LayoutPreviewComponent],
			providers: [{ provide: LayoutService, useValue: mockLayoutService }]
		})
			.compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(LayoutPreviewComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', async () => {
		expect(component).toBeTruthy();
	});

	it('should resolve the preview lazily from the layout input', () => {
		const layout: Layout = { id: 'l1', name: 'Layout 1', category: 'Cat', mapping: [] };
		const safeUrl = 'data:image/svg+xml;base64,...' as SafeUrlSVG;
		mockLayoutService.getPreview.mockReturnValue(safeUrl);

		fixture.componentRef.setInput('layout', layout);
		fixture.detectChanges();

		expect(mockLayoutService.getPreview).toHaveBeenCalledWith(layout);
		expect(component.svg()).toBe(safeUrl);
	});
});
