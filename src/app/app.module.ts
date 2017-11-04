import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {HttpClientModule} from '@angular/common/http';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from 'ng2-translate';

import {AppComponent} from './app.component';
import {ChooseBoardComponent} from './components/choose-board/choose-board-component.component';
import {GameComponent} from './components/game/game-component.component';
import {HelpComponent} from './components/help/help-component.component';
import {LayoutListComponent} from './components/layout-list/layout-list.component';
import {LayoutListItemComponent} from './components/layout-list-item/layout-list-item.component';
import {BoardComponent} from './components/board/board.component';
import {DurationPipe} from './pipes/duration.pipe';
import {LayoutService} from './service/layout.service';

@NgModule({
	declarations: [
		AppComponent,
		ChooseBoardComponent,
		GameComponent,
		HelpComponent,
		LayoutListComponent,
		LayoutListItemComponent,
		BoardComponent,
		DurationPipe
	],
	imports: [
		BrowserModule,
		FormsModule,
		HttpClientModule,
		TranslateModule.forRoot()
	],
	providers: [
		LayoutService
	],
	bootstrap: [AppComponent]
})
export class AppModule {
}
