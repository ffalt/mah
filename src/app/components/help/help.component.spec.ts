import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {HelpComponent} from './help.component';
import {TranslateModule} from '@ngx-translate/core';
import {FormsModule} from '@angular/forms';
import {DurationPipe} from '../../pipes/duration.pipe';
import {Game} from '../../model/game';
import {Component} from '@angular/core';

describe('HelpComponent', () => {

	@Component({
		selector: 'app-help-host-component',
		template: '<app-help [game]="mockGame"></app-help>'
	})
	class TestHelpHostComponent {
		mockGame = new Game();
	}

	let component: TestHelpHostComponent;
	let fixture: ComponentFixture<TestHelpHostComponent>;
	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [TestHelpHostComponent, HelpComponent, DurationPipe],
			imports: [FormsModule, TranslateModule.forRoot()]
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(TestHelpHostComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

});
