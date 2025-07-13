import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { CacheItem, SvgdefService } from './svgdef.service';
import { of, throwError } from 'rxjs';
import * as tilesets from '../model/tilesets';

// Mock the tilesets module
jest.mock('../model/tilesets', () => ({
	imageSetIsKyodai: jest.fn(),
	buildKyodaiSVG: jest.fn()
}));

interface HackSvgdefService {
	cache: Record<string, CacheItem>;
}

describe('SvgdefService', () => {
	let service: SvgdefService;
	let mockHttpClient: jest.Mocked<HttpClient>;

	beforeEach(() => {
		// Create mock for HttpClient
		mockHttpClient = {
			get: jest.fn()
		} as unknown as jest.Mocked<HttpClient>;

		// Configure TestBed
		TestBed.configureTestingModule({
			providers: [
				SvgdefService,
				{ provide: HttpClient, useValue: mockHttpClient }
			]
		});

		// Get the service
		service = TestBed.inject(SvgdefService);

		// Reset mocks
		jest.clearAllMocks();
	});

	describe('initialization', () => {
		it('should be created', () => {
			expect(service).toBeTruthy();
		});

		it('should initialize with empty cache', () => {
			// Access private cache property for testing
			const cache = (service as unknown as HackSvgdefService).cache;
			expect(cache).toEqual({});
		});
	});

	describe('get', () => {
		it('should return Kyodai SVG when imageSetIsKyodai returns true', async () => {
			// Arrange
			const kyodaiSvg = '<svg><defs></defs></svg>';
			const kyodaiUrl = 'https://example.com/kyodai.jpg';
			(tilesets.imageSetIsKyodai as jest.Mock).mockReturnValue(true);
			(tilesets.buildKyodaiSVG as jest.Mock).mockResolvedValue(kyodaiSvg);

			// Act
			const result = await service.get('kyodai', kyodaiUrl);

			// Assert
			expect(result).toBe(kyodaiSvg);
			expect(tilesets.imageSetIsKyodai).toHaveBeenCalledWith('kyodai');
			expect(tilesets.buildKyodaiSVG).toHaveBeenCalledWith(kyodaiUrl);
			expect(mockHttpClient.get).not.toHaveBeenCalled();
		});

		it('should return cached data if available', async () => {
			// Arrange
			const cachedSvg = '<svg>cached</svg>';
			(tilesets.imageSetIsKyodai as jest.Mock).mockReturnValue(false);

			// Set up cache with data
			(service as unknown as HackSvgdefService).cache = {
				'test-set': { data: cachedSvg }
			};

			// Act
			const result = await service.get('test-set');

			// Assert
			expect(result).toBe(cachedSvg);
			expect(tilesets.imageSetIsKyodai).toHaveBeenCalledWith('test-set');
			expect(mockHttpClient.get).not.toHaveBeenCalled();
		});

		it('should return pending request if one is in progress', async () => {
			// Arrange
			const pendingSvg = '<svg>pending</svg>';
			const pendingPromise = Promise.resolve(pendingSvg);
			(tilesets.imageSetIsKyodai as jest.Mock).mockReturnValue(false);

			// Set up cache with pending request
			(service as unknown as HackSvgdefService).cache = {
				'test-set': { request: pendingPromise }
			};

			// Act
			const result = await service.get('test-set');

			// Assert
			expect(result).toBe(pendingSvg);
			expect(tilesets.imageSetIsKyodai).toHaveBeenCalledWith('test-set');
			expect(mockHttpClient.get).not.toHaveBeenCalled();
		});

		it('should fetch SVG from HTTP if not cached', async () => {
			// Arrange
			const httpSvg = '<svg>http</svg>';
			(tilesets.imageSetIsKyodai as jest.Mock).mockReturnValue(false);
			mockHttpClient.get.mockReturnValue(of(httpSvg));

			// Act
			const result = await service.get('test-set');

			// Assert
			expect(result).toBe(httpSvg);
			expect(tilesets.imageSetIsKyodai).toHaveBeenCalledWith('test-set');
			expect(mockHttpClient.get).toHaveBeenCalledWith('assets/svg/test-set.svg', { responseType: 'text' });

			// Verify cache was updated
			const cache = (service as unknown as HackSvgdefService).cache;
			expect(cache['test-set'].data).toBe(httpSvg);
			expect(cache['test-set'].request).toBeUndefined();
		});

		it('should handle HTTP errors', async () => {
			// Arrange
			const error = new Error('HTTP error');
			(tilesets.imageSetIsKyodai as jest.Mock).mockReturnValue(false);
			mockHttpClient.get.mockReturnValue(throwError(() => error));

			// Act & Assert
			await expect(service.get('test-set')).rejects.toThrow('HTTP error');
			expect(tilesets.imageSetIsKyodai).toHaveBeenCalledWith('test-set');
			expect(mockHttpClient.get).toHaveBeenCalledWith('assets/svg/test-set.svg', { responseType: 'text' });
		});

		it('should handle errors from buildKyodaiSVG', async () => {
			// Arrange
			const error = new Error('Kyodai error');
			(tilesets.imageSetIsKyodai as jest.Mock).mockReturnValue(true);
			(tilesets.buildKyodaiSVG as jest.Mock).mockRejectedValue(error);

			// Act & Assert
			await expect(service.get('kyodai')).rejects.toThrow('Kyodai error');
			expect(tilesets.imageSetIsKyodai).toHaveBeenCalledWith('kyodai');
			expect(tilesets.buildKyodaiSVG).toHaveBeenCalledWith(undefined);
			expect(mockHttpClient.get).not.toHaveBeenCalled();
		});
	});
});
