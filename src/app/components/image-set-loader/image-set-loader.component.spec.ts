import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, HttpClient } from '@angular/common/http';
import { SvgdefService } from '../../service/svgdef.service';
import { ImageSetLoaderComponent } from './image-set-loader.component';
import type { ElementRef } from '@angular/core';

interface HackImageSetLoaderComponent {
	elementRef: ElementRef;

	getImageSet(): void;

	loadImageSet(): void;

	setError(): void;

	setLoading(): void;

	prepareDefs(svg: string): string;

	setImageSet(svg: string): void;
}

describe('ImageSetLoaderComponent', () => {
	let component: ImageSetLoaderComponent;
	let fixture: ComponentFixture<ImageSetLoaderComponent>;
	let httpClientSpy: { get: jest.Mock };
	let SvgdefServiceSpy: { get: jest.Mock };

	beforeEach(async () => {
		httpClientSpy = {
			get: jest.fn()
		};
		SvgdefServiceSpy = {
			get: jest.fn()
		};

		await TestBed.configureTestingModule({
			providers: [
				provideHttpClient(),
				SvgdefService,
				{ provide: SvgdefService, useValue: SvgdefServiceSpy },
				{ provide: HttpClient, useValue: httpClientSpy }
			]
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(ImageSetLoaderComponent);
		component = fixture.componentInstance;
		TestBed.runInInjectionContext(() => {
			fixture.detectChanges();
		});
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('Input properties', () => {
		it('should accept imageSet input', () => {
			const testImageSet = 'test-image-set';
			fixture.componentRef.setInput('imageSet', testImageSet);
			fixture.detectChanges();

			expect(component.imageSet()).toBe(testImageSet);
		});

		it('should accept kyodaiUrl input', () => {
			const testUrl = 'http://example.com/kyodai';
			fixture.componentRef.setInput('kyodaiUrl', testUrl);
			fixture.detectChanges();

			expect(component.kyodaiUrl()).toBe(testUrl);
		});

		it('should accept prefix input', () => {
			const testPrefix = 'test-prefix-';
			fixture.componentRef.setInput('prefix', testPrefix);
			fixture.detectChanges();

			expect(component.prefix()).toBe(testPrefix);
		});

		it('should have default value for dark input', () => {
			expect(component.dark()).toBe(false);
		});

		it('should accept dark input override', () => {
			fixture.componentRef.setInput('dark', true);
			fixture.detectChanges();

			expect(component.dark()).toBe(true);
		});
	});

	describe('ngOnChanges', () => {
		it('should call getImageSet when changes occur', () => {
			const getImageSetSpy = jest.spyOn(component as unknown as HackImageSetLoaderComponent, 'getImageSet');
			component.ngOnChanges({});
			expect(getImageSetSpy).toHaveBeenCalled();
		});
	});

	describe('prepareDefs', () => {
		it('should extract and transform SVG defs content', () => {
			fixture.componentRef.setInput('prefix', 'test-prefix-');
			fixture.detectChanges();

			const testSvg = '<svg><defs><use id="t_do1" xlink:href="./test.svg"></use></defs></svg>';
			const result = (component as unknown as HackImageSetLoaderComponent).prepareDefs(testSvg);

			expect(result).toContain('id="test-prefix-t_do1"');
			expect(result).toContain('xlink:href="assets/svg/test.svg"');
		});
	});

	describe('Service interactions', () => {
		it('should call svgDef.get with correct parameters', async () => {
			const testImageSet = 'test-image-set';
			const testUrl = 'http://example.com/kyodai';
			const testSvg = '<svg><defs>Test SVG content</defs></svg>';

			fixture.componentRef.setInput('imageSet', testImageSet);
			fixture.componentRef.setInput('kyodaiUrl', testUrl);
			fixture.detectChanges();

			SvgdefServiceSpy.get.mockResolvedValue(testSvg);
			jest.spyOn(component as unknown as HackImageSetLoaderComponent, 'setImageSet');

			(component as unknown as HackImageSetLoaderComponent).loadImageSet();

			expect(SvgdefServiceSpy.get).toHaveBeenCalledWith(testImageSet, testUrl);

			// Wait for the promise to resolve
			await fixture.whenStable();
			expect((component as unknown as HackImageSetLoaderComponent).setImageSet).toHaveBeenCalledWith(testSvg);
		});

		it('should call setError when svgDef.get fails', async () => {
			const testImageSet = 'test-image-set';
			const originalConsoleError = console.error;
			console.error = jest.fn();

			fixture.componentRef.setInput('imageSet', testImageSet);
			fixture.detectChanges();

			SvgdefServiceSpy.get.mockRejectedValue('Error loading SVG');
			jest.spyOn(component as unknown as HackImageSetLoaderComponent, 'setError');
			jest.spyOn(console, 'error');

			(component as unknown as HackImageSetLoaderComponent).loadImageSet();

			// Wait for the promise to reject
			await fixture.whenStable();
			expect((component as unknown as HackImageSetLoaderComponent).setError).toHaveBeenCalled();
			expect(console.error).toHaveBeenCalled();
			console.error = originalConsoleError;
		});
	});

	describe('Dark mode handling', () => {
		it('should append -black to imageSet when dark mode is enabled', () => {
			const testImageSet = 'test-image-set';

			fixture.componentRef.setInput('imageSet', testImageSet);
			fixture.componentRef.setInput('dark', true);
			fixture.detectChanges();

			SvgdefServiceSpy.get.mockResolvedValue('<svg><defs></defs></svg>');

			(component as unknown as HackImageSetLoaderComponent).loadImageSet();

			expect(SvgdefServiceSpy.get).toHaveBeenCalledWith(`${testImageSet}-black`, undefined);
		});
	});

	describe('DOM manipulation', () => {
		it('should update innerHTML when setImageSet is called', () => {
			const testSvg = '<svg><defs><use id="test"></use></defs></svg>';
			const mockElementReference = {
				nativeElement: {
					innerHTML: ''
				}
			};

			jest.spyOn(component as unknown as HackImageSetLoaderComponent, 'prepareDefs').mockReturnValue('<use id="test"></use>');
			(component as unknown as HackImageSetLoaderComponent).elementRef = mockElementReference as ElementRef;

			jest.useFakeTimers();

			(component as unknown as HackImageSetLoaderComponent).setImageSet(testSvg);

			// We need to wait for the setTimeout
			jest.advanceTimersByTime(2);

			expect(mockElementReference.nativeElement.innerHTML).toBe('<use id="test"></use>');

			jest.useRealTimers();
		});
	});

	describe('Loading state', () => {
		it('should set loading state with spinner icons', () => {
			jest.spyOn(component as unknown as HackImageSetLoaderComponent, 'setImageSet');

			(component as unknown as HackImageSetLoaderComponent).setLoading();

			expect((component as unknown as HackImageSetLoaderComponent).setImageSet).toHaveBeenCalled();
			const setImageSet = (component as unknown as HackImageSetLoaderComponent).setImageSet;
			const svgContent = (setImageSet as unknown as jest.SpyInstance<void, [string]>).mock.calls[0][0];
			expect(svgContent).toContain('mah-tile-spinner');
		});
	});

	describe('Error state', () => {
		it('should set error state with error icons', () => {
			jest.spyOn(component as unknown as HackImageSetLoaderComponent, 'setImageSet');

			(component as unknown as HackImageSetLoaderComponent).setError();

			expect((component as unknown as HackImageSetLoaderComponent).setImageSet).toHaveBeenCalled();
			const setImageSet = (component as unknown as HackImageSetLoaderComponent).setImageSet;
			const svgContent = (setImageSet as unknown as jest.SpyInstance<void, [string]>).mock.calls[0][0];
			expect(svgContent).toContain('mah-error-icon');
		});
	});

	describe('getImageSet', () => {
		it('should not proceed if imageSet is not set', () => {
			fixture.componentRef.setInput('imageSet', undefined);
			fixture.detectChanges();

			jest.spyOn(component as unknown as HackImageSetLoaderComponent, 'setLoading');

			(component as unknown as HackImageSetLoaderComponent).getImageSet();

			expect((component as unknown as HackImageSetLoaderComponent).setLoading).not.toHaveBeenCalled();
		});

		it('should call setLoading and loadImageSet when imageSet is set', () => {
			const testImageSet = 'test-image-set';

			fixture.componentRef.setInput('imageSet', testImageSet);
			fixture.detectChanges();

			jest.spyOn(component as unknown as HackImageSetLoaderComponent, 'setLoading');
			jest.spyOn(component as unknown as HackImageSetLoaderComponent, 'loadImageSet');
			SvgdefServiceSpy.get.mockResolvedValue('<svg><defs></defs></svg>');

			jest.useFakeTimers();

			(component as unknown as HackImageSetLoaderComponent).getImageSet();

			expect((component as unknown as HackImageSetLoaderComponent).setLoading).toHaveBeenCalled();

			// We need to wait for the setTimeout
			jest.advanceTimersByTime(2);

			expect((component as unknown as HackImageSetLoaderComponent).loadImageSet).toHaveBeenCalled();

			jest.useRealTimers();
		});
	});
});
