# Mah

A Mahjong Solitaire Game

Development repository of the original open source version of many Mahjong games out there.

[Play it here](https://ffalt.github.io/mah/) - Completely free, no ads, no tracking.

build with html5, svg, angular

[![license](https://img.shields.io/github/license/ffalt/mah.svg)](http://opensource.org/licenses/MIT)
![test](https://github.com/ffalt/mah/workflows/test/badge.svg)
[![developer](https://img.shields.io/badge/developer-awesome-brightgreen.svg)](https://github.com/ffalt/mah)
[![known vulnerabilities](https://snyk.io/test/github/ffalt/mah/badge.svg)](https://snyk.io/test/github/ffalt/mah)
[![Maintainability](https://qlty.sh/gh/ffalt/projects/mah/maintainability.svg)](https://qlty.sh/gh/ffalt/projects/mah)

## Features

* 63 boards to play

* Random boards generator for much more and challenging games

* 12 different tile/piece image sets; light & dark

* 8 game backgrounds, themes; light & dark

* 3 difficulties

* Automatic save and restore of game state

* English, Deutsch, Nederlands, Português, русский, Español, Euskara, 日本語, Français

  Want to help translate Mah? Please use <https://crowdin.com/project/mahjong>

## Binary releases

You can download pre-built desktop binaries from the project’s GitHub Releases page:

https://github.com/ffalt/mah/releases

Currently provided artifacts include installers and package builds for Android, Windows, macOS, and Linux.

> [!IMPORTANT]
>
> Unsigned apps/installers (macOS and Windows)
> At the moment, the macOS and Windows builds are not code-signed (and macOS builds are not notarized). 
> Because of this, the operating system may warn or block the app the first time you try to run it. 
> This is expected behavior for unsigned software and does not mean the files are malicious.
> If you prefer to avoid these warnings entirely, you can always play the game in your browser: https://ffalt.github.io/mah/

#### macOS

Why you see a warning: Gatekeeper blocks apps from unidentified developers (unsigned/not notarized).
A scare note might say something about the app to be broken or unsafe, this is not true.

To bypass Apples Gatekeeper, remove the quarantine attribute.

```shell
xattr -dr com.apple.quarantine /Applications/Mah.app
```

There may be other ways to bypass depending on your MacOS, please search for your installed version.

#### Windows

Why you see a warning: Microsoft Defender SmartScreen shows a warning for apps from an unknown publisher (unsigned).

In the SmartScreen dialog, click “More info” and then “Run anyway”.

#### Android

Why you see a warning: Google blocks apps to be installed from unknown sources by default.

To install apps from unknown sources on an Android device, go to Settings, then Security or Apps, 
and enable the option for Unknown Sources. This allows you to install apps from outside the Google Play Store.

You need to know which processor family your device is running on. If you don't know, you can download all apk versions and safely try them out.
Chances are it is `arm64` as it is the most used in current phones, so you can download `android-mah-x_y_z-arm64.apk` first, then `arm`, then `x86_64`, then `x86`.


## Development

### Build Config

The default game name is "Mah Jong", to change it

* copy file `custom-build-config.json.dist` to `custom-build-config.json`
* edit the name in `custom-build-config.json` to your desired app name

### Development server

Run `npm run start` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

### Build

Run `npm run build` to build the project. The build artifacts will be stored in the `dist/` directory. Use `npm run build:prod` for a production build.

### Running tests

Run `npm run test` to execute the unit tests via [Jest](https://jestjs.io/).
