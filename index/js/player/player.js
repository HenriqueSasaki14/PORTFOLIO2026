import { tracks } from './tracks.js';
import { readPlayerState, writePlayerState } from './state.js';
import { clamp, formatTime } from './utils.js';

export function initMusicPlayer() {
  document.querySelectorAll('.music-player').forEach((player) => {
    const audio = player.querySelector('.music-audio');
    const title = player.querySelector('.music-track');
    const artist = player.querySelector('.music-artist');
    const current = player.querySelector('.music-current');
    const duration = player.querySelector('.music-duration');
    const progress = player.querySelector('.music-progress');
    const playButton = player.querySelector('.music-play');
    const nextButton = player.querySelector('.music-next');
    const prevButton = player.querySelector('.music-prev');
    const volume = player.querySelector('.music-volume');

    if (!audio || !title || !artist || !current || !duration || !progress || !playButton || !nextButton || !prevButton || !volume) {
      return;
    }

    const storedState = readPlayerState();
    let currentTrack = Number.isInteger(storedState.track) ? storedState.track : 0;
    let pendingStartTime = Number.isFinite(storedState.time) ? storedState.time : 0;
    let shouldResume = storedState.isPlaying === true;
    let isLeavingPage = false;
    let seeking = false;

    currentTrack = clamp(currentTrack, 0, tracks.length - 1);

    if (Number.isFinite(storedState.volume)) {
      volume.value = clamp(storedState.volume, 0, 100);
    }

    function getVolumeValue() {
      const value = Number(volume.value);

      if (!Number.isFinite(value)) {
        return 0.15;
      }

      const normalizedVolume = clamp(value / 100, 0, 1);
      return normalizedVolume * normalizedVolume * normalizedVolume;
    }

    function saveState(isPlaying) {
      writePlayerState({
        track: currentTrack,
        time: Number.isFinite(audio.currentTime) ? audio.currentTime : pendingStartTime,
        volume: Number(volume.value),
        isPlaying
      });
    }

    function updateVolume() {
      audio.volume = getVolumeValue();
    }

    function loadTrack(index, startTime = 0) {
      const track = tracks[index];
      pendingStartTime = Number.isFinite(startTime) ? startTime : 0;
      title.textContent = track.title;
      artist.textContent = track.artist;
      audio.src = track.src;
      progress.value = 0;
      current.textContent = '00:00';
      duration.textContent = '00:00';
    }

    function waitForResumeGesture() {
      const resume = () => {
        document.removeEventListener('pointerdown', resume);
        document.removeEventListener('keydown', resume);
        playTrack();
      };

      document.addEventListener('pointerdown', resume);
      document.addEventListener('keydown', resume);
    }

    function playTrack(retryOnGesture = false) {
      audio.play().then(() => {
        player.classList.add('is-playing');
        player.classList.remove('has-audio-error');
        saveState(true);
      }).catch((error) => {
        if (!error || error.name !== 'NotAllowedError') {
          player.classList.add('has-audio-error');
        }

        if (retryOnGesture) {
          waitForResumeGesture();
        }
      });
    }

    function nextTrack() {
      currentTrack = (currentTrack + 1) % tracks.length;
      loadTrack(currentTrack);
      playTrack();
      saveState(true);
    }

    function previousTrack() {
      currentTrack = (currentTrack - 1 + tracks.length) % tracks.length;
      loadTrack(currentTrack);
      playTrack();
      saveState(true);
    }

    playButton.addEventListener('click', () => {
      if (audio.paused) {
        playTrack();
        return;
      }

      audio.pause();
      player.classList.remove('is-playing');
      saveState(false);
    });

    nextButton.addEventListener('click', nextTrack);
    prevButton.addEventListener('click', previousTrack);

    volume.addEventListener('input', () => {
      updateVolume();
      saveState(!audio.paused);
    });

    progress.addEventListener('input', () => {
      seeking = true;
      const target = (Number(progress.value) / 100) * audio.duration;
      current.textContent = formatTime(target);
    });

    progress.addEventListener('change', () => {
      if (Number.isFinite(audio.duration)) {
        audio.currentTime = (Number(progress.value) / 100) * audio.duration;
      }

      seeking = false;
      saveState(!audio.paused);
    });

    audio.addEventListener('loadedmetadata', () => {
      if (pendingStartTime > 0 && Number.isFinite(audio.duration)) {
        audio.currentTime = Math.min(pendingStartTime, Math.max(0, audio.duration - 1));
        pendingStartTime = 0;
      }

      duration.textContent = formatTime(audio.duration);

      if (shouldResume) {
        shouldResume = false;
        playTrack(true);
      }
    });

    audio.addEventListener('timeupdate', () => {
      if (seeking || !Number.isFinite(audio.duration)) {
        return;
      }

      progress.value = (audio.currentTime / audio.duration) * 100 || 0;
      current.textContent = formatTime(audio.currentTime);
      duration.textContent = formatTime(audio.duration);
      saveState(!audio.paused);
    });

    audio.addEventListener('ended', nextTrack);
    audio.addEventListener('pause', () => {
      if (!isLeavingPage) {
        saveState(false);
      }
    });
    audio.addEventListener('play', () => saveState(true));

    document.addEventListener('portfolio:navigate-away', () => {
      isLeavingPage = true;
      saveState(!audio.paused);
    });

    window.addEventListener('pageshow', () => {
      const latestState = readPlayerState();

      if (latestState.isPlaying === true && audio.paused) {
        playTrack(true);
      }
    });

    window.addEventListener('pagehide', () => {
      isLeavingPage = true;
      saveState(!audio.paused);
    });

    window.addEventListener('beforeunload', () => {
      isLeavingPage = true;
      saveState(!audio.paused);
    });

    updateVolume();
    loadTrack(currentTrack, pendingStartTime);
  });
}
