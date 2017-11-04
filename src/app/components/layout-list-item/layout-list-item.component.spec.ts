import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {LayoutListItemComponent} from './layout-list-item.component';

describe('LayoutListItemComponent', () => {
	let component: LayoutListItemComponent;
	let fixture: ComponentFixture<LayoutListItemComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [LayoutListItemComponent]
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(LayoutListItemComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
