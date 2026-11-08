import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

/** Muted ~10s looping clip from inside the episode, shown on the card a swipe stops on. */
export function Preview({ url, start }: { url: string; start: number }) {
  const player = useVideoPlayer(url, (p) => {
    p.muted = true;
    p.timeUpdateEventInterval = 1;
  });
  useEffect(() => {
    const subs = [
      player.addListener('statusChange', ({ status }) => {
        if (status === 'readyToPlay' && player.currentTime < start - 1) {
          player.currentTime = start;
          player.play();
        }
      }),
      player.addListener('timeUpdate', ({ currentTime }) => {
        if (currentTime > start + 9) player.currentTime = start;
      }),
    ];
    return () => subs.forEach((x) => x.remove());
  }, [player, start]);
  return <VideoView player={player} style={StyleSheet.absoluteFill} nativeControls={false} contentFit="contain" allowsPictureInPicture={false} pointerEvents="none" />;
}
