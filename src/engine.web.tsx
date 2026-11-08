import React, { useCallback, useEffect, useRef, useState } from 'react';
import { t } from './i18n';
import Hls from 'hls.js';
import { Engine, EngineOpts, EngineState, initialState } from './engine.types';

/** Web engine: our own <video> (playsInline so iPhone doesn't hijack into the system player) + hls.js for non-Safari HLS. */
export function useEngine({ url, hls, startAt, onError }: EngineOpts): Engine {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [s, setS] = useState<EngineState>(initialState);
  const [muted, setMutedState] = useState(false);
  const rateRef = useRef(1);
  const errRef = useRef(onError);
  errRef.current = onError;

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    setS({ ...initialState });
    let h: Hls | null = null;
    let seeked = false;
    const patch = (p: Partial<EngineState>) => setS((x) => ({ ...x, ...p }));
    const buf = () => {
      const r = v.buffered;
      for (let i = 0; i < r.length; i++) if (r.start(i) <= v.currentTime + 0.5 && r.end(i) >= v.currentTime) return r.end(i);
      return v.currentTime;
    };
    const on: Record<string, () => void> = {
      loadedmetadata: () => {
        if (!seeked && startAt > 0 && !h) v.currentTime = startAt;
        seeked = true;
        patch({ duration: isFinite(v.duration) ? v.duration : 0 });
      },
      durationchange: () => patch({ duration: isFinite(v.duration) ? v.duration : 0 }),
      timeupdate: () => patch({ time: v.currentTime, buffered: buf() }),
      progress: () => patch({ buffered: buf() }),
      play: () => patch({ playing: true, ended: false }),
      playing: () => patch({ playing: true, loading: false }),
      pause: () => patch({ playing: false }),
      waiting: () => patch({ loading: true }),
      canplay: () => patch({ loading: false }),
      ended: () => patch({ ended: true, playing: false }),
      error: () => errRef.current(),
    };
    Object.entries(on).forEach(([k, f]) => v.addEventListener(k, f));
    // Safari: native HLS (needed for AirPlay). Everyone else: hls.js (Chrome's native HLS is unreliable).
    const safari = 'webkitShowPlaybackTargetPicker' in v;
    if (hls && !safari && Hls.isSupported()) {
      h = new Hls({ startPosition: startAt > 0 ? startAt : -1, maxBufferLength: 30 });
      h.on(Hls.Events.ERROR, (_e, d) => d.fatal && errRef.current());
      h.loadSource(url);
      h.attachMedia(v);
    } else {
      v.src = url;
      if (hls && startAt > 0) v.currentTime = startAt;
    }
    v.playbackRate = rateRef.current;
    // iOS may refuse autoplay without a fresh tap → stays paused and the UI shows a big Play button.
    v.play().catch(() => undefined);
    return () => {
      Object.entries(on).forEach(([k, f]) => v.removeEventListener(k, f));
      h?.destroy();
      v.pause();
      v.removeAttribute('src');
      v.load();
    };
  }, [url, hls, startAt]);

  const surface = React.createElement('video', {
    ref,
    playsInline: true,
    controls: false,
    // @ts-ignore non-standard attribute: lets Safari stream to Apple TV
    'x-webkit-airplay': 'allow',
    style: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', background: '#000' },
  });

  const v = () => ref.current!;
  const hasWebkit = typeof document !== 'undefined' && 'webkitShowPlaybackTargetPicker' in HTMLVideoElement.prototype;
  const hasRemote = typeof document !== 'undefined' && 'remote' in HTMLVideoElement.prototype;
  const cast = useCallback(() => {
    const el = ref.current as any;
    if (el?.webkitShowPlaybackTargetPicker) el.webkitShowPlaybackTargetPicker();
    else el?.remote?.prompt().catch(() => undefined);
  }, []);

  return {
    surface,
    s,
    play: () => void v().play().catch(() => undefined),
    pause: () => v().pause(),
    seek: (t) => {
      v().currentTime = t;
      setS((x) => ({ ...x, time: t }));
    },
    setRate: (r) => {
      rateRef.current = r;
      v().playbackRate = r;
    },
    muted,
    setMuted: (m) => {
      v().muted = m;
      setMutedState(m);
    },
    cast: hasWebkit || hasRemote ? cast : undefined,
    castLabel: hasWebkit ? 'AirPlay' : t('cast'),
  };
}
