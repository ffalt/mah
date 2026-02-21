# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [1.17.0](https://github.com/ffalt/mah/compare/v1.16.1...v1.17.0) (2026-02-21)


### Features

* **app:** add a starter tutorial ([b60e256](https://github.com/ffalt/mah/commit/b60e256937e042fe8dc20cbb3a8750b90b8a31a9))
*	**languages:** add Malay, Filipino, Tamil, Swahili, Telugu, Thai, Bengali, Persian, Indonesian, Urdu, Swedish, Romanian, Turkish, Ukrainian, Vietnamese, Catalan, Czech, Danish, Finnish, Norwegian, Hindi, Greek, Arabic, Italian, Polish, Korean and Hungarian translations from Crowdin


## [1.16.1](https://github.com/ffalt/mah/compare/v1.16.0...v1.16.1) (2025-12-27)


### Bug Fixes

* **apps:** pause when the app is not focused ([7f01bcb](https://github.com/ffalt/mah/commit/7f01bcb065fdbca58899701056ed637dc020cf78))

## [1.16.0](https://github.com/ffalt/mah/compare/v1.15.1...v1.16.0) (2025-12-18)


### Features

* **board:** shuffle uses the remaining stones and does not create a new board ([d5e9a91](https://github.com/ffalt/mah/commit/d5e9a9144857318d58b7dc5439aaaa07241448dd))
* **sounds:** remove binary sounds, use ZzFX for sound generation, adjust jest mocks ([fbeaaac](https://github.com/ffalt/mah/commit/fbeaaac0b5096e89810a9471e3933af95932e0bf))

## [1.15.1](https://github.com/ffalt/mah/compare/v1.15.0...v1.15.1) (2025-12-14)


### Bug Fixes

* **pattern:** fix markdown link and formatting ([53f7b86](https://github.com/ffalt/mah/commit/53f7b86e27be428af65dfb6ebf45ad61687e389e))

## [1.15.0](https://github.com/ffalt/mah/compare/v1.14.1...v1.15.0) (2025-12-14)


### Features

* **background:** refresh images and add starry sky image ([68c492f](https://github.com/ffalt/mah/commit/68c492f5fb25b708fe657e6bc2ba2f89c3956945))
* **backgrounds:** use patterns from pattern monster ([f6b0d8f](https://github.com/ffalt/mah/commit/f6b0d8f610c03ba2308bab6c72ddfc5cf0235023))

## [1.14.1](https://github.com/ffalt/mah/compare/v1.14.0...v1.14.1) (2025-12-05)


### Bug Fixes

* **buttons:** hide feature buttons not enabled in game difficulty level ([0f72693](https://github.com/ffalt/mah/commit/0f7269389fcc7bc89cb79a29f4fd31a10b477533))

## [1.14.0](https://github.com/ffalt/mah/compare/v1.13.0...v1.14.0) (2025-12-05)


### Features

* **categories:** provide translations for layout cats ([7df1f62](https://github.com/ffalt/mah/commit/7df1f62e1ac089b5fea612b15b612e9e716e5a9a))
* **gameplay:** easy mode allows shuffle after no more moves ([a212697](https://github.com/ffalt/mah/commit/a212697e8b00cb376a8ae1d0438a2daf87f3253f))
* **game:** rework buttons ([9329b0a](https://github.com/ffalt/mah/commit/9329b0a46c931546e07b85161c390522023c87b3))
* **overlays:** rework buttons and selects ([f48d227](https://github.com/ffalt/mah/commit/f48d227d803c66393b9655af6d879a5380c1c089))
* **settings:** use tabs on medium to large screens ([191dfc4](https://github.com/ffalt/mah/commit/191dfc43d67d9a8971081957c4e2dd1cd60de1dd))
* **themes:** add color preview to settings options ([b750e28](https://github.com/ffalt/mah/commit/b750e28d263ef569f69dbff17a5a0d6990ff66bf))
* **themes:** rename color themes and add 7 more ([97bf28e](https://github.com/ffalt/mah/commit/97bf28ef34d1856ee8eec47463ac53654f37ca4f))


### Bug Fixes

* **gameplay:** easy mode allows shuffle after no more moves (but only if there are at least 2 free stones) ([1025161](https://github.com/ffalt/mah/commit/10251615c957ece30a335e186ec07f28066eb9be))
* **layout-chooser:** remove duplicate dom id ([ed2e46c](https://github.com/ffalt/mah/commit/ed2e46c6288424fbc8be618cfc2720398dc8c9f9))

## [1.13.0](https://github.com/ffalt/mah/compare/v1.12.1...v1.13.0) (2025-11-21)


### Features

* **layouts:** add layout categories; add new layouts to fill up categories ([a66d826](https://github.com/ffalt/mah/commit/a66d826ca42ff27f7976d4aee3bb2e3db6d8117f))


### Bug Fixes

* **css:** better component layout on small screens ([85fe6cd](https://github.com/ffalt/mah/commit/85fe6cd10610ad9736b71f1401f359338f5df313))
* **dark theme:** solve contrast issue on background hover ([57ebaa4](https://github.com/ffalt/mah/commit/57ebaa4d0ceb3198de18f869e23c4700dfd39c7a))
* **editor:** on saving, compact & expand to restore sorting for ID ([ece6372](https://github.com/ffalt/mah/commit/ece6372b38922841961b97ded49bfe5994ebb663))
* **layout-list:** better row layouting with css grid ([21841cb](https://github.com/ffalt/mah/commit/21841cbb7159cc50644f7b214ab38bb18a8a4a05))
* **layout-list:** use grid for anchors if available ([e589a50](https://github.com/ffalt/mah/commit/e589a5083a54f871025432d5c0f3832e1eee4923))
* **settings-dialog:** ensure background [none] is marked as selected ([030c7dd](https://github.com/ffalt/mah/commit/030c7ddd24910cc9f6689f08aed18ca5bb98d7f3))
* **settings-dialog:** gap on single column layout ([be8b573](https://github.com/ffalt/mah/commit/be8b573e104c2536db65c82712324224298e31e2))
* **settings-dialog:** more spacing; fix form structure ([d4b6127](https://github.com/ffalt/mah/commit/d4b61277aa8d5b7198cb6a543e8692372dc84efd))

## [1.12.1](https://github.com/ffalt/mah/compare/v1.12.0...v1.12.1) (2025-11-15)


### Bug Fixes

* **apps:** open external links in the default browser ([223bf25](https://github.com/ffalt/mah/commit/223bf25f3fe0be830b9985fe0698806f60b1e5cc))
* **board:** better viewport calculations ([f53e64a](https://github.com/ffalt/mah/commit/f53e64a826efb2e26fee3e87319e1a6776d2aa26))
* **hint-dialog:** icon colors on light theme ([8f7fde9](https://github.com/ffalt/mah/commit/8f7fde91730152d1b3c24dc4dc1e1f7c11a6665b))
* **new-game-dialog:** hide anchor-links on horizontal phones ([a9d83b0](https://github.com/ffalt/mah/commit/a9d83b02afa085e3bd3b236bf6f12981debbfc02))

## [1.12.0](https://github.com/ffalt/mah/compare/v1.11.0...v1.12.0) (2025-11-15)


### Features

* **languages:** add chinese ([325f95c](https://github.com/ffalt/mah/commit/325f95cf0b48bc76873a1d6fa666bdf1d2bacb24))
* **tiles-info:** allow setting the tileset in the tilesinfo-dialog ([3090f8e](https://github.com/ffalt/mah/commit/3090f8e994e29b4a33f571d5f3340ae9fe10da21))


### Bug Fixes

* **android:** remove internet permission [skip ci] ([4544c36](https://github.com/ffalt/mah/commit/4544c36d7a696249819ed51203cb66864aab713a))

## [1.11.0](https://github.com/ffalt/mah/compare/v1.10.0...v1.11.0) (2025-11-12)


### Features

* **svg:** add birds svgs ([3d20de7](https://github.com/ffalt/mah/commit/3d20de7c99961ebb389176da8ffb3ba29946a180))


### Bug Fixes

* **settings:** adjust hover color in light theme ([b94ba96](https://github.com/ffalt/mah/commit/b94ba96ed4eeebf8bb5963c80b8594640ddc457e))

## [1.10.0](https://github.com/ffalt/mah/compare/v1.9.0...v1.10.0) (2025-11-09)


### Features

* **svg:** add space svgs ([69ed442](https://github.com/ffalt/mah/commit/69ed442ea11e6ec538071929d98ad9b1cfd89dc5))
* **svg:** cleanup, remove low-resolution sets and support low-performance devices ([e78e981](https://github.com/ffalt/mah/commit/e78e9817f64bcfcf8ec07717c2c58a5df18ffe0a))


### Bug Fixes

* **mobile:** don't show pinch indicator on touch start ([494b7ab](https://github.com/ffalt/mah/commit/494b7ab45b072796cbb752bbee6a7e22d528fbb0))

## [1.9.0](https://github.com/ffalt/mah/compare/v1.8.2...v1.9.0) (2025-10-29)

### Features

* **mobile** support safe-area-padding

## [1.8.2](https://github.com/ffalt/mah/compare/v1.8.1...v1.8.2) (2025-09-29)


### Bug Fixes

* **board:** if zoomed, avoid unselecting stone on panning ([c45bdff](https://github.com/ffalt/mah/commit/c45bdff4a9189211d4c76161dc0b2b490f7af0a7))

## [1.8.1](https://github.com/ffalt/mah/compare/v1.8.0...v1.8.1) (2025-09-28)


### Bug Fixes

* **board:** proper reset of panning state ([5b7f23c](https://github.com/ffalt/mah/commit/5b7f23c33452370cff161464d9ba7633b314441a))

## [1.8.0](https://github.com/ffalt/mah/compare/v1.7.7...v1.8.0) (2025-09-28)


### Features

* **images:** add webp variants ([69848c6](https://github.com/ffalt/mah/commit/69848c60d749d374ac26868f3e34dfe1e56457bf))
* **imageset:** add animals ([8c67d37](https://github.com/ffalt/mah/commit/8c67d375564b0f39ad817366681135eaa3cd569a))
* **images:** reduce png files sizes ([ace93a6](https://github.com/ffalt/mah/commit/ace93a63d4347ce83ef3ce3921c9518aff3047d5))
* **layouts:** random layout generator ([a503275](https://github.com/ffalt/mah/commit/a5032752de0fa50c9b4f8ab1d3a5c10cb89bb53b))
* **locales:** load languages on demand instead of including in the build ([1d5d3a1](https://github.com/ffalt/mah/commit/1d5d3a18887f0960460a18c63704d4e08f0971eb))


### Bug Fixes

* **layout-list:** do not use elements.scrollIntoView() as it may scroll the parent page if embedded with iframe ([a087564](https://github.com/ffalt/mah/commit/a0875647ea9d649869762e1b5d813dcd587dbb45))

## [1.7.7](https://github.com/ffalt/mah/compare/v1.7.6...v1.7.7) (2025-02-22)

* **i18n**: add French
* **i18n**: add Japanese
* **dependencies:** update

## [1.7.6](https://github.com/ffalt/mah/compare/v1.7.5...v1.7.6) (2024-10-31)

* **i18n**: add Euskara (Basque) thanks to <https://crowdin.com/profile/mirenbz>

## [1.7.5](https://github.com/ffalt/mah/compare/v1.7.4...v1.7.5) (2024-10-02)

* **dependencies:** update

## [1.7.4](https://github.com/ffalt/mah/compare/v1.7.3...v1.7.4) (2024-03-25)

### Bug Fixes

* **layout-list:** delete custom board overlayed best time ([b37d61b](https://github.com/ffalt/mah/commit/b37d61bbd05e2359a4d89be25995c3dae8e67116))

## [1.7.3](https://github.com/ffalt/mah/compare/v1.7.2...v1.7.3) (2024-03-23)

### Features

* **layout-list:** allow deleting custom layouts in the layout-list ([74eaf0d](https://github.com/ffalt/mah/commit/74eaf0d7df1cf4db2b2cb1d866baabc90361aecb))

## [1.7.2](https://github.com/ffalt/mah/compare/v1.7.1...v1.7.2) (2024-02-18)

### Features

* **i18n:** update all translations

## [1.7.1](https://github.com/ffalt/mah/compare/v1.7.0...v1.7.1) (2024-02-18)

### Bug Fixes

* **mobile:** use full-height without browser bar to avoid scrolled UI ([d6a071b](https://github.com/ffalt/mah/commit/d6a071b774b7e8f460fd91afbab9e1433b7906af))

## [1.7.0](https://github.com/ffalt/mah/compare/v1.6.1...v1.7.0) (2024-02-18)

### Features

* **sets:** add better seasons and flowers to riichi ([a8ddead](https://github.com/ffalt/mah/commit/a8ddeada6a8675c2542280858fa9e48afea6edc4))
* **theme:** support dark mode in dialogs ([7527228](https://github.com/ffalt/mah/commit/7527228fb88ec8b529c2288ab12e0c5d7716420b))

### [1.6.1](https://github.com/ffalt/mah/compare/v1.6.0...v1.6.1) (2022-06-21)

### Bug Fixes

* **i18n:** Merge pull request [#438](https://github.com/ffalt/mah/issues/438) from carmenfdezb/main ([521039d](https://github.com/ffalt/mah/commit/521039dcab039e57f25d0fefec658e41344761cb))

## [1.6.0](https://github.com/ffalt/mah/compare/v1.5.1...v1.6.0) (2022-06-21)

### Features

* **i18n:** added Spanish, thanks Carmen! ([cb45093](https://github.com/ffalt/mah/commit/cb45093c0737983a3fb1ec18eff3065032892a37))

### Bug Fixes

* **settings-dialog:** more max width ([b860080](https://github.com/ffalt/mah/commit/b8600808c720d4d9116593f865ef5b6a57fb4b30))

### [1.5.1](https://github.com/ffalt/mah/compare/v1.5.0...v1.5.1) (2022-06-13)

### Bug Fixes

* **dialogs:** mobile portrait mode issues ([87be0e7](https://github.com/ffalt/mah/commit/87be0e7f703c8ca4206799d034c1f7e257de78db))

## [1.5.0](https://github.com/ffalt/mah/compare/v1.4.0...v1.5.0) (2022-06-13)

### Features

* **android:** pause if app is in background, integrate capacitor with dedicated build config ([a8f5e5a](https://github.com/ffalt/mah/commit/a8f5e5a06a44863424e9f6fbbded1c019ee134bc))
* **board:** pan bounds when zoomed in ([9612bde](https://github.com/ffalt/mah/commit/9612bde6cafa98f0b06828aed6955752bafda446))
* **boards:** replace duplicates ([1d45033](https://github.com/ffalt/mah/commit/1d45033033f6cc32fc6c82509af1256da68dd0ac))
* **board:** support basic zooming in with pinch/wheel, support pan if zoomed in ([0c79086](https://github.com/ffalt/mah/commit/0c79086d43c5d034e14984fd57b0f3dff4044ab1))
* **board:** zoom on svg element ([db09077](https://github.com/ffalt/mah/commit/db09077053515b90c6f05c1ffb7c6e927c9736be))
* **builder:** shuffle groups, too ([c237ab2](https://github.com/ffalt/mah/commit/c237ab2008698fd7bf0dd7415622d729b34acf1b))
* **game:** support boards with tile count > 144 ([0875ec8](https://github.com/ffalt/mah/commit/0875ec8bd043c4e31a532297848e13b4bef5986e))
* **help:** add all game function icons & shortcuts ([fa80296](https://github.com/ffalt/mah/commit/fa802969b406ee9f121e0727bbba1e51ab994dbd))
* **help:** add minimal how to ([7150020](https://github.com/ffalt/mah/commit/7150020b117aad0c009f6cb42a8d51dd669f66b6))
* **i18n:** update translations ([3dfd6a8](https://github.com/ffalt/mah/commit/3dfd6a84e0a31835fc37a0b0c8c21db491cd3ca0))
* **i18n:** update translations ([9d61ce7](https://github.com/ffalt/mah/commit/9d61ce7a2800be0aeaf59896a2f41cf20677ccfa))
* **images:** compact pngs ([b8da2c3](https://github.com/ffalt/mah/commit/b8da2c3824dd7f9d077ef9f6cda961a809051c67))
* **info-dialog:** add more generic tiles ([68d3995](https://github.com/ffalt/mah/commit/68d399588334a2f008e908883d57ea00b16b7185))
* **info-dialog:** larger tiles, add jokers ([aa20c0b](https://github.com/ffalt/mah/commit/aa20c0be25a4f4c3b1d9634acf79043e66cfc084))
* **info:** add extra tiles to info dialog ([dae5057](https://github.com/ffalt/mah/commit/dae5057f4bfb2ab06087d8793addbd363e8d9eaf))
* **loading:** use css animation instead of webfont rotation ([0933fd2](https://github.com/ffalt/mah/commit/0933fd23cd0c2b1e8ed05d5be11454ab69bd6ced))
* **mobile:** better margins in mobile horizontal ([c57ba66](https://github.com/ffalt/mah/commit/c57ba6656bc01265632e86ed6536832ee9957e14))
* **size:** remove FormsModule ([f8b2c0e](https://github.com/ffalt/mah/commit/f8b2c0ef2c21634766035c702d86a23a0fe42866))
* **svg:** add joker tiles ([3d9de07](https://github.com/ffalt/mah/commit/3d9de07796838f1db9e5b8d7b7ff5479f5f76823))
* **svg:** cleanup ([c70f211](https://github.com/ffalt/mah/commit/c70f21105f6bccacc84e67ff8bb4a84b8fec5b5b))
* **svg:** cleanup ([33969bf](https://github.com/ffalt/mah/commit/33969bff816122f0e304680aa4d41b2b8cc196c0))
* **theme:** basic theming ([baf6744](https://github.com/ffalt/mah/commit/baf67446e4736d11262737359e648d2854c03d5d))
* **theme:** basic theming ([78aa6f2](https://github.com/ffalt/mah/commit/78aa6f20fdbcbcb080a850ee7f3732a8b5b54312))
* **theme:** basic theming; dialog rework ([7d00804](https://github.com/ffalt/mah/commit/7d00804e5fc8452f4a01736f4ac5e75331eae59a))
* **tileset:** add riichi-black ([029fbf4](https://github.com/ffalt/mah/commit/029fbf4d28c73f5d446ba3cb7eb69d3496c921a5))
* **tileset:** make dark tiles an option ([0bcef97](https://github.com/ffalt/mah/commit/0bcef97c4810fbedc94f2bc220b40633455d651d))
* **toolbars:** attach toolbar left & right if screen.height < 600 ([4cb4b38](https://github.com/ffalt/mah/commit/4cb4b384d7d1adfbdd333e78121450793701ea93))

### Bug Fixes

* **board:** handle rotated board in pan ([bee3576](https://github.com/ffalt/mah/commit/bee3576587c2bc6309372032a9ceda181e183d75))
* **board:** show hinted tiles border on dark tiles ([fa749c2](https://github.com/ffalt/mah/commit/fa749c27413cfd80b9aef7e68718e06ab2a034a0))
* **builder:** for boards with < 144 tiles, invalid boards could have been randomly created ([782d64a](https://github.com/ffalt/mah/commit/782d64ab7118b1070c489e733931ff9705d0eb78))
* **builder:** refactor builder & add solver, circumvent blank tiles ([fb30822](https://github.com/ffalt/mah/commit/fb30822074fab01366f848e245804d249d3a22c4)), closes [#427](https://github.com/ffalt/mah/issues/427)
* **builder:** Remove bonkers linear board builder ([e69618b](https://github.com/ffalt/mah/commit/e69618b48a763f5eb018f2a0ea78dc6e1ea1d5f4)), closes [#428](https://github.com/ffalt/mah/issues/428)
* **choose-layout:** add missing padding ([53feebe](https://github.com/ffalt/mah/commit/53feebed3d7fdf605906b498f1de3cc2489f4c46))
* **dialog:** don't run change detection on hidden dialogs ([e031601](https://github.com/ffalt/mah/commit/e03160109b6e50ef5966474ac14afc93a27caf1e))
* **help:** layout columns ([7bff51c](https://github.com/ffalt/mah/commit/7bff51ca501db25a25092cdecd255bef957c8534))
* **loading:** update layout-list after lazy loaded ([c8273bc](https://github.com/ffalt/mah/commit/c8273bc0757d731de3c1b75415f163ccb39b0f53))
* **solver:** increase max groups ([548515b](https://github.com/ffalt/mah/commit/548515bcee18f47747297e4d97bb4f451753ba6d))
* **sound:** restore last setting ([bb8c9ed](https://github.com/ffalt/mah/commit/bb8c9ede8d6486fa85288fdb83f64d925e24be60))
* **svg:** center joker t_g13; remove deps workaround ([08ab5ec](https://github.com/ffalt/mah/commit/08ab5ecf2f1f718fe05b898f636234bb374cd516))
* **tileset:** class names & IDs must be unique ([63319bc](https://github.com/ffalt/mah/commit/63319bc42ed645671f2862dba6282dc259e08501))

## [1.4.0](https://github.com/ffalt/mah/compare/v1.3.1...v1.4.0) (2022-04-03)

### Features

* **boards:** add some more boards ([91144ba](https://github.com/ffalt/mah/commit/91144bab764f89ad72faf210563f0d46df21b522))
* **tiles:** settings for higher contrast (more thick border & darker shadow) ([1177488](https://github.com/ffalt/mah/commit/1177488fbc217fce693280851af5aa519a088cce))

## [1.3.1](https://github.com/ffalt/mah/compare/v1.3.0...v1.3.1) (2022-01-03)

### Features

* **i18n:** feat(i18n): nl translation by Vistaus

## [1.3.0](https://github.com/ffalt/mah/compare/v1.2.0...v1.3.0) (2021-10-27)

### ⚠ BREAKING CHANGES

* **deps:** No more IE11 support

### Features

* **board:** show tile name as svg title ([b111657](https://github.com/ffalt/mah/commit/b111657d6f0ab1a4ae17f1865be5c3fbee787531))
* **font:** switch to kulim park for better cyrillic support ([727d445](https://github.com/ffalt/mah/commit/727d44523cd57b5134f6a95e6e30fe6d4a051f31))
* **i18n:** refactor, add pt & ru, translate more strings ([b7e30fe](https://github.com/ffalt/mah/commit/b7e30fe8dd9d4e1c73f8723de8b5e70f17780ab1))
* **sound:** play tile sound on deselect too ([a91acf7](https://github.com/ffalt/mah/commit/a91acf7bc22218b3fe17b7d5c9dbad4cb1712ddb))

### Bug Fixes

* **css:** better paddings ([ef91056](https://github.com/ffalt/mah/commit/ef91056c71eb9a18e0a7764d843f0ed17fb25202))
* **css:** fix font sizes and layout on 4k display ([d2c375e](https://github.com/ffalt/mah/commit/d2c375e2d07cdd99a5b82acd81eafd09d0a7563a))

### build

* **deps:** update to angular 12.2.11 ([e54d412](https://github.com/ffalt/mah/commit/e54d412878dd355b25324eb086b699ffd54f8ab2))

## [1.2.0](https://github.com/ffalt/mah/compare/v1.1.9...v1.2.0) (2020-12-10)

### Features

* **best times:** remove for a board in layout chooser & remove all in settings ([60ad627](https://github.com/ffalt/mah/commit/60ad6272b1fc2d68e0c4dc78bde345403b6dded9))

## 1.1.9 (2020-09-24)

Start using standard-version changelog
