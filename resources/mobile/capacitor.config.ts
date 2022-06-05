import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.ffalt.mah',
  appName: 'mah',
  webDir: '../../dist',
	backgroundColor: '#FFFFFF',
	bundledWebRuntime: false,
	android: {
		backgroundColor: '#FFFFFF'
	}
};

export default config;
