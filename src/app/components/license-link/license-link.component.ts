import { Component, computed, input } from '@angular/core';
import { Licenses } from '../../model/consts';
import { clickExternalHref } from '../../model/external-links';

@Component({
	selector: 'app-license-link',
	templateUrl: './license-link.component.html',
	styleUrls: ['./license-link.component.scss']
})
export class LicenseLinkComponent {
	link = input.required<string>();
	licenseKey = input.required<string>();
	subject = input<string>();
	tabbable = input(true);

	protected readonly licenses = Licenses;
	protected readonly label = computed(() => {
		const license = this.licenses[this.licenseKey()] || '?';
		const subject = this.subject();
		return subject ? `${subject}: ${license}` : license;
	});

	protected readonly clickExternalHref = clickExternalHref;
}
