import { describe, expect, it } from 'bun:test';
import { buildComment, extractThinkingTime, parseGitHubUrl } from './utils.js';

describe('utils', () => {
    describe('parseGitHubUrl', () => {
        it('should parse standard https repository URLs', () => {
            const url = 'https://github.com/ragaeeb/wobble-bibble';
            const result = parseGitHubUrl(url);
            expect(result).toEqual({ owner: 'ragaeeb', repo: 'wobble-bibble' });
        });

        it('should parse git+https repository URLs', () => {
            const url = 'git+https://github.com/ragaeeb/wobble-bibble.git';
            const result = parseGitHubUrl(url);
            expect(result).toEqual({ owner: 'ragaeeb', repo: 'wobble-bibble' });
        });

        it('should return null for non-GitHub URLs', () => {
            const url = 'https://gitlab.com/owner/repo';
            const result = parseGitHubUrl(url);
            expect(result).toBeNull();
        });
    });

    describe('extractThinkingTime', () => {
        it('should extract seconds only', () => {
            const trace = 'Some reasoning...\nThought for 34s\nDone';
            expect(extractThinkingTime(trace)).toBe(34);
        });

        it('should extract minutes and seconds', () => {
            const trace = 'Wait... Thinking...\nThought for 2m 15s\nDone';
            expect(extractThinkingTime(trace)).toBe(135);
        });

        it('should handle case insensitivity', () => {
            const trace = 'thought for 10s';
            expect(extractThinkingTime(trace)).toBe(10);
        });

        it('should return null if no thinking time found', () => {
            const trace = 'No thinking trace here.';
            expect(extractThinkingTime(trace)).toBeNull();
        });
    });

    describe('buildComment', () => {
        it('should include artifact URL when GITHUB_RUN_ID is set', () => {
            const originalRunId = process.env.GITHUB_RUN_ID;
            process.env.GITHUB_RUN_ID = '12345';
            try {
                const comment = buildComment('Summary here', 'owner', 'repo');
                const expected =
                    'Summary here\n\n---\n📦 **Triage Artifact**: [View workflow run](https://github.com/owner/repo/actions/runs/12345) (JSON artifact available for 90 days)';
                expect(comment).toEqual(expected);
            } finally {
                process.env.GITHUB_RUN_ID = originalRunId;
            }
        });

        it('should include fallback message when GITHUB_RUN_ID is not set', () => {
            const originalRunId = process.env.GITHUB_RUN_ID;
            delete process.env.GITHUB_RUN_ID;
            try {
                const comment = buildComment('Summary here', 'owner', 'repo');
                const expected =
                    'Summary here\n\n---\n📦 **Triage Artifact**: [View workflow run]((artifact URL will be available after workflow completes)) (JSON artifact available for 90 days)';
                expect(comment).toEqual(expected);
            } finally {
                process.env.GITHUB_RUN_ID = originalRunId;
            }
        });
    });
});
