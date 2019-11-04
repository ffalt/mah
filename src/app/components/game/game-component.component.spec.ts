import {HttpClientModule} from '@angular/common/http';
import {Component} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';
import {MockComponent, MockPipe} from 'ng-mocks';
import {DurationPipe} from '../../pipes/duration.pipe';
import {AppService} from '../../service/app.service';
import {SvgdefService} from '../../service/svgdef.service';
import {BoardComponent} from '../board/board.component';
import {ChooseLayoutComponent} from '../choose-layout/choose-layout.component';
import {HelpComponent} from '../help/help.component';
import {SettingsComponent} from '../settings/settings.component';
import {TilesInfoComponent} from '../tiles-info/tiles-info.component';
import {GameComponent} from './game-component.component';

describe('GameComponent', () => {

	// noinspection AngularMissingOrInvalidDeclarationInModule
	@Component({
		selector: 'app-game-component-host-component',
		template: '<app-game-component [layouts]="mocklayouts"></app-game-component>'
	})
	class TestGameComponentHostComponent {
		mocklayouts = {items: []};
	}

	let component: TestGameComponentHostComponent;
	let fixture: ComponentFixture<TestGameComponentHostComponent>;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			declarations: [
				TestGameComponentHostComponent, GameComponent,
				MockComponent(BoardComponent),
				MockComponent(HelpComponent),
				MockComponent(SettingsComponent),
				MockComponent(TilesInfoComponent),
				MockComponent(ChooseLayoutComponent),
				MockPipe(DurationPipe)
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
