import { inject, TestBed } from '@angular/core/testing';
import { LocalstorageService } from './localstorage.service';

describe('LocalstorageService', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({ providers: [LocalstorageService] });
	});

	it('should be created', inject([LocalstorageService], (service: LocalstorageService) => {
		expect(service).toBeTruthy();
	}));
});
