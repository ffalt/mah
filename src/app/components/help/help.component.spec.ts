import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TranslateModule} from '@ngx-translate/core';
import {AppService} from '../../service/app.service';
import {HelpComponent} from './help.component';

describe('HelpComponent', () => {
	let component: HelpComponent;
	let fixture: ComponentFixture<HelpComponent>;
	beforeEach(async () =>
		TestBed.configureTestingModule({
			declarations: [HelpComponent, HelpComponent],
			imports: [TranslateModule.forRoot()],
			providers: [AppService]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(HelpComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', async () => {
		expect(component).toBeTruthy();
	});

});
