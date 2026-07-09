import '@angular/compiler';
import './vitest.mocks';
import { beforeEach, vi } from 'vitest';

Object.assign(globalThis as Record<string, unknown>, {
	APP_VERSION: 'TEST',
	APP_NAME: 'TEST MAHJONG',
	APP_FEATURE_EDITOR: 'true',
	APP_FEATURE_KYODAI: 'true',
	APP_FEATURE_MOBILE: 'false'
});

beforeEach(() => {
	vi.spyOn(console, 'error').mockImplementation(() => {
		// nop
	});
	vi.spyOn(console, 'warn').mockImplementation(() => {
		// nop
	});
});
