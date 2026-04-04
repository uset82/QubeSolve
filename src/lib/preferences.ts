const SOUND_ENABLED_KEY = 'qubesolve-sound-enabled';

export function loadSoundEnabled(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }

  const stored = window.localStorage.getItem(SOUND_ENABLED_KEY);
  return stored === null ? true : stored === 'true';
}

export function saveSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
}
