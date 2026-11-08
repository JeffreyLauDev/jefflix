import React, { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TextInput, View } from 'react-native';
import * as jf from '../jellyfin';
import { C, useLayout } from '../theme';
import { Focusable } from '../Focusable';
import { Icon } from '../Icon';

/**
 * TV search: on-screen keyboard on the left (remote friendly), results grid on the right.
 * Phones / desktop also get a normal text field.
 */
const KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'.split('');

export function Search({ onOpen }: { onOpen: (i: jf.Item) => void }) {
  const L = useLayout();
  const [q, setQ] = useState('');
  const [res, setRes] = useState<jf.Item[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      setBusy(true);
      jf.search(q).then(
        (r) => alive && (setRes(r), setBusy(false)),
        () => alive && setBusy(false),
      );
    }, 300);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [q]);

  const f = L.font;
  const cols = L.phone ? 2 : L.tv ? 3 : 3;
  const keyboard = !L.phone && (
    <View style={{ width: f(440), marginRight: L.pad }}>
      <View style={s.kb}>
        {KEYS.map((k, i) => (
          <Focusable key={k} autoFocus={i === 0} onPress={() => setQ((x) => x + k.toLowerCase())} style={[s.key, { width: f(64), height: f(56) }]} focusStyle={s.keyFocus}>
            <Text style={[s.keyText, { fontSize: f(24) }]}>{k}</Text>
          </Focusable>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <Focusable onPress={() => setQ((x) => x + ' ')} style={[s.key, { flex: 1, height: f(56) }]} focusStyle={s.keyFocus}>
          <Text style={[s.keyText, { fontSize: f(22) }]}>空格</Text>
        </Focusable>
        <Focusable onPress={() => setQ((x) => x.slice(0, -1))} style={[s.key, { flex: 1, height: f(56) }]} focusStyle={s.keyFocus}>
          <Icon name="backspace" size={f(26)} />
        </Focusable>
        <Focusable onPress={() => setQ('')} style={[s.key, { flex: 1, height: f(56) }]} focusStyle={s.keyFocus}>
          <Text style={[s.keyText, { fontSize: f(22) }]}>清除</Text>
        </Focusable>
      </View>
    </View>
  );

  return (
    <View style={[s.root, { padding: L.pad, paddingTop: L.phone ? 64 : L.tv ? 50 : 76 }]}>
      <TextInput
        value={q}
        onChangeText={setQ}
        autoFocus={L.phone}
        placeholder="搜尋片名、歌手…（中文用手機鍵盤或者遙控器講嘢）"
        placeholderTextColor="#777"
        style={[s.input, { fontSize: f(30) }]}
      />
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {keyboard}
        <FlatList
          key={cols}
          style={{ flex: 1 }}
          data={res}
          numColumns={cols}
          keyExtractor={(i) => i.Id}
          ListHeaderComponent={<Text style={[s.head, { fontSize: f(26) }]}>{q ? (busy ? '搜尋緊…' : `${res.length} 個結果`) : '輸入關鍵字開始搜尋'}</Text>}
          renderItem={({ item }) => (
            <Focusable onPress={() => onOpen(item)} style={[s.card, { flex: 1 / cols }]} focusStyle={s.cardFocus}>
              <Image source={{ uri: jf.image(item, 480) }} style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 4, backgroundColor: C.card }} />
              <Text numberOfLines={1} style={{ color: '#ddd', marginTop: 6, fontSize: f(20) }}>
                {item.Name}
              </Text>
            </Focusable>
          )}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  input: { backgroundColor: '#222', color: '#fff', padding: 14, borderRadius: 6, marginBottom: 24 },
  kb: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  key: { backgroundColor: '#222', alignItems: 'center', justifyContent: 'center', borderRadius: 4, borderWidth: 3, borderColor: 'transparent' },
  keyFocus: { backgroundColor: '#fff', borderColor: '#fff' },
  keyText: { color: '#aaa', fontWeight: '700' },
  head: { color: C.sub, marginBottom: 12 },
  card: { padding: 6, borderRadius: 6, borderWidth: 3, borderColor: 'transparent' },
  cardFocus: { borderColor: '#fff' },
});
