import { provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { CoreModule } from '../../../core/core.module';
import { LayoutService } from '../../../../service/layout.service';
import { ExportComponent } from './export.component';

describe('ExportComponent', () => {
	let component: ExportComponent;
	let fixture: ComponentFixture<ExportComponent>;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			declarations: [ExportComponent],
			imports: [CoreModule, TranslateModule.forRoot()],
			providers: [provideHttpClient(), provideHttpClientTesting(), LayoutService]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(ExportComponent);
		fixture.componentRef.setInput('layout', { name: 'Mock', mapping: [] });
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', async () => {
		expect(component).toBeTruthy();
	});

});
