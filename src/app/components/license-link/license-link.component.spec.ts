import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, beforeEach, it, expect } from 'vitest';
import { Licenses } from '../../model/consts';
import { LicenseLinkComponent } from './license-link.component';

describe('LicenseLinkComponent', () => {
	let component: LicenseLinkComponent;
	let fixture: ComponentFixture<LicenseLinkComponent>;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			imports: [LicenseLinkComponent]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(LicenseLinkComponent);
		component = fixture.componentInstance;
		fixture.componentRef.setInput('link', 'https://example.com/license');
		fixture.componentRef.setInput('licenseKey', 'mit');
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('Input properties', () => {
		it('should accept link input', () => {
			expect(component.link()).toBe('https://example.com/license');
		});

		it('should accept licenseKey input', () => {
			expect(component.licenseKey()).toBe('mit');
		});
	});

	describe('Component rendering', () => {
		it('should render an anchor with the link href', () => {
			const anchor = fixture.debugElement.query(By.css('a'));
			expect(anchor).toBeTruthy();
			expect(anchor.attributes.href).toBe('https://example.com/license');
		});

		it('should set title and aria-label from the Licenses map', () => {
			const anchor = fixture.debugElement.query(By.css('a'));
			expect(anchor.attributes.title).toBe(Licenses.mit);
			expect(anchor.attributes['aria-label']).toBe(Licenses.mit);
		});

		it('should render the SVG path matching the licenseKey switch branch', () => {
			const paths = fixture.debugElement.queryAll(By.css('svg path'));
			// background circle + the mit-specific path
			expect(paths.length).toBe(2);
		});
	});

	// OnPush: the view must update when input signals change
	describe('Change detection (OnPush)', () => {
		it('should update the href when the link input changes', () => {
			fixture.componentRef.setInput('link', 'https://example.com/other');
			fixture.detectChanges();

			const anchor = fixture.debugElement.query(By.css('a'));
			expect(anchor.attributes.href).toBe('https://example.com/other');
		});

		it('should update title and switched path when licenseKey changes', () => {
			fixture.componentRef.setInput('licenseKey', 'gpl');
			fixture.detectChanges();

			const anchor = fixture.debugElement.query(By.css('a'));
			expect(anchor.attributes.title).toBe(Licenses.gpl);
			expect(fixture.debugElement.queryAll(By.css('svg path')).length).toBe(2);
		});

		it('should fall back to "?" when licenseKey is unknown', () => {
			fixture.componentRef.setInput('licenseKey', 'nope');
			fixture.detectChanges();

			const anchor = fixture.debugElement.query(By.css('a'));
			expect(anchor.attributes.title).toBe('?');
			// only the background circle path remains, no switch branch matched
			expect(fixture.debugElement.queryAll(By.css('svg path')).length).toBe(1);
		});
	});
});
