import { Component, ElementRef, type OnChanges, type OnDestroy, type SimpleChanges, inject, input } from '@angular/core';
import { SvgdefService } from '../../service/svgdef.service';
import { log } from '../../model/log';
import { TILES } from '../../model/consts';
import { svg_error_icon, svgSpinnerIcon } from './svg';

@Component({
	selector: '[app-image-set-loader]',
	template: '<svg:defs></svg:defs>'
})
export class ImageSetLoaderComponent implements OnChanges, OnDestroy {
	readonly imageSet = input<string>();
	readonly kyodaiUrl = input<string>();
	readonly prefix = input<string>();
	readonly dark = input<boolean>(false);
	private readonly elementRef = inject(ElementRef);
	private readonly svgDef = inject(SvgdefService);
	private readonly loadingDelayMS: number = 100;
	private currentDefs?: string;
	private loadingTimer?: ReturnType<typeof setTimeout>;
	private loadRequestId = 0;

	ngOnChanges(_: SimpleChanges): void {
		this.getImageSet();
	}

	ngOnDestroy(): void {
		this.clearLoadingTimer();
	}

	private clearLoadingTimer(): void {
		if (this.loadingTimer === undefined) {
			return;
		}
		clearTimeout(this.loadingTimer);
		this.loadingTimer = undefined;
	}

	private setLoading(): void {
		const sl: Array<string> = [svgSpinnerIcon(this.dark())];
		const translate = this.imageSet() === 'kyodai' ? 'translate(25.5,38)' : 'translate(20,36)';
		for (const row of TILES) {
			for (const id of row) {
				sl.push(`<svg id="${id}" width="75" height="100"><use xlink:href="#mah-tile-spinner" transform="${translate}"></use></svg>`);
			}
		}
		this.setImageSet(`<svg><defs>${sl.join('')}</defs></svg>`);
	}

	private prepareDefs(svg: string): string {
		const startIndex = svg.indexOf('<defs>');
		const endIndex = svg.lastIndexOf('</defs>');
		const s = startIndex !== -1 && endIndex !== -1 && endIndex > startIndex + 6 ?
			svg.slice(startIndex + 6, endIndex) :
			'';
		const safePrefix = (this.prefix() ?? '').replace(/[^a-zA-Z0-9_-]/g, '');
		return s.replace(/xlink:href="\./g, 'xlink:href="assets/svg')
			.replace(/ id="t_/g, () => ` id="${safePrefix}t_`);
	}

	private setError(): void {
		const sl: Array<string> = [svg_error_icon];
		for (const row of TILES) {
			for (const id of row) {
				sl.push(`<svg id="${id}" width="75" height="100"><use xlink:href="#mah-error-icon" transform="translate(8,18)"></use></svg>`);
			}
		}
		this.setImageSet(`<svg><defs>${sl.join('')}</defs></svg>`);
	}

	private setImageSet(svg: string): void {
		const defs = this.prepareDefs(svg);
		if (defs === this.currentDefs) {
			return;
		}
		this.currentDefs = defs;
		this.elementRef.nativeElement.innerHTML = defs;
	}

	private loadImageSet(): void {
		const requestId = ++this.loadRequestId;
		const imageSet = this.imageSet() + (this.dark() ? '-black' : '');
		this.svgDef.get(imageSet, this.kyodaiUrl())
			.then(svg => {
				if (requestId !== this.loadRequestId) {
					return; // a newer request won the race
				}
				this.clearLoadingTimer();
				this.setImageSet(svg);
			})
			.catch(error => {
				if (requestId !== this.loadRequestId) {
					return;
				}
				this.clearLoadingTimer();
				this.setError();
				log.error(error);
			});
	}

	private getImageSet(): void {
		if (!this.imageSet()) {
			return;
		}
		// show the spinner tiles only when loading takes noticeably long; cached sets swap in a single DOM write
		this.clearLoadingTimer();
		this.loadingTimer = setTimeout(() => {
			this.loadingTimer = undefined;
			this.setLoading();
		}, this.loadingDelayMS);
		this.loadImageSet();
	}
}
