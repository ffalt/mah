import { TestBed } from '@angular/core/testing';
import { DeferLoadService } from './defer-load.service';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';

describe('DeferLoadService', () => {
	let service: DeferLoadService;
	let observeSpy: ReturnType<typeof vi.fn>;
	let unobserveSpy: ReturnType<typeof vi.fn>;
	let observerCallback: (entries: Array<IntersectionObserverEntry>) => void;

	beforeEach(() => {
		observeSpy = vi.fn();
		unobserveSpy = vi.fn();
		vi.stubGlobal('IntersectionObserver', class {
			observe = observeSpy;
			unobserve = unobserveSpy;
			disconnect = vi.fn();

			constructor(callback: (entries: Array<IntersectionObserverEntry>) => void) {
				observerCallback = callback;
			}
		});
		TestBed.configureTestingModule({ providers: [DeferLoadService] });
		service = TestBed.inject(DeferLoadService);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('should create', () => {
		expect(service).toBeTruthy();
	});

	it('should route intersection entries to the observed element handler only', () => {
		const elementA = document.createElement('div');
		const elementB = document.createElement('div');
		const handlerA = vi.fn();
		const handlerB = vi.fn();
		service.observe(elementA, handlerA);
		service.observe(elementB, handlerB);
		expect(observeSpy).toHaveBeenCalledTimes(2);

		const entryA = { target: elementA } as unknown as IntersectionObserverEntry;
		const entryOther = { target: document.createElement('div') } as unknown as IntersectionObserverEntry;
		observerCallback([entryA, entryOther]);

		expect(handlerA).toHaveBeenCalledWith(entryA);
		expect(handlerA).toHaveBeenCalledTimes(1);
		expect(handlerB).not.toHaveBeenCalled();
	});

	it('should stop routing after unobserve', () => {
		const element = document.createElement('div');
		const handler = vi.fn();
		service.observe(element, handler);

		service.unobserve(element);
		expect(unobserveSpy).toHaveBeenCalledWith(element);

		observerCallback([{ target: element } as unknown as IntersectionObserverEntry]);
		expect(handler).not.toHaveBeenCalled();
	});
});
