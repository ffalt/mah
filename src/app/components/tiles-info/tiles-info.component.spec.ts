import {HttpClientModule} from '@angular/common/http';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TranslateModule} from '@ngx-translate/core';
import {SvgdefService} from '../../service/svgdef.service';
import {TileComponent} from '../tile/tile.component';
import {CoreModule} from '../../modules/core/core.module';
import {AppService} from '../../service/app.service';
import {TilesInfoComponent} from './tiles-info.component';

describe('TilesInfoComponent', () => {
	let component: TilesInfoComponent;
	let fixture: ComponentFixture<TilesInfoComponent>;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			declarations: [TileComponent, TilesInfoComponent],
			providers: [SvgdefService, AppService],
			imports: [
				HttpClientModule,
				CoreModule,
				TranslateModule.forRoot()
			]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(TilesInfoComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', async () => {
		expect(component).toBeTruthy();
	});
});
