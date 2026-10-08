import type { CapacitorConfig } from '@capacitor/cli';

/**
 * The app loads the live site, so every web deploy reaches the app at once;
 * only changes to the native shell (plugins, icons, permissions) need a new
 * store release. QALA_URL points a local build at a preview or dev server.
 */
const site = process.env.QALA_URL ?? 'https://monli.fun';

const config: CapacitorConfig = {
  appId: 'digital.qala.saku',
  appName: 'Qala Saku',
  // Only the offline fallback ships in the app; everything else comes from `site`.
  webDir: 'www',
  // Lets the site tell it runs in the app (lib/native.ts in the web repo).
  appendUserAgent: 'QalaSakuApp/1.0',
  backgroundColor: '#F2EFE9',
  server: {
    // The logo splash, kept by the service worker so it paints at once.
    url: `${site}/launch.html`,
    errorPath: 'offline.html',
  },
  ios: {
    // Service workers (offline mode) only run for app-bound domains on iOS.
    limitsNavigationsToAppBoundDomains: true,
    contentInset: 'never',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 300,
      backgroundColor: '#F2EFE9',
      showSpinner: false,
    },
  },
};

export default config;
