import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {TilesInfoComponent} from './tiles-info.component';
import {TranslateModule} from '@ngx-translate/core';
import {TileComponent} from '../tile/tile.component';
import {HttpClientModule} from '@angular/common/http';
import {ImageSetLoaderComponent} from '../image-set-loader/image-set-loader.component';
import {SvgdefService} from '../../service/svgdef.service';

describe('TilesInfoComponent', () => {
	let component: TilesInfoComponent;
	let fixture: ComponentFixture<TilesInfoComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [TileComponent, TilesInfoComponent, ImageSetLoaderComponent],
			providers: [SvgdefService],
			imports: [HttpClientModule,
				TranslateModule.forRoot()
			]
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(TilesInfoComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
