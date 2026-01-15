import { describe, expect, it } from 'bun:test';
import { ATTACHMENT_URL_REGEX } from './graph.js';

describe('graph', () => {
    describe('ATTACHMENT_URL_REGEX', () => {
        it('should match standard user attachment URLs', () => {
            const url = 'https://github.com/user-attachments/files/24652510/5.2-arabic-hallucinated-id.txt';
            const matches = url.match(ATTACHMENT_URL_REGEX);
            expect(matches).not.toBeNull();
            expect(matches?.[0]).toBe(url);
        });

        it('should match multiple URLs in text', () => {
            const body =
                'Check these out:\n' +
                'https://github.com/user-attachments/files/1/a.txt and ' +
                'https://github.com/user-attachments/files/2/b.txt';
            const matches = body.match(ATTACHMENT_URL_REGEX);
            expect(matches).toHaveLength(2);
            expect(matches).toContain('https://github.com/user-attachments/files/1/a.txt');
            expect(matches).toContain('https://github.com/user-attachments/files/2/b.txt');
        });

        it('should not match non-txt attachments', () => {
            const url = 'https://github.com/user-attachments/files/24652510/image.png';
            const matches = url.match(ATTACHMENT_URL_REGEX);
            expect(matches).toBeNull();
        });
    });
});
