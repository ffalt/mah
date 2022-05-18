import {ComponentFixture, TestBed} from '@angular/core/testing';

import {HttpClientModule} from '@angular/common/http';
import {SvgdefService} from '../../../../service/svgdef.service';
import {ImageSetLoaderComponent} from './image-set-loader.component';

describe('ImageSetSvgLoaderComponent', () => {
	let component: ImageSetLoaderComponent;
	let fixture: ComponentFixture<ImageSetLoaderComponent>;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			declarations: [ImageSetLoaderComponent],
			imports: [HttpClientModule],
			providers: [SvgdefService]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(ImageSetLoaderComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', async () => {
		expect(component).toBeTruthy();
	});
});
