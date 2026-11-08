import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * UI language. English is the default; the user's pick is saved on the device.
 * Add a language: copy `en`, translate the values, add it to LANGS. Missing keys fall back to English.
 */
const en = {
  play: 'Play', resume: 'Resume', details: 'More info', startOver: 'Start over',
  myList: 'My List', inMyList: 'In My List', back: 'Back', cancel: 'Cancel',
  noEpisodes: "No episodes to play yet (Jellyfin hasn't scanned them).",
  episodes: 'Episodes', moreLikeThis: 'More like this', related: 'Related videos', relatedShort: 'Related',
  tabSearch: 'Search', tabHome: 'Home', tabShows: 'Shows', tabMovies: 'Movies', tabMv: 'MV',
  cantReach: "Can't reach Jellyfin", empty: 'Nothing here yet', switchUser: 'Switch user / Sign out', language: 'Language',
  continueWatching: 'Continue Watching', latest: 'Recently Added', top10: 'Top 10', allShows: 'All Shows', newMovies: 'New Movies',
  min: '{n} min', cast: 'Cast',
  bigger: 'Bigger previews', smaller: 'Smaller previews', big: 'Big', small: 'Small', nowPlaying: 'Now playing',
  space: 'Space', clear: 'Clear', searchPh: 'Search titles, artists…', searching: 'Searching…', results: '{n} results', searchHint: 'Type to start searching',
  original: 'Original (best)', originalShort: 'Original', q480: '480p (data saver)',
  cantPlay: "This video won't play. Try another quality (bottom right).",
  rewind: 'Back 10 seconds', pause: 'Pause', replay: 'Replay', forward: 'Forward 10 seconds', next: 'Next episode',
  speed: 'Playback speed', mute: 'Mute', quality: 'Quality', restoreWindow: 'Restore window', miniWindow: 'Mini window on top', fullscreen: 'Full screen',
  badServer: "Can't reach this server. Check the address (e.g. media.example.com).", wrongPw: 'Wrong password',
  yourServer: 'Your Jellyfin server', serverHint: 'Enter its address, e.g. media.example.com or 192.168.1.5:8096',
  serverPh: 'Server address', connecting: 'Connecting…', connect: 'Connect', whoWatching: "Who's watching?", enterName: 'Enter user name',
  qcTitle: 'Sign in with your phone, no typing', qcSteps: '1. Scan the QR code with your phone\n2. Sign in, then enter this code',
  qcUnavailable: 'Quick Connect is unavailable', loading: 'loading', username: 'User name', password: 'Password', signIn: 'Sign in',
  serverLine: 'Server: {s} (tap to change)',
};
export type Key = keyof typeof en;
type Dict = Partial<Record<Key, string>>;

const yue: Dict = {
  play: '播放', resume: '繼續播放', details: '詳情', startOver: '由頭播', myList: '我的片單', inMyList: '已加入片單', back: '返回', cancel: '取消',
  noEpisodes: '仲未有集數可以播（Jellyfin 未掃描到）', episodes: '集數', moreLikeThis: '更多類似', related: '相關影片', relatedShort: '相關',
  tabSearch: '搜尋', tabHome: '首頁', tabShows: '節目', tabMovies: '電影',
  cantReach: '連唔到 Jellyfin', empty: '呢度暫時冇片', switchUser: '轉換用戶／登出', language: '語言',
  continueWatching: '繼續觀看', latest: '最新加入', top10: '熱門 Top 10', allShows: '全部節目', newMovies: '最新電影',
  min: '{n} 分鐘', cast: '投放', bigger: '放大畫面', smaller: '縮細畫面', big: '大畫面', small: '細畫面', nowPlaying: '正在播放',
  space: '空格', clear: '清除', searchPh: '搜尋片名、歌手…（中文用手機鍵盤或者遙控器講嘢）', searching: '搜尋緊…', results: '{n} 個結果', searchHint: '輸入關鍵字開始搜尋',
  original: '原檔（最清）', originalShort: '原檔', q480: '480p（慳流量）', cantPlay: '呢條片播唔到，試吓喺右下角轉畫質',
  rewind: '後退10秒', pause: '暫停', replay: '重播', forward: '快進10秒', next: '下一集',
  speed: '播放速度', mute: '靜音', quality: '畫質', restoreWindow: '還原視窗', miniWindow: '小視窗置頂', fullscreen: '全螢幕',
  badServer: '連唔到呢個伺服器，請檢查網址（例如 media.example.com）', wrongPw: '密碼唔啱',
  yourServer: '你嘅 Jellyfin 伺服器', serverHint: '輸入網址，例如 media.example.com 或 192.168.1.5:8096',
  serverPh: '伺服器網址', connecting: '連線中…', connect: '連接', whoWatching: '邊個睇緊？', enterName: '輸入用戶名',
  qcTitle: '用手機登入，唔使打字', qcSteps: '1. 用手機掃 QR code\n2. 登入後輸入呢組碼',
  qcUnavailable: 'Quick Connect 暫時用唔到', loading: '載入中', username: '用戶名', password: '密碼', signIn: '登入',
  serverLine: '伺服器：{s}（撳呢度更改）',
};

const zhTW: Dict = {
  ...yue,
  details: '詳細資訊', startOver: '從頭播放', noEpisodes: '尚無可播放的集數（Jellyfin 尚未掃描）', moreLikeThis: '更多類似內容',
  cantReach: '無法連線到 Jellyfin', empty: '這裡暫時沒有影片', switchUser: '切換使用者／登出', allShows: '所有節目',
  bigger: '放大預覽', smaller: '縮小預覽', small: '小畫面',
  searchPh: '搜尋片名、歌手…', searching: '搜尋中…', original: '原始檔（最清晰）', originalShort: '原始檔', q480: '480p（省流量）',
  cantPlay: '這部影片無法播放，請在右下角切換畫質', rewind: '倒退 10 秒', forward: '快轉 10 秒',
  badServer: '無法連線到這個伺服器，請檢查網址（例如 media.example.com）', wrongPw: '密碼錯誤',
  yourServer: '你的 Jellyfin 伺服器', connect: '連線', whoWatching: '誰在觀看？', enterName: '輸入使用者名稱',
  qcTitle: '用手機登入，免打字', qcSteps: '1. 用手機掃描 QR code\n2. 登入後輸入這組代碼', qcUnavailable: 'Quick Connect 暫時無法使用',
  username: '使用者名稱', serverLine: '伺服器：{s}（點此更改）',
};

const zhCN: Dict = {
  play: '播放', resume: '继续播放', details: '详细信息', startOver: '从头播放', myList: '我的片单', inMyList: '已加入片单', back: '返回', cancel: '取消',
  noEpisodes: '暂无可播放的剧集（Jellyfin 尚未扫描）', episodes: '剧集', moreLikeThis: '更多类似内容', related: '相关视频', relatedShort: '相关',
  tabSearch: '搜索', tabHome: '首页', tabShows: '剧集', tabMovies: '电影',
  cantReach: '无法连接 Jellyfin', empty: '这里暂时没有视频', switchUser: '切换用户／退出登录', language: '语言',
  continueWatching: '继续观看', latest: '最新添加', top10: '热门 Top 10', allShows: '全部剧集', newMovies: '最新电影',
  min: '{n} 分钟', cast: '投屏', bigger: '放大预览', smaller: '缩小预览', big: '大画面', small: '小画面', nowPlaying: '正在播放',
  space: '空格', clear: '清除', searchPh: '搜索片名、歌手…', searching: '搜索中…', results: '{n} 个结果', searchHint: '输入关键词开始搜索',
  original: '原画（最清晰）', originalShort: '原画', q480: '480p（省流量）', cantPlay: '该视频无法播放，请在右下角切换画质',
  rewind: '后退 10 秒', pause: '暂停', replay: '重播', forward: '快进 10 秒', next: '下一集',
  speed: '播放速度', mute: '静音', quality: '画质', restoreWindow: '还原窗口', miniWindow: '小窗置顶', fullscreen: '全屏',
  badServer: '无法连接该服务器，请检查地址（例如 media.example.com）', wrongPw: '密码错误',
  yourServer: '你的 Jellyfin 服务器', serverHint: '输入地址，例如 media.example.com 或 192.168.1.5:8096',
  serverPh: '服务器地址', connecting: '连接中…', connect: '连接', whoWatching: '谁在观看？', enterName: '输入用户名',
  qcTitle: '用手机登录，无需打字', qcSteps: '1. 用手机扫描二维码\n2. 登录后输入这组代码',
  qcUnavailable: 'Quick Connect 暂时不可用', loading: '加载中', username: '用户名', password: '密码', signIn: '登录',
  serverLine: '服务器：{s}（点击更改）',
};

const ja: Dict = {
  play: '再生', resume: '続きから再生', details: '詳細', startOver: '最初から', myList: 'マイリスト', inMyList: 'マイリストに追加済み', back: '戻る', cancel: 'キャンセル',
  noEpisodes: '再生できるエピソードがまだありません（Jellyfin が未スキャン）', episodes: 'エピソード', moreLikeThis: 'おすすめ作品', related: '関連動画', relatedShort: '関連',
  tabSearch: '検索', tabHome: 'ホーム', tabShows: '番組', tabMovies: '映画',
  cantReach: 'Jellyfin に接続できません', empty: 'まだ何もありません', switchUser: 'ユーザー切替／ログアウト', language: '言語',
  continueWatching: '視聴中の作品', latest: '新着', top10: 'トップ10', allShows: 'すべての番組', newMovies: '新作映画',
  min: '{n}分', cast: 'キャスト', bigger: 'プレビューを大きく', smaller: 'プレビューを小さく', big: '大', small: '小', nowPlaying: '再生中',
  space: 'スペース', clear: 'クリア', searchPh: 'タイトル、アーティストを検索…', searching: '検索中…', results: '{n}件', searchHint: 'キーワードを入力して検索',
  original: 'オリジナル（最高画質）', originalShort: 'オリジナル', q480: '480p（データ節約）', cantPlay: 'この動画は再生できません。右下で画質を変えてみてください',
  rewind: '10秒戻る', pause: '一時停止', replay: 'もう一度再生', forward: '10秒進む', next: '次のエピソード',
  speed: '再生速度', mute: 'ミュート', quality: '画質', restoreWindow: 'ウィンドウを元に戻す', miniWindow: 'ミニウィンドウで最前面', fullscreen: '全画面',
  badServer: 'このサーバーに接続できません。アドレスを確認してください（例: media.example.com）', wrongPw: 'パスワードが違います',
  yourServer: 'あなたの Jellyfin サーバー', serverHint: 'アドレスを入力（例: media.example.com や 192.168.1.5:8096）',
  serverPh: 'サーバーアドレス', connecting: '接続中…', connect: '接続', whoWatching: '誰が観ますか？', enterName: 'ユーザー名を入力',
  qcTitle: 'スマホでログイン（入力不要）', qcSteps: '1. スマホで QR コードを読み取る\n2. ログインしてこのコードを入力',
  qcUnavailable: 'Quick Connect は利用できません', loading: '読み込み中', username: 'ユーザー名', password: 'パスワード', signIn: 'ログイン',
  serverLine: 'サーバー: {s}（タップで変更）',
};

const ko: Dict = {
  play: '재생', resume: '이어서 재생', details: '상세 정보', startOver: '처음부터', myList: '내가 찜한 콘텐츠', inMyList: '찜 완료', back: '뒤로', cancel: '취소',
  noEpisodes: '아직 재생할 에피소드가 없습니다 (Jellyfin 스캔 전)', episodes: '에피소드', moreLikeThis: '비슷한 콘텐츠', related: '관련 영상', relatedShort: '관련',
  tabSearch: '검색', tabHome: '홈', tabShows: '시리즈', tabMovies: '영화',
  cantReach: 'Jellyfin에 연결할 수 없습니다', empty: '아직 콘텐츠가 없습니다', switchUser: '사용자 전환 / 로그아웃', language: '언어',
  continueWatching: '시청 중인 콘텐츠', latest: '최근 추가', top10: 'TOP 10', allShows: '모든 시리즈', newMovies: '최신 영화',
  min: '{n}분', cast: '전송', bigger: '미리보기 크게', smaller: '미리보기 작게', big: '크게', small: '작게', nowPlaying: '재생 중',
  space: '공백', clear: '지우기', searchPh: '제목, 아티스트 검색…', searching: '검색 중…', results: '결과 {n}개', searchHint: '검색어를 입력하세요',
  original: '원본 (최고 화질)', originalShort: '원본', q480: '480p (데이터 절약)', cantPlay: '이 영상을 재생할 수 없습니다. 오른쪽 아래에서 화질을 바꿔 보세요',
  rewind: '10초 뒤로', pause: '일시정지', replay: '다시 재생', forward: '10초 앞으로', next: '다음 에피소드',
  speed: '재생 속도', mute: '음소거', quality: '화질', restoreWindow: '창 복원', miniWindow: '미니 창 항상 위', fullscreen: '전체 화면',
  badServer: '서버에 연결할 수 없습니다. 주소를 확인하세요 (예: media.example.com)', wrongPw: '비밀번호가 틀렸습니다',
  yourServer: '내 Jellyfin 서버', serverHint: '주소 입력 (예: media.example.com 또는 192.168.1.5:8096)',
  serverPh: '서버 주소', connecting: '연결 중…', connect: '연결', whoWatching: '누가 시청하나요?', enterName: '사용자 이름 입력',
  qcTitle: '휴대폰으로 로그인 (입력 불필요)', qcSteps: '1. 휴대폰으로 QR 코드를 스캔\n2. 로그인 후 이 코드를 입력',
  qcUnavailable: 'Quick Connect를 사용할 수 없습니다', loading: '불러오는 중', username: '사용자 이름', password: '비밀번호', signIn: '로그인',
  serverLine: '서버: {s} (눌러서 변경)',
};

const es: Dict = {
  play: 'Reproducir', resume: 'Continuar', details: 'Más info', startOver: 'Desde el principio', myList: 'Mi lista', inMyList: 'En Mi lista', back: 'Atrás', cancel: 'Cancelar',
  noEpisodes: 'Aún no hay episodios (Jellyfin no los ha escaneado).', episodes: 'Episodios', moreLikeThis: 'Títulos similares', related: 'Vídeos relacionados', relatedShort: 'Relacionados',
  tabSearch: 'Buscar', tabHome: 'Inicio', tabShows: 'Series', tabMovies: 'Películas',
  cantReach: 'No se puede conectar con Jellyfin', empty: 'Aún no hay nada aquí', switchUser: 'Cambiar usuario / Cerrar sesión', language: 'Idioma',
  continueWatching: 'Seguir viendo', latest: 'Añadido recientemente', top10: 'Top 10', allShows: 'Todas las series', newMovies: 'Películas nuevas',
  min: '{n} min', cast: 'Enviar', bigger: 'Vistas previas grandes', smaller: 'Vistas previas pequeñas', big: 'Grande', small: 'Pequeño', nowPlaying: 'Reproduciendo',
  space: 'Espacio', clear: 'Borrar', searchPh: 'Busca títulos, artistas…', searching: 'Buscando…', results: '{n} resultados', searchHint: 'Escribe para buscar',
  original: 'Original (mejor)', originalShort: 'Original', q480: '480p (ahorro de datos)', cantPlay: 'Este vídeo no se puede reproducir. Prueba otra calidad (abajo a la derecha).',
  rewind: 'Retroceder 10 segundos', pause: 'Pausa', replay: 'Volver a ver', forward: 'Avanzar 10 segundos', next: 'Siguiente episodio',
  speed: 'Velocidad', mute: 'Silenciar', quality: 'Calidad', restoreWindow: 'Restaurar ventana', miniWindow: 'Minirreproductor encima', fullscreen: 'Pantalla completa',
  badServer: 'No se puede conectar con este servidor. Revisa la dirección (p. ej. media.example.com).', wrongPw: 'Contraseña incorrecta',
  yourServer: 'Tu servidor Jellyfin', serverHint: 'Escribe su dirección, p. ej. media.example.com o 192.168.1.5:8096',
  serverPh: 'Dirección del servidor', connecting: 'Conectando…', connect: 'Conectar', whoWatching: '¿Quién está viendo?', enterName: 'Escribe tu usuario',
  qcTitle: 'Inicia sesión con el móvil, sin teclear', qcSteps: '1. Escanea el código QR con el móvil\n2. Inicia sesión e introduce este código',
  qcUnavailable: 'Quick Connect no está disponible', loading: 'cargando', username: 'Usuario', password: 'Contraseña', signIn: 'Iniciar sesión',
  serverLine: 'Servidor: {s} (toca para cambiar)',
};

export const LANGS = [
  { code: 'en', name: 'English', dict: en as Dict, html: 'en' },
  { code: 'yue', name: '廣東話', dict: yue, html: 'zh-HK' },
  { code: 'zh-TW', name: '繁體中文', dict: zhTW, html: 'zh-TW' },
  { code: 'zh-CN', name: '简体中文', dict: zhCN, html: 'zh-CN' },
  { code: 'ja', name: '日本語', dict: ja, html: 'ja' },
  { code: 'ko', name: '한국어', dict: ko, html: 'ko' },
  { code: 'es', name: 'Español', dict: es, html: 'es' },
] as const;
export type Lang = (typeof LANGS)[number]['code'];

const KEY = 'jf_lang';
let lang: Lang = 'en';
const subs = new Set<() => void>();
const apply = (l: Lang) => {
  lang = l;
  if (Platform.OS === 'web') document.documentElement.lang = LANGS.find((x) => x.code === l)!.html;
  subs.forEach((f) => f());
};
AsyncStorage.getItem(KEY).then((v) => v && v !== lang && LANGS.some((x) => x.code === v) && apply(v as Lang), () => undefined);

export const getLang = () => lang;
export const langName = () => LANGS.find((x) => x.code === lang)!.name;
export function setLang(l: Lang) {
  AsyncStorage.setItem(KEY, l).catch(() => undefined);
  apply(l);
}

/** Translate a key; `{name}` placeholders are filled from vars. */
export function t(k: Key, vars?: Record<string, string | number>): string {
  let s = LANGS.find((x) => x.code === lang)!.dict[k] ?? en[k];
  if (vars) for (const [n, v] of Object.entries(vars)) s = s.replace(`{${n}}`, String(v));
  return s;
}

/** Re-render the calling component when the language changes. */
export const useLang = () =>
  useSyncExternalStore(
    (f) => (subs.add(f), () => void subs.delete(f)),
    () => lang,
    () => lang,
  );
