import fs from 'node:fs';
import path from 'node:path';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { generatePatternList, PatternService } from './pattern.service';

function getPatternsDirectory(): string {
	// This spec file lives in src/app/service -> assets is at src/assets
	return path.resolve(__dirname, '../../assets/patterns');
}

function listJsonBaseNames(directory: string): Array<string> {
	const files = fs.readdirSync(directory, { withFileTypes: true });
	return files
		.filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith('.json'))
		.map(entry => entry.name.replace(/\.json$/i, ''))
		.sort();
}

describe('generatePatternList vs assets/patterns/*.json', () => {
	const patternsDirectory = getPatternsDirectory();
	const filesystemIds = new Set(listJsonBaseNames(patternsDirectory));
	const generated = generatePatternList();
	const generatedIds = new Set(generated.map(p => p.id));

	it('has a JSON file for every generated id', () => {
		const missingFiles: Array<string> = [];
		for (const id of generatedIds) {
			if (!filesystemIds.has(id)) {
				missingFiles.push(`${id}.json`);
			}
		}
		expect(missingFiles).toEqual([]);
	});

	it('includes every JSON file in the generated list', () => {
		const notListed: Array<string> = [];
		for (const id of filesystemIds) {
			if (!generatedIds.has(id)) {
				notListed.push(id);
			}
		}
		expect(notListed).toEqual([]);
	});
});

interface CacheItem {
	data?: string;
	request?: Promise<string>;
}

interface HackHttpCache {
	cache: Record<string, CacheItem>;
}

interface HackPatternService {
	cache: HackHttpCache;
}

describe('PatternService', () => {
	let service: PatternService;
	let mockHttpClient: jest.Mocked<HttpClient>;

	beforeEach(() => {
		// Create mock for HttpClient
		mockHttpClient = {
			get: jest.fn()
		} as unknown as jest.Mocked<HttpClient>;

		// Configure TestBed
		TestBed.configureTestingModule({
			providers: [
				PatternService,
				{ provide: HttpClient, useValue: mockHttpClient }
			]
		});

		// Get the service
		service = TestBed.inject(PatternService);

		// Reset mocks
		jest.clearAllMocks();
	});

	describe('initialization', () => {
		it('should be created', () => {
			expect(service).toBeTruthy();
		});

		it('should initialize with empty cache', () => {
			// Access private cache property for testing
			const cache = (service as unknown as HackPatternService).cache.cache;
			expect(cache).toEqual({});
		});
	});

	describe('get', () => {
		it('should return cached data if available', async () => {
			// Arrange
			const cachedJson = '{"path":["M0,0"],"width":100,"height":100}';

			// Set up cache with data
			(service as unknown as HackPatternService).cache.cache = {
				'assets/patterns/test-pattern.json': { data: cachedJson }
			};

			// Act
			const result = await service.get('test-pattern');

			// Assert
			expect(result).toBe(cachedJson);
			expect(mockHttpClient.get).not.toHaveBeenCalled();
		});

		it('should return pending request if one is in progress', async () => {
			// Arrange
			const pendingJson = '{"path":["M0,0"],"width":100,"height":100}';
			const pendingPromise = Promise.resolve(pendingJson);

			// Set up cache with pending request
			(service as unknown as HackPatternService).cache.cache = {
				'assets/patterns/test-pattern.json': { request: pendingPromise }
			};

			// Act
			const result = await service.get('test-pattern');

			// Assert
			expect(result).toBe(pendingJson);
			expect(mockHttpClient.get).not.toHaveBeenCalled();
		});

		it('should fetch pattern from HTTP if not cached', async () => {
			// Arrange
			const httpJson = '{"path":["M0,0"],"width":100,"height":100}';
			mockHttpClient.get.mockReturnValue(of(httpJson));

			// Act
			const result = await service.get('test-pattern');

			// Assert
			expect(result).toBe(httpJson);
			expect(mockHttpClient.get).toHaveBeenCalledWith('assets/patterns/test-pattern.json', { responseType: 'text' });

			// Verify cache was updated
			const cache = (service as unknown as HackPatternService).cache.cache;
			expect(cache['assets/patterns/test-pattern.json'].data).toBe(httpJson);
		});

		it('should handle HTTP errors', async () => {
			// Arrange
			const error = new Error('HTTP error');
			mockHttpClient.get.mockReturnValue(throwError(() => error));

			// Act & Assert
			await expect(service.get('test-pattern')).rejects.toThrow('HTTP error');
			expect(mockHttpClient.get).toHaveBeenCalledWith('assets/patterns/test-pattern.json', { responseType: 'text' });

			// Verify cache was cleaned up after error
			const cache = (service as unknown as HackPatternService).cache.cache;
			expect(cache['assets/patterns/test-pattern.json']).toBeUndefined();
		});

		it('should prevent race condition by sharing pending requests', async () => {
			// Arrange
			const httpJson = '{"path":["M0,0"],"width":100,"height":100}';
			mockHttpClient.get.mockReturnValue(of(httpJson));

			// Act - Make two requests in quick succession
			const promise1 = service.get('test-pattern');
			const promise2 = service.get('test-pattern');

			// Wait for both to resolve
			const [result1, result2] = await Promise.all([promise1, promise2]);

			// Assert - Both should get the same result
			expect(result1).toBe(httpJson);
			expect(result2).toBe(httpJson);

			// Verify HTTP was only called once - this is the key assertion for race condition fix
			// If race condition existed, we'd see 2 calls
			expect(mockHttpClient.get).toHaveBeenCalledTimes(1);
		});

		it('should handle simultaneous requests with cache hit', async () => {
			// Arrange
			const cachedJson = '{"path":["M0,0"],"width":100,"height":100}';

			// Set up cache with data
			(service as unknown as HackPatternService).cache.cache = {
				'assets/patterns/test-pattern.json': { data: cachedJson }
			};

			// Act - Make two simultaneous requests
			const promise1 = service.get('test-pattern');
			const promise2 = service.get('test-pattern');

			// Assert - Both should return the same data
			expect(promise1).not.toBe(promise2); // Different promises but same value
			const [result1, result2] = await Promise.all([promise1, promise2]);
			expect(result1).toBe(cachedJson);
			expect(result2).toBe(cachedJson);

			// Verify HTTP was not called
			expect(mockHttpClient.get).not.toHaveBeenCalled();
		});

		it('should allow retry after failed request', async () => {
			// Arrange
			const error = new Error('First attempt failed');
			const successJson = '{"path":["M0,0"],"width":100,"height":100}';

			// First call fails
			mockHttpClient.get.mockReturnValueOnce(throwError(() => error));

			// Act - First request fails
			await expect(service.get('test-pattern')).rejects.toThrow('First attempt failed');

			// Verify cache was cleaned
			let cache = (service as unknown as HackPatternService).cache.cache;
			expect(cache['assets/patterns/test-pattern.json']).toBeUndefined();

			// Second call succeeds
			mockHttpClient.get.mockReturnValueOnce(of(successJson));

			// Act - Retry request
			const result = await service.get('test-pattern');

			// Assert
			expect(result).toBe(successJson);
			expect(mockHttpClient.get).toHaveBeenCalledTimes(2);

			// Verify cache was updated
			cache = (service as unknown as HackPatternService).cache.cache;
			expect(cache['assets/patterns/test-pattern.json'].data).toBe(successJson);
		});
	});

	describe('svgDataUrl', () => {
		it('should call get and return data URL', async () => {
			// Arrange
			const patternJson = '{"path":["M0,0"],"width":100,"height":100,"mode":"fill"}';
			const colors = ['#FF0000', '#00FF00'];

			jest.spyOn(service, 'get').mockResolvedValue(patternJson);

			// Act
			const result = await service.svgDataUrl('test-pattern', colors);

			// Assert
			expect(service.get).toHaveBeenCalledWith('test-pattern');
			expect(result).toContain('url("data:image/svg+xml;utf8,');
		});
	});
});
