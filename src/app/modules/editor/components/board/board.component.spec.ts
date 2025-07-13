import { provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { BoardComponent } from './board.component';

describe('BoardComponent', () => {
	let component: BoardComponent;
	let fixture: ComponentFixture<BoardComponent>;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			imports: [BoardComponent, TranslateModule.forRoot()],
			providers: [provideHttpClient(), provideHttpClientTesting()]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(BoardComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', async () => {
		expect(component).toBeTruthy();
	});

});
