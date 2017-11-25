import {TestBed, inject} from '@angular/core/testing';

import {SvgdefService} from './svgdef.service';

describe('SvgdefService', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [SvgdefService]
		});
	});

	it('should be created', inject([SvgdefService], (service: SvgdefService) => {
		expect(service).toBeTruthy();
	}));
});
