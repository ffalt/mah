import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {LayoutListComponent} from './layout-list.component';

describe('LayoutListComponent', () => {
	let component: LayoutListComponent;
	let fixture: ComponentFixture<LayoutListComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [LayoutListComponent]
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(LayoutListComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
