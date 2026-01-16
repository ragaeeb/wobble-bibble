/**
 * Data Access Layer for Synthesis Agent
 */

export async function fetchTriageData(issueId: number): Promise<any> {
    try {
        const fs = await import('fs/promises');
        const path = `../../agents/triage/triage-issue-${issueId}.json`;
        const content = await fs.readFile(path, 'utf-8');
        return JSON.parse(content);
    } catch {
        // Return dummy data for testing flow if file missing
        return {
            title: `Issue ${issueId}`,
            analysis: {
                violationScore: 0.8,
                detectedViolations: [
                    { type: 'formatting', description: 'Arabic text leaking into English translation' }
                ]
            }
        };
    }
}
