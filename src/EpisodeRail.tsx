import React, { useEffect, useRef, useState } from 'react';
import { t } from './i18n';
import { Image, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as jf from './jellyfin';
import { C, useLayout } from './theme';
import { Focusable } from './Focusable';
import { Preview } from './Preview';
import { Icon } from './Icon';

/**
 * Row shown over the player: every episode (or related video) as a card.
 * Left/right moves between cards; staying on one for a moment turns its still into a muted preview clip.
 */
export function EpisodeRail({ title, current, list, onPick, onHeight, small, onToggleSize }: {
  title: string;
  current: string;
  list: jf.Item[];
  onPick: (i: jf.Item) => void;
  onHeight?: (h: number) => void;
  /** true = the video shrinks above the row; false = the row sits over the full-size video */
  small?: boolean;
  onToggleSize?: () => void;
}) {
  const L = useLayout();
  // Size from screen HEIGHT: a landscape phone is wide but short, so the row must stay a thin strip (~1/3 of the screen).
  const short = L.height < 600;
  const cardW = Math.round(Math.min(L.tv ? 340 : 280, Math.max(130, Math.min(L.width * 0.42, ((L.height * (short ? 0.2 : 0.24)) * 16) / 9))));
  const gap = short ? 10 : 14;
  const [prev, setPrev] = useState<string | null>(null);
  // Touch screens have no focus: preview whichever card the swipe stops nearest the middle.
  const onScrollEnd = (ev: any) => {
    if (Platform.OS === 'web') return;
    const x = ev.nativeEvent.contentOffset.x + L.width / 2 - L.pad - cardW / 2;
    const it = list[Math.min(list.length - 1, Math.max(0, Math.round(x / (cardW + gap))))];
    setPrev(it && it.Id !== current ? it.Id : null);
  };
  const timer = useRef<any>(null);
  const sv = useRef<any>(null);
  const idx = Math.max(0, list.findIndex((x) => x.Id === current));
  useEffect(() => {
    const t = setTimeout(() => sv.current?.scrollTo({ x: Math.max(0, idx * (cardW + gap) - L.pad), animated: false }), 30);
    return () => {
      clearTimeout(t);
      clearTimeout(timer.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const seasons = new Set(list.map((x) => x.ParentIndexNumber)).size > 1;
  const f = L.font;
  return (
    <View onLayout={(ev) => onHeight?.(ev.nativeEvent.layout.height)} style={[s.wrap, short && { paddingTop: 12, paddingBottom: 10 }]}>
      <View style={[s.head, { paddingHorizontal: L.pad }, short && { marginBottom: 6 }]}>
        <Text numberOfLines={1} style={[s.h, { fontSize: short ? 15 : f(34), flex: 1 }]}>{title}</Text>
        {onToggleSize ? (
          <Focusable onPress={onToggleSize} style={s.size} focusStyle={s.sizeFocus} accessibilityRole="button" accessibilityLabel={small ? t('bigger') : t('smaller')}>
            <Icon name={small ? 'fullscreen' : 'exit-fullscreen'} size={short ? 16 : 20} />
            <Text style={[s.sizeText, { fontSize: short ? 12 : f(18) }]}>{small ? t('big') : t('small')}</Text>
          </Focusable>
        ) : null}
      </View>
      <ScrollView ref={sv} horizontal onMomentumScrollEnd={onScrollEnd} onScrollEndDrag={(ev) => ev.nativeEvent.velocity?.x === 0 && onScrollEnd(ev)} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: L.pad, gap }}>
        {list.map((it) => {
          const now = it.Id === current;
          const pos = (it.UserData?.PlaybackPositionTicks ?? 0) / (it.RunTimeTicks || 1);
          const runSec = (it.RunTimeTicks ?? 0) / 1e7;
          const ep = it.Type === 'Episode' ? `${seasons ? `S${it.ParentIndexNumber ?? 1}:` : ''}E${it.IndexNumber ?? ''}  ` : '';
          return (
            <Focusable
              key={it.Id}
              autoFocus={now}
              onPress={() => onPick(it)}
              onFocusChange={(on) => {
                clearTimeout(timer.current);
                if (on && !now) timer.current = setTimeout(() => setPrev(it.Id), 700);
                else if (!on) setPrev((p) => (p === it.Id ? null : p));
              }}
              style={[s.card, { width: cardW }]}
              focusStyle={s.cardFocus}
            >
              <View style={[s.thumb, { height: Math.round((cardW * 9) / 16) }]}>
                <Image source={{ uri: jf.image(it, cardW * 2) ?? undefined }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                {prev === it.Id ? <Preview url={jf.streamUrl(it)} start={Math.min(Math.max(30, runSec * 0.2), Math.max(0, runSec - 15))} /> : null}
                {now ? (
                  <View style={s.badge}>
                    <Text style={s.badgeText}>{t('nowPlaying')}</Text>
                  </View>
                ) : null}
                {pos > 0.01 && pos < 0.97 ? (
                  <View style={s.track}>
                    <View style={[s.fill, { width: `${pos * 100}%` }]} />
                  </View>
                ) : null}
              </View>
              <Text numberOfLines={1} style={[s.name, { fontSize: short ? 12 : f(22) }, short && { marginTop: 4 }]}>{ep}{it.Name}</Text>
              {!short && !L.phone && it.Overview ? (
                <Text numberOfLines={2} style={[s.ov, { fontSize: f(17) }]}>{it.Overview}</Text>
              ) : null}
            </Focusable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 36, paddingBottom: 32, backgroundColor: 'rgba(0,0,0,0.82)' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  h: { color: '#fff', fontWeight: '800' },
  size: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4, borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)' },
  sizeFocus: { borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.15)' },
  sizeText: { color: '#fff', fontWeight: '700' },
  card: { borderRadius: 6, borderWidth: 3, borderColor: 'transparent', padding: 2 },
  cardFocus: { borderColor: '#fff', transform: [{ scale: 1.04 }] },
  thumb: { width: '100%', borderRadius: 4, overflow: 'hidden', backgroundColor: C.card },
  name: { color: '#fff', fontWeight: '700', marginTop: 8 },
  ov: { color: C.sub, marginTop: 4 },
  badge: { position: 'absolute', left: 8, top: 8, backgroundColor: C.red, borderRadius: 3, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  track: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  fill: { height: 4, backgroundColor: C.red },
});
