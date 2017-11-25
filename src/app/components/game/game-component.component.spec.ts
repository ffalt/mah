import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {GameComponent} from './game-component.component';
import {Game} from '../../model/game';
import {Component} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';
import {Layouts} from '../../model/layouts';
import {BoardComponent} from '../board/board.component';
import {DurationPipe} from '../../pipes/duration.pipe';
import {HelpComponent} from '../help/help-component.component';
import {ChooseBoardComponent} from '../choose-board/choose-board-component.component';
import {FormsModule} from '@angular/forms';
import {LayoutListItemComponent} from '../layout-list-item/layout-list-item.component';
import {LayoutListComponent} from '../layout-list/layout-list.component';
import {TilesInfoComponent} from '../tiles-info/tiles-info.component';

describe('GameComponent', () => {

	@Component({
		selector: 'app-game-component-host-component',
		template: '<app-game-component [game]="mockGame" [layouts]="mocklayouts"></app-game-component>'
	})
	class TestGameComponentHostComponent {
		mockGame = new Game();
		mocklayouts = new Layouts();
	}

	let component: TestGameComponentHostComponent;
	let fixture: ComponentFixture<TestGameComponentHostComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [TestGameComponentHostComponent, GameComponent, BoardComponent, HelpComponent, ChooseBoardComponent,
				TilesInfoComponent, LayoutListComponent, LayoutListItemComponent, DurationPipe],
			imports: [FormsModule, TranslateModule.forRoot()]
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(TestGameComponentHostComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

});
