import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TranslateModule} from '@ngx-translate/core';
import {CoreModule} from '../../../core/core.module';
import {LayoutService} from '../../../../service/layout.service';
import {ImportComponent} from './import.component';

describe('ImportComponent', () => {
	let component: ImportComponent;
	let fixture: ComponentFixture<ImportComponent>;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			declarations: [ImportComponent],
			imports: [HttpClientTestingModule, CoreModule, TranslateModule.forRoot()],
			providers: [LayoutService]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(ImportComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', async () => {
		expect(component).toBeTruthy();
	});

});
