import { describe, expect, it } from 'bun:test';
import { extractThinkingTime, parseGitHubUrl } from './utils.js';

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

        it('should extract minutes only', () => {
            const trace = 'Wait... Thinking...\nThought for 2m\nDone';
            expect(extractThinkingTime(trace)).toBe(120);
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
});
