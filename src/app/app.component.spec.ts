import {HttpClientModule} from '@angular/common/http';
import {TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {TranslateModule} from '@ngx-translate/core';
import {MockComponent} from 'ng-mocks';
import {AppComponent} from './app.component';
import {GameComponent} from './components/game/game-component.component';
import {AppService} from './service/app.service';
import {LayoutService} from './service/layout.service';
import {SvgdefService} from './service/svgdef.service';

describe('AppComponent', () => {
	beforeEach(async () => TestBed.configureTestingModule({
			declarations: [
				AppComponent,
				MockComponent(GameComponent)
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
