import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';
import {AppService} from '../../service/app.service';
import {SettingsComponent} from './settings.component';

describe('SettingsComponent', () => {
	let component: SettingsComponent;
	let fixture: ComponentFixture<SettingsComponent>;
	beforeEach(async () =>
		TestBed.configureTestingModule({
			declarations: [SettingsComponent],
			imports: [FormsModule, TranslateModule.forRoot()],
			providers: [AppService]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(SettingsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', async () => {
		expect(component).toBeTruthy();
	});
});
