import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, Pressable, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as jf from './src/jellyfin';
import { useSpatialNav } from './src/spatialNav';
import { Intro } from './src/screens/Intro';
import { Login } from './src/screens/Login';
import { Browse } from './src/screens/Browse';
import { Details } from './src/screens/Details';
import { Search } from './src/screens/Search';
import { Player } from './src/screens/Player';
import { Icon } from './src/Icon';
import { useLayout } from './src/theme';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

type Screen = { name: 'details'; item: jf.Item } | { name: 'search' } | { name: 'player'; item: jf.Item; fromStart?: boolean };

export default function App() {
  return (
    <SafeAreaProvider>
      <AppInner />
    </SafeAreaProvider>
  );
}

function AppInner() {
  const top0 = useSafeAreaInsets().top;
  const [intro, setIntro] = useState(true);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [stack, setStack] = useState<Screen[]>([]);
  const [tab, setTabState] = useState<jf.Tab>('home');
  const L = useLayout();
  const web = Platform.OS === 'web';

  // Web: mirror navigation into browser history, so the browser Back button and the
  // iPhone swipe-back gesture work. State = { d: stack depth, tab }.
  useEffect(() => {
    if (!web) return;
    history.replaceState({ d: 0, tab: 'home' }, '');
    const onPop = (e: PopStateEvent) => {
      const st = e.state ?? { d: 0, tab: 'home' };
      setStack((x) => (x.length > st.d ? x.slice(0, st.d) : x));
      setTabState(st.tab ?? 'home');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [web]);

  // Tabs: from Home, a tab adds one history step; tab→tab replaces it, so Back always lands on Home.
  const setTab = useCallback(
    (t: jf.Tab) => {
      if (t === tab) return;
      setTabState(t);
      if (!web) return;
      if (t === 'home') history.back();
      else if (tab === 'home') history.pushState({ d: 0, tab: t }, '');
      else history.replaceState({ d: 0, tab: t }, '');
    },
    [tab, web],
  );

  useEffect(() => {
    jf.restore().then((s) => setAuthed(!!s));
  }, []);

  // Remote-control focus memory (web/webOS): remember what was focused before opening a screen,
  // restore it on back; on a new screen with nothing focused, focus its first button.
  const focusMemory = useRef<(HTMLElement | null)[]>([]);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const want = focusMemory.current[stack.length];
    focusMemory.current.length = stack.length;
    const t = setTimeout(() => {
      const visible = (el: Element | null) => !!el && (el as HTMLElement).getClientRects().length > 0 && el !== document.body;
      if (want && visible(want)) return want.focus({ preventScroll: false });
      if (visible(document.activeElement)) return;
      document.querySelectorAll<HTMLElement>('[data-focusable="1"]').forEach((el) => {
        if (!visible(document.activeElement) && visible(el)) el.focus();
      });
    }, 600);
    return () => clearTimeout(t);
  }, [stack.length, authed]);

  const push = (sc: Screen) => {
    if (Platform.OS === 'web') focusMemory.current[stack.length] = document.activeElement as HTMLElement;
    setStack((st) => [...st, sc]);
    if (web) history.pushState({ d: stack.length + 1, tab }, '');
  };
  const back = useCallback(() => {
    if (!stack.length && tab === 'home') return false;
    if (web) history.back(); // popstate does the actual pop
    else if (stack.length) setStack((st) => st.slice(0, -1));
    else setTabState('home');
    return true;
  }, [stack.length, tab, web]);

  useSpatialNav(back);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', back);
    return () => sub.remove();
  }, [back]);

  const onLoggedIn = useCallback(() => setAuthed(true), []);
  const onIntroDone = useCallback(() => setIntro(false), []);
  const play = (item: jf.Item, fromStart?: boolean) =>
    push(item.Type === 'Series' ? { name: 'details', item } : { name: 'player', item, fromStart });
  // next episode replaces the player (Back then returns to the details page, not the previous episode)
  const playNext = useCallback((item: jf.Item) => setStack((st) => [...st.slice(0, -1), { name: 'player', item, fromStart: true }]), []);
  const info = (item: jf.Item) => push({ name: 'details', item });

  const top = stack[stack.length - 1];
  let body: React.ReactNode = null;
  if (authed === false) body = <View style={{ flex: 1, paddingTop: top0 }}><Login onLoggedIn={onLoggedIn} /></View>;
  else if (authed) {
    body = (
      <>
        {/* Browse stays mounted underneath so its scroll/tab survive going back */}
        <View style={[StyleSheet.absoluteFill, { paddingTop: top0 }, top && s.hidden]}>
          <Browse
            onPlay={(i) => play(i)}
            onInfo={info}
            tab={tab}
            onTab={setTab}
            onSearch={() => push({ name: 'search' })}
            onProfile={async () => {
              await jf.logout();
              setStack([]);
              setAuthed(false);
            }}
          />
        </View>
        {/* Every screen in the stack stays mounted (hidden) so going Back keeps its state: typed search, scroll, focus. */}
        {stack.map((sc, i) => {
          const hidden = i !== stack.length - 1;
          if (sc.name === 'player' && hidden) return null; // never keep a hidden video playing
          return (
            <View key={i} style={[StyleSheet.absoluteFill, hidden && s.hidden]}>
              {sc.name === 'details' && <Details item={sc.item} active={!hidden} onPlay={play} onOpen={info} />}
              {sc.name === 'search' && <View style={{ flex: 1, paddingTop: top0 }}><Search onOpen={info} /></View>}
              {sc.name !== 'player' && !L.tv && (
                <Pressable role="button" accessibilityLabel="返回" onPress={back} hitSlop={10} style={[s.backBtn, { left: L.pad - 6, top: top0 + (L.phone ? 10 : 18) }]}>
                  <Icon name="back" size={24} />
                </Pressable>
              )}
              {sc.name === 'player' && <Player key={sc.item.Id} item={sc.item} fromStart={sc.fromStart} onClose={back} onNext={playNext} />}
            </View>
          );
        })}
      </>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar style="light" hidden={top?.name === 'player'} />
      {body}
      {intro && <Intro onDone={onIntroDone} />}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0a' },
  hidden: { display: 'none' },
  backBtn: { position: 'absolute', zIndex: 10, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)' },
});
