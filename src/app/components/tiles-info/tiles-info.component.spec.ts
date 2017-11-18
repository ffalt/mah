import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {TilesInfoComponent} from './tiles-info.component';
import {TranslateModule} from '@ngx-translate/core';

describe('TilesInfoComponent', () => {
	let component: TilesInfoComponent;
	let fixture: ComponentFixture<TilesInfoComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [TilesInfoComponent],
			imports: [
				TranslateModule.forRoot()
			]
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(TilesInfoComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
