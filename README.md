# Jefflix

Your Jellyfin, on every screen. A cinematic home screen for the Jellyfin server you already run — on macOS, Windows, Linux, iPhone, LG TV (webOS) and the web.

**Website & docs:** https://jefflix-app.vercel.app · **Download:** https://jefflix-app.vercel.app/download/ · **Community:** https://discord.gg/KSp8ZRMvQP

![Jefflix player](https://jefflix-app.vercel.app/shots/player.gif)

## Features

- Big hero, Continue Watching, newest additions and poster rows
- Our own player: speed, quality switch with automatic transcode fallback, episode row, next episode
- My List synced with your Jellyfin favourites
- Full remote / arrow-key navigation; on-screen keyboard search for TVs
- TV sign-in with QR code + Jellyfin Quick Connect
- No accounts, no analytics. Jefflix talks only to your server.

## Develop

Expo (React Native + web) app; desktop builds wrap the web build with Tauri.

```bash
npm install
npx expo start          # phone / web dev server
npx expo export -p web  # web build in dist/
npx tauri build         # desktop installer (needs Rust)
```

## Licence

MIT — see [LICENSE](LICENSE).

Jefflix is an independent, open-source project. It is not affiliated with, endorsed by or sponsored by Netflix, Inc. or the Jellyfin project. Jefflix ships no content; it plays media from a Jellyfin server you run.
