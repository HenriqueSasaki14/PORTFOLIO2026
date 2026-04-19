const storageKey = 'portfolioMusicPlayerState';

export function readPlayerState() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || {};
  } catch {
    return {};
  }
}

export function writePlayerState(state) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // Local storage can be unavailable in some privacy modes.
  }
}
