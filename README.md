<p align="center"><img src="assets/j-mark.png" width="96" alt="Jefflix logo"></p>
<h1 align="center">Jefflix</h1>

<p align="center">
  <a href="https://github.com/JeffreyLauDev/jefflix/releases/latest"><img src="https://img.shields.io/github/v/release/JeffreyLauDev/jefflix?color=e50914&label=download" alt="Latest release"></a>
  <a href="https://github.com/JeffreyLauDev/jefflix/releases"><img src="https://img.shields.io/github/downloads/JeffreyLauDev/jefflix/total?color=333" alt="Downloads"></a>
  <a href="https://discord.gg/KSp8ZRMvQP"><img src="https://img.shields.io/badge/chat-Discord-5865F2?logo=discord&logoColor=white" alt="Discord"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/licence-MIT-333" alt="MIT licence"></a>
  <img src="https://img.shields.io/badge/platforms-macOS%20%7C%20Windows%20%7C%20Linux%20%7C%20iPhone%20%7C%20LG%20TV%20%7C%20Web-333" alt="Platforms">
</p>

<p align="center"><b>Your Jellyfin, on every screen.</b><br>A cinematic home screen for the Jellyfin server you already run — on macOS, Windows, Linux, iPhone, LG TV and the web.</p>

<p align="center"><a href="https://jefflix-app.vercel.app/download/"><b>Download</b></a> · <a href="https://jefflix-app.vercel.app/docs/">Docs</a> · <a href="https://discord.gg/KSp8ZRMvQP">Discord</a> · <a href="https://jefflix-app.vercel.app">Website</a></p>

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

## Why Jefflix?

- **Looks like a streaming service, not a file browser.** Big hero art, poster rows, Continue Watching and Top 10, built from your own library.
- **One app on every screen.** Same look and features on Mac, Windows, Linux, iPhone, LG TV and the web.
- **Made for the couch.** Every button works with a TV remote; sign in on the TV by scanning a QR code.
- **Nothing in between.** No account, no cloud, no tracking. Jefflix talks only to your Jellyfin server.

## Download

| Platform | Get it |
| --- | --- |
| macOS 11+ (Apple Silicon + Intel) | [Jefflix_2.0.0_universal.dmg](https://github.com/JeffreyLauDev/jefflix/releases/latest/download/Jefflix_2.0.0_universal.dmg) |
| Windows 10 / 11 | [Jefflix_2.0.0_x64-setup.exe](https://github.com/JeffreyLauDev/jefflix/releases/latest/download/Jefflix_2.0.0_x64-setup.exe) |
| Linux (Debian / Ubuntu) | [Jefflix_2.0.0_amd64.deb](https://github.com/JeffreyLauDev/jefflix/releases/latest/download/Jefflix_2.0.0_amd64.deb) |
| LG TV (webOS 4+) | [com.jeffrey.jefflix_2.0.0_all.ipk](https://github.com/JeffreyLauDev/jefflix/releases/latest/download/com.jeffrey.jefflix_2.0.0_all.ipk) · [install guide](https://jefflix-app.vercel.app/docs/install/lg-webos/) |
| iPhone / iPad | TestFlight beta — [coming soon](https://jefflix-app.vercel.app/docs/install/ios/) |
| Web (self-host) | [jefflix-web-2.0.0.zip](https://github.com/JeffreyLauDev/jefflix/releases/latest/download/jefflix-web-2.0.0.zip) |

All install guides: https://jefflix-app.vercel.app/download/

## Features

- **Speaks your language:** English, 廣東話, 繁體中文, 简体中文, 日本語, 한국어, Español. Translations welcome in [`src/i18n.ts`](src/i18n.ts).

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

## Contributing

Ideas, bug reports and pull requests are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) and the [`good first issue`](https://github.com/JeffreyLauDev/jefflix/labels/good%20first%20issue) label. Chat with the developer on [Discord](https://discord.gg/KSp8ZRMvQP).

If Jefflix is useful to you, a star helps other Jellyfin users find it.

## Licence

MIT — see [LICENSE](LICENSE).

Jefflix is an independent, open-source project. It is not affiliated with, endorsed by or sponsored by Netflix, Inc. or the Jellyfin project. Jefflix ships no content; it plays media from a Jellyfin server you run.
