/* eslint-disable no-var */
declare var APP_VERSION: any;
declare var APP_NAME: any;
declare var APP_FEATURE_EDITOR: any;
declare var APP_FEATURE_MOBILE: any;

export const env: {
	APP_VERSION: string;
	APP_NAME: string;
	APP_FEATURE_EDITOR: boolean;
	APP_FEATURE_MOBILE: boolean;
} = {
	APP_VERSION: APP_VERSION || 'DEV',
	APP_NAME: APP_NAME || 'Mah Jong',
	APP_FEATURE_EDITOR: !!APP_FEATURE_EDITOR,
	APP_FEATURE_MOBILE: !!APP_FEATURE_MOBILE
};
