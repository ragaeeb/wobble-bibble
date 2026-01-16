/**
 * Implementation Agent Steps
 */
import { mockGitProvider, realFileSystem, type FileSystem, type GitProvider } from './data.js';
import type { ImplementationState } from './types.js';

export async function applyChanges(
    state: ImplementationState,
    fs: FileSystem = realFileSystem,
    git: GitProvider = mockGitProvider
): Promise<Partial<ImplementationState>> {
    const { diffs, pullRequestDescription } = state;
    const appliedChanges: string[] = [];

    // 1. Create Branch
    const branchName = `fix/prompt-refinement-${Date.now()}`;
    await git.createBranch(branchName);
    await git.checkout(branchName);

    // 2. Apply Changes
    for (const diff of diffs) {
        try {
            // In a real scenario, we might use the 'diff' to patch, 
            // but here we have the full modified content from Engineer
            if (diff.modifiedContent) {
                await fs.writeFile(diff.file, diff.modifiedContent);
                appliedChanges.push(diff.file);
            }
        } catch (e) {
            console.error(`Failed to write file ${diff.file}`, e);
            return {
                status: 'FAILED',
                error: `Failed to write file ${diff.file}: ${e}`
            };
        }
    }

    // 3. Commit and Push
    if (appliedChanges.length > 0) {
        await git.commit("Apply prompt refinements");
        await git.push(branchName);
        
        // 4. Create PR
        const pr = await git.createPullRequest(
            "Prompt Refinement",
            pullRequestDescription,
            branchName
        );
        
        return {
            status: 'SUCCESS',
            appliedChanges,
            prUrl: pr.url
        };
    }

    return {
        status: 'SUCCESS',
        appliedChanges: [],
        error: 'No changes to apply'
    };
}
