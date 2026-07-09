import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AppService } from '../../service/app.service';
import { DurationPipe } from '../../pipes/duration.pipe';

@Component({
	selector: 'app-clock',
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './clock.component.html',
	imports: [DurationPipe]
})
export class ClockComponent {
	readonly app = inject(AppService);
}
