import {TestBed, async} from '@angular/core/testing';
import {AppComponent} from './app.component';
import {ChooseBoardComponent} from './components/choose-board/choose-board-component.component';
import {GameComponent} from './components/game/game-component.component';
import {HelpComponent} from './components/help/help.component';
import {LayoutListComponent} from './components/layout-list/layout-list.component';
import {LayoutListItemComponent} from './components/layout-list-item/layout-list-item.component';
import {BoardComponent} from './components/board/board.component';
import {DurationPipe} from './pipes/duration.pipe';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {TranslateModule} from '@ngx-translate/core';
import {LayoutService} from './service/layout.service';
import {TilesInfoComponent} from './components/tiles-info/tiles-info.component';
import {TooltipModule} from './modules/tooltip/tooltip.module';
import {SettingsComponent} from './components/settings/settings.component';
import {ImageSetLoaderComponent} from './components/image-set-loader/image-set-loader.component';
import {TileComponent} from './components/tile/tile.component';
import {SvgdefService} from './service/svgdef.service';

describe('AppComponent', () => {
	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [
				AppComponent,
				ChooseBoardComponent,
				GameComponent,
				HelpComponent,
				LayoutListComponent,
				LayoutListItemComponent,
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
				TooltipModule,
				HttpClientModule,
				TranslateModule.forRoot()
			],
			providers: [
				SvgdefService,
				LayoutService
			]
		}).compileComponents();
	}));
	it('should create the app', async(() => {
		const fixture = TestBed.createComponent(AppComponent);
		const app = fixture.debugElement.componentInstance;
		expect(app).toBeTruthy();
	}));
	// it(`should have as title 'app'`, async(() => {
	// 	const fixture = TestBed.createComponent(AppComponent);
	// 	const app = fixture.debugElement.componentInstance;
	// 	expect(app.title).toEqual('app');
	// }));
	// it('should render title in a h1 tag', async(() => {
	// 	const fixture = TestBed.createComponent(AppComponent);
	// 	fixture.detectChanges();
	// 	const compiled = fixture.debugElement.nativeElement;
	// 	expect(compiled.querySelector('h1').textContent).toContain('Welcome to app!');
	// }));
});
