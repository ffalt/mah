import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {ChooseBoardComponent} from './choose-board-component.component';
import {Layouts} from '../../model/layouts';
import {Component} from '@angular/core';
import {LayoutListComponent} from '../layout-list/layout-list.component';
import {LayoutListItemComponent} from '../layout-list-item/layout-list-item.component';
import {BoardComponent} from '../board/board.component';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';
import {TooltipModule} from '../../modules/tooltip/tooltip.module';
import {ImageSetLoaderComponent} from '../image-set-loader/image-set-loader.component';

describe('ChooseBoardComponent', () => {


	@Component({
		selector: 'app-choose-board-host-component',
		template: '<app-choose-board-component [layouts]="mockLayouts"></app-choose-board-component>'
	})
	class TestChooseBoardHostComponent {
		mockLayouts = new Layouts();
	}

	let component: TestChooseBoardHostComponent;
	let fixture: ComponentFixture<TestChooseBoardHostComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [TestChooseBoardHostComponent, ImageSetLoaderComponent, ChooseBoardComponent, LayoutListComponent, LayoutListItemComponent, BoardComponent],
			imports: [TooltipModule, FormsModule, TranslateModule.forRoot()]
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(TestChooseBoardHostComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});


});
