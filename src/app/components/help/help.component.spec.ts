import {Component} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';
import {Game} from '../../model/game';
import {DurationPipe} from '../../pipes/duration.pipe';
import {HelpComponent} from './help.component';

describe('HelpComponent', () => {

	// noinspection AngularMissingOrInvalidDeclarationInModule
	@Component({
		selector: 'app-help-host-component',
		template: '<app-help [game]="mockGame"></app-help>'
	})
	class TestHelpHostComponent {
		mockGame = new Game();
	}

	let component: TestHelpHostComponent;
	let fixture: ComponentFixture<TestHelpHostComponent>;
	beforeEach(async () =>
		TestBed.configureTestingModule({
			declarations: [TestHelpHostComponent, HelpComponent, DurationPipe],
			imports: [FormsModule, TranslateModule.forRoot()]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(TestHelpHostComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', async () => {
		expect(component).toBeTruthy();
	});

});
