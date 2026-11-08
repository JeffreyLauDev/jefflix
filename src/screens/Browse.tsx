import React, { useCallback, useEffect, useState } from 'react';
import { t, Key, LANGS, getLang, setLang, langName, useLang } from '../i18n';
import { Platform } from 'react-native';
import { ActivityIndicator, FlatList, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as jf from '../jellyfin';
import { C, useLayout } from '../theme';
import { Focusable } from '../Focusable';
import { Hero, Logo, Row } from '../components';
import { Icon } from '../Icon';

/** TV layout: top tab bar (search · home · shows · movies · MV · my list), hero, rows. */
const TABS: { key: jf.Tab | 'search'; label: Key }[] = [
  { key: 'search', label: 'tabSearch' },
  { key: 'home', label: 'tabHome' },
  { key: 'shows', label: 'tabShows' },
  { key: 'movies', label: 'tabMovies' },
  { key: 'mv', label: 'tabMv' },
  { key: 'mylist', label: 'myList' },
];

type Props = {
  onPlay: (i: jf.Item) => void;
  onInfo: (i: jf.Item) => void;
  onSearch: () => void;
  onProfile: () => void;
  tab: jf.Tab;
  onTab: (t: jf.Tab) => void;
};

export function Browse({ onPlay, onInfo, onSearch, onProfile, tab, onTab: setTab }: Props) {
  const L = useLayout();
  const [rows, setRows] = useState<jf.Row[] | null>(null);
  const [hero, setHero] = useState<jf.Item>();
  const [err, setErr] = useState('');
  const [menu, setMenu] = useState(false);
  const lang = useLang();
  const [scrolled, setScrolled] = useState(false);
  // Back closes the profile menu first (capture phase runs before the app-level back handler).
  useEffect(() => {
    if (!menu || Platform.OS !== 'web') return;
    const h = (e: KeyboardEvent) => {
      if ([8, 27, 461, 10009].includes(e.keyCode)) {
        e.stopImmediatePropagation();
        e.preventDefault();
        setMenu(false);
        setTimeout(() => (document.querySelector('[data-avatar]') as HTMLElement | null)?.focus(), 50);
      }
    };
    window.addEventListener('keydown', h, true);
    return () => window.removeEventListener('keydown', h, true);
  }, [menu]);

  useEffect(() => {
    let alive = true;
    setRows(null);
    setErr('');
    jf.rows(tab).then(
      (r) => {
        if (!alive) return;
        setRows(r);
        setHero(r.find((x) => x.key !== 'resume')?.items[0] ?? r[0]?.items[0]);
      },
      () => alive && setErr(t('cantReach')),
    );
    return () => {
      alive = false;
    };
  }, [tab, lang]);

  // On TV/desktop the hero follows the focused card, like a TV streaming app.
  const onFocus = useCallback((i: jf.Item) => !L.phone && setHero(i), [L.phone]);
  const user = jf.current();
  const f = L.font;

  const header = (
    <View style={[s.bar, { paddingHorizontal: L.pad, paddingTop: L.phone ? 44 : 30 }, scrolled && s.barSolid]}>
      <Focusable onPress={() => setMenu(true)} {...({ dataSet: { avatar: '1' } } as object)} style={s.avatarBtn} focusStyle={s.focusRing}>
        <View style={[s.avatar, { width: f(44), height: f(44) }]}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: f(22) }}>{user?.userName?.[0]?.toUpperCase()}</Text>
        </View>
        {!L.phone && <View style={{ marginLeft: 4 }}><Icon name="chevron-down" size={f(22)} /></View>}
      </Focusable>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs} style={{ flexGrow: 0, flexShrink: 1 }} {...({ dataSet: { tabbar: '1' } } as object)}>
        {TABS.map((tb) => {
          const active = tb.key === tab;
          return (
            <Focusable
              key={tb.key}
              autoFocus={tb.key === 'home'}
              aria-selected={active}
              onPress={() => (tb.key === 'search' ? onSearch() : setTab(tb.key))}
              style={[s.tab, L.phone && s.tabPhone, active && s.tabActive]}
              focusStyle={s.tabFocus}
            >
              {tb.key === 'search' ? <Icon name="search" size={L.phone ? 18 : f(26)} color={active ? '#fff' : C.sub} /> : <Text style={[s.tabText, { fontSize: L.phone ? 13 : f(24) }, active && { color: '#fff' }]}>{t(tb.label)}</Text>}
            </Focusable>
          );
        })}
      </ScrollView>
      {!L.phone && <Logo size={f(40)} />}
    </View>
  );

  return (
    <View style={s.root}>
      <FlatList
        data={rows ?? []}
        keyExtractor={(r) => r.key}
        ListHeaderComponent={
          <View>
            <Hero item={hero} onPlay={onPlay} onInfo={onInfo} />
            {!rows && !err ? <ActivityIndicator color={C.red} size="large" style={{ marginTop: 40 }} /> : null}
            {err ? <Text style={s.err}>{err}</Text> : null}
            {rows && !rows.length ? <Text style={s.err}>{t('empty')}</Text> : null}
          </View>
        }
        renderItem={({ item }) => <Row row={item} onPress={onInfo} onFocus={onFocus} />}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y > L.heroH * 0.5;
          if (y !== scrolled) setScrolled(y);
        }}
        scrollEventThrottle={64}
        initialNumToRender={6}
        windowSize={11}
        removeClippedSubviews={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      />
      {header}
      {menu ? (
        <View style={s.menuBack}>
          <View style={s.menu}>
            <Text style={[s.menuTitle, { fontSize: f(26) }]}>{user?.userName}</Text>
            <Focusable autoFocus onPress={onProfile} style={s.menuItem} focusStyle={s.menuFocus}>
              <Text style={[s.menuText, { fontSize: f(24) }]}>{t('switchUser')}</Text>
            </Focusable>
            <Focusable
              onPress={() => setLang(LANGS[(LANGS.findIndex((x) => x.code === getLang()) + 1) % LANGS.length].code)}
              style={s.menuItem} focusStyle={s.menuFocus} accessibilityRole="button">
              <Text style={[s.menuText, { fontSize: f(24) }]}>{t('language')}: {langName()}  ›</Text>
            </Focusable>
            <Focusable
              onPress={() => {
                setMenu(false);
                if (Platform.OS === 'web') setTimeout(() => (document.querySelector('[data-avatar]') as HTMLElement | null)?.focus(), 50);
              }}
              style={s.menuItem} focusStyle={s.menuFocus}>
              <Text style={[s.menuText, { fontSize: f(24) }]}>{t('cancel')}</Text>
            </Focusable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: 12,
    backgroundColor: 'rgba(10,10,10,0.35)',
  },
  avatarBtn: { flexDirection: 'row', alignItems: 'center', padding: 4, borderRadius: 6, borderWidth: 3, borderColor: 'transparent' },
  avatar: { backgroundColor: '#2b74e2', borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  focusRing: { borderColor: '#fff' },
  tabs: { flexDirection: 'row', gap: 2, alignItems: 'center' },
  tab: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 22, borderWidth: 3, borderColor: 'transparent' },
  tabPhone: { paddingVertical: 5, paddingHorizontal: 8, borderWidth: 1 },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.18)' },
  tabFocus: { borderColor: '#fff' },
  tabText: { color: C.sub, fontWeight: '600' },
  barSolid: { backgroundColor: '#0a0a0a' },
  menuBack: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  menu: { backgroundColor: '#181818', borderRadius: 10, padding: 24, minWidth: 320, gap: 10 },
  menuTitle: { color: '#fff', fontWeight: '700', marginBottom: 8 },
  menuItem: { padding: 14, borderRadius: 6, borderWidth: 3, borderColor: 'transparent', backgroundColor: '#2a2a2a' },
  menuFocus: { borderColor: '#fff' },
  menuText: { color: '#fff' },
  err: { color: C.sub, textAlign: 'center', marginTop: 30, fontSize: 20 },
});
