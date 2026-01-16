import { describe, expect, it, mock } from 'bun:test';
import { applyChanges } from './steps.js';
import type { FileSystem, GitProvider } from './data.js';

describe('Implementation Steps', () => {
    it('should apply changes and create a PR', async () => {
        const state: any = {
            diffs: [{ file: 'test.md', modifiedContent: 'new content' }],
            pullRequestDescription: 'Fix stuff'
        };

        const mockFS: FileSystem = {
            writeFile: mock(async () => {}),
            readFile: mock(async () => '')
        };

        const mockGit: GitProvider = {
            createBranch: mock(async () => {}),
            checkout: mock(async () => {}),
            commit: mock(async () => {}),
            push: mock(async () => {}),
            createPullRequest: mock(async () => ({ url: 'http://pr/1' }))
        };

        const result = await applyChanges(state, mockFS, mockGit);
        
        expect(result.status).toBe('SUCCESS');
        expect(result.prUrl).toBe('http://pr/1');
        expect(result.appliedChanges).toContain('test.md');
        
        expect(mockFS.writeFile).toHaveBeenCalledWith('test.md', 'new content');
        expect(mockGit.commit).toHaveBeenCalled();
        expect(mockGit.createPullRequest).toHaveBeenCalled();
    });

    it('should handle write errors gracefully', async () => {
        const state: any = {
            diffs: [{ file: 'error.md', modifiedContent: 'fail' }],
            pullRequestDescription: 'Fix stuff'
        };

        const mockFS: FileSystem = {
            writeFile: mock(async () => { throw new Error('Write failed'); }),
            readFile: mock(async () => '')
        };

        const mockGit: GitProvider = {
            createBranch: mock(async () => {}),
            checkout: mock(async () => {}),
            commit: mock(async () => {}),
            push: mock(async () => {}),
            createPullRequest: mock(async () => ({ url: '' }))
        };

        const result = await applyChanges(state, mockFS, mockGit);
        
        expect(result.status).toBe('FAILED');
        expect(result.error).toContain('Write failed');
    });
});
