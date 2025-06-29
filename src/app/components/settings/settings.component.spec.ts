import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { AppService } from '../../service/app.service';
import { LayoutService } from '../../service/layout.service';
import { SettingsComponent } from './settings.component';

describe('SettingsComponent', () => {
	let component: SettingsComponent;
	let fixture: ComponentFixture<SettingsComponent>;
	beforeEach(async () =>
		TestBed.configureTestingModule({
			declarations: [SettingsComponent],
			imports: [TranslateModule.forRoot()],
			providers: [provideHttpClient(), provideHttpClientTesting(), AppService, LayoutService]
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
