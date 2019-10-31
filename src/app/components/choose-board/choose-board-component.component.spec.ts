import {Component} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';
import {Layouts} from '../../model/layouts';
import {BoardComponent} from '../board/board.component';
import {ImageSetLoaderComponent} from '../image-set-loader/image-set-loader.component';
import {LayoutListItemComponent} from '../layout-list-item/layout-list-item.component';
import {LayoutListComponent} from '../layout-list/layout-list.component';
import {ChooseBoardComponent} from './choose-board-component.component';

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
			declarations: [TestChooseBoardHostComponent, ImageSetLoaderComponent, ChooseBoardComponent, LayoutListComponent, LayoutListItemComponent, BoardComponent],
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
