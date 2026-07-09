import { Component, inject } from '@angular/core';
import { AppService } from '../../service/app.service';
import { DurationPipe } from '../../pipes/duration.pipe';

@Component({
	selector: 'app-clock',
	templateUrl: './clock.component.html',
	imports: [DurationPipe]
})
export class ClockComponent {
	readonly app = inject(AppService);
}
