# Contributing to Jefflix

Thanks for wanting to help. Bug reports, ideas, translations and code are all welcome.

- **Questions and chat:** [Discord](https://discord.gg/KSp8ZRMvQP)
- **Bugs and features:** [open an issue](https://github.com/JeffreyLauDev/jefflix/issues/new/choose)
- **Good place to start:** issues labelled [`good first issue`](https://github.com/JeffreyLauDev/jefflix/labels/good%20first%20issue)

## Running it locally

You need Node 20+ and a Jellyfin server you can reach (10.8 or later).

```bash
npm install
npx expo start --web    # opens the web build; sign in to your Jellyfin server
```

Add `?tv=1` to the URL to get the TV (10-foot) layout. iPhone: `npx expo run:ios`. Desktop: `npx tauri build` (needs Rust).

## How the code is laid out

| Path | What it does |
| --- | --- |
| `src/jellyfin.ts` | All Jellyfin API calls, rows for the home screen, stream URLs |
| `src/screens/` | Login, Browse (home and tabs), Details, Player, Search |
| `src/Focusable.tsx`, `src/spatialNav.ts` | Remote / arrow-key focus handling |
| `src/engine.*.tsx` | Video engine: `<video>` + hls.js on web, native player on iOS |
| `src-tauri/` | Desktop wrapper (macOS, Windows, Linux) |

## Rules of thumb

- Everything must be reachable with arrow keys, Enter and Back — the TV has no mouse.
- One look on every screen: test the phone, desktop and `?tv=1` layouts.
- Keep pull requests small and focused; include a screenshot or GIF for UI changes.
- Run `npx tsc --noEmit` before you open a PR.

By contributing you agree your work is released under the [MIT licence](LICENSE).
