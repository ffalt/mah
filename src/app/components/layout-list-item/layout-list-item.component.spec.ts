import {ComponentFixture, TestBed} from '@angular/core/testing';

import {Component} from '@angular/core';
import {Layout} from '../../model/layouts';
import {LayoutListItemComponent} from './layout-list-item.component';

describe('LayoutListItemComponent', () => {

	// noinspection AngularMissingOrInvalidDeclarationInModule
	@Component({
		selector: 'app-layout-list-item-host-component',
		template: '<app-layout-list-item [layout]="mockLayout"></app-layout-list-item>'
	})
	class TestLayoutListItemHostComponent {
		mockLayout = new Layout();
	}

	let component: TestLayoutListItemHostComponent;
	let fixture: ComponentFixture<TestLayoutListItemHostComponent>;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			declarations: [TestLayoutListItemHostComponent, LayoutListItemComponent]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(TestLayoutListItemHostComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', async () =>
		expect(component).toBeTruthy());

});
