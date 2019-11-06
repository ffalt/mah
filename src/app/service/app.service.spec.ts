import {inject, TestBed} from '@angular/core/testing';
import {TranslateModule} from '@ngx-translate/core';
import {AppService} from './app.service';

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
