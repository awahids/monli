import { registerPlugin, type PluginListenerHandle } from '@capacitor/core';

/**
 * Proxies to the native plugins the app shell installs (mobile/package.json).
 * Only call them when isNativeApp() (lib/native.ts).
 */
export const Browser = registerPlugin<{
  open(options: { url: string }): Promise<void>;
  close(): Promise<void>;
}>('Browser');

export const App = registerPlugin<{
  addListener(event: 'appUrlOpen', cb: (e: { url: string }) => void): Promise<PluginListenerHandle>;
  /** The link that started the app, when it was opened by one (e.g. from the widget). */
  getLaunchUrl(): Promise<{ url: string } | undefined>;
}>('App');

export const BiometricAuth = registerPlugin<{
  checkBiometry(): Promise<{ isAvailable: boolean }>;
  internalAuthenticate(options: { reason?: string; cancelTitle?: string; androidTitle?: string; allowDeviceCredential?: boolean }): Promise<void>;
}>('BiometricAuthNative');

export const SpeechRecognition = registerPlugin<{
  available(): Promise<{ available: boolean }>;
  requestPermissions(): Promise<{ speechRecognition: string }>;
  start(options: { language: string; maxResults?: number; partialResults?: boolean; popup?: boolean }): Promise<{ matches?: string[] }>;
  stop(): Promise<void>;
}>('SpeechRecognition');

const Filesystem = registerPlugin<{
  writeFile(options: { path: string; data: string; directory: 'CACHE'; encoding: 'utf8' }): Promise<{ uri: string }>;
}>('Filesystem');

const Share = registerPlugin<{
  share(options: { title?: string; files: string[] }): Promise<void>;
}>('Share');

/** The app has no downloads: write the file to the cache and open the share sheet. */
export async function shareTextFile(filename: string, text: string) {
  const { uri } = await Filesystem.writeFile({ path: filename, data: text, directory: 'CACHE', encoding: 'utf8' });
  await Share.share({ title: filename, files: [uri] });
}

/** Our own plugin in the app shell: hands the home screen widget its numbers. */
export const WidgetBridge = registerPlugin<{
  update(options: { label: string; value: string; detail: string; updated: string }): Promise<void>;
}>('WidgetBridge');
