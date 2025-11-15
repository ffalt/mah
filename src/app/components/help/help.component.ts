import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { clickExternalHref } from '../../model/external-links';

@Component({
	selector: 'app-help',
	templateUrl: './help.component.html',
	styleUrls: ['./help.component.scss'],
	imports: [TranslatePipe]
})
export class HelpComponent {
	shortcuts = [
		{ icon: 'icon-lightbulb', key: 'T', name: 'HINT' },
		{ icon: 'icon-spin1', key: 'M', name: 'SHUFFLE' },
		{ icon: 'icon-undo', key: 'U', name: 'UNDO' },
		{ icon: 'icon-loop', key: 'N', name: 'RESTART' },
		{ icon: 'icon-pause', key: 'P', name: 'PAUSE' },
		{ icon: 'icon-calendar', key: 'I', name: 'INFO' },
		{ icon: 'icon-cog', key: 'S', name: 'SETTINGS' },
		{ icon: 'icon-logo', key: 'H', name: 'HELP' }
	];

	protected readonly clickExternalHref = clickExternalHref;
}
