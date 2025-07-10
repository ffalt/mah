import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { LayoutPreviewComponent } from './layout-preview.component';

describe('LayoutPreviewComponent', () => {
	let component: LayoutPreviewComponent;
	let fixture: ComponentFixture<LayoutPreviewComponent>;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			declarations: [LayoutPreviewComponent],
			imports: [],
			providers: []
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(LayoutPreviewComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', async () => {
		expect(component).toBeTruthy();
	});
});
