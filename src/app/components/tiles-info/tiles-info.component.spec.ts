import {HttpClientModule} from '@angular/common/http';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TranslateModule} from '@ngx-translate/core';
import {SvgdefService} from '../../service/svgdef.service';
import {ImageSetLoaderComponent} from '../image-set-loader/image-set-loader.component';
import {TileComponent} from '../tile/tile.component';
import {TilesInfoComponent} from './tiles-info.component';

describe('TilesInfoComponent', () => {
	let component: TilesInfoComponent;
	let fixture: ComponentFixture<TilesInfoComponent>;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			declarations: [TileComponent, TilesInfoComponent, ImageSetLoaderComponent],
			providers: [SvgdefService],
			imports: [
				HttpClientModule,
				TranslateModule.forRoot()
			]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(TilesInfoComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', async () =>
		expect(component).toBeTruthy());
});
