import { Component, ElementRef, type OnDestroy, computed, inject, input, output, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AppService } from '../../service/app.service';
import { GAME_MODE_EASY, type GAME_MODE_ID, GAME_MODE_STANDARD } from '../../model/consts';
import { IconDragHandleComponent } from '../icons/icon-drag-handle.component';
import { IconPauseComponent } from '../icons/icon-pause.component';
import { IconUndoComponent } from '../icons/icon-undo.component';
import { IconHintComponent } from '../icons/icon-hint.component';
import { IconCloseComponent } from '../icons/icon-close.component';

type ZenDragStartEvent = Pick<PointerEvent, 'currentTarget' | 'clientX' | 'clientY' | 'pointerId' | 'preventDefault'>;
type ZenDragMoveEvent = Pick<PointerEvent, 'clientX' | 'clientY' | 'preventDefault'>;
type ZenDragKeyEvent = Pick<KeyboardEvent, 'key' | 'currentTarget' | 'preventDefault'>;

@Component({
	selector: 'app-zen-controls',
	templateUrl: './zen-controls.component.html',
	styleUrls: ['./zen-controls.component.scss'],
	host: {
		'[style.transform]': 'transform()'
	},
	imports: [TranslatePipe, IconDragHandleComponent, IconPauseComponent, IconUndoComponent, IconHintComponent, IconCloseComponent]
})
export class ZenControlsComponent implements OnDestroy {
	readonly gameMode = input.required<GAME_MODE_ID>();
	readonly undoEvent = output<void>();
	readonly hintEvent = output<void>();
	readonly exitEvent = output<void>();
	readonly app = inject(AppService);
	readonly translateX = signal(0);
	readonly translateY = signal(0);
	readonly transform = computed(() => `translate(${this.translateX()}px, ${this.translateY()}px)`);
	readonly gameModeStandard = computed(() => [GAME_MODE_EASY, GAME_MODE_STANDARD].includes(this.gameMode()));

	private readonly element = inject(ElementRef);
	private dragOriginX: number = 0;
	private dragOriginY: number = 0;
	private dragStartX: number = 0;
	private dragStartY: number = 0;
	private dragMinX: number = 0;
	private dragMaxX: number = 0;
	private dragMinY: number = 0;
	private dragMaxY: number = 0;
	private dragPointerId?: number;
	private dragElement?: HTMLElement;
	private readonly dragMoveListener = (event: PointerEvent) => this.onDrag(event);
	private readonly dragEndListener = () => this.stopDrag();

	ngOnDestroy(): void {
		this.stopDrag();
	}

	startDrag(event: ZenDragStartEvent): void {
		const handle = event.currentTarget;
		if (!(handle instanceof HTMLElement)) {
			return;
		}
		event.preventDefault();
		this.dragElement = handle;
		this.dragPointerId = event.pointerId;
		this.dragOriginX = event.clientX;
		this.dragOriginY = event.clientY;
		this.dragStartX = this.translateX();
		this.dragStartY = this.translateY();
		const rect = (this.element.nativeElement as HTMLElement).getBoundingClientRect();
		this.dragMinX = 8 - rect.left + this.translateX();
		this.dragMaxX = window.innerWidth - rect.right - 8 + this.translateX();
		this.dragMinY = 8 - rect.top + this.translateY();
		this.dragMaxY = window.innerHeight - rect.bottom - 8 + this.translateY();
		if (typeof handle.setPointerCapture === 'function') {
			handle.setPointerCapture(event.pointerId);
		}
		document.addEventListener('pointermove', this.dragMoveListener);
		document.addEventListener('pointerup', this.dragEndListener);
		document.addEventListener('pointercancel', this.dragEndListener);
	}

	onDrag(event: ZenDragMoveEvent): void {
		if (this.dragPointerId === undefined) {
			return;
		}
		event.preventDefault();
		const x = this.dragStartX + event.clientX - this.dragOriginX;
		const y = this.dragStartY + event.clientY - this.dragOriginY;
		this.translateX.set(Math.max(this.dragMinX, Math.min(this.dragMaxX, x)));
		this.translateY.set(Math.max(this.dragMinY, Math.min(this.dragMaxY, y)));
	}

	stopDrag(): void {
		document.removeEventListener('pointermove', this.dragMoveListener);
		document.removeEventListener('pointerup', this.dragEndListener);
		document.removeEventListener('pointercancel', this.dragEndListener);
		if (
			this.dragPointerId !== undefined &&
			this.dragElement &&
			typeof this.dragElement.releasePointerCapture === 'function'
		) {
			this.dragElement.releasePointerCapture(this.dragPointerId);
		}
		this.dragPointerId = undefined;
		this.dragElement = undefined;
	}

	onHandleKeyDown(event: ZenDragKeyEvent): void {
		let deltaX = 0;
		let deltaY = 0;
		switch (event.key) {
			case 'ArrowLeft': {
				deltaX = -16;
				break;
			}
			case 'ArrowRight': {
				deltaX = 16;
				break;
			}
			case 'ArrowUp': {
				deltaY = -16;
				break;
			}
			case 'ArrowDown': {
				deltaY = 16;
				break;
			}
			default: {
				return;
			}
		}
		event.preventDefault();
		const rect = (this.element.nativeElement as HTMLElement).getBoundingClientRect();
		const translateX = this.translateX();
		const translateY = this.translateY();
		const minX = 8 - rect.left + translateX;
		const maxX = window.innerWidth - rect.right - 8 + translateX;
		const minY = 8 - rect.top + translateY;
		const maxY = window.innerHeight - rect.bottom - 8 + translateY;
		this.translateX.set(Math.max(minX, Math.min(maxX, translateX + deltaX)));
		this.translateY.set(Math.max(minY, Math.min(maxY, translateY + deltaY)));
	}
}
