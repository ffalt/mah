import { Pipe, type PipeTransform } from '@angular/core';

function pad(num: number): string {
	return (num < 10 ? '0' : '') + num.toString();
}

@Pipe({
	name: 'duration'
})
export class DurationPipe implements PipeTransform {
	transform(value: number): string {
		if (Number.isNaN(value) || (value === 0)) {
			return '-';
		}
		const num = Math.floor(value / 1000);
		const hours = Math.floor(num / 3600);
		const minutes = Math.floor((num - (hours * 3600)) / 60);
		const seconds = num - (hours * 3600) - (minutes * 60);
		const hoursS = (hours > 0) ? `${pad(hours)}:` : '';
		return `${hoursS}${pad(minutes)}:${pad(seconds)}`;
	}
}
