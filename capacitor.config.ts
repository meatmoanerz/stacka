import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'se.stacka.app',
  appName: 'Stacka',
  webDir: 'out',
  server: {
    // TODO: Replace with your deployed URL (e.g. https://your-app.vercel.app)
    url: 'https://YOUR_DEPLOYED_URL',
    cleartext: false,
  },
  ios: {
    contentInset: 'always',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#FAFBF9',
      showSpinner: false,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
}

export default config
