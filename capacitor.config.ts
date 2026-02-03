import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.numelodic.app',
  appName: 'NU MELODIC',
  webDir: 'dist/public',
  server: {
    url: 'https://music-stream-pro-pbm2.replit.app',
    cleartext: false
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#09090b',
    preferredContentMode: 'mobile'
  }
};

export default config;
