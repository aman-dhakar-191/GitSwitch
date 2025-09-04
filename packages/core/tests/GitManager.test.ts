import { GitManager } from '../src/GitManager';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

describe('GitManager', () => {
  let gitManager: GitManager;
  let testRepoPath: string;

  beforeAll(() => {
    gitManager = new GitManager();
    // Use the current GitSwitch repo for testing
    testRepoPath = path.resolve(__dirname, '../../..');
  });

  describe('isGitRepository', () => {
    it('should return true for a git repository', () => {
      const result = gitManager.isGitRepository(testRepoPath);
      expect(result).toBe(true);
    });

    it('should return false for a non-git directory', () => {
      const tempDir = os.tmpdir();
      const result = gitManager.isGitRepository(tempDir);
      expect(result).toBe(false);
    });
  });

  describe('getRepositoryRoot', () => {
    it('should return the repository root path', () => {
      const result = gitManager.getRepositoryRoot(testRepoPath);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should return null for non-git directory', () => {
      const tempDir = os.tmpdir();
      const result = gitManager.getRepositoryRoot(tempDir);
      expect(result).toBeNull();
    });
  });

  describe('getCurrentConfig', () => {
    it('should return git config if available', () => {
      const result = gitManager.getCurrentConfig(testRepoPath);
      
      if (result) {
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('email');
        expect(typeof result.name).toBe('string');
        expect(typeof result.email).toBe('string');
      }
      // If no config is set, result should be null
    });
  });

  describe('getRemoteUrl', () => {
    it('should return remote URL if available', () => {
      const result = gitManager.getRemoteUrl(testRepoPath);
      
      if (result) {
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      }
      // If no remote is set, result should be null
    });
  });
});