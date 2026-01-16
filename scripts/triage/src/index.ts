/**
 * Triage Agent Entry Point
 *
 * Usage: bun run src/index.ts <issue_number>
 *
 * Environment:
 * - GOOGLE_API_KEY: Required (can be in root .env file)
 * - GITHUB_TOKEN: Optional (auto-detected from gh CLI if not set)
 */

import { writeFileSync } from 'node:fs';
import { Octokit } from '@octokit/rest';
import rootPkg from '../../../package.json';
import { createTriageGraph, type TriageStateType } from './graph.js';
import { getModelFromEnv } from './models.js';
import { buildTriageResult, parseGitHubUrl } from './utils.js';

// Validate package.json has required fields at module load time
const repoInfo = parseGitHubUrl(rootPkg.repository?.url || rootPkg.homepage || '');
if (!repoInfo && !process.env.GITHUB_REPOSITORY) {
    console.error('Error: Could not parse owner/repo from package.json and GITHUB_REPOSITORY not set');
    process.exit(1);
}

// Note: Bun auto-loads .env from cwd. If running from scripts/triage/,
// create a .env there or set env vars before running.

interface Config {
    issueNumber: number;
    owner: string;
    repo: string;
    githubToken: string;
}

/**
 * Try to get GITHUB_TOKEN from gh CLI if not set in environment
 */
function getGitHubToken(): string | null {
    // First check environment (CI will have this set)
    if (process.env.GITHUB_TOKEN) {
        return process.env.GITHUB_TOKEN;
    }

    // Try to get from gh CLI for local development
    try {
        const result = Bun.spawnSync(['gh', 'auth', 'token']);
        if (result.exitCode === 0) {
            const token = result.stdout.toString().trim();
            if (token) {
                console.log('🔑 Using GITHUB_TOKEN from gh CLI');
                return token;
            }
        }
    } catch {
        // gh CLI not available or not logged in
    }

    return null;
}

function getConfig(): Config {
    const issueNumber = Number.parseInt(process.argv[2], 10);
    if (Number.isNaN(issueNumber)) {
        console.error('Usage: bun run src/index.ts <issue_number>');
        process.exit(1);
    }

    const githubToken = getGitHubToken();
    if (!githubToken) {
        console.error('Error: GITHUB_TOKEN not set and gh CLI not available');
        console.error('Either set GITHUB_TOKEN env var or login with: gh auth login');
        process.exit(1);
    }

    if (!process.env.GOOGLE_API_KEY) {
        console.error('Error: GOOGLE_API_KEY environment variable is required');
        process.exit(1);
    }

    process.env.REPO_ROOT = process.env.GITHUB_WORKSPACE || process.cwd();

    // Get owner/repo from environment or package.json
    let owner: string;
    let repo: string;

    if (process.env.GITHUB_REPOSITORY) {
        // CI: GITHUB_REPOSITORY is "owner/repo"
        [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
    } else if (repoInfo) {
        // Local: use pre-parsed package.json info
        owner = repoInfo.owner;
        repo = repoInfo.repo;
    } else {
        console.error('Error: Could not determine repository owner/name');
        process.exit(1);
    }

    return {
        githubToken,
        issueNumber,
        owner,
        repo,
    };
}

async function main(): Promise<void> {
    const config = getConfig();
    const { issueNumber, owner, repo, githubToken } = config;

    console.log(`🔍 Triaging issue #${issueNumber} in ${owner}/${repo}...`);

    const octokit = new Octokit({ auth: githubToken });

    const { data: issue } = await octokit.issues.get({
        issue_number: issueNumber,
        owner,
        repo,
    });

    console.log(`📋 Issue: ${issue.title}`);

    const hintsMatch = issue.body?.match(/### Hints.*?\n\n([\s\S]*?)(?=\n###|$)/i);
    const hints = hintsMatch?.[1]?.trim() ?? '';

    const graph = createTriageGraph();
    const initialState: Partial<TriageStateType> = {
        hints,
        issueBody: issue.body ?? '',
        issueNumber,
        issueTitle: issue.title,
    };

    console.log('🤖 Running AI triage...');
    const result = await graph.invoke(initialState);

    console.log(`✅ Found ${result.violations.length} violation(s)`);
    console.log(`🏷️  Labels to apply: ${result.labelsToApply.join(', ')}`);

    const existingLabels = issue.labels.map((l) => (typeof l === 'string' ? l : (l.name ?? '')));
    const labelsToAdd = result.labelsToApply.filter((l) => !existingLabels.includes(l));

    if (labelsToAdd.length > 0) {
        await octokit.issues.addLabels({ issue_number: issueNumber, labels: labelsToAdd, owner, repo });
        console.log(`✅ Applied labels: ${labelsToAdd.join(', ')}`);
    }

    if (existingLabels.includes('triage')) {
        await octokit.issues.removeLabel({ issue_number: issueNumber, name: 'triage', owner, repo }).catch(() => {});
    }

    const modelConfig = getModelFromEnv();
    const analysisModel = `${modelConfig.provider}/${modelConfig.model}`;
    const triageResult = buildTriageResult(config, issue, result, existingLabels, labelsToAdd, analysisModel);
    const outputPath = `triage-issue-${issueNumber}.json`;
    writeFileSync(outputPath, JSON.stringify(triageResult, null, 2));
    console.log(`📄 Wrote triage result to ${outputPath}`);

    // Note: Comment posting is handled by the workflow after artifact upload
    // so the comment can include the direct artifact download URL

    console.log('✨ Triage complete!');

    // Explicitly exit to prevent any lingering connections
    process.exit(0);
}

if (import.meta.main) {
    main().catch((error) => {
        console.error('❌ Triage failed:', error);
        process.exit(1);
    });
}
