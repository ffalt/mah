import { Component, inject, input, output, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AppService } from '../../service/app.service';
import { StatsBarComponent } from '../stats-bar/stats-bar.component';
import { IconMenuComponent } from '../icons/icon-menu.component';
import { IconSettingsComponent } from '../icons/icon-settings.component';
import { IconMuteComponent } from '../icons/icon-mute.component';
import { IconTilesinfoComponent } from '../icons/icon-tilesinfo.component';
import { IconZenComponent } from '../icons/icon-zen.component';
import { IconFullscreenComponent } from '../icons/icon-fullscreen.component';

@Component({
	selector: 'app-controls-bottom',
	templateUrl: './controls-bottom.component.html',
	styleUrls: ['./controls-bottom.component.scss'],
	imports: [TranslatePipe, StatsBarComponent, IconMenuComponent, IconSettingsComponent, IconMuteComponent, IconTilesinfoComponent, IconZenComponent, IconFullscreenComponent]
})
export class ControlsBottomComponent {
	readonly fullScreenEnabled = input(false);
	readonly settingsEvent = output<void>();
	readonly infoEvent = output<void>();
	readonly zenEvent = output<void>();
	readonly fullscreenEvent = output<void>();
	readonly app = inject(AppService);
	readonly menuOpen = signal(false);

	toggleMenu(): void {
		this.menuOpen.update(open => !open);
	}

	closeMenu(): void {
		this.menuOpen.set(false);
	}
}
