import type React from 'react';

/** One tiny interface over "a video that plays": raw <video>+hls.js on web, expo-video on iOS/Android. */
export type EngineState = { playing: boolean; time: number; duration: number; buffered: number; loading: boolean; ended: boolean };
export type EngineOpts = { url: string; hls: boolean; startAt: number; onError: () => void };
export type Engine = {
  surface: React.ReactNode;
  s: EngineState;
  play(): void;
  pause(): void;
  seek(t: number): void;
  setRate(r: number): void;
  muted: boolean;
  setMuted(m: boolean): void;
  /** Web: open the AirPlay / Chromecast picker. */
  cast?: () => void;
  castLabel?: string;
  /** iOS native: ready-made AirPlay route button. */
  nativeCast?: React.ReactNode;
};
export const initialState: EngineState = { playing: false, time: 0, duration: 0, buffered: 0, loading: true, ended: false };
