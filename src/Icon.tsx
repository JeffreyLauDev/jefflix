import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

/** One consistent stroke-icon set (24px grid, rounded line caps) — replaces emoji/unicode symbols everywhere. */
export type IconName =
  | 'play' | 'pause' | 'info' | 'plus' | 'check' | 'search' | 'chevron-down' | 'back' | 'replay'
  | 'rewind10' | 'forward10' | 'volume' | 'mute' | 'settings' | 'fullscreen' | 'exit-fullscreen'
  | 'airplay' | 'cast' | 'next' | 'backspace' | 'user' | 'list' | 'mini';

export function Icon({ name, size = 24, color = '#fff', strokeWidth = 2 }: { name: IconName; size?: number; color?: string; strokeWidth?: number }) {
  const st = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  const fill = { fill: color, stroke: color, strokeWidth: 1, strokeLinejoin: 'round' as const };
  let g: React.ReactNode = null;
  switch (name) {
    case 'play': g = <Path d="M7 4.5v15a.8.8 0 0 0 1.2.7l12.2-7.5a.8.8 0 0 0 0-1.4L8.2 3.8A.8.8 0 0 0 7 4.5z" {...fill} />; break;
    case 'pause': g = (<><Rect x="6" y="4.5" width="4.2" height="15" rx="1.2" {...fill} /><Rect x="13.8" y="4.5" width="4.2" height="15" rx="1.2" {...fill} /></>); break;
    case 'info': g = (<><Circle cx="12" cy="12" r="9.2" {...st} /><Path d="M12 11v5.5M12 7.6v.1" {...st} /></>); break;
    case 'list': g = <Path d="M4 6h16M4 12h16M4 18h10" {...st} />; break;
    case 'mini': g = (<><Rect x="3" y="5" width="18" height="14" rx="2" {...st} /><Rect x="12" y="11" width="7" height="5" rx="1" {...fill} /></>); break;
    case 'plus': g = <Path d="M12 5v14M5 12h14" {...st} />; break;
    case 'check': g = <Path d="M4.5 12.5l5 5 10-11" {...st} />; break;
    case 'search': g = (<><Circle cx="10.5" cy="10.5" r="6.5" {...st} /><Path d="M15.5 15.5L20 20" {...st} /></>); break;
    case 'chevron-down': g = <Path d="M6 9.5l6 6 6-6" {...st} />; break;
    case 'back': g = <Path d="M19 12H5M11 5.5L4.5 12l6.5 6.5" {...st} />; break;
    case 'replay': g = <Path d="M4 12a8 8 0 1 0 2.6-5.9M4 4.5v4.6h4.6" {...st} />; break;
    case 'rewind10': g = (<><Path d="M4.5 12.5a7.5 7.5 0 1 0 2.3-5.4M4.2 4.2v4h4" {...st} /><Path d="M9.4 10.2v4.6M12.2 10.2h2.3v4.6h-2.3z" {...st} strokeWidth={1.6} /></>); break;
    case 'forward10': g = (<><Path d="M19.5 12.5a7.5 7.5 0 1 1-2.3-5.4M19.8 4.2v4h-4" {...st} /><Path d="M9.4 10.2v4.6M12.2 10.2h2.3v4.6h-2.3z" {...st} strokeWidth={1.6} /></>); break;
    case 'volume': g = (<><Path d="M4 9.5v5h3.6l4.9 4V5.5l-4.9 4z" {...fill} /><Path d="M16 9a4.2 4.2 0 0 1 0 6M18.6 6.5a8 8 0 0 1 0 11" {...st} /></>); break;
    case 'mute': g = (<><Path d="M4 9.5v5h3.6l4.9 4V5.5l-4.9 4z" {...fill} /><Path d="M16.5 9.5l5 5M21.5 9.5l-5 5" {...st} /></>); break;
    case 'settings': g = (<><Path d="M4 7h9M17 7h3M4 17h3M11 17h9" {...st} /><Circle cx="15" cy="7" r="2.2" {...st} /><Circle cx="9" cy="17" r="2.2" {...st} /></>); break;
    case 'fullscreen': g = <Path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" {...st} />; break;
    case 'exit-fullscreen': g = <Path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" {...st} />; break;
    case 'airplay': g = (<><Path d="M7 17H5.5A2.5 2.5 0 0 1 3 14.5v-8A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5v8a2.5 2.5 0 0 1-2.5 2.5H17" {...st} /><Path d="M12 14.5l5 6H7z" {...fill} /></>); break;
    case 'cast': g = (<><Path d="M3 7.5V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" {...st} /><Path d="M3 17.5a3.5 3.5 0 0 1 3.5 3.5M3 13a8 8 0 0 1 8 8" {...st} /><Circle cx="3.6" cy="20.4" r=".9" {...fill} /></>); break;
    case 'next': g = (<><Path d="M5 5v14l10-7z" {...fill} /><Path d="M19 5v14" {...st} /></>); break;
    case 'backspace': g = (<><Path d="M9 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6-7z" {...st} /><Path d="M12.5 9.5l5 5M17.5 9.5l-5 5" {...st} /></>); break;
    case 'user': g = (<><Circle cx="12" cy="8.5" r="3.8" {...st} /><Path d="M4.5 20a7.5 7.5 0 0 1 15 0" {...st} /></>); break;
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {g}
    </Svg>
  );
}
