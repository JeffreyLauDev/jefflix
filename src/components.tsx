import React, { memo, useState } from 'react';
import { t } from './i18n';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as jf from './jellyfin';
import { C, useLayout } from './theme';
import { Focusable } from './Focusable';
import { Icon } from './Icon';

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Image source={require('../assets/j-mark.png')} style={{ width: size * 0.7, height: size, marginRight: size * 0.2 }} resizeMode="contain" />
      <Text style={{ color: C.red, fontSize: size * 0.8, fontWeight: '900', letterSpacing: 2 }}>
        JEF<Text style={{ color: '#fff' }}>FLIX</Text>
      </Text>
    </View>
  );
}

export const Card = memo(function Card({
  item,
  onPress,
  onFocus,
  rank,
}: {
  item: jf.Item;
  onPress: (i: jf.Item) => void;
  onFocus?: (i: jf.Item) => void;
  rank?: number;
}) {
  const L = useLayout();
  const uri = jf.image(item, L.cardW * 2);
  const pos = item.UserData?.PlaybackPositionTicks;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginRight: L.phone ? 8 : 20 }}>
      {rank ? <Text style={[s.rank, { fontSize: L.cardH * 1.05, lineHeight: L.cardH * 1.05 }]}>{rank}</Text> : null}
      <Focusable
        onPress={() => onPress(item)}
        onFocusChange={(f) => f && onFocus?.(item)}
        style={[s.card, { width: L.cardW, height: L.cardH }]}
        focusStyle={s.cardFocus}
      >
        {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} /> : null}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={s.cardShade}>
          <Text numberOfLines={1} style={[s.cardName, { fontSize: L.font(20) }]}>
            {item.Name}
          </Text>
        </LinearGradient>
        {pos && item.RunTimeTicks ? <View style={[s.prog, { width: `${Math.min(100, (pos / item.RunTimeTicks) * 100)}%` }]} /> : null}
      </Focusable>
    </View>
  );
});

export function Row({ row, onPress, onFocus }: { row: jf.Row; onPress: (i: jf.Item) => void; onFocus?: (i: jf.Item) => void }) {
  const L = useLayout();
  const top10 = row.key === 'top10';
  return (
    <View style={{ marginBottom: L.phone ? 18 : 34 }}>
      <Text style={[s.rowTitle, { fontSize: L.font(30), marginLeft: L.pad }]}>{row.title}</Text>
      <FlatList
        horizontal
        data={row.items}
        keyExtractor={(i) => i.Id}
        renderItem={({ item, index }) => <Card item={item} onPress={onPress} onFocus={onFocus} rank={top10 ? index + 1 : undefined} />}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: L.pad, paddingVertical: 14 }}
        initialNumToRender={8}
        windowSize={5}
        removeClippedSubviews
      />
    </View>
  );
}

export function Hero({ item, onPlay, onInfo }: { item?: jf.Item; onPlay: (i: jf.Item) => void; onInfo: (i: jf.Item) => void }) {
  const L = useLayout();
  const [lastUri, setLastUri] = useState<string>();
  if (!item) return <View style={{ height: L.heroH }} />;
  const uri = jf.image(item, 1600, 'backdrop') || jf.image(item, 1600);
  if (uri !== lastUri) setLastUri(uri);
  const f = L.font;
  const meta = [item.ProductionYear, jf.minutes(item.RunTimeTicks), jf.artistOf(item) || item.SeriesName || item.Genres?.[0], item.OfficialRating].filter(Boolean);
  return (
    <View style={{ height: L.heroH }}>
      {uri ? <Image source={{ uri }} style={[StyleSheet.absoluteFill, L.phone ? null : { left: L.width * 0.3 }]} resizeMode="cover" /> : null}
      <LinearGradient
        colors={L.phone ? ['transparent', 'rgba(10,10,10,0.6)', C.bg] : [C.bg, 'rgba(10,10,10,0.85)', 'transparent']}
        start={L.phone ? { x: 0, y: 0 } : { x: 0, y: 0 }}
        end={L.phone ? { x: 0, y: 1 } : { x: 0.75, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient colors={['transparent', C.bg]} style={[StyleSheet.absoluteFill, { top: '55%' }]} />
      <View style={[s.heroBody, { left: L.pad, right: L.phone ? L.pad : L.width * 0.45, bottom: L.phone ? 24 : 70 }]}>
        <Text numberOfLines={2} style={[s.heroTitle, { fontSize: f(60) }]}>
          {item.Name}
        </Text>
        <Text style={[s.heroMeta, { fontSize: f(26) }]}>{meta.join('  ·  ')}</Text>
        {!L.phone && item.Overview ? (
          <Text numberOfLines={3} style={[s.heroOver, { fontSize: f(24) }]}>
            {item.Overview}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 14, marginTop: 18 }}>
          <Focusable onPress={() => onPlay(item)} style={[s.btn, { backgroundColor: '#fff' }]} focusStyle={s.btnFocus}>
            <Icon name="play" size={f(28)} color="#000" />
            <Text style={[s.btnText, { color: '#000', fontSize: f(26) }]}>{t('play')}</Text>
          </Focusable>
          <Focusable onPress={() => onInfo(item)} style={[s.btn, { backgroundColor: 'rgba(109,109,110,0.7)' }]} focusStyle={s.btnFocus}>
            <Icon name="info" size={f(28)} />
            <Text style={[s.btnText, { fontSize: f(26) }]}>{t('details')}</Text>
          </Focusable>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 6, overflow: 'hidden', backgroundColor: C.card, borderWidth: 3, borderColor: 'transparent' },
  cardFocus: { borderColor: '#fff', transform: [{ scale: 1.1 }], zIndex: 5 },
  cardShade: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 10, paddingTop: 24, paddingBottom: 8 },
  cardName: { color: '#fff' },
  prog: { position: 'absolute', left: 0, bottom: 0, height: 4, backgroundColor: C.red },
  // Outlined rank number: dark fill + light outline (web stroke, native shadow fallback)
  rank: { color: '#141414', fontWeight: '900', marginRight: -12, textShadowColor: '#bbb', textShadowRadius: 3, textShadowOffset: { width: 0, height: 0 }, ...({ WebkitTextStroke: '3px #bbb' } as object) },
  rowTitle: { color: '#e5e5e5', fontWeight: '700' },
  heroBody: { position: 'absolute' },
  heroTitle: { color: '#fff', fontWeight: '800', textShadowColor: '#000', textShadowRadius: 10 },
  heroMeta: { color: C.green, fontWeight: '600', marginTop: 10 },
  heroOver: { color: '#ddd', marginTop: 10, lineHeight: 34 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 28, borderRadius: 6, borderWidth: 3, borderColor: 'transparent' },
  btnFocus: { borderColor: '#fff', transform: [{ scale: 1.06 }] },
  btnText: { color: '#fff', fontWeight: '700' },
});
