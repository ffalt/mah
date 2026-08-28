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

	it('should show the challenge score and the new best badge', () => {
		appService.game.message.set({ messageID: 'MSG_CHALLENGE_WON', score: 4200 });
		fixture.detectChanges();

		const score = fixture.nativeElement.querySelector(':scope .overlay-message-score') as HTMLElement;
		expect(score).toBeTruthy();
		expect(score.textContent).toContain('4200');
		expect(score.querySelector('.badge')).toBeNull();

		appService.game.message.set({ messageID: 'MSG_CHALLENGE_WON', score: 4200, scoreBest: true });
		fixture.detectChanges();
		expect((fixture.nativeElement.querySelector(':scope .overlay-message-score .badge') as HTMLElement).textContent).toContain('DAILY_NEW_BEST');
	});

	it('should show a zero score rather than hiding it', () => {
		appService.game.message.set({ messageID: 'MSG_CHALLENGE_LOST', score: 0 });
		fixture.detectChanges();
		expect((fixture.nativeElement.querySelector(':scope .overlay-message-score .value') as HTMLElement).textContent).toContain('0');
	});

	it('should not show a score for an ordinary game', () => {
		appService.game.message.set({ messageID: 'MSG_BEST', playTime: 61_000 });
		fixture.detectChanges();
		expect(fixture.nativeElement.querySelector(':scope .overlay-message-score')).toBeNull();
	});

	it('should emit messageEvent when the message is clicked', () => {
		appService.game.message.set({ messageID: 'MSG_START' });
		fixture.detectChanges();

		const messageSpy = vi.fn();
		component.messageEvent.subscribe(messageSpy);
		(fixture.nativeElement.querySelector(':scope .overlay-message-message') as HTMLElement).click();

		expect(messageSpy).toHaveBeenCalled();
	});

	it('closes on an overlay click for a message the player can just dismiss', () => {
		appService.game.message.set({ messageID: 'MSG_BEST', playTime: 1000 });
		fixture.detectChanges();

		component.messageEvent.subscribe(() => appService.game.message.set(undefined));
		(fixture.nativeElement.querySelector(':scope .overlay') as HTMLElement).click();
		fixture.detectChanges();

		expect(fixture.nativeElement.querySelector(':scope .overlay')).toBeNull();
	});

	it('keeps the ask-shuffle prompt on screen when the overlay is clicked', () => {
		appService.game.message.set({ messageID: 'MSG_FAIL', askShuffle: true });
		fixture.detectChanges();

		// clickMessage() deliberately does nothing here, so the dialog must not close itself either
		(fixture.nativeElement.querySelector(':scope .overlay') as HTMLElement).click();
		fixture.detectChanges();

		expect(appService.game.message()?.askShuffle).toBe(true);
		expect(fixture.nativeElement.querySelector(':scope .overlay-message-actions')).toBeTruthy();
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
