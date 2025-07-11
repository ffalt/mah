import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { MockComponent } from 'ng-mocks';
import { TranslateModule } from '@ngx-translate/core';
import { PrefixPipe } from '../../pipes/prefix.pipe';
import { ImageSetLoaderComponent } from '../image-set-loader/image-set-loader.component';
import { SvgdefService } from '../../../../service/svgdef.service';
import { AppService } from '../../../../service/app.service';
import { BoardComponent } from './board.component';
import { By } from '@angular/platform-browser';
import { Stone } from '../../../../model/stone';
import { Backgrounds } from '../../../../model/consts';

interface HackBoardComponent {
	resize(element: { innerHeight: number; innerWidth: number }): void;
}

describe('BoardComponent', () => {
	let component: BoardComponent;
	let fixture: ComponentFixture<BoardComponent>;
	let appService: AppService;

	beforeEach(async () =>
		TestBed.configureTestingModule({
			declarations: [BoardComponent, PrefixPipe, MockComponent(ImageSetLoaderComponent)
			],
			imports: [TranslateModule.forRoot()],
			providers: [SvgdefService, AppService]
		})
			.compileComponents());

	beforeEach(() => {
		fixture = TestBed.createComponent(BoardComponent);
		component = fixture.componentInstance;
		appService = TestBed.inject(AppService);
		jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
			cb(0);
			return 0;
		});
		TestBed.runInInjectionContext(() => {
			fixture.detectChanges();
		});
	});

	it('should create', async () => {
		expect(component).toBeTruthy();
		expect(appService).toBeTruthy();
	});

	describe('Input properties', () => {
		it('should accept background input', () => {
			const testBackground = Backgrounds[1].img;
			fixture.componentRef.setInput('background', testBackground);
			fixture.detectChanges();
			expect(component.backgroundUrl).toContain(testBackground);
		});

		it('should accept imageSet input', () => {
			const testImageSet = 'classic';
			fixture.componentRef.setInput('imageSet', testImageSet);
			fixture.detectChanges();

			expect(component.prefix).toBe(`b_${testImageSet}_`);
			expect(component.urlPrefix).toBe(`#b_${testImageSet}_`);
		});

		it('should accept stones input and update drawStones', () => {
			const testStones = [
				new Stone(0, 0, 0, 0, 0),
				new Stone(1, 1, 1, 1, 1)
			];
			fixture.componentRef.setInput('stones', testStones);
			fixture.detectChanges();

			expect(component.drawStones).toHaveLength(2);
			expect(component.drawStones[0].source).toBe(testStones[0]);
			expect(component.drawStones[1].source).toBe(testStones[1]);
		});
	});

	describe('Output events', () => {
		it('should emit clickEvent when a stone is clicked', () => {
			const testStone = new Stone(0, 0, 0, 0, 0);
			testStone.img = { id: 'c1' };
			const testStones = [testStone];

			fixture.componentRef.setInput('stones', testStones);
			fixture.detectChanges();

			const clickSpy = jest.spyOn(component.clickEvent, 'emit');

			// Simulate a click on the stone
			component.onClickUp(new MouseEvent('mouseup'), component.drawStones[0]);

			expect(clickSpy).toHaveBeenCalledWith(testStone);
		});

		it('should emit undefined clickEvent when clicking outside stones', () => {
			const clickSpy = jest.spyOn(component.clickEvent, 'emit');

			// Simulate a click on the board (not on a stone)
			component.onMouseUp(new MouseEvent('mouseup'));

			expect(clickSpy).toHaveBeenCalledWith(undefined);
		});
	});

	describe('Rendering', () => {
		it('should render SVG element with correct attributes', () => {
			const svgElement = fixture.debugElement.query(By.css('svg.board-svg'));
			expect(svgElement).toBeTruthy();
			expect(svgElement.attributes['preserveAspectRatio']).toBe('xMidYMid meet');
			expect(svgElement.attributes['viewBox']).toBe(component.viewport);
		});

		it('should render stones when provided', () => {
			const testStone = new Stone(0, 0, 0, 0, 0);
			testStone.img = { id: 'c1' };
			const testStones = [testStone];

			fixture.componentRef.setInput('stones', testStones);
			fixture.detectChanges();

			const stoneElements = fixture.debugElement.queryAll(By.css('g.draw'));
			expect(stoneElements).toHaveLength(1);
		});

		it('should add selected class to selected stones', () => {
			const testStone = new Stone(0, 0, 0, 0, 0);
			testStone.img = { id: 'c1' };
			testStone.selected = true;
			const testStones = [testStone];

			fixture.componentRef.setInput('stones', testStones);
			fixture.detectChanges();

			const selectedStone = fixture.debugElement.query(By.css('g.draw.selected'));
			expect(selectedStone).toBeTruthy();
		});

		it('should add hidden class to picked stones', () => {
			const testStone = new Stone(0, 0, 0, 0, 0);
			testStone.img = { id: 'c1' };
			testStone.picked = true;
			const testStones = [testStone];

			fixture.componentRef.setInput('stones', testStones);
			fixture.detectChanges();

			const hiddenStone = fixture.debugElement.query(By.css('g.draw.hidden'));
			expect(hiddenStone).toBeTruthy();
		});

		it('should add hinted class to hinted stones', () => {
			const testStone = new Stone(0, 0, 0, 0, 0);
			testStone.img = { id: 'c1' };
			testStone.hinted = true;
			const testStones = [testStone];

			fixture.componentRef.setInput('stones', testStones);
			fixture.detectChanges();

			const hintedStone = fixture.debugElement.query(By.css('g.draw.hinted'));
			expect(hintedStone).toBeTruthy();
		});
	});

	describe('Transformation and scaling', () => {
		it('should update transformSVG when zooming', () => {
			const initialTransform = component.transformSVG;
			component.zoomSVGValue(1.5, 100, 100);
			expect(component.transformSVG).not.toBe(initialTransform);
			expect(component.scale).toBe(1.5);
		});

		it('should reset scale and pan when zooming below threshold', () => {
			// Set initial scale and pan
			component.scale = 1.5;
			component.panX = 50;
			component.panY = 50;

			// Zoom out below threshold
			component.zoomSVGValue(0.9, 100, 100);

			expect(component.scale).toBe(1);
			expect(component.panX).toBe(0);
			expect(component.panY).toBe(0);
		});

		it('should update pan values when panning', () => {
			// Set initial scale to enable panning
			component.scale = 1.5;
			const initialPanX = component.panX;
			const initialPanY = component.panY;

			// Simulate panning
			component.setPanValue(20, 30);

			expect(component.panX).toBe(20);
			expect(component.panY).toBe(30);
			expect(component.panX).not.toBe(initialPanX);
			expect(component.panY).not.toBe(initialPanY);
		});
	});

	describe('Event handling', () => {
		it('should handle wheel events for zooming', () => {
			const zoomSpy = jest.spyOn(component, 'zoomSVGValue');
			const wheelEvent = new WheelEvent('wheel', { deltaY: -100 });

			component.onWheel(wheelEvent);

			expect(zoomSpy).toHaveBeenCalled();
		});

		it('should handle mouse down events', () => {
			// Set scale to enable panning
			component.scale = 1.5;

			const mouseEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
			component.onMouseDown(mouseEvent);

			expect(component['lastMouseX']).toBe(100);
			expect(component['lastMouseY']).toBe(100);
			expect(component['initialMouseX']).toBe(100);
			expect(component['initialMouseY']).toBe(100);
		});

		it('should handle mouse move events when panning', () => {
			// Set up panning state
			component.scale = 1.5;
			component['isPanning'] = true;
			component['lastMouseX'] = 100;
			component['lastMouseY'] = 100;

			const setPanSpy = jest.spyOn(component, 'setPanValue');
			const mouseEvent = new MouseEvent('mousemove', { clientX: 120, clientY: 130 });

			component.onMouseMove(mouseEvent);

			expect(setPanSpy).toHaveBeenCalled();
			expect(component['lastMouseX']).toBe(120);
			expect(component['lastMouseY']).toBe(130);
		});

		it('should handle mouse up events when panning', () => {
			// Set up panning state
			component['isPanning'] = true;
			const clickSpy = jest.spyOn(component.clickEvent, 'emit');

			component.onMouseUp(new MouseEvent('mouseup'));

			expect(component['isPanning']).toBe(false);
			expect(clickSpy).not.toHaveBeenCalled();
		});

		it('should handle mouse up events when not panning', () => {
			// Set up non-panning state
			component['isPanning'] = false;
			const clickSpy = jest.spyOn(component.clickEvent, 'emit');

			component.onMouseUp(new MouseEvent('mouseup'));

			expect(clickSpy).toHaveBeenCalledWith(undefined);
		});

		it('should handle resize events', () => {
			const resizeSpy = jest.spyOn(component as unknown as HackBoardComponent, 'resize');
			const resizeEvent = new Event('resize');
			Object.defineProperty(resizeEvent, 'target', { value: window });

			component.onResize(resizeEvent as UIEvent);

			expect(resizeSpy).toHaveBeenCalled();
		});

		it('should handle touch start events for panning', () => {
			// Create a touch event with one touch point
			const touchEvent = new TouchEvent('touchstart', {
				touches: [{ identifier: 0, clientX: 100, clientY: 100 } as Touch]
			});

			component.onTouchStart(touchEvent);

			expect(component['touchPoints']).toHaveLength(1);
			expect(component['isPanning']).toBe(true);
			expect(component['lastTouchX']).toBe(100);
			expect(component['lastTouchY']).toBe(100);
		});

		it('should handle touch start events for pinching', () => {
			// Create a touch event with two touch points
			const touchEvent = new TouchEvent('touchstart', {
				touches: [
					{ identifier: 0, clientX: 100, clientY: 100 } as Touch,
					{ identifier: 1, clientX: 200, clientY: 200 } as Touch
				]
			});

			component.onTouchStart(touchEvent);

			expect(component['touchPoints']).toHaveLength(2);
			expect(component['isPanning']).toBe(false);
			expect(component['isPinching']).toBe(true);
			expect(component['initialDistance']).toBeGreaterThan(0);
		});

		it('should handle touch move events when panning', () => {
			// Set up panning state
			component['isPanning'] = true;
			component['isPinching'] = false;
			component['lastTouchX'] = 100;
			component['lastTouchY'] = 100;
			component.scale = 1.5;
			component['lastPinch'] = 0; // Ensure enough time has passed

			const setPanSpy = jest.spyOn(component, 'setPanValue');

			// Create a touch event with one touch point
			const touchEvent = new TouchEvent('touchmove', {
				touches: [{ identifier: 0, clientX: 120, clientY: 130 } as Touch]
			});

			component.onTouchMove(touchEvent);

			expect(setPanSpy).toHaveBeenCalled();
		});

		it('should handle touch end events', () => {
			// Set up panning state
			component['isPanning'] = true;

			// Create a touch event with no touches
			const touchEvent = new TouchEvent('touchend', { touches: [] });

			component.onTouchEnd(touchEvent);

			expect(component['isPanning']).toBe(false);
			expect(component['touchPoints']).toHaveLength(0);
		});
	});

	describe('Indicators', () => {
		it('should display indicators when zooming', () => {
			const displaySpy = jest.spyOn(component.indicators, 'display');
			const wheelEvent = new WheelEvent('wheel', { deltaY: -100, clientX: 100, clientY: 100 });

			component.onWheel(wheelEvent);

			expect(displaySpy).toHaveBeenCalledWith(100, 100, expect.any(Number));
		});

		it('should display indicators when panning', () => {
			// Set up panning state
			component.scale = 1.5;
			component['isPanning'] = true;
			component['lastMouseX'] = 100;
			component['lastMouseY'] = 100;

			const displaySpy = jest.spyOn(component.indicators, 'display');
			const mouseEvent = new MouseEvent('mousemove', { clientX: 120, clientY: 130 });

			component.updatePanning(mouseEvent);

			expect(displaySpy).toHaveBeenCalledWith(120, 130, expect.any(Number));
		});

		it('should hide indicators after display', () => {
			const mockIndicator = { state: 'hidden', x: 100, y: 100, size: 10, top: 95, left: 95 };
			jest.spyOn(component.indicators, 'display').mockReturnValue(mockIndicator);
			const hideSpy = jest.spyOn(component.indicators, 'hide');
			const wheelEvent = new WheelEvent('wheel', { deltaY: -100, clientX: 100, clientY: 100 });

			component.onWheel(wheelEvent);

			expect(hideSpy).toHaveBeenCalledWith(mockIndicator);
		});
	});

	describe('Edge cases', () => {
		it('should not enable panning when scale is 1', () => {
			// Set scale to 1 (no panning)
			component.scale = 1;

			const mouseEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
			component.onMouseDown(mouseEvent);

			// Initial values should not be set
			expect(component['initialMouseX']).not.toBe(100);
			expect(component['initialMouseY']).not.toBe(100);
		});

		it('should not update pan when not panning', () => {
			// Set up non-panning state
			component['isPanning'] = false;
			component.scale = 1.5;

			const setPanSpy = jest.spyOn(component, 'setPanValue');
			const mouseEvent = new MouseEvent('mousemove', { clientX: 120, clientY: 130 });

			component.onMouseMove(mouseEvent);

			expect(setPanSpy).not.toHaveBeenCalled();
		});

		it('should clamp pan values within bounds', () => {
			// Mock element dimensions
			Object.defineProperty(component.element.nativeElement, 'offsetWidth', { value: 1000 });
			Object.defineProperty(component.element.nativeElement, 'offsetHeight', { value: 800 });

			// Try to pan beyond bounds
			component.setPanValue(-2000, 2000);

			// Values should be clamped
			expect(component.panX).toBeGreaterThan(-2000);
			expect(component.panY).toBeLessThan(2000);
		});

		it('should handle ngOnChanges with undefined values', () => {
			const changes = {
				stones: { currentValue: undefined, previousValue: [], firstChange: false, isFirstChange: () => false }
			};

			// This should not throw an error
			component.ngOnChanges(changes);

			expect(component.drawStones).toHaveLength(0);
		});
	});
});
