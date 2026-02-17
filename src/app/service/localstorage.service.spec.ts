import { TestBed } from '@angular/core/testing';
import { LocalstorageService } from './localstorage.service';
import type { GameStateStore, LayoutScoreStore, LoadLayout, SettingsStore } from '../model/types';

describe('LocalstorageService', () => {
	let service: LocalstorageService;
	let localStorageMock: {
		getItem: jest.Mock;
		setItem: jest.Mock;
		removeItem: jest.Mock;
	};
	let originalLocalStorage: Storage;
	let consoleErrorSpy: jest.SpyInstance;

	beforeEach(() => {
		// Save original localStorage
		originalLocalStorage = global.localStorage;

		// Create localStorage mock
		localStorageMock = {
			getItem: jest.fn(),
			setItem: jest.fn(),
			removeItem: jest.fn()
		};

		// Replace localStorage with mock
		Object.defineProperty(window, 'localStorage', {
			value: localStorageMock,
			writable: true
		});

		// Spy on console.error to prevent test output noise
		consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

		// Configure TestBed
		TestBed.configureTestingModule({
			providers: [LocalstorageService]
		});

		// Get the service
		service = TestBed.inject(LocalstorageService);

		jest.resetAllMocks();
	});

	afterEach(() => {
		// Restore original localStorage
		Object.defineProperty(window, 'localStorage', {
			value: originalLocalStorage,
			writable: true
		});

		// Restore console.error
		consoleErrorSpy.mockRestore();

		// Clear all mocks
		jest.clearAllMocks();
	});

	describe('initialization', () => {
		it('should be created', () => {
			expect(service).toBeTruthy();
		});

		it('should call updateData during initialization', () => {
			// Create a new instance to verify constructor behavior
			const updateDataSpy = jest.spyOn(LocalstorageService.prototype as unknown as HackLocalstorgageService, 'updateData');
			const newService = new LocalstorageService();

			expect(newService).toBeTruthy();

			expect(updateDataSpy).toHaveBeenCalled();

			// Clean up
			updateDataSpy.mockRestore();
		});
	});

	describe('getScore', () => {
		it('should get score for a layout', () => {
			const mockScore: LayoutScoreStore = { playCount: 5, bestTime: 1000 };
			localStorageMock.getItem.mockReturnValue(JSON.stringify(mockScore));

			const result = service.getScore('test-layout');

			expect(result).toEqual(mockScore);
			expect(localStorageMock.getItem).toHaveBeenCalledWith('mah.score.test-layout');
		});

		it('should return undefined if no score exists', () => {
			localStorageMock.getItem.mockReturnValue(null);

			const result = service.getScore('test-layout');

			expect(result).toBeUndefined();
			expect(localStorageMock.getItem).toHaveBeenCalledWith('mah.score.test-layout');
		});

		it('should handle localStorage errors', () => {
			localStorageMock.getItem.mockImplementation(() => {
				throw new Error('Test error');
			});

			const result = service.getScore('test-layout');

			expect(result).toBeUndefined();
			expect(localStorageMock.getItem).toHaveBeenCalledWith('mah.score.test-layout');
		});
	});

	describe('getSettings', () => {
		it('should get settings', () => {
			const mockSettings: SettingsStore = {
				lang: 'en',
				sounds: true,
				music: false,
				contrast: false,
				dark: false,
				tileset: 'default',
				theme: 'light',
				background: ''
			};
			localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSettings));

			const result = service.getSettings();

			expect(result).toEqual(mockSettings);
			expect(localStorageMock.getItem).toHaveBeenCalledWith('mah.settings');
		});

		it('should return undefined if no settings exist', () => {
			localStorageMock.getItem.mockReturnValue(null);

			const result = service.getSettings();

			expect(result).toBeUndefined();
			expect(localStorageMock.getItem).toHaveBeenCalledWith('mah.settings');
		});
	});

	describe('getState', () => {
		it('should get game state', () => {
			const mockState: GameStateStore = {
				elapsed: 1000,
				state: 1,
				layout: 'test-layout',
				gameMode: 'GAME_MODE_STANDARD',
				undo: [[0, 0, 0]],
				stones: [[0, 0, 0, 1]]
			};
			localStorageMock.getItem.mockReturnValue(JSON.stringify(mockState));

			const result = service.getState();

			expect(result).toEqual(mockState);
			expect(localStorageMock.getItem).toHaveBeenCalledWith('mah.state');
		});

		it('should return undefined if no state exists', () => {
			localStorageMock.getItem.mockReturnValue(null);

			const result = service.getState();

			expect(result).toBeUndefined();
			expect(localStorageMock.getItem).toHaveBeenCalledWith('mah.state');
		});
	});

	describe('getCustomLayouts', () => {
		it('should get custom layouts', () => {
			const mockLayouts: Array<LoadLayout> = [
				{ id: 'custom1', name: 'Custom 1', cat: 'Test', map: [] }
			];
			localStorageMock.getItem.mockReturnValue(JSON.stringify(mockLayouts));

			const result = service.getCustomLayouts();

			expect(result).toEqual(mockLayouts);
			expect(localStorageMock.getItem).toHaveBeenCalledWith('mah.boards');
		});

		it('should return undefined if no custom layouts exist', () => {
			localStorageMock.getItem.mockReturnValue(null);

			const result = service.getCustomLayouts();

			expect(result).toBeUndefined();
			expect(localStorageMock.getItem).toHaveBeenCalledWith('mah.boards');
		});
	});

	describe('getLastPlayed', () => {
		it('should get last played layout ID', () => {
			localStorageMock.getItem.mockReturnValue('test-layout');

			const result = service.getLastPlayed();

			expect(result).toBe('test-layout');
			expect(localStorageMock.getItem).toHaveBeenCalledWith('mah.last');
		});

		it('should return undefined if no last played layout exists', () => {
			localStorageMock.getItem.mockReturnValue(null);

			const result = service.getLastPlayed();

			expect(result).toBeUndefined();
			expect(localStorageMock.getItem).toHaveBeenCalledWith('mah.last');
		});

		it('should handle localStorage errors', () => {
			localStorageMock.getItem.mockImplementation(() => {
				throw new Error('Test error');
			});

			const result = service.getLastPlayed();

			expect(result).toBeUndefined();
			expect(localStorageMock.getItem).toHaveBeenCalledWith('mah.last');
			expect(consoleErrorSpy).toHaveBeenCalled();
		});

		it('should handle missing localStorage', () => {
			// Temporarily remove localStorage
			Object.defineProperty(window, 'localStorage', {
				value: undefined,
				writable: true
			});

			const result = service.getLastPlayed();

			expect(result).toBeUndefined();
			expect(localStorageMock.getItem).not.toHaveBeenCalled();

			// Restore localStorage mock
			Object.defineProperty(window, 'localStorage', {
				value: localStorageMock,
				writable: true
			});
		});
	});

	describe('storeLastPlayed', () => {
		it('should store last played layout ID', () => {
			service.storeLastPlayed('test-layout');

			expect(localStorageMock.setItem).toHaveBeenCalledWith('mah.last', 'test-layout');
		});

		it('should remove last played layout ID if empty', () => {
			service.storeLastPlayed('');

			expect(localStorageMock.removeItem).toHaveBeenCalledWith('mah.last');
			expect(localStorageMock.setItem).not.toHaveBeenCalled();
		});

		it('should handle localStorage errors', () => {
			localStorageMock.setItem.mockImplementation(() => {
				throw new Error('Test error');
			});

			service.storeLastPlayed('test-layout');

			expect(localStorageMock.setItem).toHaveBeenCalledWith('mah.last', 'test-layout');
			expect(consoleErrorSpy).toHaveBeenCalled();
		});

		it('should handle missing localStorage', () => {
			// Temporarily remove localStorage
			Object.defineProperty(window, 'localStorage', {
				value: undefined,
				writable: true
			});

			service.storeLastPlayed('test-layout');

			expect(localStorageMock.setItem).not.toHaveBeenCalled();

			// Restore localStorage mock
			Object.defineProperty(window, 'localStorage', {
				value: localStorageMock,
				writable: true
			});
		});
	});

	describe('storeScore', () => {
		it('should store score for a layout', () => {
			const mockScore: LayoutScoreStore = { playCount: 5, bestTime: 1000 };

			service.storeScore('test-layout', mockScore);

			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				'mah.score.test-layout',
				JSON.stringify(mockScore)
			);
		});

		it('should remove score if undefined', () => {
			service.storeScore('test-layout', undefined);

			expect(localStorageMock.removeItem).toHaveBeenCalledWith('mah.score.test-layout');
			expect(localStorageMock.setItem).not.toHaveBeenCalled();
		});
	});

	describe('clearScore', () => {
		it('should clear score for a layout', () => {
			service.clearScore('test-layout');

			expect(localStorageMock.removeItem).toHaveBeenCalledWith('mah.score.test-layout');
		});
	});

	describe('storeSettings', () => {
		it('should store settings', () => {
			const mockSettings: SettingsStore = {
				lang: 'en',
				sounds: true,
				music: false,
				contrast: false,
				dark: false,
				tileset: 'default',
				theme: 'light',
				background: ''
			};

			service.storeSettings(mockSettings);

			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				'mah.settings',
				JSON.stringify(mockSettings)
			);
		});

		it('should remove settings if undefined', () => {
			service.storeSettings(undefined);

			expect(localStorageMock.removeItem).toHaveBeenCalledWith('mah.settings');
			expect(localStorageMock.setItem).not.toHaveBeenCalled();
		});
	});

	describe('storeState', () => {
		it('should store game state', () => {
			const mockState: GameStateStore = {
				elapsed: 1000,
				state: 1,
				layout: 'test-layout',
				gameMode: 'GAME_MODE_STANDARD',
				undo: [[0, 0, 0]],
				stones: [[0, 0, 0, 1]]
			};

			service.storeState(mockState);

			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				'mah.state',
				JSON.stringify(mockState)
			);
		});

		it('should remove state if undefined', () => {
			service.storeState(undefined);

			expect(localStorageMock.removeItem).toHaveBeenCalledWith('mah.state');
			expect(localStorageMock.setItem).not.toHaveBeenCalled();
		});
	});

	describe('storeCustomLayouts', () => {
		it('should store custom layouts', () => {
			const mockLayouts: Array<LoadLayout> = [
				{ id: 'custom1', name: 'Custom 1', cat: 'Test', map: [] }
			];

			service.storeCustomLayouts(mockLayouts);

			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				'mah.boards',
				JSON.stringify(mockLayouts)
			);
		});

		it('should remove custom layouts if undefined', () => {
			service.storeCustomLayouts(undefined);

			expect(localStorageMock.removeItem).toHaveBeenCalledWith('mah.boards');
			expect(localStorageMock.setItem).not.toHaveBeenCalled();
		});
	});

	interface HackLocalstorgageService {
		get<T>(key: string): T | undefined;

		set<T>(key: string, data?: T): void;

		updateData(): void;
	}

	describe('private methods', () => {
		describe('get', () => {
			it('should get data from localStorage with prefix', () => {
				localStorageMock.getItem.mockReturnValue(JSON.stringify({ test: 'data' }));

				const result =
					(service as unknown as HackLocalstorgageService)
						.get('test-key');

				expect(result).toEqual({ test: 'data' });
				expect(localStorageMock.getItem).toHaveBeenCalledWith('mah.test-key');
			});

			it('should return undefined if data does not exist', () => {
				localStorageMock.getItem.mockReturnValue(null);

				const result =
					(service as unknown as HackLocalstorgageService).get('test-key');

				expect(result).toBeUndefined();
				expect(localStorageMock.getItem).toHaveBeenCalledWith('mah.test-key');
			});

			it('should handle JSON parse errors', () => {
				localStorageMock.getItem.mockReturnValue('invalid-json');

				const result =
					(service as unknown as HackLocalstorgageService).get('test-key');

				expect(result).toBeUndefined();
				expect(localStorageMock.getItem).toHaveBeenCalledWith('mah.test-key');
			});

			it('should handle missing localStorage', () => {
				// Temporarily remove localStorage
				Object.defineProperty(window, 'localStorage', {
					value: undefined,
					writable: true
				});

				const result =
					(service as unknown as HackLocalstorgageService)
						.get('test-key');

				expect(result).toBeUndefined();
				expect(localStorageMock.getItem).not.toHaveBeenCalled();

				// Restore localStorage mock
				Object.defineProperty(window, 'localStorage', {
					value: localStorageMock,
					writable: true
				});
			});
		});

		describe('set', () => {
			it('should set data in localStorage with prefix', () => {
				const data = { test: 'data' };

				(service as unknown as HackLocalstorgageService)
					.set('test-key', data);

				expect(localStorageMock.setItem).toHaveBeenCalledWith(
					'mah.test-key',
					JSON.stringify(data)
				);
			});

			it('should remove data if undefined', () => {
				(service as unknown as HackLocalstorgageService)
					.set('test-key', undefined);

				expect(localStorageMock.removeItem).toHaveBeenCalledWith('mah.test-key');
				expect(localStorageMock.setItem).not.toHaveBeenCalled();
			});

			it('should handle missing localStorage', () => {
				// Temporarily remove localStorage
				Object.defineProperty(window, 'localStorage', {
					value: undefined,
					writable: true
				});

				(service as unknown as HackLocalstorgageService)
					.set('test-key', { test: 'data' });

				expect(localStorageMock.setItem).not.toHaveBeenCalled();
				expect(localStorageMock.removeItem).not.toHaveBeenCalled();

				// Restore localStorage mock
				Object.defineProperty(window, 'localStorage', {
					value: localStorageMock,
					writable: true
				});
			});
		});

		describe('updateData', () => {
			it('should migrate old data to new format', () => {
				// Setup old data
				localStorageMock.getItem.mockImplementation((key: string) => {
					if (key === 'state') {
						return JSON.stringify({ test: 'state' });
					}
					if (key === 'settings') {
						return JSON.stringify({ test: 'settings' });
					}
					return null;
				});

				// Call updateData
				(service as unknown as HackLocalstorgageService)
					.updateData();

				// Verify old data was removed
				expect(localStorageMock.removeItem).toHaveBeenCalledWith('state');
				expect(localStorageMock.removeItem).toHaveBeenCalledWith('settings');

				// Verify new data was set
				expect(localStorageMock.setItem).toHaveBeenCalledWith(
					'mah.state',
					JSON.stringify({ test: 'state' })
				);
				expect(localStorageMock.setItem).toHaveBeenCalledWith(
					'mah.settings',
					JSON.stringify({ test: 'settings' })
				);
			});

			it('should handle missing old data', () => {
				localStorageMock.getItem.mockReturnValue(null);

				(service as unknown as HackLocalstorgageService)
					.updateData();

				expect(localStorageMock.removeItem).not.toHaveBeenCalled();
				expect(localStorageMock.setItem).not.toHaveBeenCalled();
			});

			it('should handle localStorage errors', () => {
				localStorageMock.getItem.mockImplementation(() => {
					throw new Error('Test error');
				});

				(service as unknown as HackLocalstorgageService)
					.updateData();

				expect(consoleErrorSpy).toHaveBeenCalled();
			});

			it('should handle missing localStorage', () => {
				// Temporarily remove localStorage
				Object.defineProperty(window, 'localStorage', {
					value: undefined,
					writable: true
				});

				(service as unknown as HackLocalstorgageService)
					.updateData();

				expect(localStorageMock.getItem).not.toHaveBeenCalled();
				expect(localStorageMock.setItem).not.toHaveBeenCalled();
				expect(localStorageMock.removeItem).not.toHaveBeenCalled();

				// Restore localStorage mock
				Object.defineProperty(window, 'localStorage', {
					value: localStorageMock,
					writable: true
				});
			});
		});
	});
});
