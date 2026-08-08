import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { GameStartComponent } from './game-start.component';

describe('GameStartComponent', () => {
	let component: GameStartComponent;
	let fixture: ComponentFixture<GameStartComponent>;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			imports: [GameStartComponent],
			providers: [provideTranslateService(), provideHttpClient(), provideHttpClientTesting()]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(GameStartComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should emit startEvent when the button is clicked', () => {
		const startSpy = vi.fn();
		component.startEvent.subscribe(startSpy);

		(fixture.nativeElement.querySelector(':scope .start-button') as HTMLElement).click();

		expect(startSpy).toHaveBeenCalled();
	});
});
