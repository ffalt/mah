import {
  CONSTS,
  STATES,
  GAME_MODE_EASY,
  GAME_MODE_STANDARD,
  GAME_MODE_EXPERT,
  GameModes,
  Themes,
  Backgrounds,
  ImageSets,
  ImageSetDefault,
  ThemeDefault,
  LangAuto,
  LangDefault,
  TILES,
  TILES_EXT,
  TILES_INFOS
} from './consts';

describe('Constants', () => {
  describe('CONSTS', () => {
    it('should define game constants', () => {
      expect(CONSTS).toBeDefined();
      expect(CONSTS.mX).toBeDefined();
      expect(CONSTS.mY).toBeDefined();
      expect(CONSTS.mZ).toBeDefined();
      expect(CONSTS.tileWidth).toBeDefined();
      expect(CONSTS.tileHeight).toBeDefined();
    });
  });

  describe('STATES', () => {
    it('should define game states', () => {
      expect(STATES).toBeDefined();
      expect(STATES.idle).toBe(0);
      expect(STATES.run).toBe(1);
      expect(STATES.pause).toBe(2);
    });
  });

  describe('Game Modes', () => {
    it('should define game mode constants', () => {
      expect(GAME_MODE_EASY).toBe('GAME_MODE_EASY');
      expect(GAME_MODE_STANDARD).toBe('GAME_MODE_STANDARD');
      expect(GAME_MODE_EXPERT).toBe('GAME_MODE_EXPERT');
    });

    it('should define game modes with features', () => {
      expect(GameModes).toBeInstanceOf(Array);
      expect(GameModes).toHaveLength(3);

      // Check easy mode
      const easyMode = GameModes.find(mode => mode.id === GAME_MODE_EASY);
      expect(easyMode).toBeDefined();
      expect(easyMode?.features.length).toBe(3);

      // Check standard mode
      const standardMode = GameModes.find(mode => mode.id === GAME_MODE_STANDARD);
      expect(standardMode).toBeDefined();
      expect(standardMode?.features.length).toBe(2);

      // Check expert mode
      const expertMode = GameModes.find(mode => mode.id === GAME_MODE_EXPERT);
      expect(expertMode).toBeDefined();
      expect(expertMode?.features.length).toBe(0);
    });
  });

  describe('Themes', () => {
    it('should define themes', () => {
      expect(Themes).toBeInstanceOf(Array);
      expect(Themes.length).toBeGreaterThan(0);

      // Check theme structure
      const theme = Themes[0];
      expect(theme).toHaveProperty('id');
      expect(theme).toHaveProperty('name');
    });
  });

  describe('Backgrounds', () => {
    it('should define backgrounds', () => {
      expect(Backgrounds).toBeInstanceOf(Array);
      expect(Backgrounds.length).toBeGreaterThan(0);

      // Check background structure
      const background = Backgrounds[0];
      expect(background).toHaveProperty('name');
      // First one should be "no background"
      expect(background.img).toBeUndefined();
    });
  });

  describe('ImageSets', () => {
    it('should define image sets', () => {
      expect(ImageSets).toBeInstanceOf(Array);
      expect(ImageSets.length).toBeGreaterThan(0);

      // Check image set structure
      const imageSet = ImageSets[0];
      expect(imageSet).toHaveProperty('id');
      expect(imageSet).toHaveProperty('type');
      expect(imageSet).toHaveProperty('name');
    });
  });

  describe('Default values', () => {
    it('should define default values', () => {
      expect(ImageSetDefault).toBeDefined();
      expect(ThemeDefault).toBeDefined();
      expect(LangAuto).toBe('auto');
      expect(LangDefault).toBe('auto');
    });
  });

  describe('Tiles', () => {
    it('should define tile sets', () => {
      expect(TILES).toBeInstanceOf(Array);
      expect(TILES.length).toBeGreaterThan(0);

      // Check tile structure (array of 4 strings)
      const tile = TILES[0];
      expect(tile).toBeInstanceOf(Array);
      expect(tile).toHaveLength(4);
      expect(typeof tile[0]).toBe('string');
    });

    it('should define extended tiles', () => {
      expect(TILES_EXT).toBeInstanceOf(Array);
    });

    it('should define tile info groups', () => {
      expect(TILES_INFOS).toBeInstanceOf(Array);
      expect(TILES_INFOS.length).toBeGreaterThan(0);

      // Check tile info structure
      const tileInfo = TILES_INFOS[0];
      expect(tileInfo).toHaveProperty('name');
      expect(tileInfo).toHaveProperty('groups');
      expect(tileInfo.groups).toBeInstanceOf(Array);

      // Check group structure
      const group = tileInfo.groups[0];
      expect(group).toHaveProperty('name');
      expect(group).toHaveProperty('tiles');
      expect(group.tiles).toBeInstanceOf(Array);
    });
  });
});
