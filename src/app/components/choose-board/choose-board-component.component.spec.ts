import {Component} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';
import {Layouts} from '../../model/layouts';
import {ChooseBoardComponent} from './choose-board-component.component';
import {LayoutPreviewComponent} from '../layout-preview/layout-preview.component';

describe('ChooseBoardComponent', () => {

	// noinspection AngularMissingOrInvalidDeclarationInModule
	@Component({
		selector: 'app-choose-board-host-component',
		template: '<app-choose-board-component [layouts]="mockLayouts"></app-choose-board-component>'
	})
	class TestChooseBoardHostComponent {
		mockLayouts = new Layouts();
	}

	let component: TestChooseBoardHostComponent;
	let fixture: ComponentFixture<TestChooseBoardHostComponent>;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			declarations: [TestChooseBoardHostComponent, ChooseBoardComponent, LayoutPreviewComponent],
			imports: [FormsModule, TranslateModule.forRoot()]
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
