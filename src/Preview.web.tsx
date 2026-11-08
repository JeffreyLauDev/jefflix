import React, { useEffect, useRef } from 'react';

/** A muted, looping few-seconds clip taken from the episode itself (Jellyfin has no ready-made preview clips). */
export function Preview({ url, start }: { url: string; start: number }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    const loop = () => {
      if (v.currentTime > start + 9) v.currentTime = start;
    };
    v.addEventListener('timeupdate', loop);
    v.play().catch(() => undefined);
    return () => v.removeEventListener('timeupdate', loop);
  }, [start]);
  return React.createElement('video', {
    ref,
    src: `${url}#t=${start}`,
    muted: true,
    autoPlay: true,
    playsInline: true,
    style: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', background: '#000', pointerEvents: 'none' },
  });
}
