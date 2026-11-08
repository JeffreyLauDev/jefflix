# Jefflix

Your Jellyfin, on every screen. A cinematic home screen for the Jellyfin server you already run — on macOS, Windows, Linux, iPhone, LG TV (webOS) and the web.

**Website & docs:** https://jefflix-app.vercel.app · **Download:** https://jefflix-app.vercel.app/download/ · **Community:** https://discord.gg/KSp8ZRMvQP

![Jefflix home screen on desktop](docs/screenshots/desktop-home.png)

## Screenshots

> Real screens from a personal library. Artwork is blurred because it belongs to its owners; in Jefflix it is your own library, in full colour.

### Home — big hero and poster rows

![Moving through the home rows with the keyboard](docs/screenshots/browse.gif)

![TV home](docs/screenshots/tv-home.png)

### Details and My List

![Details page with seasons and episodes](docs/screenshots/desktop-details.png)

![Adding a title to My List](docs/screenshots/mylist.gif)

### The player

![Player: quality menu, episode row, small and big previews](docs/screenshots/player.gif)

### Search, built for a remote

![Search typed with a remote](docs/screenshots/search.gif)

### On the TV

![TV layout driven by a remote](docs/screenshots/tv.gif)

Sign in on the TV by scanning a QR code with your phone (Jellyfin Quick Connect):

![TV Quick Connect sign-in](docs/screenshots/tv-quick-connect.png)

### On iPhone

<p>
  <img src="docs/screenshots/phone-home.png" alt="Home on iPhone" width="260" />
  &nbsp;
  <img src="docs/screenshots/phone-details.png" alt="Details on iPhone" width="260" />
</p>

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
