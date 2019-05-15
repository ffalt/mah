import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';
import {Game} from '../../model/game';
import {SettingsComponent} from './settings.component';

describe('SettingsComponent', () => {

	// noinspection AngularMissingOrInvalidDeclarationInModule
	@Component({
		selector: 'app-settings-host-component',
		template: '<app-settings [game]="mockGame"></app-settings>'
	})
	class TestSettingsHostComponent {
		mockGame = new Game();
	}

	let component: TestSettingsHostComponent;
	let fixture: ComponentFixture<TestSettingsHostComponent>;
	beforeEach(async () =>
		TestBed.configureTestingModule({
			declarations: [TestSettingsHostComponent, SettingsComponent],
			imports: [FormsModule, TranslateModule.forRoot()]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(TestSettingsHostComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', async () =>
		expect(component).toBeTruthy());

});
