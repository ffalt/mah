import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AppService } from '../../service/app.service';
import { ClockComponent } from '../clock/clock.component';

@Component({
	selector: 'app-stats-bar',
	templateUrl: './stats-bar.component.html',
	styleUrls: ['./stats-bar.component.scss'],
	imports: [ClockComponent, TranslatePipe]
})
export class StatsBarComponent {
	readonly app = inject(AppService);
}
