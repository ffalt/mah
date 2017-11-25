import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {LayoutListItemComponent} from './layout-list-item.component';
import {Layout} from '../../model/layouts';
import {Component} from '@angular/core';

describe('LayoutListItemComponent', () => {

	@Component({
		selector: 'app-layout-list-item-host-component',
		template: '<li app-layout-list-item [layout]="mockLayout"></li>'
	})
	class TestLayoutListItemHostComponent {
		mockLayout = new Layout();
	}

	let component: TestLayoutListItemHostComponent;
	let fixture: ComponentFixture<TestLayoutListItemHostComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [TestLayoutListItemHostComponent, LayoutListItemComponent]
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(TestLayoutListItemHostComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

});
