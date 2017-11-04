import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {ChooseBoardComponent} from './choose-board-component.component';

describe('ChooseBoardComponent', () => {
	let component: ChooseBoardComponent;
	let fixture: ComponentFixture<ChooseBoardComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [ChooseBoardComponent]
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(ChooseBoardComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
