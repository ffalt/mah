import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { AppService } from '../../service/app.service';
import { GameMessageComponent } from './game-message.component';

describe('GameMessageComponent', () => {
	let component: GameMessageComponent;
	let fixture: ComponentFixture<GameMessageComponent>;
	let appService: AppService;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			imports: [GameMessageComponent],
			providers: [provideTranslateService(), provideHttpClient(), provideHttpClientTesting(), AppService]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(GameMessageComponent);
		component = fixture.componentInstance;
		appService = TestBed.inject(AppService);
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should show the message with play time when one is set', () => {
		appService.game.message.set(undefined);
		fixture.detectChanges();
		expect(fixture.nativeElement.querySelector(':scope .overlay-message-message')).toBeNull();

		appService.game.message.set({ messageID: 'MSG_BEST', playTime: 61_000 });
		fixture.detectChanges();

		const message = fixture.nativeElement.querySelector(':scope .overlay-message-message') as HTMLElement;
		expect(message).toBeTruthy();
		expect(message.textContent).toContain('MSG_BEST');
		expect(message.textContent).toContain('01:01');
	});

	it('should emit messageEvent when the message is clicked', () => {
		appService.game.message.set({ messageID: 'MSG_START' });
		fixture.detectChanges();

		const messageSpy = vi.fn();
		component.messageEvent.subscribe(messageSpy);
		(fixture.nativeElement.querySelector(':scope .overlay-message-message') as HTMLElement).click();

		expect(messageSpy).toHaveBeenCalled();
	});

	it('should emit shuffle and surrender events from the ask-shuffle actions', () => {
		appService.game.message.set({ messageID: 'MSG_FAIL', askShuffle: true });
		fixture.detectChanges();

		const shuffleSpy = vi.fn();
		const surrenderSpy = vi.fn();
		component.shuffleEvent.subscribe(shuffleSpy);
		component.surrenderEvent.subscribe(surrenderSpy);

		const buttons = fixture.nativeElement.querySelectorAll(':scope .overlay-message-actions .button');
		expect(buttons).toHaveLength(2);
		(buttons[0] as HTMLElement).click();
		expect(shuffleSpy).toHaveBeenCalled();
		(buttons[1] as HTMLElement).click();
		expect(surrenderSpy).toHaveBeenCalled();
	});
});
