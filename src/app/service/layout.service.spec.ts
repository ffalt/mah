import { inject, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { LayoutService } from './layout.service';

describe('LayoutService', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [provideHttpClient(), LayoutService]
		});
	});

	it('should be created', inject([LayoutService], (service: LayoutService) => {
		expect(service).toBeTruthy();
	}));
});
