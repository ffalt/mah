import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AppService } from '../../service/app.service';
import { ClockComponent } from './clock.component';
import { describe, beforeEach, it, expect } from 'vitest';

describe('ClockComponent', () => {
	let component: ClockComponent;
	let fixture: ComponentFixture<ClockComponent>;
	let appService: AppService;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			imports: [ClockComponent],
			providers: [provideTranslateService(), provideHttpClient(), provideHttpClientTesting(), AppService]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(ClockComponent);
		component = fixture.componentInstance;
		appService = TestBed.inject(AppService);
		appService.game.clock.elapsed.set(0);
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should render a placeholder for zero elapsed time', () => {
		expect(fixture.nativeElement.textContent.trim()).toBe('-');
	});

	it('should format the elapsed time via the duration pipe', () => {
		appService.game.clock.elapsed.set(65_000);
		fixture.detectChanges();
		expect(fixture.nativeElement.textContent.trim()).toBe('01:05');
	});

	it('should update when the elapsed time changes', () => {
		appService.game.clock.elapsed.set(1000);
		fixture.detectChanges();
		expect(fixture.nativeElement.textContent.trim()).toBe('00:01');

		appService.game.clock.elapsed.set(3_661_000);
		fixture.detectChanges();
		expect(fixture.nativeElement.textContent.trim()).toBe('01:01:01');
	});
});
