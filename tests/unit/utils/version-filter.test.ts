import { describe, it, expect } from 'vitest';
import { filterLatestVersionsPerMajor, filterAppDataForLLM } from '../../../src/utils/version-filter';

describe('version-filter utility', () => {
  describe('filterLatestVersionsPerMajor', () => {
    it('should return empty array for empty input', () => {
      expect(filterLatestVersionsPerMajor([])).toEqual([]);
    });

    it('should return single version when only one exists', () => {
      const versions = [{
        id: '1',
        externalVersion: '1.0.0',
        internalVersion: '1.0.0'
      }];
      
      const result = filterLatestVersionsPerMajor(versions);
      expect(result).toHaveLength(1);
      expect(result[0].externalVersion).toBe('1.0.0');
    });

    it('should keep only latest version per major version', () => {
      const versions = [
        { id: '1', externalVersion: '1.0.0', internalVersion: '1.0.0' },
        { id: '2', externalVersion: '1.1.0', internalVersion: '1.1.0' },
        { id: '3', externalVersion: '1.2.0', internalVersion: '1.2.0' },
        { id: '4', externalVersion: '2.0.0', internalVersion: '2.0.0' },
        { id: '5', externalVersion: '2.1.0', internalVersion: '2.1.0' },
      ];
      
      const result = filterLatestVersionsPerMajor(versions);
      expect(result).toHaveLength(2);
      expect(result[0].externalVersion).toBe('2.1.0'); // Latest v2
      expect(result[1].externalVersion).toBe('1.2.0'); // Latest v1
    });

    it('should handle complex version numbers (4 parts)', () => {
      const versions = [
        { id: '1', externalVersion: '6.4.17.1', internalVersion: '4.17.1' },
        { id: '2', externalVersion: '6.4.17.2', internalVersion: '4.17.2' },
        { id: '3', externalVersion: '6.4.18.0', internalVersion: '4.18.0' },
        { id: '4', externalVersion: '6.5.0.0', internalVersion: '5.0.0' },
      ];
      
      const result = filterLatestVersionsPerMajor(versions);
      expect(result).toHaveLength(1); // Only one major version (6)
      expect(result[0].externalVersion).toBe('6.5.0.0'); // Latest
    });

    it('should handle WordPress-style versions with missing patch', () => {
      const versions = [
        { id: '1', externalVersion: '6.0', internalVersion: '6.0.0' },
        { id: '2', externalVersion: '6.1', internalVersion: '6.1.0' },
        { id: '3', externalVersion: '6.1.1', internalVersion: '6.1.1' },
      ];
      
      const result = filterLatestVersionsPerMajor(versions);
      expect(result).toHaveLength(1);
      expect(result[0].externalVersion).toBe('6.1.1');
    });

    it('should strip unnecessary fields', () => {
      const versions = [{
        id: '1',
        externalVersion: '1.0.0',
        internalVersion: '1.0.0',
        supported: false,
        deprecated: false,
        current: false
      }];
      
      const result = filterLatestVersionsPerMajor(versions);
      expect(result[0]).not.toHaveProperty('supported');
      expect(result[0]).not.toHaveProperty('deprecated');
      expect(result[0]).not.toHaveProperty('current');
    });
  });

  describe('filterAppDataForLLM', () => {
    it('should remove description field', () => {
      const app = {
        id: '123',
        name: 'Test App',
        description: 'Some description',
        versions: [{
          id: '1',
          externalVersion: '1.0.0',
          internalVersion: '1.0.0'
        }]
      };
      
      const result = filterAppDataForLLM(app);
      expect(result).not.toHaveProperty('description');
      expect(result.id).toBe('123');
      expect(result.name).toBe('Test App');
    });

    it('should apply version filtering', () => {
      const app = {
        id: '123',
        name: 'Shopware 6',
        versions: [
          { id: '1', externalVersion: '6.4.17.1', internalVersion: '4.17.1' },
          { id: '2', externalVersion: '6.4.17.2', internalVersion: '4.17.2' },
          { id: '3', externalVersion: '6.4.18.0', internalVersion: '4.18.0' },
          { id: '4', externalVersion: '6.5.0.0', internalVersion: '5.0.0' },
          { id: '5', externalVersion: '6.5.1.0', internalVersion: '5.1.0' },
        ]
      };
      
      const result = filterAppDataForLLM(app);
      expect(result.versions).toHaveLength(1); // Only latest
      expect(result.versions[0].externalVersion).toBe('6.5.1.0');
    });

    it('should handle apps with no versions', () => {
      const app = {
        id: '123',
        name: 'Empty App',
        versions: []
      };
      
      const result = filterAppDataForLLM(app);
      expect(result.versions).toEqual([]);
    });
  });

  describe('Real-world scenarios', () => {
    it('should correctly filter Contao versions', () => {
      const versions = [
        { id: '1', externalVersion: '4.13.13', internalVersion: '4.13.13' },
        { id: '2', externalVersion: '4.13.14', internalVersion: '4.13.14' },
        { id: '3', externalVersion: '4.13.54', internalVersion: '4.13.54' },
        { id: '4', externalVersion: '5.1.10', internalVersion: '5.1.10' },
        { id: '5', externalVersion: '5.5.11', internalVersion: '5.5.11' },
      ];
      
      const result = filterLatestVersionsPerMajor(versions);
      expect(result).toHaveLength(2);
      expect(result.map(v => v.externalVersion)).toContain('5.5.11');
      expect(result.map(v => v.externalVersion)).toContain('4.13.54');
    });

    it('should correctly filter TYPO3 versions', () => {
      const versions = [
        { id: '1', externalVersion: '11.5.19', internalVersion: '11.5.19' },
        { id: '2', externalVersion: '11.5.41', internalVersion: '11.5.41' },
        { id: '3', externalVersion: '12.4.0', internalVersion: '12.4.0' },
        { id: '4', externalVersion: '12.4.33', internalVersion: '12.4.33' },
        { id: '5', externalVersion: '13.3.1', internalVersion: '13.3.1' },
        { id: '6', externalVersion: '13.4.14', internalVersion: '13.4.14' },
      ];
      
      const result = filterLatestVersionsPerMajor(versions);
      expect(result).toHaveLength(3);
      expect(result[0].externalVersion).toBe('13.4.14');
      expect(result[1].externalVersion).toBe('12.4.33');
      expect(result[2].externalVersion).toBe('11.5.41');
    });
  });
});