import { Platform } from 'react-native';

/**
 * Desktop app only (Tauri window): shrink Jefflix into a small always-on-top window parked in the
 * bottom-right corner, and back. In a normal browser / phone / TV this does nothing (`canMini` is false).
 */
export const canMini = Platform.OS === 'web' && typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

let saved: { w: number; h: number; x: number; y: number } | null = null;

export async function setMini(on: boolean) {
  if (!canMini) return;
  const { getCurrentWindow, LogicalSize, LogicalPosition, currentMonitor } = await import('@tauri-apps/api/window');
  const win = getCurrentWindow();
  if (on) {
    if (await win.isFullscreen()) await win.setFullscreen(false);
    const sf = await win.scaleFactor();
    const size = (await win.innerSize()).toLogical(sf);
    const pos = (await win.outerPosition()).toLogical(sf);
    saved = { w: size.width, h: size.height, x: pos.x, y: pos.y };
    const mon = await currentMonitor();
    await win.setMinSize(new LogicalSize(320, 180));
    await win.setSize(new LogicalSize(480, 270));
    if (mon) {
      const m = { w: mon.size.width / mon.scaleFactor, h: mon.size.height / mon.scaleFactor, x: mon.position.x / mon.scaleFactor, y: mon.position.y / mon.scaleFactor };
      await win.setPosition(new LogicalPosition(m.x + m.w - 480 - 24, m.y + m.h - 270 - 80));
    }
    await win.setAlwaysOnTop(true);
  } else {
    await win.setAlwaysOnTop(false);
    await win.setMinSize(new LogicalSize(800, 480));
    if (saved) {
      await win.setSize(new LogicalSize(saved.w, saved.h));
      await win.setPosition(new LogicalPosition(saved.x, saved.y));
    }
  }
}
