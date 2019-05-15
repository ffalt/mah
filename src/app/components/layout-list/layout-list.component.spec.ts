import {Component} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {Layouts} from '../../model/layouts';
import {LayoutListItemComponent} from '../layout-list-item/layout-list-item.component';
import {LayoutListComponent} from './layout-list.component';

describe('LayoutListComponent', () => {

	// noinspection AngularMissingOrInvalidDeclarationInModule
	@Component({
		selector: 'app-layout-list-host-component',
		template: '<app-layout-list [layouts]="mockLayouts"></app-layout-list>'
	})
	class TestLayoutListHostComponent {
		mockLayouts = new Layouts();
	}

	let component: TestLayoutListHostComponent;
	let fixture: ComponentFixture<TestLayoutListHostComponent>;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			declarations: [TestLayoutListHostComponent, LayoutListItemComponent, LayoutListComponent]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(TestLayoutListHostComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', async () =>
		expect(component).toBeTruthy());

});
