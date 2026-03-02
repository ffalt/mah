import { provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { LayoutService } from '../../../../service/layout.service';
import { LayoutComponent } from './layout.component';
import type { Layout } from '../../../../model/types';

describe('LayoutComponent', () => {
	let component: LayoutComponent;
	let fixture: ComponentFixture<LayoutComponent>;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			imports: [LayoutComponent, TranslateModule.forRoot()],
			providers: [provideHttpClient(), provideHttpClientTesting(), LayoutService]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(LayoutComponent);
		fixture.componentRef.setInput('layout', undefined);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', async () => {
		expect(component).toBeTruthy();
	});

	describe('moveLayer', () => {
		it('should handle empty layer without crashing', () => {
			const mockLayout: Layout = {
				id: 'test',
				category: 'Test',
				name: 'Test Layout',
				mapping: [
					[0, 5, 5],
					[1, 5, 5]
				]
			};
			fixture.componentRef.setInput('layout', mockLayout);
			component.currentZ = 2;

			expect(() => {
				component.moveLayer(true, 1);
			}).not.toThrow();
		});

		it('should not move layer when list is empty', () => {
			const mockLayout: Layout = {
				id: 'test',
				category: 'Test',
				name: 'Test Layout',
				mapping: [
					[0, 5, 5],
					[1, 5, 5]
				]
			};
			fixture.componentRef.setInput('layout', mockLayout);
			component.currentZ = 3;

			const originalMapping = JSON.stringify(mockLayout.mapping);
			component.moveLayer(true, 1);
			const newMapping = JSON.stringify(mockLayout.mapping);

			expect(originalMapping).toBe(newMapping);
		});

		it('should allow moving tiles to maximum valid X position', () => {
			const mockLayout: Layout = {
				id: 'test',
				category: 'Test',
				name: 'Test Layout',
				mapping: [
					[0, 35, 5],
					[0, 36, 5]
				]
			};
			fixture.componentRef.setInput('layout', mockLayout);
			component.currentZ = 0;

			component.moveLayer(true, 1);

			expect(mockLayout.mapping[0][1]).toBe(36);
			expect(mockLayout.mapping[1][1]).toBe(37);
		});

		it('should prevent moving tiles beyond maximum valid X position', () => {
			const mockLayout: Layout = {
				id: 'test',
				category: 'Test',
				name: 'Test Layout',
				mapping: [
					[0, 36, 5],
					[0, 37, 5]
				]
			};
			fixture.componentRef.setInput('layout', mockLayout);
			component.currentZ = 0;

			const originalMapping = JSON.stringify(mockLayout.mapping);

			component.moveLayer(true, 1);

			const newMapping = JSON.stringify(mockLayout.mapping);
			expect(originalMapping).toBe(newMapping);
		});

		it('should allow moving tiles to maximum valid Y position', () => {
			const mockLayout: Layout = {
				id: 'test',
				category: 'Test',
				name: 'Test Layout',
				mapping: [
					[0, 5, 16],
					[0, 5, 17]
				]
			};
			fixture.componentRef.setInput('layout', mockLayout);
			component.currentZ = 0;

			const originalMapping = JSON.stringify(mockLayout.mapping);
			component.moveLayer(false, 0);
			const newMapping = JSON.stringify(mockLayout.mapping);

			expect(originalMapping).toBe(newMapping);
		});

		it('should prevent moving tiles beyond maximum valid Y position', () => {
			const mockLayout: Layout = {
				id: 'test',
				category: 'Test',
				name: 'Test Layout',
				mapping: [
					[0, 5, 17]
				]
			};
			fixture.componentRef.setInput('layout', mockLayout);
			component.currentZ = 0;

			const originalMapping = JSON.stringify(mockLayout.mapping);

			component.moveLayer(false, 1);

			const newMapping = JSON.stringify(mockLayout.mapping);
			expect(originalMapping).toBe(newMapping);
		});

		it('should prevent moving tiles below minimum position (X)', () => {
			const mockLayout: Layout = {
				id: 'test',
				category: 'Test',
				name: 'Test Layout',
				mapping: [
					[0, 0, 5],
					[0, 1, 5]
				]
			};
			fixture.componentRef.setInput('layout', mockLayout);
			component.currentZ = 0;

			const originalMapping = JSON.stringify(mockLayout.mapping);

			component.moveLayer(true, -1);

			const newMapping = JSON.stringify(mockLayout.mapping);
			expect(originalMapping).toBe(newMapping);
		});

		it('should prevent moving tiles below minimum position (Y)', () => {
			const mockLayout: Layout = {
				id: 'test',
				category: 'Test',
				name: 'Test Layout',
				mapping: [
					[0, 5, 0],
					[0, 5, 1]
				]
			};
			fixture.componentRef.setInput('layout', mockLayout);
			component.currentZ = 0;

			const originalMapping = JSON.stringify(mockLayout.mapping);

			component.moveLayer(false, -1);

			const newMapping = JSON.stringify(mockLayout.mapping);
			expect(originalMapping).toBe(newMapping);
		});

		it('should successfully move tiles within valid bounds', () => {
			const mockLayout: Layout = {
				id: 'test',
				category: 'Test',
				name: 'Test Layout',
				mapping: [
					[0, 10, 10],
					[0, 11, 10]
				]
			};
			fixture.componentRef.setInput('layout', mockLayout);
			component.currentZ = 0;

			component.moveLayer(true, 2);

			expect(mockLayout.mapping[0][1]).toBe(12);
			expect(mockLayout.mapping[1][1]).toBe(13);
		});
	});
});
