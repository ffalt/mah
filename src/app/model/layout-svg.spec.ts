import { generateSVG, generateBase64SVG } from './layout-svg';
import type { Mapping } from './types';

describe('Layout SVG', () => {
  describe('generateSVG', () => {
    it('should generate SVG string from mapping', () => {
      const mapping: Mapping = [
        [0, 0, 0],
        [0, 1, 0]
      ];

      const svg = generateSVG(mapping);

      // Check that it's a valid SVG string
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');

      // Check that it contains the expected number of elements
      expect(svg.match(/<g transform=/g)?.length).toBe(2);

      // Check that it contains the expected attributes
      expect(svg).toContain('viewBox=');
      expect(svg).toContain('preserveAspectRatio="xMidYMid meet"');
      expect(svg).toContain('height="100%"');
      expect(svg).toContain('width="100%"');

      // Check that it contains rect elements with the expected attributes
      expect(svg).toContain('<rect fill="#FFF9E5" stroke-width="2" stroke="black" x="0" y="0" width="75" height="100" rx="10" ry="10">');
    });

    it('should handle empty mapping', () => {
      const mapping: Mapping = [];

      const svg = generateSVG(mapping);

      // Check that it's a valid SVG string
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');

      // Check that it doesn't contain any g elements
      expect(svg.match(/<g transform=/g)).toBeNull();
    });
  });

  describe('generateBase64SVG', () => {
    let originalBtoa: typeof window.btoa;

    beforeEach(() => {
      // Save original btoa function
      originalBtoa = window.btoa;

      // Mock btoa function
      window.btoa = jest.fn((input: string) => Buffer.from(input).toString('base64'));
    });

    afterEach(() => {
      // Restore original btoa function
      window.btoa = originalBtoa;
    });

    it('should generate base64 encoded SVG data URL from mapping', () => {
      const mapping: Mapping = [
        [0, 0, 0]
      ];

      const dataUrl = generateBase64SVG(mapping);

      // Check that it's a valid data URL
      expect(dataUrl).toMatch(/^data:image\/svg\+xml;base64,/);

      // Check that btoa was called with the SVG string
      expect(window.btoa).toHaveBeenCalledWith(generateSVG(mapping));
    });
  });
});
