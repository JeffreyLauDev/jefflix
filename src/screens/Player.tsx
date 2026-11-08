import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as jf from '../jellyfin';
import { useEngine } from '../engine';
import { C, useLayout } from '../theme';
import { Icon, IconName } from '../Icon';
import { EpisodeRail } from '../EpisodeRail';
import { canMini, setMini } from '../miniWindow';
import { BACK_CODES } from '../spatialNav';

/**
 * Jefflix's own player: tap to show controls, double-tap ±10s, draggable seek bar,
 * speed, quality (direct play or HLS transcode), next episode, AirPlay / cast, fullscreen, keyboard + TV remote.
 * Reports progress to Jellyfin. The video itself comes from `useEngine` (web <video>+hls.js, native expo-video).
 */
const QUALITIES: { label: string; q?: jf.Quality }[] = [
  { label: '原檔（最清）' },
  { label: '1080p', q: { height: 1080, bitrate: 8_000_000 } },
  { label: '720p', q: { height: 720, bitrate: 4_000_000 } },
  { label: '480p（慳流量）', q: { height: 480, bitrate: 1_500_000 } },
  { label: '360p', q: { height: 360, bitrate: 800_000 } },
];
const RATES = [0.75, 1, 1.25, 1.5, 2];
const isWeb = Platform.OS === 'web';
const touchDevice = () => !isWeb || !!globalThis.matchMedia?.('(pointer: coarse)').matches;
const fmt = (t: number) => {
  t = Math.max(0, Math.floor(t || 0));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = String(t % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
};
const titleOf = (it: jf.Item) =>
  it.Type === 'Episode' ? `${it.SeriesName ?? ''}  S${it.ParentIndexNumber ?? 1}:E${it.IndexNumber ?? ''}  ${it.Name}` : it.Name;

export function Player({ item, fromStart, onNext, onClose }: { item: jf.Item; fromStart?: boolean; onNext: (i: jf.Item) => void; onClose: () => void }) {
  const L = useLayout();
  const root = useRef<any>(null);
  const resume = fromStart ? 0 : (item.UserData?.PlaybackPositionTicks ?? 0) / 1e7;
  const [startAt, setStartAt] = useState(resume);
  const [quality, setQuality] = useState(0);
  const [fellBack, setFellBack] = useState(false);
  const [failed, setFailed] = useState(false);
  const [show, setShow] = useState(true);
  const [menu, setMenu] = useState(false);
  const [rate, setRate] = useState(1);
  const [scrub, setScrub] = useState<number | null>(null);
  const [barW, setBarW] = useState(1);
  const [fs, setFs] = useState(false);
  const [next, setNext] = useState<jf.Item | null>(null);
  const [rail, setRail] = useState<jf.Item[]>([]);
  const [panel, setPanel] = useState(false);
  const [railH, setRailH] = useState(0);
  // Episode row size, like YouTube: small = video shrinks above the row, big = row over the full video. Remembered.
  const [railSmall, setRailSmall] = useState(L.phone || L.height < 600);
  useEffect(() => {
    AsyncStorage.getItem('jf_rail_small').then((v) => v !== null && setRailSmall(v === '1'), () => undefined);
  }, []);
  const toggleRailSize = () =>
    setRailSmall((v) => {
      AsyncStorage.setItem('jf_rail_small', v ? '0' : '1').catch(() => undefined);
      return !v;
    });
  const [mini, setMiniState] = useState(false);
  const toggleMini = () => {
    setMini(!mini).then(() => setMiniState(!mini), () => undefined);
    setPanel(false);
  };
  useEffect(() => () => void setMini(false), []); // leaving the player restores the normal window
  const timeRef = useRef(0);

  const q = QUALITIES[quality].q ?? (fellBack ? QUALITIES[2].q : undefined);
  const e = useEngine({
    url: jf.streamUrl(item, q),
    hls: !!q,
    startAt,
    onError: () => {
      if (!q) {
        // original file can't be played by this device → transcode from where we were
        setStartAt(Math.max(timeRef.current, resume));
        setFellBack(true);
      } else setFailed(true);
    },
  });
  timeRef.current = e.s.time || timeRef.current;
  const eng = useRef(e);
  eng.current = e;

  // ---- next episode
  useEffect(() => {
    setPanel(false);
    if (item.Type !== 'Episode' || !item.SeriesId) {
      jf.similar(item.Id).then(setRail, () => setRail([]));
      return;
    }
    jf.episodes(item.SeriesId).then(
      (list) => {
        setRail(list);
        setNext(list[list.findIndex((x) => x.Id === item.Id) + 1] ?? null);
      },
      () => undefined,
    );
  }, [item.Id, item.SeriesId, item.Type]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (e.s.ended && next) onNext(next);
  }, [e.s.ended, next, onNext]);

  // ---- progress → Jellyfin
  useEffect(() => {
    jf.report('start', item, startAt);
    const t = setInterval(() => jf.report('progress', item, timeRef.current, !eng.current.s.playing), 10_000);
    return () => {
      clearInterval(t);
      jf.report('stop', item, timeRef.current);
    };
  }, [item]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- auto-hide controls
  const hideT = useRef<any>(null);
  const poke = useCallback(() => {
    setShow(true);
    clearTimeout(hideT.current);
    hideT.current = setTimeout(() => setShow(false), 3500);
  }, []);
  useEffect(() => {
    poke();
    return () => clearTimeout(hideT.current);
  }, [poke]);
  const visible = show || !e.s.playing || menu || panel;

  // ---- helpers
  const seekBy = (d: number) => {
    e.seek(Math.min(Math.max(0, e.s.time + d), e.s.duration || Infinity));
    poke();
  };
  const toggle = () => {
    e.s.playing ? e.pause() : e.play();
    poke();
  };
  const toggleFs = () => {
    if (!isWeb) return;
    const el = root.current as HTMLElement;
    document.fullscreenElement ? document.exitFullscreen() : el?.requestFullscreen?.();
  };
  const cycleRate = () => {
    const r = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
    setRate(r);
    e.setRate(r);
  };
  const pickQuality = (i: number) => {
    setMenu(false);
    if (i === quality) return;
    setStartAt(timeRef.current);
    setQuality(i);
    setFellBack(false);
    setFailed(false);
  };

  // ---- web: keyboard / TV remote, fullscreen state, wake lock
  useEffect(() => {
    if (!isWeb) return;
    const h = (ev: KeyboardEvent) => {
      const onBtn = (ev.target as HTMLElement | null)?.getAttribute?.('role') === 'button';
      const k = ev.keyCode;
      if (menu && [8, 27, 461, 10009].includes(k)) {
        ev.stopImmediatePropagation();
        ev.preventDefault();
        return setMenu(false);
      }
      if ((k === 13 || k === 32) && onBtn) return; // let the focused button handle it
      if (panel) return; // arrows / Enter belong to the episode row (spatial nav); Back is handled in the capture listener below
      if (k === 40 && rail.length) {
        ev.preventDefault();
        return setPanel(true);
      }
      const c = eng.current;
      if (k === 13 || k === 32 || k === 75 || k === 415 || k === 19) c.s.playing ? c.pause() : c.play();
      else if (k === 37 || k === 74 || k === 412) c.seek(Math.max(0, c.s.time - 10));
      else if (k === 39 || k === 76 || k === 417) c.seek(c.s.time + 10);
      else if (k === 70) toggleFs();
      else if (k === 77) c.setMuted(!c.muted);
      else if (k !== 38 && k !== 40) return;
      ev.preventDefault();
      poke();
    };
    window.addEventListener('keydown', h);
    const fsH = () => setFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', fsH);
    let lock: any;
    (navigator as any).wakeLock?.request?.('screen').then((l: any) => (lock = l), () => undefined);
    return () => {
      window.removeEventListener('keydown', h);
      document.removeEventListener('fullscreenchange', fsH);
      lock?.release?.();
    };
  }, [menu, panel, rail.length, poke]); // eslint-disable-line react-hooks/exhaustive-deps

  // Back / Esc closes the open menu or episode row first (window capture runs before the app-level Back handler)
  useEffect(() => {
    if (!isWeb || (!panel && !menu)) return;
    const h = (ev: KeyboardEvent) => {
      if (!BACK_CODES.includes(ev.keyCode)) return;
      ev.stopImmediatePropagation();
      ev.preventDefault();
      panel ? setPanel(false) : setMenu(false);
    };
    window.addEventListener('keydown', h, true);
    return () => window.removeEventListener('keydown', h, true);
  }, [panel, menu]);

  // ---- lock-screen / media-key controls
  useEffect(() => {
    const ms = isWeb ? (navigator as any).mediaSession : null;
    if (!ms) return;
    ms.metadata = new (globalThis as any).MediaMetadata({ title: titleOf(item), artist: jf.artistOf(item) ?? item.SeriesName ?? 'Jefflix', artwork: [{ src: jf.image(item, 512) ?? '' }] });
    ms.setActionHandler('play', () => eng.current.play());
    ms.setActionHandler('pause', () => eng.current.pause());
    ms.setActionHandler('seekbackward', () => eng.current.seek(Math.max(0, timeRef.current - 10)));
    ms.setActionHandler('seekforward', () => eng.current.seek(timeRef.current + 10));
    return () => ['play', 'pause', 'seekbackward', 'seekforward'].forEach((a) => ms.setActionHandler(a, null));
  }, [item]);

  // ---- tap / double-tap on the picture
  const lastTap = useRef(0);
  const tapT = useRef<any>(null);
  const onSurface = (ev: any) => {
    if (menu) return setMenu(false);
    if (panel) return setPanel(false);
    const x = ev.nativeEvent?.locationX ?? L.width / 2;
    const touch = touchDevice();
    const now = Date.now();
    if (now - lastTap.current < 300) {
      clearTimeout(tapT.current);
      lastTap.current = 0;
      if (!touch) return toggleFs(); // desktop: double-click = fullscreen (first click already toggled play)
      return x < L.width / 3 ? seekBy(-10) : x > (L.width * 2) / 3 ? seekBy(10) : toggleFs();
    }
    lastTap.current = now;
    if (!touch) return toggle(); // desktop: click = play/pause, instantly
    tapT.current = setTimeout(() => (show ? setShow(false) : poke()), 280); // phone: tap = show/hide controls
  };

  // ---- seek bar
  const dur = e.s.duration || 1;
  const frac = Math.min(1, Math.max(0, (scrub ?? e.s.time) / dur));
  const bufFrac = Math.min(1, e.s.buffered / dur);
  const at = (ev: any) => Math.min(1, Math.max(0, ev.nativeEvent.locationX / barW)) * (e.s.duration || 0);
  const bar = {
    onStartShouldSetResponder: () => true,
    onResponderGrant: (ev: any) => {
      setScrub(at(ev));
      clearTimeout(hideT.current);
    },
    onResponderMove: (ev: any) => setScrub(at(ev)),
    onResponderRelease: (ev: any) => {
      e.seek(at(ev));
      setScrub(null);
      poke();
    },
    onResponderTerminate: () => setScrub(null),
  };

  const big = L.phone ? 34 : 44;
  const btn = (label: string, onPress: () => void, icon?: IconName, size = 22, text?: string) => (
    <Pressable role="button" accessibilityLabel={label} onPress={() => { onPress(); poke(); }} hitSlop={8} style={s.btn}>
      {icon ? <Icon name={icon} size={size} /> : null}
      {text ? <Text style={[s.icon, { fontSize: L.phone ? 14 : 18 }]}>{text}</Text> : null}
    </Pressable>
  );
  const sm = L.phone ? 14 : 18;

  return (
    <View ref={root} style={[s.root, isWeb && !visible && ({ cursor: 'none' } as object)]}>
      {/* Phones: with the episode row open, the picture shrinks into the space above it instead of being covered. */}
      <View style={[StyleSheet.absoluteFill, panel && railSmall && { bottom: railH }]} pointerEvents="none">
        {e.surface}
      </View>
      <Pressable style={StyleSheet.absoluteFill} onPress={onSurface} {...(isWeb ? ({ onMouseMove: poke } as object) : {})} />

      {e.s.loading && !failed ? <ActivityIndicator size="large" color="#fff" style={s.center} pointerEvents="none" /> : null}
      {failed ? (
        <View style={s.center} pointerEvents="none">
          <Text style={s.msg}>呢條片播唔到，試吓喺右下角轉畫質</Text>
        </View>
      ) : null}

      <View style={[StyleSheet.absoluteFill, { opacity: visible ? 1 : 0 }]} pointerEvents="box-none">
        <View style={[s.top, { paddingHorizontal: L.pad, paddingTop: L.phone ? 40 : 24 }]} pointerEvents={visible ? 'auto' : 'none'}>
          {btn('返回', onClose, 'back', big * 0.8)}
          <Text numberOfLines={1} style={[s.title, { fontSize: L.phone ? 15 : 22 }]}>{titleOf(item)}</Text>
          {e.nativeCast ?? (e.cast ? btn(e.castLabel ?? '投放', e.cast, e.castLabel === 'AirPlay' ? 'airplay' : 'cast', sm + 8) : null)}
        </View>

        {!panel && <View style={s.mid} pointerEvents="box-none">
          <View pointerEvents={visible ? 'auto' : 'none'} style={[s.midRow, { gap: L.phone ? 28 : 56 }]}>
            {btn('後退10秒', () => seekBy(-10), 'rewind10', big)}
            {btn(e.s.ended ? '重播' : e.s.playing ? '暫停' : '播放', e.s.ended ? () => e.seek(0) : toggle, e.s.ended ? 'replay' : e.s.playing ? 'pause' : 'play', big * 1.6)}
            {btn('快進10秒', () => seekBy(10), 'forward10', big)}
          </View>
        </View>}

        {!panel && <View style={[s.bottom, { paddingHorizontal: L.pad, paddingBottom: L.phone ? 28 : 24 }]} pointerEvents={visible ? 'auto' : 'none'}>
          <View style={s.barRow}>
            <Text style={s.time}>{fmt(scrub ?? e.s.time)}</Text>
            <View style={s.barHit} onLayout={(ev) => setBarW(ev.nativeEvent.layout.width)} {...bar}>
              <View style={s.track} pointerEvents="none">
                <View style={[s.fill, { width: `${bufFrac * 100}%`, backgroundColor: 'rgba(255,255,255,0.35)' }]} />
                <View style={[s.fill, { width: `${frac * 100}%`, backgroundColor: C.red }]} />
              </View>
              <View pointerEvents="none" style={[s.thumb, { left: frac * barW - 8, transform: [{ scale: scrub !== null ? 1.5 : 1 }] }]} />
            </View>
            <Text style={s.time}>-{fmt(Math.max(0, e.s.duration - (scrub ?? e.s.time)))}</Text>
          </View>
          <View style={s.opts}>
            {rail.length ? btn(item.Type === 'Episode' ? '集數' : '相關影片', () => setPanel(true), 'list', sm + 6, item.Type === 'Episode' ? '集數' : '相關') : null}
            {next ? btn('下一集', () => onNext(next), 'next', sm + 6, '下一集') : null}
            <View style={{ flex: 1 }} />
            {btn('播放速度', cycleRate, undefined, sm, `${rate}x`)}
            {btn('靜音', () => e.setMuted(!e.muted), e.muted ? 'mute' : 'volume', sm + 8)}
            {btn('畫質', () => setMenu(!menu), 'settings', sm + 6, QUALITIES[quality].q ? QUALITIES[quality].label.split('（')[0] : fellBack ? '720p' : '原檔')}
            {canMini ? btn(mini ? '還原視窗' : '小視窗置頂', toggleMini, mini ? 'exit-fullscreen' : 'mini', sm + 8) : null}
            {isWeb && (globalThis as any).document?.fullscreenEnabled ? btn('全螢幕', toggleFs, fs ? 'exit-fullscreen' : 'fullscreen', sm + 8) : null}
          </View>
          {menu ? (
            <View style={s.menu}>
              <Text style={s.menuTitle}>畫質</Text>
              {QUALITIES.map((o, i) => (
                <Pressable key={o.label} role="button" onPress={() => pickQuality(i)} style={s.menuItem}>
                  <Text style={[s.menuText, i === quality && { color: C.red, fontWeight: '800' }]}>{o.label}</Text>
                  {i === quality ? <Icon name="check" size={18} color={C.red} /> : null}
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>}
        {panel && rail.length ? (
          <EpisodeRail
            title={item.Type === 'Episode' ? item.SeriesName ?? '集數' : '相關影片'}
            current={item.Id}
            list={rail}
            onPick={(it) => (it.Id === item.Id ? setPanel(false) : onNext(it))}
            onHeight={setRailH}
            small={railSmall}
            onToggleSize={toggleRailSize}
          />
        ) : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000', overflow: 'hidden' },
  center: { position: 'absolute', alignSelf: 'center', top: '46%' },
  msg: { color: '#fff', fontSize: 18, backgroundColor: 'rgba(0,0,0,0.7)', padding: 12, borderRadius: 6 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 40, ...({ backgroundImage: 'linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0))' } as object) },
  title: { flex: 1, color: '#fff', fontWeight: '700' },
  mid: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  midRow: { flexDirection: 'row', alignItems: 'center' },
  bottom: { paddingTop: 40, ...({ backgroundImage: 'linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0.8))' } as object) },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barHit: { flex: 1, height: 36, justifyContent: 'center' },
  track: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  thumb: { position: 'absolute', top: 10, width: 16, height: 16, borderRadius: 8, backgroundColor: C.red },
  time: { color: '#fff', fontSize: 13, minWidth: 44, textAlign: 'center', fontVariant: ['tabular-nums'] },
  opts: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  btn: { paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  icon: { color: '#fff', fontWeight: '700' },
  menu: { position: 'absolute', right: 16, bottom: 130, backgroundColor: 'rgba(24,24,24,0.96)', borderRadius: 8, paddingVertical: 8, minWidth: 190 },
  menuTitle: { color: '#aaa', fontSize: 13, paddingHorizontal: 16, paddingBottom: 6 },
  menuItem: { paddingHorizontal: 16, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  menuText: { color: '#fff', fontSize: 16 },
});
