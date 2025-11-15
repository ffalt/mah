import { Component, input } from '@angular/core';
import { Licenses } from '../../model/consts';
import { clickExternalHref } from '../../model/external-links';

@Component({
	selector: 'app-license-link',
	templateUrl: './license-link.component.html',
	styleUrls: ['./license-link.component.scss']
})
export class LicenseLinkComponent {
	imagesetId = input.required<string>();
	licenseKey = input.required<string>();

	protected readonly licenses = Licenses;
	protected readonly clickExternalHref = clickExternalHref;
}
