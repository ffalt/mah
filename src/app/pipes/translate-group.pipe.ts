import { inject, Pipe, type PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
	name: 'translateGroup'
})
export class TranslateGroupPipe implements PipeTransform {
	translate = inject(TranslateService);

	transform(value: string): string {
		const key = `CAT_${value.toUpperCase()}`;
		const translation = this.translate.instant(key);
		return translation === key ? value : translation;
	}
}
