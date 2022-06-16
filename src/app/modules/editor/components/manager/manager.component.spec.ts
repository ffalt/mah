import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TranslateModule} from '@ngx-translate/core';
import {CoreModule} from '../../../core/core.module';
import {LayoutService} from '../../../../service/layout.service';
import {WorkerService} from '../../../../service/worker.service';
import {ManagerComponent} from './manager.component';

describe('ManagerComponent', () => {
	let component: ManagerComponent;
	let fixture: ComponentFixture<ManagerComponent>;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			declarations: [ManagerComponent],
			imports: [HttpClientTestingModule, CoreModule, TranslateModule.forRoot()],
			providers: [LayoutService, WorkerService]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(ManagerComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', async () => {
		expect(component).toBeTruthy();
	});

});
