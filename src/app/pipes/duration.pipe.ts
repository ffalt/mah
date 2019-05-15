import {Pipe, PipeTransform} from '@angular/core';

function pad(num: number): string {
	return (num < 10 ? '0' : '') + num.toString();
}

@Pipe({
	name: 'duration'
})
export class DurationPipe implements PipeTransform {
	transform(value: number): string {
		if (isNaN(value) || (value === 0)) {
			return '-';
		}
		const secNum = Math.floor(value / 1000);
		const hours = Math.floor(secNum / 3600);
		const minutes = Math.floor((secNum - (hours * 3600)) / 60);
		const seconds = secNum - (hours * 3600) - (minutes * 60);
		return `${(hours > 0) ? pad(hours) + ':' : ''}${pad(minutes)}:${pad(seconds)}`;
	}
}
