import { Stone, safeGetStone } from './stone';

describe('Stone', () => {
  describe('initialization', () => {
    it('should create an instance', () => {
      const stone = new Stone(0, 1, 2, 3, 4);

      expect(stone).toBeTruthy();
      expect(stone.z).toBe(0);
      expect(stone.x).toBe(1);
      expect(stone.y).toBe(2);
      expect(stone.v).toBe(3);
      expect(stone.groupNr).toBe(4);
      expect(stone.picked).toBe(false);
    });
  });

  describe('toPosition', () => {
    it('should convert to a position object', () => {
      const stone = new Stone(0, 1, 2, 3, 4);

      const position = stone.toPosition();

      expect(position).toEqual({
        z: 0,
        x: 1,
        y: 2,
        v: 3,
        groupNr: 4
      });
    });
  });

  describe('isBlocked', () => {
    it('should return true if there are unpicked stones on top', () => {
      const stone = new Stone(0, 0, 0, 1, 1);
      const topStone = new Stone(1, 0, 0, 2, 2);

      stone.nodes = {
        top: [topStone],
        left: [],
        right: [],
        bottom: []
      };

      expect(stone.isBlocked()).toBe(true);
    });

    it('should return true if there are unpicked stones on both left and right', () => {
      const stone = new Stone(0, 1, 0, 1, 1);
      const leftStone = new Stone(0, 0, 0, 2, 2);
      const rightStone = new Stone(0, 2, 0, 3, 3);

      stone.nodes = {
        top: [],
        left: [leftStone],
        right: [rightStone],
        bottom: []
      };

      expect(stone.isBlocked()).toBe(true);
    });

    it('should return false if there are no stones on top and either left or right is free', () => {
      const stone = new Stone(0, 1, 0, 1, 1);
      const leftStone = new Stone(0, 0, 0, 2, 2);

      stone.nodes = {
        top: [],
        left: [leftStone],
        right: [],
        bottom: []
      };

      expect(stone.isBlocked()).toBe(false);
    });

    it('should return false if all stones on top are picked', () => {
      const stone = new Stone(0, 0, 0, 1, 1);
      const topStone = new Stone(1, 0, 0, 2, 2);
      topStone.picked = true;

      stone.nodes = {
        top: [topStone],
        left: [],
        right: [],
        bottom: []
      };

      expect(stone.isBlocked()).toBe(false);
    });

    it('should return false if all stones on either left or right are picked', () => {
      const stone = new Stone(0, 1, 0, 1, 1);
      const leftStone = new Stone(0, 0, 0, 2, 2);
      const rightStone = new Stone(0, 2, 0, 3, 3);
      rightStone.picked = true;

      stone.nodes = {
        top: [],
        left: [leftStone],
        right: [rightStone],
        bottom: []
      };

      expect(stone.isBlocked()).toBe(false);
    });
  });
});

describe('safeGetStone', () => {
  it('should find a stone by position', () => {
    const stone1 = new Stone(0, 0, 0, 1, 1);
    const stone2 = new Stone(0, 1, 0, 2, 2);
    const stone3 = new Stone(1, 0, 0, 3, 3);

    const stones = [stone1, stone2, stone3];

    const result = safeGetStone(stones, 0, 1, 0);

    expect(result).toBe(stone2);
  });

  it('should return undefined if no stone is found', () => {
    const stone1 = new Stone(0, 0, 0, 1, 1);
    const stone2 = new Stone(0, 1, 0, 2, 2);

    const stones = [stone1, stone2];

    const result = safeGetStone(stones, 1, 1, 1);

    expect(result).toBeUndefined();
  });

  it('should handle empty array', () => {
    const stones: Array<Stone> = [];

    const result = safeGetStone(stones, 0, 0, 0);

    expect(result).toBeUndefined();
  });
});
