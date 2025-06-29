import { inject, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { SvgdefService } from './svgdef.service';

describe('SvgdefService', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [provideHttpClient(), SvgdefService]
		});
	});

	it('should be created', inject([SvgdefService], (service: SvgdefService) => {
		expect(service).toBeTruthy();
	}));
});
