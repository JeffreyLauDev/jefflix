import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Remote-control arrow navigation for the web build (desktop + LG webOS).
 * Moves DOM focus to the nearest [data-focusable] element in the pressed direction.
 * Native builds use RN's own TV focus engine instead.
 */
const KEYS: Record<number, 'up' | 'down' | 'left' | 'right'> = { 37: 'left', 38: 'up', 39: 'right', 40: 'down' };
export const BACK_CODES = [8, 27, 461, 10009];

export function useSpatialNav(onBack: () => boolean) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      const typing = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
      if (BACK_CODES.includes(e.keyCode) && !(typing && e.keyCode === 8)) {
        if (onBack()) e.preventDefault();
        return;
      }
      const dir = KEYS[e.keyCode];
      if (!dir) return;
      if (typing && (dir === 'left' || dir === 'right')) return;
      if (move(dir)) e.preventDefault();
    };
    // Capture phase: RN-web TextInput stops keydown propagation, which trapped the remote inside inputs.
    // On document (not window) so window-capture overlays (profile menu) still get Back first.
    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
  }, [onBack]);
}

function move(dir: 'up' | 'down' | 'left' | 'right') {
  const all = Array.from(document.querySelectorAll<HTMLElement>('[data-focusable="1"],input')).filter(visible);
  const cur = document.activeElement as HTMLElement | null;
  if (!cur || !all.includes(cur)) {
    all[0]?.focus();
    return true;
  }
  const a = cur.getBoundingClientRect();
  const ac = { x: a.left + a.width / 2, y: a.top + a.height / 2 };
  let best: HTMLElement | null = null;
  let bestScore = Infinity;
  for (const el of all) {
    if (el === cur) continue;
    const b = el.getBoundingClientRect();
    const bc = { x: b.left + b.width / 2, y: b.top + b.height / 2 };
    const dx = bc.x - ac.x;
    const dy = bc.y - ac.y;
    const ok =
      dir === 'right' ? b.left >= a.right - 4 : dir === 'left' ? b.right <= a.left + 4 : dir === 'down' ? b.top >= a.bottom - 4 : b.bottom <= a.top + 4;
    if (!ok) continue;
    const main = dir === 'left' || dir === 'right' ? Math.abs(dx) : Math.abs(dy);
    const cross = dir === 'left' || dir === 'right' ? Math.abs(dy) : Math.abs(dx);
    // vertical moves prefer the row's left-most / nearest card; horizontal moves must stay in the row
    const score = dir === 'left' || dir === 'right' ? main + cross * 6 : main * 2 + cross * 0.6;
    if (score < bestScore) {
      bestScore = score;
      best = el;
    }
  }
  // Moving up into the tab bar lands on the selected tab (standard TV behaviour), not the nearest one.
  const inBar = (el: HTMLElement) => !!el.closest('[data-tabbar],[data-avatar]');
  if (best && dir === 'up' && inBar(best) && !inBar(cur)) {
    best = document.querySelector<HTMLElement>('[data-tabbar] [aria-selected="true"]') ?? best;
  }
  // Leaving the tab bar downwards lands on the left-most item of that row (hero's Play, not Info).
  if (best && dir === 'down' && cur.closest('[data-tabbar]')) {
    const top = best.getBoundingClientRect().top;
    best = all.filter((el) => Math.abs(el.getBoundingClientRect().top - top) < 8).sort((x, y) => x.getBoundingClientRect().left - y.getBoundingClientRect().left)[0] ?? best;
  }
  if (!best) return false;
  best.focus({ preventScroll: true });
  best.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
  return true;
}

function visible(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
}
