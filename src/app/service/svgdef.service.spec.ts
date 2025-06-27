import { HttpClientModule } from '@angular/common/http';
import { inject, TestBed } from '@angular/core/testing';
import { SvgdefService } from './svgdef.service';

describe('SvgdefService', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [SvgdefService],
			imports: [HttpClientModule]
		});
	});

	it('should be created', inject([SvgdefService], (service: SvgdefService) => {
		expect(service).toBeTruthy();
	}));
});
