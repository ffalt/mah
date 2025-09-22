import { Pipe, type PipeTransform } from '@angular/core';

@Pipe({
	name: 'prefix'
})
export class PrefixPipe implements PipeTransform {
	transform(value: string | undefined, prefix: string): string {
		return `${prefix}${value ?? ''}`;
	}
}
