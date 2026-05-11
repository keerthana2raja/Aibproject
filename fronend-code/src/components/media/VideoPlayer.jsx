import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize2,
} from 'lucide-react';

function formatTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

function requestFs(el) {
  if (!el) return Promise.reject();
  if (el.requestFullscreen) return el.requestFullscreen();
  if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
  if (el.msRequestFullscreen) return el.msRequestFullscreen();
  return Promise.reject();
}

function exitFs() {
  if (document.fullscreenElement && document.exitFullscreen) return document.exitFullscreen();
  if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
    return document.webkitExitFullscreen();
  }
  if (document.msFullscreenElement && document.msExitFullscreen) {
    return document.msExitFullscreen();
  }
  return Promise.resolve();
}

/**
 * In-app HTML5 video with custom chrome matching enterprise UI.
 */
const VideoPlayer = ({ src, autoPlay = true, className = '' }) => {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [paused, setPaused] = useState(true);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [error, setError] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return undefined;

    const onTime = () => {
      setCurrentTime(v.currentTime);
    };
    const onPlay = () => setPaused(false);
    const onPause = () => setPaused(true);
    const onLoaded = () => {
      setDuration(Number.isFinite(v.duration) ? v.duration : 0);
      setBuffering(false);
      setError(null);
    };
    const onDurationChange = () => {
      setDuration(Number.isFinite(v.duration) ? v.duration : 0);
    };
    const onWaiting = () => setBuffering(true);
    const onPlaying = () => setBuffering(false);
    const onCanPlay = () => setBuffering(false);
    const onVolume = () => {
      setVolume(v.volume);
      setMuted(v.muted);
    };
    const onErr = () => {
      // 1 = MEDIA_ERR_ABORTED (src change / load()) — not a real playback failure.
      if (v.error?.code === 1) return;
      setError('This video could not be loaded or the format is not supported.');
      setBuffering(false);
    };

    v.addEventListener('timeupdate', onTime);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('loadedmetadata', onLoaded);
    v.addEventListener('durationchange', onDurationChange);
    v.addEventListener('waiting', onWaiting);
    v.addEventListener('playing', onPlaying);
    v.addEventListener('canplay', onCanPlay);
    v.addEventListener('volumechange', onVolume);
    v.addEventListener('error', onErr);

    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('loadedmetadata', onLoaded);
      v.removeEventListener('durationchange', onDurationChange);
      v.removeEventListener('waiting', onWaiting);
      v.removeEventListener('playing', onPlaying);
      v.removeEventListener('canplay', onCanPlay);
      v.removeEventListener('volumechange', onVolume);
      v.removeEventListener('error', onErr);
    };
  }, [src]);

  useEffect(() => {
    setError(null);
    setBuffering(true);
    setCurrentTime(0);
    setDuration(0);
    const v = videoRef.current;
    if (!v) return;
    v.load();
    if (autoPlay) {
      const p = v.play();
      if (p) p.catch(() => setPaused(true));
    }
  }, [src, autoPlay]);

  useEffect(() => {
    const onFsChange = () => {
      const el = containerRef.current;
      const active =
        document.fullscreenElement === el ||
        document.webkitFullscreenElement === el ||
        document.msFullscreenElement === el;
      setFullscreen(!!active);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    document.addEventListener('MSFullscreenChange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
      document.removeEventListener('MSFullscreenChange', onFsChange);
    };
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v || error) return;
    if (v.paused) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  };

  const onSeek = (e) => {
    const v = videoRef.current;
    if (!v || !Number.isFinite(duration)) return;
    const next = Number(e.target.value);
    v.currentTime = next;
    setCurrentTime(next);
  };

  const onVolumeInput = (e) => {
    const v = videoRef.current;
    if (!v) return;
    const next = Number(e.target.value);
    v.volume = next;
    v.muted = next === 0;
    setVolume(next);
    setMuted(next === 0);
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    if (v.muted) {
      setMuted(true);
    } else {
      setMuted(false);
      if (v.volume === 0) {
        v.volume = 0.5;
        setVolume(0.5);
      }
    }
  };

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (fullscreen) {
        await exitFs();
      } else {
        await requestFs(el);
      }
    } catch {
      /* ignore */
    }
  };

  if (!src) return null;

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col bg-black min-h-0 group ${
        fullscreen
          ? 'h-screen w-screen max-h-screen'
          : ''
      } ${className}`}
    >
      <div
        className={`relative flex items-center justify-center bg-black ${
          fullscreen
            ? 'min-h-0 flex-1 w-full basis-0'
            : 'min-h-[200px] max-h-[min(70vh,720px)]'
        }`}
      >
        <video
          ref={videoRef}
          key={src}
          className={`w-full object-contain outline-none ${
            fullscreen ? 'h-full max-h-full min-h-0' : 'max-h-[min(70vh,720px)]'
          }`}
          playsInline
          preload="auto"
          src={src}
        />
        {buffering && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
            <div className="h-10 w-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-6 bg-black/80">
            <p className="text-center text-[13px] text-white/90 max-w-sm leading-relaxed">{error}</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-white/10 bg-surface px-3 py-2.5 shrink-0">
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="sr-only">Seek</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(currentTime, duration || 0)}
            onChange={onSeek}
            disabled={!!error || !(duration > 0)}
            className="w-full h-1.5 accent-brand-600 rounded-full cursor-pointer disabled:opacity-40"
            aria-valuemin={0}
            aria-valuemax={duration}
            aria-valuenow={currentTime}
          />
        </label>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={togglePlay}
            disabled={!!error}
            className="p-2 rounded-lg border border-border bg-surface text-text-secondary hover:bg-surface-3 hover:text-text-primary disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label={paused ? 'Play' : 'Pause'}
          >
            {paused ? (
              <Play className="w-4 h-4" strokeWidth={2} />
            ) : (
              <Pause className="w-4 h-4" strokeWidth={2} />
            )}
          </button>

          <span className="text-[11px] font-medium tabular-nums text-text-secondary min-w-[5.5rem]">
            {formatTime(currentTime)} <span className="text-text-muted">/</span> {formatTime(duration)}
          </span>

          <div className="flex items-center gap-1.5 flex-1 min-w-[120px] max-w-[140px]">
            <button
              type="button"
              onClick={toggleMute}
              className="p-2 rounded-lg border border-border bg-surface text-text-secondary hover:bg-surface-3"
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted || volume === 0 ? (
                <VolumeX className="w-4 h-4" strokeWidth={1.75} />
              ) : (
                <Volume2 className="w-4 h-4" strokeWidth={1.75} />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={onVolumeInput}
              className="flex-1 h-1.5 accent-brand-600"
              aria-label="Volume"
            />
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-lg border border-border bg-surface text-text-secondary hover:bg-surface-3 ml-auto"
            aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {fullscreen ? (
              <Minimize2 className="w-4 h-4" strokeWidth={1.75} />
            ) : (
              <Maximize className="w-4 h-4" strokeWidth={1.75} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
