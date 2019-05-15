import {HttpClientModule} from '@angular/common/http';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {SvgdefService} from '../../service/svgdef.service';
import {ImageSetLoaderComponent} from '../image-set-loader/image-set-loader.component';
import {TileComponent} from './tile.component';

describe('TileComponent', () => {
	let component: TileComponent;
	let fixture: ComponentFixture<TileComponent>;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			declarations: [TileComponent, ImageSetLoaderComponent],
			imports: [HttpClientModule],
			providers: [SvgdefService]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(TileComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', async () =>
		expect(component).toBeTruthy());
});
