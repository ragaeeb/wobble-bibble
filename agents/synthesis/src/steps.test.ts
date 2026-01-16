import { describe, expect, it, mock, spyOn } from 'bun:test';
import { summarizeIssue, clusterPatterns } from './steps.js';
import * as DataModule from './data.js';

// Mock fetchTriageData
spyOn(DataModule, 'fetchTriageData').mockImplementation(async (id) => ({
    title: `Issue ${id}`,
    analysis: {
        violationScore: 0.9,
        detectedViolations: [
            { type: id % 2 === 0 ? 'arabic_leak' : 'formatting', description: 'Test violation' }
        ]
    }
}));

describe('Synthesis Steps', () => {
    describe('summarizeIssue', () => {
        it('should summarize an issue correctly', async () => {
            // Mock LLM
            const mockModel = {
                invoke: mock(async () => ({
                    content: JSON.stringify({
                        title: 'Issue 1',
                        violationType: 'formatting',
                        brief: 'Formatting error detected in translation.'
                    })
                }))
            };

            const summary = await summarizeIssue(1, mockModel);
            
            expect(summary.issueId).toBe(1);
            expect(summary.title).toBe('Issue 1');
            expect(summary.violationType).toBe('formatting');
            expect(summary.brief).toBe('Formatting error detected in translation.');
        });

        it('should handle LLM JSON parsing failure gracefully', async () => {
             const mockModel = {
                invoke: mock(async () => ({
                    content: 'Invalid JSON'
                }))
            };

            const summary = await summarizeIssue(2, mockModel);
            expect(summary.violationType).toBe('unknown');
            expect(summary.brief).toContain('Failed');
        });

        it('should strip markdown code blocks from LLM output', async () => {
            const mockModel = {
                invoke: mock(async () => ({
                    content: '```json\n{"title":"Issue 3","violationType":"leak","brief":"Arabic leak."}\n```'
                }))
            };

            const summary = await summarizeIssue(3, mockModel);
            expect(summary.violationType).toBe('leak');
        });
    });

    describe('clusterPatterns', () => {
        it('should cluster summaries by violation type', async () => {
            const state: any = {
                summaries: [
                    { issueId: 1, violationType: 'leak', title: 'A', brief: 'A' },
                    { issueId: 2, violationType: 'leak', title: 'B', brief: 'B' },
                    { issueId: 3, violationType: 'format', title: 'C', brief: 'C' }
                ]
            };

            const result = await clusterPatterns(state);
            const clusters = result.clusters!;

            expect(clusters).toHaveLength(2);
            
            // Check leak cluster
            const leakCluster = clusters.find(c => c.pattern.includes('leak'));
            expect(leakCluster).toBeDefined();
            expect(leakCluster?.issueIds).toHaveLength(2);
            expect(leakCluster?.issueIds).toContain(1);
            expect(leakCluster?.issueIds).toContain(2);

            // Check format cluster
            const formatCluster = clusters.find(c => c.pattern.includes('format'));
            expect(formatCluster).toBeDefined();
            expect(formatCluster?.issueIds).toHaveLength(1);
        });

        it('should handle empty summaries', async () => {
            const result = await clusterPatterns({ summaries: [] } as any);
            expect(result.clusters).toEqual([]);
        });
    });
});
