// tslint:disable-next-line:no-implicit-dependencies
import {browser, logging} from 'protractor';
import {AppPage} from './app.po';

describe('workspace-project App', () => {
	let page: AppPage;

	beforeEach(() => {
		page = new AppPage();
	});

	it('should display start', async () => {
		await page.navigateTo();
		// expect(page.getTitleText()).toEqual('Welcome to my-app!');
	});

	afterEach(async () => {
		// Assert that there are no errors emitted from the browser
		const logs = await browser.manage().logs().get(logging.Type.BROWSER);
		expect(logs).not.toContain(jasmine.objectContaining({level: logging.Level.SEVERE}));
	});
});
