import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';
import {LayoutService} from '../../service/layout.service';
import {CoreModule} from '../../modules/core/core.module';
import {ChooseLayoutComponent} from './choose-layout.component';

describe('ChooseLayoutComponent', () => {
	let component: ChooseLayoutComponent;
	let fixture: ComponentFixture<ChooseLayoutComponent>;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			declarations: [ChooseLayoutComponent],
			imports: [FormsModule, HttpClientTestingModule, CoreModule, TranslateModule.forRoot()],
			providers: [LayoutService]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(ChooseLayoutComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', async () => {
		expect(component).toBeTruthy();
	});

});
