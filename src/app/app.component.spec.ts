import { TestBed } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app.component';
import { AppService } from './service/app.service';
import { LayoutService } from './service/layout.service';
import { SvgdefService } from './service/svgdef.service';
import type { Layout, LoadLayout } from './model/types';

function b64(json: unknown): string {
	return Buffer.from(JSON.stringify(json)).toString('base64');
}

const VALID_MAP = [[0, [[0, 0]]]];

function makeBoard(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
	return { id: 'test-id', name: 'Test Board', map: VALID_MAP, ...overrides };
}

function makeMah(boards: unknown[] = [makeBoard()]): unknown {
	return { mah: '1.0', boards };
}

const MOCK_LAYOUT: Layout = {
	id: 'test-id',
	name: 'Test Board',
	category: 'Classic',
	mapping: [],
	custom: true
};

describe('AppComponent', () => {
	beforeEach(async () => TestBed.configureTestingModule({
		imports: [AppComponent, BrowserModule, TranslateModule.forRoot()],
		providers: [provideHttpClient(), AppService, SvgdefService, LayoutService]
	}).compileComponents());

	it('should create the app', async () => {
		const fixture = TestBed.createComponent(AppComponent);
		const app = fixture.debugElement.componentInstance;
		expect(app).toBeTruthy();
	});

	describe('checkImport', () => {
		let app: AppComponent;
		let layoutService: LayoutService;

		beforeEach(() => {
			const fixture = TestBed.createComponent(AppComponent);
			app = fixture.componentInstance;
			layoutService = app.layoutService;
			layoutService.layouts.items = [];
			jest.spyOn(layoutService, 'expandLayout').mockReturnValue(MOCK_LAYOUT);
			jest.spyOn(layoutService, 'storeCustomBoards').mockImplementation(() => undefined);
		});

		const checkImport = (app: AppComponent, input: string | null): Promise<Array<string>> =>
			(app as unknown as Record<string, (s: string | null) => Promise<Array<string>>>)['checkImport'](input);

		it('returns [] for null input', async () => {
			expect(await checkImport(app, null)).toEqual([]);
			expect(layoutService.storeCustomBoards).not.toHaveBeenCalled();
		});

		it('imports a valid board and returns its id', async () => {
			const result = await checkImport(app, b64(makeMah()));
			expect(result).toEqual(['test-id']);
			expect(layoutService.storeCustomBoards).toHaveBeenCalledTimes(1);
		});

		it('does not re-import a board already in layouts', async () => {
			layoutService.layouts.items = [MOCK_LAYOUT];
			const result = await checkImport(app, b64(makeMah()));
			expect(result).toEqual(['test-id']);
			expect(layoutService.storeCustomBoards).not.toHaveBeenCalled();
		});

		it('imports multiple valid boards', async () => {
			const board2 = makeBoard({ id: 'id-2', name: 'Board 2' });
			const layout2: Layout = { ...MOCK_LAYOUT, id: 'id-2', name: 'Board 2' };
			(layoutService.expandLayout as jest.Mock)
				.mockReturnValueOnce(MOCK_LAYOUT)
				.mockReturnValueOnce(layout2);
			const result = await checkImport(app, b64(makeMah([makeBoard(), board2])));
			expect(result).toEqual(['test-id', 'id-2']);
			expect(layoutService.storeCustomBoards).toHaveBeenCalledTimes(1);
		});

		it('does not store duplicate board ids within the same import', async () => {
			const result = await checkImport(app, b64(makeMah([makeBoard(), makeBoard()])));
			expect(result).toEqual(['test-id', 'test-id']);
			const storedBoards: Array<LoadLayout> = (layoutService.storeCustomBoards as jest.Mock).mock.calls[0][0];
			expect(storedBoards).toHaveLength(1);
		});

		it('skips a board when expandLayout throws', async () => {
			(layoutService.expandLayout as jest.Mock).mockImplementationOnce(() => {
				throw new Error('expand error');
			});
			expect(await checkImport(app, b64(makeMah()))).toEqual([]);
			expect(layoutService.storeCustomBoards).not.toHaveBeenCalled();
		});

		it('logs a warning when boards were parsed but none could be expanded', async () => {
			(layoutService.expandLayout as jest.Mock).mockImplementation(() => {
				throw new Error('expand error');
			});
			const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
			await checkImport(app, b64(makeMah()));
			expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('no valid boards'));
			warnSpy.mockRestore();
		});
	});
});
