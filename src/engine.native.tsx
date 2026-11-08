import React, { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView, VideoAirPlayButton } from 'expo-video';
import { Engine, EngineOpts, EngineState, initialState } from './engine.types';

/** Native engine (iOS/Android/tvOS): expo-video without its built-in controls; AirPlay via the system route button. */
export function useEngine({ url, startAt, onError }: EngineOpts): Engine {
  const player = useVideoPlayer(url, (p) => {
    p.timeUpdateEventInterval = 0.25;
    p.allowsExternalPlayback = true;
    p.staysActiveInBackground = true;
    p.showNowPlayingNotification = true;
    p.play();
  });
  const [s, setS] = useState<EngineState>(initialState);
  const [muted, setMutedState] = useState(false);
  const errRef = useRef(onError);
  errRef.current = onError;

  useEffect(() => {
    let seeked = false;
    const patch = (p: Partial<EngineState>) => setS((x) => ({ ...x, ...p }));
    const subs = [
      player.addListener('timeUpdate', ({ currentTime, bufferedPosition }) => patch({ time: currentTime, buffered: bufferedPosition, duration: player.duration })),
      player.addListener('playingChange', ({ isPlaying }) => patch({ playing: isPlaying, ...(isPlaying ? { ended: false } : {}) })),
      player.addListener('statusChange', ({ status }) => {
        patch({ loading: status === 'loading' });
        if (status === 'readyToPlay') {
          if (!seeked && startAt > 0) player.currentTime = startAt;
          seeked = true;
          patch({ duration: player.duration });
        }
        if (status === 'error') errRef.current();
      }),
      player.addListener('playToEnd', () => patch({ ended: true, playing: false })),
    ];
    return () => subs.forEach((x) => x.remove());
  }, [player, startAt]);

  return {
    surface: <VideoView player={player} style={StyleSheet.absoluteFill} nativeControls={false} contentFit="contain" allowsPictureInPicture startsPictureInPictureAutomatically />,
    s,
    play: () => player.play(),
    pause: () => player.pause(),
    seek: (t) => {
      player.currentTime = t;
      setS((x) => ({ ...x, time: t }));
    },
    setRate: (r) => (player.playbackRate = r),
    muted,
    setMuted: (m) => {
      player.muted = m;
      setMutedState(m);
    },
    nativeCast: Platform.OS === 'ios' ? <VideoAirPlayButton style={{ width: 44, height: 44 }} tint="#fff" activeTint="#e50914" /> : undefined,
  };
}
