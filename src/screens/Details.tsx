import React, { useEffect, useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as jf from '../jellyfin';
import { C, useLayout } from '../theme';
import { Focusable } from '../Focusable';
import { Row } from '../components';
import { Icon } from '../Icon';

/** Title page: backdrop, meta, Play / Resume, My List toggle, episodes (series) and "More like this". */
export function Details({ item: initial, active = true, onPlay, onOpen }: { item: jf.Item; active?: boolean; onPlay: (i: jf.Item, fromStart?: boolean) => void; onOpen: (i: jf.Item) => void }) {
  const L = useLayout();
  const [item, setItem] = useState(initial);
  const [fav, setFav] = useState(!!initial.UserData?.IsFavorite);
  const [eps, setEps] = useState<jf.Item[]>([]);
  const [ready, setReady] = useState(initial.Type !== 'Series');
  const [more, setMore] = useState<jf.Item[]>([]);

  useEffect(() => {
    jf.similar(initial.Id).then(setMore, () => setMore([]));
  }, [initial.Id]);

  // Runs on open and again whenever this screen becomes visible (e.g. back from the player),
  // so resume position, watched state and My List are always fresh.
  useEffect(() => {
    if (!active) return;
    jf.getItem(initial.Id).then((x) => {
      setItem(x);
      setFav(!!x.UserData?.IsFavorite);
    }, () => undefined);
    if (initial.Type === 'Series')
      jf.episodes(initial.Id)
        .then(setEps, () => undefined)
        .finally(() => setReady(true));
  }, [active, initial.Id, initial.Type]);

  const toggleFav = async () => {
    const next = !fav;
    setFav(next);
    try {
      await jf.setFavorite(item.Id, next);
    } catch {
      setFav(!next);
    }
  };

  const f = L.font;
  const uri = jf.image(item, 1600, 'backdrop') || jf.image(item, 1600);
  const pos = item.UserData?.PlaybackPositionTicks ?? 0;
  const resumable = pos > 0 && item.RunTimeTicks && pos < item.RunTimeTicks * 0.95;
  const playTarget = item.Type === 'Series' ? eps.find((e) => !e.UserData?.Played) ?? eps[0] : item;
  const meta = [item.ProductionYear, jf.minutes(item.RunTimeTicks), item.OfficialRating, jf.artistOf(item), ...(item.Genres ?? []).slice(0, 2)].filter(Boolean);

  // Series: wait for episodes so the Play button exists before anything grabs remote focus.
  if (!ready) return <View style={s.root} />;

  return (
    <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: 60 }}>
      <View style={{ height: L.phone ? L.width * 0.62 : L.height * 0.7 }}>
        {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
        <LinearGradient colors={['transparent', C.bg]} style={[StyleSheet.absoluteFill, { top: '35%' }]} />
        {!L.phone && <LinearGradient colors={[C.bg, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 0.7, y: 0 }} style={StyleSheet.absoluteFill} />}
      </View>
      <View style={{ paddingHorizontal: L.pad, marginTop: L.phone ? -20 : -L.height * 0.38, maxWidth: L.phone ? undefined : L.width * 0.55 }}>
        <Text style={[s.title, { fontSize: f(58) }]}>{item.Name}</Text>
        <Text style={[s.meta, { fontSize: f(24) }]}>{meta.join('  ·  ')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginVertical: 20 }}>
          {playTarget ? (
            <Focusable autoFocus onPress={() => onPlay(playTarget)} style={[s.btn, { backgroundColor: '#fff' }]} focusStyle={s.btnFocus}>
              <Icon name="play" size={f(28)} color="#000" />
              <Text style={[s.btnText, { color: '#000', fontSize: f(26) }]}>{resumable ? '繼續播放' : '播放'}</Text>
            </Focusable>
          ) : null}
          {resumable ? (
            <Focusable onPress={() => onPlay(item, true)} style={s.btn} focusStyle={s.btnFocus}>
              <Icon name="replay" size={f(28)} />
              <Text style={[s.btnText, { fontSize: f(26) }]}>由頭播</Text>
            </Focusable>
          ) : null}
          <Focusable onPress={toggleFav} style={s.btn} focusStyle={s.btnFocus}>
            <Icon name={fav ? 'check' : 'plus'} size={f(28)} />
            <Text style={[s.btnText, { fontSize: f(26) }]}>{fav ? '已加入片單' : '我的片單'}</Text>
          </Focusable>
        </View>
        {item.Type === 'Series' && !eps.length ? <Text style={[s.meta, { color: C.sub, fontSize: f(22), marginBottom: 16 }]}>仲未有集數可以播（Jellyfin 未掃描到）</Text> : null}
        {item.Overview ? <Text style={[s.over, { fontSize: f(24), lineHeight: f(36) }]}>{item.Overview}</Text> : null}
      </View>

      {eps.length ? (
        <View style={{ marginTop: 30 }}>
          <Text style={[s.section, { fontSize: f(30), marginLeft: L.pad }]}>集數</Text>
          <FlatList
            data={eps}
            keyExtractor={(e) => e.Id}
            scrollEnabled={false}
            renderItem={({ item: e, index }) => (
              <Focusable onPress={() => onPlay(e)} style={[s.ep, { marginHorizontal: L.pad }]} focusStyle={s.epFocus}>
                <Text style={[s.epNo, { fontSize: f(36) }]}>{index + 1}</Text>
                <Image source={{ uri: jf.image(e, 400) }} style={{ width: L.cardW, height: L.cardH, borderRadius: 4, backgroundColor: C.card }} />
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={[s.epTitle, { fontSize: f(24) }]}>{e.Name}</Text>
                  <Text numberOfLines={2} style={{ color: C.sub, fontSize: f(20) }}>
                    {e.Overview}
                  </Text>
                </View>
              </Focusable>
            )}
          />
        </View>
      ) : null}

      {more.length ? (
        <View style={{ marginTop: 30 }}>
          <Row row={{ key: 'more', title: '更多類似', items: more }} onPress={onOpen} />
        </View>
      ) : null}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  title: { color: '#fff', fontWeight: '800' },
  meta: { color: C.green, fontWeight: '600', marginTop: 10 },
  over: { color: '#ddd' },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 26, borderRadius: 6, backgroundColor: 'rgba(109,109,110,0.7)', borderWidth: 3, borderColor: 'transparent' },
  btnFocus: { borderColor: '#fff', transform: [{ scale: 1.06 }] },
  btnText: { color: '#fff', fontWeight: '700' },
  section: { color: '#fff', fontWeight: '700', marginBottom: 12 },
  ep: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 6, borderWidth: 3, borderColor: 'transparent', marginBottom: 6 },
  epFocus: { borderColor: '#fff', backgroundColor: '#222' },
  epNo: { color: C.sub, width: 60, textAlign: 'center' },
  epTitle: { color: '#fff', fontWeight: '600', marginBottom: 6 },
});
