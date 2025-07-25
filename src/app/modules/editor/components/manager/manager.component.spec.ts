import { provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { LayoutService } from '../../../../service/layout.service';
import { WorkerService } from '../../../../service/worker.service';
import { ManagerComponent } from './manager.component';

describe('ManagerComponent', () => {
	let component: ManagerComponent;
	let fixture: ComponentFixture<ManagerComponent>;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			imports: [ManagerComponent, TranslateModule.forRoot()],
			providers: [provideHttpClient(), provideHttpClientTesting(), LayoutService, WorkerService]
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
