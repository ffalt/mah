import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
	name: 'duration'
})
export class DurationPipe implements PipeTransform {
	public transform(value: number): string {
		if (isNaN(value) || (value === 0)) {
			return '-';
		}
		const sec_num = Math.round(value / 1000);
		const hours = Math.floor(sec_num / 3600);
		const minutes = Math.floor((sec_num - (hours * 3600)) / 60);
		const seconds = sec_num - (hours * 3600) - (minutes * 60);
		return ((hours > 0) ? (hours < 10 ? '0' : '') + hours + ':' : '') +
			(minutes < 10 ? '0' : '') + minutes + ':' +
			(seconds < 10 ? '0' : '') + seconds;
	}
}
