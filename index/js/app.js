import { initFrameRouter } from './navigation/frame-router.js';
import { initMusicPlayer } from './player/player.js';
import { enableIframeMode } from './shared/iframe-mode.js';

if (window.self !== window.top) {
  enableIframeMode();
} else {
  initMusicPlayer();
  initFrameRouter();
}
