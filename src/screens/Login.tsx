import React, { useEffect, useState } from 'react';
import { t, useLang, LANGS, getLang, setLang, langName } from '../i18n';
import { Image, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import * as jf from '../jellyfin';
import { C, useLayout } from '../theme';
import { Focusable } from '../Focusable';
import { Logo } from '../components';
import { Icon } from '../Icon';
import Svg, { Rect } from 'react-native-svg';
import qrcode from 'qrcode-generator';

function QR({ text, size }: { text: string; size: number }) {
  const q = qrcode(0, 'M');
  q.addData(text);
  q.make();
  const n = q.getModuleCount();
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) cells.push(<Rect key={r * n + c} x={c + 2} y={r + 2} width={1.02} height={1.02} fill="#000" />);
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${n + 4} ${n + 4}`} style={{ backgroundColor: '#fff', borderRadius: 8 }}>
      {cells}
    </Svg>
  );
}

/** "Who's watching?" profile gate + Quick Connect / password sign-in. */
export function Login({ onLoggedIn }: { onLoggedIn: () => void }) {
  const L = useLayout();
  useLang();
  const [server, setServer] = useState<string | null | undefined>(undefined); // undefined = loading, null = ask
  const [srvInput, setSrvInput] = useState('');
  const [srvErr, setSrvErr] = useState('');
  const [srvBusy, setSrvBusy] = useState(false);
  useEffect(() => {
    jf.savedServer().then((v) => setServer(v || null));
  }, []);
  const connect = async () => {
    setSrvErr('');
    setSrvBusy(true);
    try {
      setServer((await jf.connectServer(srvInput)).url);
    } catch {
      setSrvErr(t('badServer'));
    }
    setSrvBusy(false);
  };
  const [users, setUsers] = useState<jf.User[]>([]);
  const [picked, setPicked] = useState<jf.User | null>(null);
  const [pw, setPw] = useState('');
  // Remote Back on the password step returns to the user picker (Backspace still deletes text in inputs).
  useEffect(() => {
    if (!picked || Platform.OS !== 'web') return;
    const h = (e: KeyboardEvent) => {
      const typing = (document.activeElement as HTMLElement | null)?.tagName === 'INPUT';
      if ([27, 461, 10009].includes(e.keyCode) || (e.keyCode === 8 && !typing)) {
        e.stopImmediatePropagation();
        e.preventDefault();
        setPicked(null);
        setPw('');
      }
    };
    window.addEventListener('keydown', h, true);
    return () => window.removeEventListener('keydown', h, true);
  }, [picked]);
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [qcErr, setQcErr] = useState('');

  useEffect(() => {
    if (!server) return;
    jf.publicUsers(server).then(setUsers, () => setUsers([]));
  }, [server]);

  // Quick Connect runs in the background the whole time the gate is open.
  useEffect(() => {
    if (!server) return;
    let alive = true;
    let timer: ReturnType<typeof setInterval>;
    jf.quickConnectStart(server).then(
      ({ Code, Secret }) => {
        if (!alive) return;
        setCode(Code);
        timer = setInterval(async () => {
          try {
            if (await jf.quickConnectPoll(server, Secret)) onLoggedIn();
          } catch {}
        }, 3000);
      },
      (e) => alive && (setCode(''), setQcErr(String(e?.message ?? e))),
    );
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [server, onLoggedIn]);

  const signIn = async (name: string) => {
    setErr('');
    try {
      await jf.loginByName(server!, name, pw);
      onLoggedIn();
    } catch (e: any) {
      setErr(e?.status === 401 ? t('wrongPw') : t('cantReach'));
    }
  };

  const f = L.font;
  if (server === undefined) return <View style={[s.root, { padding: L.pad }]} />;
  if (server === null)
    return (
      <View style={[s.root, { padding: L.pad }]}>
        <LangButton />
        <Logo size={f(56)} />
        <View style={{ width: Math.min(560, L.width - 2 * L.pad), marginTop: 24 }}>
          <Text style={[s.h1, { fontSize: f(44), textAlign: 'left', marginTop: 12 }]}>{t('yourServer')}</Text>
          <Text style={[s.sub, { fontSize: f(22), textAlign: 'left', marginTop: 0, marginBottom: 20 }]}>{t('serverHint')}</Text>
          <TextInput
            value={srvInput}
            onChangeText={setSrvInput}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholder={t('serverPh')}
            placeholderTextColor="#777"
            autoFocus
            onSubmitEditing={connect}
            style={[s.input, { fontSize: f(30) }]}
          />
          <Focusable onPress={connect} style={s.btn} focusStyle={s.btnFocus}>
            <Text style={[s.btnText, { fontSize: f(28), textAlign: 'center' }]}>{srvBusy ? t('connecting') : t('connect')}</Text>
          </Focusable>
          {srvErr ? <Text style={[s.err, { fontSize: f(22) }]}>{srvErr}</Text> : null}
        </View>
      </View>
    );
  return (
    <View style={[s.root, { padding: L.pad }]}>
      <LangButton />
      <Logo size={f(56)} />
      {!picked ? (
        <>
          <Text style={[s.h1, { fontSize: f(44), marginTop: 12, marginBottom: 14 }]}>{t('whoWatching')}</Text>
          <View style={s.users}>
            {users.map((u, i) => (
              <Focusable key={u.Id} autoFocus={i === 0} onPress={() => setPicked(u)} style={s.user} focusStyle={s.userFocus}>
                {jf.userImage(u) ? (
                  <Image source={{ uri: `${server}/Users/${u.Id}/Images/Primary?maxWidth=200&tag=${u.PrimaryImageTag}` }} style={[s.avatar, { width: f(120), height: f(120) }]} />
                ) : (
                  <View style={[s.avatar, { width: f(120), height: f(120), backgroundColor: ['#e50914', '#2b74e2', '#e5b609', '#28a745'][i % 4] }]}>
                    <Text style={{ color: '#fff', fontSize: f(60), fontWeight: '800' }}>{u.Name[0]?.toUpperCase()}</Text>
                  </View>
                )}
                <Text style={[s.uname, { fontSize: f(28) }]}>{u.Name}</Text>
              </Focusable>
            ))}
            <Focusable autoFocus={!users.length} onPress={() => setPicked({ Id: '', Name: '' })} style={s.user} focusStyle={s.userFocus}>
              <View style={[s.avatar, { width: f(120), height: f(120), borderColor: '#555' }]}>
                <Icon name="plus" size={f(56)} color="#aaa" />
              </View>
              <Text style={[s.uname, { fontSize: f(28) }]}>{t('enterName')}</Text>
            </Focusable>
          </View>
          {!L.tv ? null : code ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 28, marginTop: 20, backgroundColor: '#1a1a1a', borderRadius: 16, padding: 18 }}>
              <QR text={`${server}/web/#/quickconnect`} size={L.tv ? 180 : 130} />
              <View>
                <Text style={[s.h1, { fontSize: f(30), textAlign: 'left', marginTop: 0, marginBottom: 0 }]}>{t('qcTitle')}</Text>
                <Text style={[s.sub, { fontSize: f(22), textAlign: 'left', marginTop: 4 }]}>{t('qcSteps')}</Text>
                <Text style={{ color: '#fff', fontSize: f(48), fontWeight: '800', letterSpacing: 10, marginTop: 4 }}>{code}</Text>
              </View>
            </View>
          ) : (
            <Text style={[s.sub, { fontSize: f(20), marginTop: 20 }]}>{t('qcUnavailable')}{qcErr ? `: ${qcErr}` : ` (${t('loading')})`}</Text>
          )}
        </>
      ) : (
        <View style={{ width: Math.min(560, L.width - 2 * L.pad), marginTop: 40 }}>
          {picked.Id ? (
            <Text style={[s.h1, { fontSize: f(44), textAlign: 'left' }]}>{picked.Name}</Text>
          ) : (
            <TextInput
              value={picked.Name}
              onChangeText={(Name) => setPicked({ Id: '', Name })}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={t('username')}
              placeholderTextColor="#777"
              autoFocus
              style={[s.input, { fontSize: f(30), marginTop: 40 }]}
            />
          )}
          <TextInput
            value={pw}
            onChangeText={setPw}
            secureTextEntry
            placeholder={t('password')}
            placeholderTextColor="#777"
            autoFocus={!!picked.Id}
            onSubmitEditing={() => signIn(picked.Name)}
            style={[s.input, { fontSize: f(30) }]}
          />
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <Focusable onPress={() => signIn(picked.Name)} style={s.btn} focusStyle={s.btnFocus}>
              <Text style={[s.btnText, { fontSize: f(28) }]}>{t('signIn')}</Text>
            </Focusable>
            <Focusable onPress={() => setPicked(null)} style={[s.btn, { backgroundColor: '#333' }]} focusStyle={s.btnFocus}>
              <Text style={[s.btnText, { fontSize: f(28) }]}>{t('back')}</Text>
            </Focusable>
          </View>
          <Text style={[s.err, { fontSize: f(24) }]}>{err}</Text>
        </View>
      )}
      <Text style={[s.server, { fontSize: f(20) }]} onPress={async () => { await jf.forgetServer(); setUsers([]); setPicked(null); setCode(''); setSrvInput(server); setServer(null); }}>
        {t('serverLine', { s: server })}
      </Text>
    </View>
  );
}

function LangButton() {
  const L = useLayout();
  return (
    <Focusable
      onPress={() => setLang(LANGS[(LANGS.findIndex((x) => x.code === getLang()) + 1) % LANGS.length].code)}
      accessibilityRole="button"
      style={{ position: 'absolute', top: 16, right: L.pad, padding: 8, borderRadius: 6, borderWidth: 2, borderColor: 'transparent', flexDirection: 'row', alignItems: 'center', gap: 6, zIndex: 5 }}
      focusStyle={{ borderColor: '#fff' }}>
      <Text style={{ color: C.sub, fontSize: L.font(20) }}>{langName()}  ›</Text>
    </Focusable>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, alignItems: 'center' },
  h1: { color: C.text, fontWeight: '700', marginTop: 40, marginBottom: 30, textAlign: 'center' },
  users: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 30 },
  user: { alignItems: 'center', padding: 6, borderRadius: 8 },
  userFocus: { transform: [{ scale: 1.08 }] },
  avatar: { borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: 'transparent' },
  uname: { color: C.sub, marginTop: 12 },
  sub: { color: C.sub, marginTop: 50, textAlign: 'center' },
  input: { backgroundColor: '#333', color: '#fff', padding: 16, borderRadius: 6, marginBottom: 20 },
  btn: { backgroundColor: C.red, paddingVertical: 12, paddingHorizontal: 40, borderRadius: 6, borderWidth: 3, borderColor: 'transparent' },
  btnFocus: { borderColor: '#fff' },
  btnText: { color: '#fff', fontWeight: '700' },
  err: { color: '#ff6b6b', marginTop: 16 },
  server: { color: '#555', position: 'absolute', bottom: 20 },
});
