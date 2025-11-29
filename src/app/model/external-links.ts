import { environment } from '../../environments/environment';

type openExternal = (href: string) => void;

export function clickExternalHref(event: MouseEvent): void {
	if (!environment.openExternal) {
		return;
	}
	event.preventDefault();
	try {
		let element: HTMLElement | null = event.target as HTMLElement | null;
		while (element && !(element instanceof HTMLAnchorElement)) {
			element = element.parentElement;
		}
		if (element && element instanceof HTMLAnchorElement) {
			const href = element.getAttribute('href') ?? '';
			(environment.openExternal as openExternal)(href);
		}
	} catch (error) {
		console.error(error);
	}
}
