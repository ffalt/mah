<div align="center">
	<img width="500" height="350" src="logo.svg" alt="Mah">
</div>

# Mah - A Mahjong Solitaire Game

Development repository of the original open-source version behind many Mahjong games on the web.

[Play Mahjong here](https://ffalt.github.io/mah/) - Completely free, no ads, no tracking.

Built with HTML5, SVG, and Angular.

[![license](https://img.shields.io/github/license/ffalt/mah.svg)](http://opensource.org/licenses/MIT)
![test](https://github.com/ffalt/mah/workflows/test/badge.svg)
[![developer](https://img.shields.io/badge/developer-awesome-brightgreen.svg)](https://github.com/ffalt/mah)
[![known vulnerabilities](https://snyk.io/test/github/ffalt/mah/badge.svg)](https://snyk.io/test/github/ffalt/mah)
[![Maintainability](https://qlty.sh/gh/ffalt/projects/mah/maintainability.svg)](https://qlty.sh/gh/ffalt/projects/mah)

## Features

* 63 built-in boards

* Random board generator for countless and more challenging games

* 13 tile/piece image sets; light and dark themes

* 8 game backgrounds and 7 background colors

* 3 difficulty levels and 2 game setup generators

* Automatic saving and restoring of game state and best times.   
  In your browser only—nothing is stored in the cloud!

* English, Deutsch, Nederlands, Português, Русский, Español, Euskara, 日本語, Français
  Want to help translate Mah? Please use <https://crowdin.com/project/mahjong>

## Additional boards/layouts

Visit the

### [Mahjong Solitaire Layout Museum](https://ffalt.github.io/mahseum/)

Browse a curated archive of custom board layouts created by the Kyodai Mahjongg community.
Click any layout and select “Play it with Mah” to import it into your game.

## Acknowledgements

The art in Mah is based on other open-source creative work.
Please have a look at the credits for [artwork](src/assets/svg/README.md), [backgrounds](src/assets/img/README.md), [sounds](src/assets/sounds/README.md), and [fonts](src/assets/fonts/README.md).

## Web releases

[Play Mah in your browser](https://ffalt.github.io/mah/)

## Binary releases

You can download pre-built desktop/mobile binaries from the project’s GitHub Releases page:

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

Why you see a warning: Apple’s Gatekeeper blocks apps from unidentified developers (unsigned/not notarized).
You might see a message claiming the app is damaged or unsafe - this is not true.

To bypass Apple’s Gatekeeper, remove the quarantine attribute:

```shell
xattr -dr com.apple.quarantine /Applications/mah.app
```

There may be other ways to proceed depending on your macOS version; please search for instructions specific to your version.

#### Windows

Why you see a warning: Microsoft Defender SmartScreen shows a warning for apps from an unknown publisher (unsigned).

In the SmartScreen dialog, click “More info” and then “Run anyway”.

#### Android

Why you see a warning: Android blocks installation from unknown sources by default.

To install apps from unknown sources on an Android device, go to Settings, then Security or Apps, 
and enable the option for Unknown Sources. This allows you to install apps from outside the Google Play Store.

You need to know which processor architecture your device uses. If you don't know, you can safely try the APK variants.
Most modern phones are `arm64`, so try `android-mah-x_y_z-arm64.apk` first, then `arm`, then `x86_64`, then `x86`. 


## Development

### Build Config

The default game name is "Mah Jong". To change it:

* Copy the file `custom-build-config.json.dist` to `custom-build-config.json`
* Edit the name in `custom-build-config.json` to your desired app name

### Development server

Run `npm run start` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

### Build

Run `npm run build` to build the project. The build artifacts will be stored in the `dist/` directory. For a production build, use `npm run build:prod`.

### Running tests

Run `npm run test` to execute the unit tests.
