import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DropZoneDirective } from './drop-zone.directive';
import { Mock, describe, beforeEach, it, expect, vi } from 'vitest';

@Component({
	template: '<div appDropZone></div>',
	imports: [DropZoneDirective]
})
class TestHostComponent {
}

@Component({
	template: '<div appDropZone [preventBodyDrop]="false"></div>',
	imports: [DropZoneDirective]
})
class TestHostNoPreventComponent {
}

function makeEvent(overrides: Partial<{ dataTransfer: unknown }> = {}): DragEvent {
	return {
		preventDefault: vi.fn(),
		stopPropagation: vi.fn(),
		...overrides
	} as unknown as DragEvent;
}

function getDirective(fixture: ReturnType<typeof TestBed.createComponent<TestHostComponent>>): DropZoneDirective {
	return fixture.debugElement.query(By.directive(DropZoneDirective)).injector.get(DropZoneDirective);
}

describe('DropZoneDirective', () => {
	describe('with preventBodyDrop=true (default)', () => {
		let directive: DropZoneDirective;

		beforeEach(() => {
			TestBed.configureTestingModule({});
			const fixture = TestBed.createComponent(TestHostComponent);
			fixture.detectChanges();
			directive = getDirective(fixture);
		});

		it('should create directive', () => {
			expect(directive).toBeTruthy();
		});

		describe('onDragOver', () => {
			it('should stop propagation, prevent default, emit appDropZoneOver, and set active=true on first call', () => {
				let emitCount = 0;
				directive.appDropZoneOver.subscribe(() => emitCount++);

				const event = makeEvent();
				directive.onDragOver(event);

				expect((event.stopPropagation as Mock)).toHaveBeenCalled();
				expect((event.preventDefault as Mock)).toHaveBeenCalled();
				expect(directive.active).toBe(true);
				expect(emitCount).toBe(1);
			});

			it('should not emit appDropZoneOver when already active', () => {
				let emitCount = 0;
				directive.appDropZoneOver.subscribe(() => emitCount++);

				directive.active = true;
				const event = makeEvent();
				directive.onDragOver(event);

				expect(emitCount).toBe(0);
				expect(directive.active).toBe(true);
			});
		});

		describe('onDragLeave', () => {
			it('should set active=false', () => {
				directive.active = true;
				directive.onDragLeave(makeEvent());
				expect(directive.active).toBe(false);
			});
		});

		describe('onBodyDragOver', () => {
			it('should prevent default and stop propagation when preventBodyDrop is true', () => {
				const event = makeEvent();
				directive.onBodyDragOver(event);

				expect((event.preventDefault as Mock)).toHaveBeenCalled();
				expect((event.stopPropagation as Mock)).toHaveBeenCalled();
			});
		});

		describe('onBodyDrop', () => {
			it('should prevent default when preventBodyDrop is true', () => {
				const event = makeEvent();
				directive.onBodyDrop(event);

				expect((event.preventDefault as Mock)).toHaveBeenCalled();
			});
		});

		describe('onDrop', () => {
			it('should prevent default and set active=false', () => {
				directive.active = true;
				const event = makeEvent();

				directive.onDrop(event);

				expect((event.preventDefault as Mock)).toHaveBeenCalled();
				expect(directive.active).toBe(false);
			});

			it('should emit files from dataTransfer.items', () => {
				const emitted: Array<Array<File>> = [];
				directive.appDropZone.subscribe(files => {
					emitted.push(files);
				});

				const mockFile = new File(['content'], 'test.txt');
				const itemsArray = [{ kind: 'file', getAsFile: () => mockFile }];
				const clearMock = vi.fn();
				const mockDataTransfer = {
					items: Object.assign(itemsArray, { clear: clearMock }),
					files: null,
					clearData: vi.fn()
				};
				const event = makeEvent({ dataTransfer: mockDataTransfer });

				directive.onDrop(event);

				expect(clearMock).toHaveBeenCalled();
				expect(emitted).toHaveLength(1);
				expect(emitted[0]).toHaveLength(1);
				expect(emitted[0][0]).toBe(mockFile);
			});

			it('should skip items that are not files', () => {
				const emitted: Array<Array<File>> = [];
				directive.appDropZone.subscribe(files => {
					emitted.push(files);
				});

				const itemsArray = [{ kind: 'string', getAsFile: () => null }];
				const mockDataTransfer = {
					items: Object.assign(itemsArray, { clear: vi.fn() }),
					files: null,
					clearData: vi.fn()
				};
				const event = makeEvent({ dataTransfer: mockDataTransfer });

				directive.onDrop(event);

				expect(emitted).toHaveLength(1);
				expect(emitted[0]).toHaveLength(0);
			});

			it('should emit files from dataTransfer.files when items is not present', () => {
				const emitted: Array<Array<File>> = [];
				directive.appDropZone.subscribe(files => {
					emitted.push(files);
				});

				const mockFile = new File(['content'], 'test.txt');
				const clearDataMock = vi.fn();
				const mockDataTransfer = {
					items: undefined,
					files: [mockFile] as unknown as FileList,
					clearData: clearDataMock
				};
				const event = makeEvent({ dataTransfer: mockDataTransfer });

				directive.onDrop(event);

				expect(clearDataMock).toHaveBeenCalled();
				expect(emitted).toHaveLength(1);
				expect(emitted[0]).toHaveLength(1);
				expect(emitted[0][0]).toBe(mockFile);
			});

			it('should do nothing extra when dataTransfer is null', () => {
				const emitted: Array<Array<File>> = [];
				directive.appDropZone.subscribe(files => {
					emitted.push(files);
				});

				const event = makeEvent({ dataTransfer: null });

				directive.onDrop(event);

				expect(emitted).toHaveLength(0);
			});
		});
	});

	describe('with preventBodyDrop=false', () => {
		let directive: DropZoneDirective;

		beforeEach(() => {
			TestBed.configureTestingModule({});
			const fixture = TestBed.createComponent(TestHostNoPreventComponent);
			fixture.detectChanges();
			directive = fixture.debugElement.query(By.directive(DropZoneDirective)).injector.get(DropZoneDirective);
		});

		it('should not prevent default on onBodyDragOver', () => {
			const event = makeEvent();
			directive.onBodyDragOver(event);

			expect((event.preventDefault as Mock)).not.toHaveBeenCalled();
			expect((event.stopPropagation as Mock)).not.toHaveBeenCalled();
		});

		it('should not prevent default on onBodyDrop', () => {
			const event = makeEvent();
			directive.onBodyDrop(event);

			expect((event.preventDefault as Mock)).not.toHaveBeenCalled();
		});
	});
});
