import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {ImageSetLoaderComponent} from './image-set-loader.component';

describe('ImageSetSvgLoaderComponent', () => {
	let component: ImageSetLoaderComponent;
	let fixture: ComponentFixture<ImageSetLoaderComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [ImageSetLoaderComponent]
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(ImageSetLoaderComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
