import {HttpClientModule} from '@angular/common/http';
import {TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {TranslateModule} from '@ngx-translate/core';
import {AppComponent} from './app.component';
import {BoardComponent} from './components/board/board.component';
import {ChooseBoardComponent} from './components/choose-board/choose-board-component.component';
import {GameComponent} from './components/game/game-component.component';
import {HelpComponent} from './components/help/help.component';
import {ImageSetLoaderComponent} from './components/image-set-loader/image-set-loader.component';
import {LayoutListItemComponent} from './components/layout-list-item/layout-list-item.component';
import {LayoutListComponent} from './components/layout-list/layout-list.component';
import {LayoutPreviewComponent} from './components/layout-preview/layout-preview.component';
import {SettingsComponent} from './components/settings/settings.component';
import {TileComponent} from './components/tile/tile.component';
import {TilesInfoComponent} from './components/tiles-info/tiles-info.component';
import {DurationPipe} from './pipes/duration.pipe';
import {AppService} from './service/app.service';
import {LayoutService} from './service/layout.service';
import {SvgdefService} from './service/svgdef.service';

describe('AppComponent', () => {
	beforeEach(async () =>
		TestBed.configureTestingModule({
			declarations: [
				AppComponent,
				ChooseBoardComponent,
				GameComponent,
				HelpComponent,
				LayoutListComponent,
				LayoutListItemComponent,
				LayoutPreviewComponent,
				BoardComponent,
				TilesInfoComponent,
				TileComponent,
				SettingsComponent,
				ImageSetLoaderComponent,
				DurationPipe
			],
			imports: [
				BrowserModule,
				FormsModule,
				HttpClientModule,
				TranslateModule.forRoot()
			],
			providers: [
				AppService,
				SvgdefService,
				LayoutService
			]
		}).compileComponents());

	it('should create the app', async () => {
		const fixture = TestBed.createComponent(AppComponent);
		const app = fixture.debugElement.componentInstance;
		expect(app).toBeTruthy();
	});

});
