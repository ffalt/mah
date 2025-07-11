import { inject, TestBed } from '@angular/core/testing';
import { AppService } from './app.service';
import { TranslateModule } from '@ngx-translate/core';

describe('AppService', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [AppService],
			imports: [TranslateModule.forRoot()]
		});
	});

	it('should be created', inject([AppService], (service: AppService) => {
		expect(service).toBeTruthy();
	}));
});
