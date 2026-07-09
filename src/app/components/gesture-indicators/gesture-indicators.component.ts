import { Component, input } from '@angular/core';
import type { Indicator } from '../../model/indicator';

@Component({
	selector: 'app-gesture-indicators',
	templateUrl: './gesture-indicators.component.html',
	styleUrls: ['./gesture-indicators.component.scss']
})
export class GestureIndicatorsComponent {
	readonly indicators = input.required<Indicator>();
}
