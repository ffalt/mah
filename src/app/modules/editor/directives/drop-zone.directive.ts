import { Directive, output, input } from '@angular/core';

// Angular Drag and Drop File
//
// Add this directive to an element to turn it into a dropzone
// for drag and drop of files.
// Example:
//
// <div (appDropZone)="onDrop($event)"></div>
//
// Any files dropped onto the region are then
// returned as a Javascript array of file objects.
// Which in TypeScript is `Array<File>`
//
// https://gist.github.com/darrenmothersele/7afda13d858a156ce571510dd78b7624

@Directive({
	selector: '[appDropZone]',
	standalone: false,
	host: {
		'[class.drop-zone-active]': 'active',
		'(drop)': 'onDrop($event)',
		'(dragover)': 'onDragOver($event)',
		'(dragleave)': 'onDragLeave($event)',
		'(body:dragover)': 'onBodyDragOver($event)',
		'(body:drop)': 'onBodyDrop($event)'
	}
})
export class DropZoneDirective {
	// The directive emits a `fileDrop` event
	// with the list of files dropped on the element
	// as an JS array of `File` objects.
	readonly appDropZone = output<Array<File>>();
	readonly appDropZoneOver = output();

	// Disable dropping on the body of the document.
	// This prevents the browser from loading the dropped files
	// using its default behaviour if the user misses the drop zone.
	// Set this input to false if you want the browser default behaviour.
	readonly preventBodyDrop = input(true);

	// The `drop-zone-active` class is applied to the host
	// element when a drag is currently over the target.
	active = false;

	onDrop(event: DragEvent): void {
		event.preventDefault();
		this.active = false;
		const { dataTransfer } = event;
		if (dataTransfer?.items) {
			const files: Array<File> = [];
			const items = Array.from(dataTransfer.items);
			for (const item of items) {
				// If dropped items aren't files, reject them
				if (item?.kind === 'file') {
					const file = item.getAsFile();
					if (file) {
						files.push(file);
					}
				}
			}
			dataTransfer.items.clear();
			this.appDropZone.emit(files);
		} else if (dataTransfer) {
			const files = dataTransfer?.files;
			dataTransfer.clearData();
			if (files) {
				this.appDropZone.emit(Array.from(files));
			}
		}
	}

	onDragOver(event: DragEvent): void {
		event.stopPropagation();
		event.preventDefault();
		if (!this.active) {
			this.appDropZoneOver.emit();
		}
		this.active = true;
	}

	onDragLeave(_event: DragEvent): void {
		this.active = false;
	}

	onBodyDragOver(event: DragEvent): void {
		if (this.preventBodyDrop()) {
			event.preventDefault();
			event.stopPropagation();
		}
	}

	onBodyDrop(event: DragEvent): void {
		if (this.preventBodyDrop()) {
			event.preventDefault();
		}
	}
}
