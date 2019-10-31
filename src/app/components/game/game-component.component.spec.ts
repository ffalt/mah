import {HttpClientModule} from '@angular/common/http';
import {Component} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';
import {Game} from '../../model/game';
import {Layouts} from '../../model/layouts';
import {DurationPipe} from '../../pipes/duration.pipe';
import {AppService} from '../../service/app.service';
import {SvgdefService} from '../../service/svgdef.service';
import {BoardComponent} from '../board/board.component';
import {ChooseBoardComponent} from '../choose-board/choose-board-component.component';
import {HelpComponent} from '../help/help.component';
import {ImageSetLoaderComponent} from '../image-set-loader/image-set-loader.component';
import {LayoutListItemComponent} from '../layout-list-item/layout-list-item.component';
import {LayoutListComponent} from '../layout-list/layout-list.component';
import {SettingsComponent} from '../settings/settings.component';
import {TileComponent} from '../tile/tile.component';
import {TilesInfoComponent} from '../tiles-info/tiles-info.component';
import {GameComponent} from './game-component.component';

describe('GameComponent', () => {

	// noinspection AngularMissingOrInvalidDeclarationInModule
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

	beforeEach(async () =>
		TestBed.configureTestingModule({
			declarations: [
				TestGameComponentHostComponent, GameComponent, BoardComponent, HelpComponent, ChooseBoardComponent,
				TileComponent, ImageSetLoaderComponent, SettingsComponent, TilesInfoComponent, LayoutListComponent, LayoutListItemComponent, DurationPipe
			],
			imports: [HttpClientModule, FormsModule, TranslateModule.forRoot()],
			providers: [SvgdefService, AppService]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(TestGameComponentHostComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', async () => {
		expect(component).toBeTruthy();
	});

});
