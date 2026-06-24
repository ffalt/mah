import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { KYODAI_TILES, SvgdefService } from './svgdef.service';
import { of, throwError } from 'rxjs';
import { Mocked } from 'vitest';

interface CacheItem {
	data?: string;
	request?: Promise<string>;
}

interface HackHttpCache {
	cache: Record<string, CacheItem>;
}

interface HackSvgdefService {
	cache: HackHttpCache;
}

describe('SvgdefService', () => {
	let service: SvgdefService;
	let mockHttpClient: Mocked<HttpClient>;
	let mockKyodai: { isKyodaiImageSet: ReturnType<typeof vi.fn>; buildKyodaiSVG: ReturnType<typeof vi.fn> };

	beforeEach(() => {
		// Create mock for HttpClient
		mockHttpClient = {
			get: vi.fn()
		} as unknown as Mocked<HttpClient>;

		// Stub the Kyodai tileset helpers
		mockKyodai = {
			isKyodaiImageSet: vi.fn(),
			buildKyodaiSVG: vi.fn()
		};

		// Configure TestBed
		TestBed.configureTestingModule({
			providers: [
				SvgdefService,
				{ provide: HttpClient, useValue: mockHttpClient },
				{ provide: KYODAI_TILES, useValue: mockKyodai }
			]
		});

		service = TestBed.inject(SvgdefService);
	});

	describe('initialization', () => {
		it('should be created', () => {
			expect(service).toBeTruthy();
		});

		it('should initialize with empty cache', () => {
			// Access private cache property for testing
			const cache = (service as unknown as HackSvgdefService).cache.cache;
			expect(cache).toEqual({});
		});
	});

	describe('get', () => {
		it('should return Kyodai SVG when isKyodaiImageSet returns true', async () => {
			// Arrange
			const kyodaiSvg = '<svg><defs></defs></svg>';
			const kyodaiUrl = 'https://example.com/kyodai.jpg';
			mockKyodai.isKyodaiImageSet.mockReturnValue(true);
			mockKyodai.buildKyodaiSVG.mockResolvedValue(kyodaiSvg);

			// Act
			const result = await service.get('kyodai', kyodaiUrl);

			// Assert
			expect(result).toBe(kyodaiSvg);
			expect(mockKyodai.isKyodaiImageSet).toHaveBeenCalledWith('kyodai');
			expect(mockKyodai.buildKyodaiSVG).toHaveBeenCalledWith(kyodaiUrl);
			expect(mockHttpClient.get).not.toHaveBeenCalled();
		});

		it('should return cached data if available', async () => {
			// Arrange
			const cachedSvg = '<svg>cached</svg>';
			mockKyodai.isKyodaiImageSet.mockReturnValue(false);

			// Set up cache with data
			(service as unknown as HackSvgdefService).cache.cache = {
				'assets/svg/test-set.svg': { data: cachedSvg }
			};

			// Act
			const result = await service.get('test-set');

			// Assert
			expect(result).toBe(cachedSvg);
			expect(mockKyodai.isKyodaiImageSet).toHaveBeenCalledWith('test-set');
			expect(mockHttpClient.get).not.toHaveBeenCalled();
		});

		it('should return pending request if one is in progress', async () => {
			// Arrange
			const pendingSvg = '<svg>pending</svg>';
			const pendingPromise = Promise.resolve(pendingSvg);
			mockKyodai.isKyodaiImageSet.mockReturnValue(false);

			// Set up cache with pending request
			(service as unknown as HackSvgdefService).cache.cache = {
				'assets/svg/test-set.svg': { request: pendingPromise }
			};

			// Act
			const result = await service.get('test-set');

			// Assert
			expect(result).toBe(pendingSvg);
			expect(mockKyodai.isKyodaiImageSet).toHaveBeenCalledWith('test-set');
			expect(mockHttpClient.get).not.toHaveBeenCalled();
		});

		it('should fetch SVG from HTTP if not cached', async () => {
			// Arrange
			const httpSvg = '<svg>http</svg>';
			mockKyodai.isKyodaiImageSet.mockReturnValue(false);
			mockHttpClient.get.mockReturnValue(of(httpSvg));

			// Act
			const result = await service.get('test-set');

			// Assert
			expect(result).toBe(httpSvg);
			expect(mockKyodai.isKyodaiImageSet).toHaveBeenCalledWith('test-set');
			expect(mockHttpClient.get).toHaveBeenCalledWith('assets/svg/test-set.svg', { responseType: 'text' });

			// Verify cache was updated with the SVG data
			const cache = (service as unknown as HackSvgdefService).cache.cache;
			expect(cache['assets/svg/test-set.svg'].data).toBe(httpSvg);
		});

		it('should handle HTTP errors', async () => {
			// Arrange
			const error = new Error('HTTP error');
			mockKyodai.isKyodaiImageSet.mockReturnValue(false);
			mockHttpClient.get.mockReturnValue(throwError(() => error));

			// Act & Assert
			await expect(service.get('test-set')).rejects.toThrow('HTTP error');
			expect(mockKyodai.isKyodaiImageSet).toHaveBeenCalledWith('test-set');
			expect(mockHttpClient.get).toHaveBeenCalledWith('assets/svg/test-set.svg', { responseType: 'text' });

			// Verify cache was cleaned up after error
			const cache = (service as unknown as HackSvgdefService).cache.cache;
			expect(cache['assets/svg/test-set.svg']).toBeUndefined();
		});

		it('should prevent race condition by sharing pending requests', async () => {
			// Arrange
			const httpSvg = '<svg>http</svg>';
			mockKyodai.isKyodaiImageSet.mockReturnValue(false);
			mockHttpClient.get.mockReturnValue(of(httpSvg));

			// Act - Make two simultaneous requests for the same resource
			const promise1 = service.get('test-set');
			const promise2 = service.get('test-set');

			// Assert - Both should return the same data
			expect(promise1).not.toBe(promise2); // Different promises but same value
			const [result1, result2] = await Promise.all([promise1, promise2]);
			expect(result1).toBe(httpSvg);
			expect(result2).toBe(httpSvg);

			// Verify HTTP was only called once
			expect(mockHttpClient.get).toHaveBeenCalledTimes(1);
		});

		it('should handle errors from buildKyodaiSVG', async () => {
			// Arrange
			const error = new Error('Kyodai error');
			mockKyodai.isKyodaiImageSet.mockReturnValue(true);
			mockKyodai.buildKyodaiSVG.mockRejectedValue(error);

			// Act & Assert
			await expect(service.get('kyodai')).rejects.toThrow('Kyodai error');
			expect(mockKyodai.isKyodaiImageSet).toHaveBeenCalledWith('kyodai');
			expect(mockKyodai.buildKyodaiSVG).toHaveBeenCalledWith(undefined);
			expect(mockHttpClient.get).not.toHaveBeenCalled();
		});
	});
});
