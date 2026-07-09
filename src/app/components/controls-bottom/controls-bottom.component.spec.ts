import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { AppService } from '../../service/app.service';
import { ControlsBottomComponent } from './controls-bottom.component';

describe('ControlsBottomComponent', () => {
	let component: ControlsBottomComponent;
	let fixture: ComponentFixture<ControlsBottomComponent>;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			imports: [ControlsBottomComponent],
			providers: [provideTranslateService(), provideHttpClient(), provideHttpClientTesting(), AppService]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(ControlsBottomComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should toggle and close the menu', () => {
		component.toggleMenu();
		expect(component.menuOpen()).toBe(true);
		component.closeMenu();
		expect(component.menuOpen()).toBe(false);
	});

	it('should close the menu when a menu item is clicked', () => {
		component.toggleMenu();
		fixture.detectChanges();

		const zenSpy = vi.fn();
		component.zenEvent.subscribe(zenSpy);
		(fixture.nativeElement.querySelector(':scope .menu button[title="ZEN_MODE"]') as HTMLElement).click();

		expect(zenSpy).toHaveBeenCalled();
		expect(component.menuOpen()).toBe(false);
	});

	it('should show the fullscreen button only when enabled', () => {
		fixture.componentRef.setInput('fullScreenEnabled', true);
		fixture.detectChanges();
		expect(fixture.nativeElement.querySelector(':scope .menu button[title="FULLSCREEN"]')).toBeTruthy();

		fixture.componentRef.setInput('fullScreenEnabled', false);
		fixture.detectChanges();
		expect(fixture.nativeElement.querySelector(':scope .menu button[title="FULLSCREEN"]')).toBeNull();
	});
});
