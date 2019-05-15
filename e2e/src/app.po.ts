// tslint:disable-next-line:no-implicit-dependencies
import {browser} from 'protractor';

export class AppPage {

	async navigateTo(): Promise<any> {
		return browser.get(browser.baseUrl);
	}

	// getTitleText() {
	// 	return element(by.css('app-root h1')).getText() as Promise<string>;
	// }
}
