import AsyncStorage from '@react-native-async-storage/async-storage';
import { t } from './i18n';
import { Platform } from 'react-native';

const SERVER_KEY = 'jf_server';
export const savedServer = () => AsyncStorage.getItem(SERVER_KEY);
export const forgetServer = () => AsyncStorage.removeItem(SERVER_KEY);

/** Turn whatever a person typed ("media.me.com", "192.168.1.5:8096") into a working Jellyfin URL, or throw. Saves it. */
export async function connectServer(input: string): Promise<{ url: string; name: string }> {
  const raw = input.trim().replace(/\/+$/, '');
  if (!raw) throw new Error('empty');
  const hasScheme = /^https?:\/\//i.test(raw);
  const looksLocal = /^(\d{1,3}\.){3}\d{1,3}|localhost|\.local\b|:8096\b/i.test(raw);
  const candidates = hasScheme ? [raw] : looksLocal ? [`http://${raw}`, `https://${raw}`] : [`https://${raw}`, `http://${raw}`];
  for (const url of candidates) {
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 6000);
      const r = await fetch(`${url}/System/Info/Public`, { signal: ctl.signal });
      clearTimeout(t);
      const j = await r.json();
      if (r.ok && j?.ServerName) {
        await AsyncStorage.setItem(SERVER_KEY, url);
        return { url, name: j.ServerName };
      }
    } catch {}
  }
  throw new Error('unreachable');
}

export type Item = {
  Id: string;
  Name: string;
  Type: string;
  Overview?: string;
  ProductionYear?: number;
  RunTimeTicks?: number;
  OfficialRating?: string;
  Genres?: string[];
  Artists?: string[];
  SeriesName?: string;
  SeriesId?: string;
  IndexNumber?: number;
  ParentIndexNumber?: number;
  PremiereDate?: string;
  ImageTags?: Record<string, string>;
  BackdropImageTags?: string[];
  UserData?: { PlaybackPositionTicks?: number; IsFavorite?: boolean; Played?: boolean };
};

export type User = { Id: string; Name: string; PrimaryImageTag?: string };
export type Row = { key: string; title: string; items: Item[] };

type Session = { server: string; token: string; userId: string; userName: string };

const DEVICE_KEY = 'jf_device';
const SESSION_KEY = 'jf_session';
const FIELDS = 'Overview,ProductionYear,RunTimeTicks,Genres,OfficialRating,PremiereDate';

let session: Session | null = null;
let deviceId = '';

async function getDeviceId() {
  if (deviceId) return deviceId;
  deviceId = (await AsyncStorage.getItem(DEVICE_KEY)) || '';
  if (!deviceId) {
    deviceId = `jefflix-${Platform.OS}-${Math.random().toString(36).slice(2, 12)}`;
    await AsyncStorage.setItem(DEVICE_KEY, deviceId);
  }
  return deviceId;
}

function deviceName() {
  if (Platform.OS === 'web') return /Web0S|webOS/i.test(globalThis.navigator?.userAgent ?? '') ? 'LG TV' : 'Browser';
  return Platform.OS === 'ios' ? 'iPhone' : 'Android';
}

async function authHeader(token?: string) {
  const id = await getDeviceId();
  return `MediaBrowser Client="Jefflix", Device="${deviceName()}", DeviceId="${id}", Version="2.0.0"${token ? `, Token="${token}"` : ''}`;
}

async function call<T>(server: string, method: string, path: string, body?: unknown, token = session?.token): Promise<T> {
  const res = await fetch(server + path, {
    method,
    headers: {
      'X-Emby-Authorization': await authHeader(token),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status });
  const text = await res.text();
  return (text ? JSON.parse(text) : {}) as T;
}

const api = <T>(method: string, path: string, body?: unknown) => {
  if (!session) throw new Error('not logged in');
  return call<T>(session.server, method, path, body);
};

/* ---------- session ---------- */
export async function restore(): Promise<Session | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  session = raw ? JSON.parse(raw) : null;
  return session;
}

async function save(server: string, r: { AccessToken: string; User: { Id: string; Name: string } }) {
  session = { server, token: r.AccessToken, userId: r.User.Id, userName: r.User.Name };
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function logout() {
  session = null;
  await AsyncStorage.removeItem(SESSION_KEY);
}

export const current = () => session;
export const cleanServer = (s: string) => s.trim().replace(/\/+$/, '');

export async function publicUsers(server: string): Promise<User[]> {
  return call<User[]>(cleanServer(server), 'GET', '/Users/Public', undefined, '');
}

export async function loginByName(server: string, user: string, pw: string) {
  const s = cleanServer(server);
  return save(s, await call(s, 'POST', '/Users/AuthenticateByName', { Username: user, Pw: pw }, ''));
}

export async function quickConnectStart(server: string) {
  const s = cleanServer(server);
  return call<{ Code: string; Secret: string }>(s, 'POST', '/QuickConnect/Initiate', undefined, '');
}

export async function quickConnectPoll(server: string, secret: string) {
  const s = cleanServer(server);
  const st = await call<{ Authenticated: boolean }>(s, 'GET', `/QuickConnect/Connect?secret=${secret}`, undefined, '');
  if (!st.Authenticated) return null;
  return save(s, await call(s, 'POST', '/Users/AuthenticateWithQuickConnect', { Secret: secret }, ''));
}

/* ---------- images & streams ---------- */
export function image(it: Pick<Item, 'Id' | 'ImageTags' | 'BackdropImageTags'>, w: number, kind: 'wide' | 'poster' | 'backdrop' = 'wide') {
  if (!session) return undefined;
  const t = it.ImageTags || {};
  const base = `${session.server}/Items/${it.Id}/Images`;
  if (kind === 'backdrop' && it.BackdropImageTags?.[0]) return `${base}/Backdrop?maxWidth=${w}&tag=${it.BackdropImageTags[0]}`;
  const type = kind === 'poster' ? (t.Primary ? 'Primary' : t.Thumb ? 'Thumb' : null) : t.Thumb ? 'Thumb' : t.Primary ? 'Primary' : null;
  return type ? `${base}/${type}?maxWidth=${w}&tag=${t[type]}` : undefined;
}

export const userImage = (u: User) =>
  session && u.PrimaryImageTag ? `${session.server}/Users/${u.Id}/Images/Primary?maxWidth=200&tag=${u.PrimaryImageTag}` : undefined;

/** No quality = direct play of the original file (Range-streamed). With quality = HLS transcode (adaptive-friendly, saves data). */
export type Quality = { height: number; bitrate: number };
export function streamUrl(it: Item, q?: Quality) {
  const s = session!;
  return q
    ? `${s.server}/Videos/${it.Id}/master.m3u8?MediaSourceId=${it.Id}&VideoCodec=h264&AudioCodec=aac&TranscodingMaxAudioChannels=2&MaxHeight=${q.height}&VideoBitRate=${q.bitrate}&api_key=${s.token}`
    : `${s.server}/Videos/${it.Id}/stream?static=true&MediaSourceId=${it.Id}&api_key=${s.token}`;
}

/* ---------- data ---------- */
// Hide empty series (folder exists but no episodes scanned yet) — nothing to play.
const items = (q: string) =>
  api<{ Items: (Item & { RecursiveItemCount?: number })[] }>('GET', `/Users/${session!.userId}/Items?Recursive=true&Fields=${FIELDS},RecursiveItemCount&${q}`).then((r) =>
    r.Items.filter((i) => i.Type !== 'Series' || (i.RecursiveItemCount ?? 1) > 0),
  );
const VIDEO_TYPES = 'IncludeItemTypes=Movie,Series,MusicVideo,Video';

export type Tab = 'home' | 'shows' | 'movies' | 'mv' | 'mylist';

export async function rows(tab: Tab): Promise<Row[]> {
  const uid = session!.userId;
  const out: Row[] = [];
  const add = (key: string, title: string, list: Item[]) => list.length && out.push({ key, title, items: list });

  if (tab === 'mylist') {
    add('fav', t('myList'), await items(`Filters=IsFavorite&${VIDEO_TYPES}&SortBy=DateCreated&SortOrder=Descending`));
    return out;
  }
  if (tab === 'shows') {
    add('series', t('allShows'), await items('IncludeItemTypes=Series&SortBy=SortName'));
    return out;
  }
  if (tab === 'movies') {
    const all = await items('IncludeItemTypes=Movie&SortBy=SortName');
    add('new', t('newMovies'), [...all].sort((a, b) => (b.PremiereDate || '').localeCompare(a.PremiereDate || '')).slice(0, 30));
    groupBy(all, (i) => i.Genres?.[0]).forEach(([g, l]) => add(`g-${g}`, g, l));
    return out;
  }

  const [resume, latest, mvs, fav] = await Promise.all([
    api<{ Items: Item[] }>('GET', `/Users/${uid}/Items/Resume?MediaTypes=Video&Limit=30&Fields=${FIELDS}`).then((r) => r.Items),
    items(`${VIDEO_TYPES}&SortBy=DateCreated&SortOrder=Descending&Limit=40`),
    items('IncludeItemTypes=MusicVideo&SortBy=PremiereDate&SortOrder=Descending&Limit=2000'),
    tab === 'home' ? items(`Filters=IsFavorite&${VIDEO_TYPES}&Limit=40`) : Promise.resolve([] as Item[]),
  ]);

  if (tab === 'mv') {
    groupBy(mvs, artistOf).forEach(([a, l]) => add(`a-${a}`, a, l));
    return out;
  }
  add('resume', t('continueWatching'), resume);
  add('fav', t('myList'), fav);
  add('latest', t('latest'), latest);
  add('top10', t('top10'), [...mvs].sort(() => 0.5 - Math.random()).slice(0, 10));
  groupBy(mvs, artistOf).slice(0, 15).forEach(([a, l]) => add(`a-${a}`, a, l.slice(0, 40)));
  return out;
}

/** Channel/artist tags from YouTube are messy: "a, YouTube, YouTube Music" → first real name, with friendly aliases. */
const ARTIST_ALIAS: Record<string, string> = { 'endy jaugwokyin': '周國賢 Endy Chow' };
const NOT_ARTIST = /^(youtube( music)?|.*(records?|studio|music|limited|ltd).*)$/i;
export function artistOf(i: Item) {
  const raw = (i.Artists ?? []).flatMap((a) => a.split(/\s*,\s*/)).find((a) => a && !NOT_ARTIST.test(a));
  return raw ? ARTIST_ALIAS[raw.toLowerCase()] ?? raw : undefined;
}

function groupBy(list: Item[], key: (i: Item) => string | undefined): [string, Item[]][] {
  const m = new Map<string, Item[]>();
  list.forEach((i) => {
    const k = key(i);
    if (k) m.set(k, [...(m.get(k) || []), i]);
  });
  return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
}

export const search = (term: string) =>
  term.trim() ? items(`${VIDEO_TYPES}&SearchTerm=${encodeURIComponent(term.trim())}&Limit=60`) : Promise.resolve([]);

export const episodes = (seriesId: string) =>
  api<{ Items: Item[] }>('GET', `/Shows/${seriesId}/Episodes?UserId=${session!.userId}&Fields=${FIELDS}`).then((r) => r.Items);

export const getItem = (id: string) => api<Item>('GET', `/Users/${session!.userId}/Items/${id}`);

export const similar = (id: string) =>
  api<{ Items: Item[] }>('GET', `/Items/${id}/Similar?UserId=${session!.userId}&Limit=20&Fields=${FIELDS}`).then((r) => r.Items);

export const setFavorite = (id: string, on: boolean) =>
  api(on ? 'POST' : 'DELETE', `/Users/${session!.userId}/FavoriteItems/${id}`);

export const report = (kind: 'start' | 'progress' | 'stop', it: Item, positionSec: number, paused = false) =>
  api('POST', kind === 'start' ? '/Sessions/Playing' : kind === 'progress' ? '/Sessions/Playing/Progress' : '/Sessions/Playing/Stopped', {
    ItemId: it.Id,
    MediaSourceId: it.Id,
    PositionTicks: Math.floor(positionSec * 1e7),
    IsPaused: paused,
    CanSeek: true,
    PlayMethod: 'DirectPlay',
  }).catch(() => undefined);

export const minutes = (ticks?: number) => (ticks ? t('min', { n: Math.max(1, Math.round(ticks / 6e8)) }) : '');
