import {HttpClientTestingModule} from '@angular/common/http/testing';
import {Component} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';
import {MockComponent} from 'ng-mocks';
import {LayoutService} from '../../service/layout.service';
import {LayoutPreviewComponent} from '../layout-preview/layout-preview.component';
import {ChooseLayoutComponent} from './choose-layout.component';

describe('ChooseLayoutComponent', () => {

	// noinspection AngularMissingOrInvalidDeclarationInModule
	@Component({
		selector: 'app-choose-layout-host-component',
		template: '<app-choose-layout [layouts]="mockLayouts"></app-choose-layout>'
	})
	class TestChooseBoardHostComponent {
		mockLayouts = {items: []};
	}

	let component: TestChooseBoardHostComponent;
	let fixture: ComponentFixture<TestChooseBoardHostComponent>;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			declarations: [TestChooseBoardHostComponent, ChooseLayoutComponent, MockComponent(LayoutPreviewComponent)],
			imports: [FormsModule, HttpClientTestingModule, TranslateModule.forRoot()],
			providers: [LayoutService]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(TestChooseBoardHostComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', async () => {
		expect(component).toBeTruthy();
	});

});
