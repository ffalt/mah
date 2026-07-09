import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, beforeEach, it, expect } from 'vitest';
import { AppService } from '../../service/app.service';
import { Stone } from '../../model/stone';
import { StatsBarComponent } from './stats-bar.component';

describe('StatsBarComponent', () => {
	let component: StatsBarComponent;
	let fixture: ComponentFixture<StatsBarComponent>;
	let appService: AppService;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			imports: [StatsBarComponent],
			providers: [provideTranslateService(), provideHttpClient(), provideHttpClientTesting(), AppService]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(StatsBarComponent);
		component = fixture.componentInstance;
		appService = TestBed.inject(AppService);
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should display the stone and free counts', () => {
		appService.game.board.count.set(42);
		appService.game.board.free.set([new Stone(0, 0, 0, 0, 0), new Stone(0, 2, 0, 0, 0)]);
		fixture.detectChanges();
		const spans = Array.from(fixture.nativeElement.querySelectorAll(':scope .text > span')) as Array<HTMLElement>;
		expect(spans.map(span => span.textContent)).toEqual(['42', '2']);
	});

	it('should toggle the clock with the showClock setting', () => {
		appService.settings.showClock.set(true);
		fixture.detectChanges();
		expect(fixture.nativeElement.querySelector('app-clock')).toBeTruthy();
		appService.settings.showClock.set(false);
		fixture.detectChanges();
		expect(fixture.nativeElement.querySelector('app-clock')).toBeNull();
	});
});
