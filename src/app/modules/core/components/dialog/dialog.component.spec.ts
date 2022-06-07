import {HttpClientModule} from '@angular/common/http';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TranslateModule} from '@ngx-translate/core';
import {DialogComponent} from './dialog.component';

describe('DialogComponent', () => {
	let component: DialogComponent;
	let fixture: ComponentFixture<DialogComponent>;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			declarations: [DialogComponent],
			imports: [HttpClientModule, TranslateModule.forRoot()],
			providers: []
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(DialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', async () => {
		expect(component).toBeTruthy();
	});
});
