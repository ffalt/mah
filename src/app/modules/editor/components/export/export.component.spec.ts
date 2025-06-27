import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { CoreModule } from '../../../core/core.module';
import { LayoutService } from '../../../../service/layout.service';
import { ExportComponent } from './export.component';

describe('ExportComponent', () => {
	let component: ExportComponent;
	let fixture: ComponentFixture<ExportComponent>;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			declarations: [ExportComponent],
			imports: [HttpClientTestingModule, CoreModule, TranslateModule.forRoot()],
			providers: [LayoutService]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(ExportComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', async () => {
		expect(component).toBeTruthy();
	});

});
