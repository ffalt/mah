<div align="center"><a href="https://github.com/Safouene1/support-palestine-banner/blob/master/Markdown-pages/Support.md"><img src="https://raw.githubusercontent.com/Safouene1/support-palestine-banner/master/banner-support.svg" alt="Support Palestine" style="width: 100%;"></a></div>

<div align="center">
 <img width="500" height="350" src="logo.svg" alt="Mah">
</div>

# Mah - Mahjong Solitaire

The original open-source Mahjong Solitaire game powering many Mahjong experiences on the web.  
**Completely free. No ads. No tracking. No cloud.**

## 🀄 [Play now in your browser](https://ffalt.github.io/mah/)

[![license](https://img.shields.io/github/license/ffalt/mah.svg)](http://opensource.org/licenses/MIT)
![test](https://github.com/ffalt/mah/workflows/test/badge.svg)
[![developer](https://img.shields.io/badge/developer-awesome-brightgreen.svg)](https://github.com/ffalt/mah)
[![Maintainability](https://qlty.sh/gh/ffalt/projects/mah/maintainability.svg)](https://qlty.sh/gh/ffalt/projects/mah)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/35c2364ef29946f3a26b7605a34c75a8)](https://app.codacy.com/gh/ffalt/mah/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)

---

## ✨ Features

🧩 **84 built-in boards** plus a random board generator for endless replayability

🎨 **13 tile image sets** - switch between beautiful tile designs in light and dark styles

🖼️ **Massive visual customization** - 8 image backgrounds, 375 pattern backgrounds, light/dark mode, 14 color themes

🏆 **3 difficulty levels** - from relaxed casual play to expert-level challenge

💾 **Auto-save** - your game state and best times are saved locally in your browser, never to the cloud

📱 **Cross-platform** - runs in the browser, on desktop (macOS, Windows, Linux), and on Android

🌍 **37 languages** - English, العربية, বাংলা, Català, Čeština, Dansk, Deutsch, Ελληνικά, Español, Euskara, فارسی, Suomi, Filipino, Français, हिन्दी, Magyar, Bahasa Indonesia, Italiano, 日本語, 한국어, Bahasa Melayu, Nederlands, Norsk, Polski, Português, Română, Русский, Svenska, Kiswahili, தமிழ், తెలుగు, ไทย, Türkçe, Українська, اردو, Tiếng Việt, 中文
> Want to help translate? Contribute on [Crowdin](https://crowdin.com/project/mahjong)

---

## 🏛️ Explore More Boards

### [Mahjong Solitaire Layout Museum](https://ffalt.github.io/mahseum/)

Browse a curated archive of custom board layouts created by the Kyodai Mahjongg community.
Click any layout and select **"Play it with Mah"** to import it directly into your game.

---

## 📥 Download

Play instantly in the browser, or grab a native build for your platform:

<a href="https://github.com/ffalt/mah/releases" target="_blank"><img height="80" src="./resources/badges/badge-github.png" alt="Get it on Github"></a>
<a href="https://apps.obtainium.imranr.dev/redirect?r=obtainium://app/%7B%22id%22:%22io.github.ffalt.mah%22,%22url%22:%22https://github.com/ffalt/mah%22,%22author%22:%22ffalt%22,%22name%22:%22Mah%22%7D" target="_blank"><img height="80" src="./resources/badges/badge-obtainium.png" alt="Get it on Obtainium"></a>

|    | Platform | Available                                |
|----|----------|------------------------------------------|
| 🌐 | Web      | [Play now](https://ffalt.github.io/mah/) |
| 🍎 | macOS    | `.dmg` installer                         |
| 🪟 | Windows  | `.msi` / `.exe` installer                |
| 🐧 | Linux    | `.deb` / `.AppImage`                     |
| 🤖 | Android  | `.apk`                                   |

> [!IMPORTANT]
>
> **Unsigned apps/installers (macOS and Windows)**
>
> The macOS and Windows builds are not yet code-signed. Your OS may show a warning the first time you run the app - this is normal for unsigned software and **does not mean the files are malicious**.
> If you prefer to skip these warnings, just [play in your browser](https://ffalt.github.io/mah/) instead.

<details>
<summary>🍎 <strong>macOS</strong> - bypassing Gatekeeper</summary>

Apple's Gatekeeper blocks apps from unidentified developers. You may see a message claiming the app is damaged - this is not true.

Remove the quarantine attribute to fix it:

```shell
xattr -dr com.apple.quarantine /Applications/mah.app
```

The exact steps may vary by macOS version - search for instructions specific to yours.

</details>

<details>
<summary>🪟 <strong>Windows</strong> - bypassing SmartScreen</summary>

Microsoft Defender SmartScreen shows a warning for unsigned apps.

Click **"More info"** → **"Run anyway"** to proceed.

</details>

<details>
<summary>🤖 <strong>Android</strong> - installing from APK</summary>

Android blocks installs from unknown sources by default. Go to **Settings → Security (or Apps)** and enable **Unknown Sources**.

Most modern phones use `arm64`. Try these APK variants in order:

1. `android-mah-x_y_z-arm64.apk`
2. `android-mah-x_y_z-arm.apk`
3. `android-mah-x_y_z-x86_64.apk`
4. `android-mah-x_y_z-x86.apk`

</details>

---

## 🙏 Acknowledgements

Mah's art is built on open-source creative work. See the credits for [artwork](src/assets/svg/README.md), [backgrounds](src/assets/img/README.md), [sounds](src/assets/sounds/README.md), and [fonts](src/fonts/README.md).

---

## 🐳 Docker

Run Mah with a single command:

```bash
docker run -d -p 8080:80 ffalt/mah
```

Then open [http://localhost:8080](http://localhost:8080).

Or use Docker Compose:

```yaml
services:
  mah:
    image: ffalt/mah
    ports:
      - "8080:80"
```

For building from source with a custom version, see [resources/docker](resources/docker/).

---

## 🛠️ Development

### Build Config

The default game name is "Mah Jong". To change it:

1. Copy `custom-build-config.json.dist` to `custom-build-config.json`
2. Edit the name in `custom-build-config.json` to your desired app name

### Quick Start

```bash
npm run start         # Dev server → http://localhost:4200/
npm run build:prod    # Production build → dist/
npm run test          # Run unit tests
```
