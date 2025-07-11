import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { of } from 'rxjs';
import { LayoutService } from './layout.service';
import { LocalstorageService } from './localstorage.service';
import { expandMapping, mappingToID } from '../model/mapping';
import { generateBase64SVG } from '../model/layout-svg';
import type { CompactMapping, Layout, LoadLayout, Mapping, SafeUrlSVG } from '../model/types';

// Mock dependencies
jest.mock('../model/mapping', () => ({
  expandMapping: jest.fn(),
  mappingToID: jest.fn()
}));

jest.mock('../model/layout-svg', () => ({
  generateBase64SVG: jest.fn()
}));

describe('LayoutService', () => {
  let service: LayoutService;
  let mockHttpClient: jest.Mocked<HttpClient>;
  let mockDomSanitizer: jest.Mocked<DomSanitizer>;
  let mockLocalstorageService: jest.Mocked<LocalstorageService>;

  beforeEach(() => {
    // Create mocks for dependencies
    mockHttpClient = {
      get: jest.fn()
    } as unknown as jest.Mocked<HttpClient>;

    mockDomSanitizer = {
      bypassSecurityTrustUrl: jest.fn()
    } as unknown as jest.Mocked<DomSanitizer>;

    mockLocalstorageService = {
      getCustomLayouts: jest.fn(),
      storeCustomLayouts: jest.fn(),
      getSettings: jest.fn(),
      storeSettings: jest.fn(),
      getState: jest.fn(),
      storeState: jest.fn(),
      getScore: jest.fn(),
      storeScore: jest.fn()
    } as unknown as jest.Mocked<LocalstorageService>;

    // Configure TestBed
    TestBed.configureTestingModule({
      providers: [
        LayoutService,
        { provide: HttpClient, useValue: mockHttpClient },
        { provide: DomSanitizer, useValue: mockDomSanitizer },
        { provide: LocalstorageService, useValue: mockLocalstorageService }
      ]
    });

    // Get the service
    service = TestBed.inject(LayoutService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with empty layouts', () => {
      expect(service.layouts).toEqual({ items: [] });
      expect(service.loaded).toBe(false);
      expect(service.selectBoardID).toBeUndefined();
    });
  });

  describe('static layout2loadLayout', () => {
    it('should convert a layout to a load layout', () => {
      // Arrange
      const layout: Layout = {
        id: 'test-id',
        name: 'Test Layout',
        by: 'Test Author',
        category: 'Test Category',
        mapping: [[0, 0, 0]]
      };
      const compactMapping: CompactMapping = [[0, [[0, 0]]]];

      // Act
      const result = LayoutService.layout2loadLayout(layout, compactMapping);

      // Assert
      expect(result).toEqual({
        id: 'test-id',
        name: 'Test Layout',
        by: 'Test Author',
        cat: 'Test Category',
        map: compactMapping
      });
    });
  });

  describe('get', () => {
    it('should return cached layouts if already loaded', async () => {
      // Arrange
      service.loaded = true;
      service.layouts = { items: [{ id: 'test', name: 'Test', category: 'Test', mapping: [] }] };

      // Act
      const result = await service.get();

      // Assert
      expect(result).toBe(service.layouts);
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });

    it('should load layouts from server and custom layouts', async () => {
      // Arrange
      const serverLayouts: Array<LoadLayout> = [
        { id: 'server1', name: 'Server 1', cat: 'Category 1', map: [[0, [[0, 0]]]] }
      ];
      const customLayouts: Array<LoadLayout> = [
        { id: 'custom1', name: 'Custom 1', cat: 'Category 2', map: [[0, [[0, 0]]]] }
      ];
      const expandedMapping: Mapping = [[0, 0, 0]];
      const safeUrl = 'data:image/svg+xml;base64,...' as SafeUrlSVG;

      mockHttpClient.get.mockReturnValue(of(serverLayouts));
      mockLocalstorageService.getCustomLayouts.mockReturnValue(customLayouts);
      (expandMapping as jest.Mock).mockReturnValue(expandedMapping);
      (generateBase64SVG as jest.Mock).mockReturnValue('data:image/svg+xml;base64,...');
      mockDomSanitizer.bypassSecurityTrustUrl.mockReturnValue(safeUrl);

      // Act
      const result = await service.get();

      // Assert
      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe('server1');
      expect(result.items[0].custom).toBeUndefined();
      expect(result.items[1].id).toBe('custom1');
      expect(result.items[1].custom).toBe(true);
      expect(service.loaded).toBe(true);
      expect(mockHttpClient.get).toHaveBeenCalledWith('assets/data/boards.json');
      expect(mockLocalstorageService.getCustomLayouts).toHaveBeenCalled();
    });
  });

  describe('removeAllCustomLayouts', () => {
    it('should remove all custom layouts', () => {
      // Arrange
      service.layouts = {
        items: [
          { id: 'server1', name: 'Server 1', category: 'Category 1', mapping: [], custom: false },
          { id: 'custom1', name: 'Custom 1', category: 'Category 2', mapping: [], custom: true }
        ]
      };

      // Act
      service.removeAllCustomLayouts();

      // Assert
      expect(service.layouts.items).toHaveLength(1);
      expect(service.layouts.items[0].id).toBe('server1');
      expect(mockLocalstorageService.storeCustomLayouts).toHaveBeenCalledWith();
    });
  });

  describe('removeCustomLayout', () => {
    it('should remove specific custom layouts', () => {
      // Arrange
      service.layouts = {
        items: [
          { id: 'server1', name: 'Server 1', category: 'Category 1', mapping: [] },
          { id: 'custom1', name: 'Custom 1', category: 'Category 2', mapping: [], custom: true },
          { id: 'custom2', name: 'Custom 2', category: 'Category 2', mapping: [], custom: true }
        ]
      };
      mockLocalstorageService.getCustomLayouts.mockReturnValue([
        { id: 'custom1', name: 'Custom 1', cat: 'Category 2', map: [] },
        { id: 'custom2', name: 'Custom 2', cat: 'Category 2', map: [] }
      ]);

      // Act
      service.removeCustomLayout(['custom1']);

      // Assert
      expect(service.layouts.items).toHaveLength(2);
      expect(service.layouts.items[0].id).toBe('server1');
      expect(service.layouts.items[1].id).toBe('custom2');
      expect(mockLocalstorageService.storeCustomLayouts).toHaveBeenCalledWith([
        { id: 'custom2', name: 'Custom 2', cat: 'Category 2', map: [] }
      ]);
    });

    it('should handle removing all custom layouts', () => {
      // Arrange
      service.layouts = {
        items: [
          { id: 'server1', name: 'Server 1', category: 'Category 1', mapping: [] },
          { id: 'custom1', name: 'Custom 1', category: 'Category 2', mapping: [], custom: true }
        ]
      };
      mockLocalstorageService.getCustomLayouts.mockReturnValue([
        { id: 'custom1', name: 'Custom 1', cat: 'Category 2', map: [] }
      ]);

      // Act
      service.removeCustomLayout(['custom1']);

      // Assert
      expect(service.layouts.items).toHaveLength(1);
      expect(service.layouts.items[0].id).toBe('server1');
      expect(mockLocalstorageService.storeCustomLayouts).toHaveBeenCalledWith(undefined);
    });
  });

  describe('expandLayout', () => {
    it('should expand a layout with provided ID', () => {
      // Arrange
      const loadLayout: LoadLayout = {
        id: 'test-id',
        name: 'Test Layout',
        by: 'Test Author',
        cat: 'Test Category',
        map: [[0, [[0, 0]]]]
      };
      const expandedMapping: Mapping = [[0, 0, 0]];
      const safeUrl = 'data:image/svg+xml;base64,...' as SafeUrlSVG;

      (expandMapping as jest.Mock).mockReturnValue(expandedMapping);
      (generateBase64SVG as jest.Mock).mockReturnValue('data:image/svg+xml;base64,...');
      mockDomSanitizer.bypassSecurityTrustUrl.mockReturnValue(safeUrl);

      // Act
      const result = service.expandLayout(loadLayout);

      // Assert
      expect(result).toEqual({
        id: 'test-id',
        name: 'Test Layout',
        by: 'Test Author',
        category: 'Test Category',
        mapping: expandedMapping,
        previewSVG: safeUrl,
        custom: undefined
      });
      expect(expandMapping).toHaveBeenCalledWith(loadLayout.map);
      expect(generateBase64SVG).toHaveBeenCalledWith(expandedMapping);
      expect(mockDomSanitizer.bypassSecurityTrustUrl).toHaveBeenCalledWith('data:image/svg+xml;base64,...');
    });

    it('should generate ID if not provided', () => {
      // Arrange
      const loadLayout: LoadLayout = {
        id: '',
        name: 'Test Layout',
        cat: 'Test Category',
        map: [[0, [[0, 0]]]]
      };
      const expandedMapping: Mapping = [[0, 0, 0]];
      const safeUrl = 'data:image/svg+xml;base64,...' as SafeUrlSVG;
      const generatedId = 'generated-id';

      (expandMapping as jest.Mock).mockReturnValue(expandedMapping);
      (mappingToID as jest.Mock).mockReturnValue(generatedId);
      (generateBase64SVG as jest.Mock).mockReturnValue('data:image/svg+xml;base64,...');
      mockDomSanitizer.bypassSecurityTrustUrl.mockReturnValue(safeUrl);

      // Act
      const result = service.expandLayout(loadLayout);

      // Assert
      expect(result.id).toBe(generatedId);
      expect(mappingToID).toHaveBeenCalledWith(expandedMapping);
    });

    it('should set custom flag if provided', () => {
      // Arrange
      const loadLayout: LoadLayout = {
        id: 'test-id',
        name: 'Test Layout',
        cat: 'Test Category',
        map: [[0, [[0, 0]]]]
      };
      const expandedMapping: Mapping = [[0, 0, 0]];
      const safeUrl = 'data:image/svg+xml;base64,...' as SafeUrlSVG;

      (expandMapping as jest.Mock).mockReturnValue(expandedMapping);
      (generateBase64SVG as jest.Mock).mockReturnValue('data:image/svg+xml;base64,...');
      mockDomSanitizer.bypassSecurityTrustUrl.mockReturnValue(safeUrl);

      // Act
      const result = service.expandLayout(loadLayout, true);

      // Assert
      expect(result.custom).toBe(true);
    });
  });

  describe('loadCustomLayouts', () => {
    it('should load custom layouts from storage', () => {
      // Arrange
      const customLayouts: Array<LoadLayout> = [
        { id: 'custom1', name: 'Custom 1', cat: 'Category 1', map: [] }
      ];
      mockLocalstorageService.getCustomLayouts.mockReturnValue(customLayouts);

      // Act
      const result = service.loadCustomLayouts();

      // Assert
      expect(result).toBe(customLayouts);
      expect(mockLocalstorageService.getCustomLayouts).toHaveBeenCalled();
    });

    it('should return empty array if no custom layouts', () => {
      // Arrange
      mockLocalstorageService.getCustomLayouts.mockReturnValue(undefined);

      // Act
      const result = service.loadCustomLayouts();

      // Assert
      expect(result).toEqual([]);
      expect(mockLocalstorageService.getCustomLayouts).toHaveBeenCalled();
    });
  });

  describe('storeCustomBoards', () => {
    it('should store custom boards and update layouts', () => {
      // Arrange
      service.layouts = { items: [{ id: 'server1', name: 'Server 1', category: 'Category 1', mapping: [] }] };
      const customLayouts: Array<LoadLayout> = [];
      mockLocalstorageService.getCustomLayouts.mockReturnValue(customLayouts);

      const newCustomLayouts: Array<LoadLayout> = [
        { id: 'custom1', name: 'Custom 1', cat: 'Category 2', map: [[0, [[0, 0]]]] }
      ];
      const expandedLayout: Layout = {
        id: 'custom1',
        name: 'Custom 1',
        category: 'Category 2',
        mapping: [[0, 0, 0]],
        custom: true
      };

      // Mock expandLayout
      jest.spyOn(service, 'expandLayout').mockReturnValue(expandedLayout);

      // Act
      service.storeCustomBoards(newCustomLayouts);

      // Assert
      expect(mockLocalstorageService.storeCustomLayouts).toHaveBeenCalledWith(newCustomLayouts);
      expect(service.layouts.items).toHaveLength(2);
      expect(service.layouts.items[1]).toBe(expandedLayout);
      expect(service.expandLayout).toHaveBeenCalledWith(newCustomLayouts[0], true);
    });
  });

  describe('generatePreview', () => {
    it('should generate a preview SVG', () => {
      // Arrange
      const mapping: Mapping = [[0, 0, 0]];
      const safeUrl = 'data:image/svg+xml;base64,...' as SafeUrlSVG;

      (generateBase64SVG as jest.Mock).mockReturnValue('data:image/svg+xml;base64,...');
      mockDomSanitizer.bypassSecurityTrustUrl.mockReturnValue(safeUrl);

      // Act
      const result = service.generatePreview(mapping);

      // Assert
      expect(result).toBe(safeUrl);
      expect(generateBase64SVG).toHaveBeenCalledWith(mapping);
      expect(mockDomSanitizer.bypassSecurityTrustUrl).toHaveBeenCalledWith('data:image/svg+xml;base64,...');
    });
  });
});
