import {HttpClientModule} from '@angular/common/http';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TranslateModule} from '@ngx-translate/core';
import {MockComponent} from 'ng-mocks';
import {AppService} from '../../service/app.service';
import {SvgdefService} from '../../service/svgdef.service';
import {ChooseLayoutComponent} from '../choose-layout/choose-layout.component';
import {HelpComponent} from '../help/help.component';
import {SettingsComponent} from '../settings/settings.component';
import {TilesInfoComponent} from '../tiles-info/tiles-info.component';
import {CoreModule} from '../../modules/core/core.module';
import {GameComponent} from './game-component.component';

describe('GameComponent', () => {
	let component: GameComponent;
	let fixture: ComponentFixture<GameComponent>;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			declarations: [
				GameComponent,
				MockComponent(HelpComponent),
				MockComponent(SettingsComponent),
				MockComponent(TilesInfoComponent),
				MockComponent(ChooseLayoutComponent)
			],
			imports: [HttpClientModule, CoreModule, TranslateModule.forRoot()],
			providers: [SvgdefService, AppService]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(GameComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', async () => {
		expect(component).toBeTruthy();
	});

});
