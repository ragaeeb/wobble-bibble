/**
 * Triage Agent Entry Point
 *
 * Usage: bun run src/index.ts <issue_number>
 *
 * Environment:
 * - GOOGLE_API_KEY: Required (can be in root .env file)
 * - GITHUB_TOKEN: Optional (auto-detected from gh CLI if not set)
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Octokit } from '@octokit/rest';
import { createTriageGraph, type TriageStateType } from './graph.js';
import type { TriageResult } from './types.js';

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
    } else {
        // Local: parse from package.json
        const pkgPath = join(import.meta.dir, '../../../../package.json');
        if (existsSync(pkgPath)) {
            const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
            const repoUrl = pkg.repository?.url || pkg.homepage || '';
            const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
            if (match) {
                owner = match[1];
                repo = match[2];
            } else {
                console.error('Error: Could not parse owner/repo from package.json');
                process.exit(1);
            }
        } else {
            console.error('Error: package.json not found and GITHUB_REPOSITORY not set');
            process.exit(1);
        }
    }

    return {
        githubToken,
        issueNumber,
        owner,
        repo,
    };
}

function buildTriageResult(
    config: Config,
    issue: { html_url: string },
    result: TriageStateType,
    existingLabels: string[],
    labelsToAdd: string[],
): TriageResult {
    const modelLabel = existingLabels.find((l) => l.startsWith('model:'));
    const addonLabel = existingLabels.find((l) => l.startsWith('addon:'));

    return {
        attachmentUrl: result.attachmentUrl,
        createdAt: new Date().toISOString(),
        detectedViolations: result.violations,
        issueNumber: config.issueNumber,
        issueUrl: issue.html_url,
        labelsApplied: [...existingLabels, ...labelsToAdd],
        metadata: {
            model: modelLabel?.replace('model:', '') ?? null,
            promptAddon: addonLabel?.replace('addon:', '') ?? null,
        },
        parsedContent: {
            inputArabic: result.parsedDump?.inputArabic ?? '',
            inputCharCount: result.parsedDump?.inputArabic.length ?? 0,
            output: result.parsedDump?.output ?? '',
            outputCharCount: result.parsedDump?.output.length ?? 0,
            promptStack: result.parsedDump?.promptStack ?? '',
            reasoningCharCount: result.parsedDump?.reasoningTrace.length ?? 0,
            reasoningTrace: result.parsedDump?.reasoningTrace ?? '',
        },
    };
}

function buildComment(summaryComment: string, owner: string, repo: string): string {
    const runId = process.env.GITHUB_RUN_ID;
    const artifactUrl = runId
        ? `https://github.com/${owner}/${repo}/actions/runs/${runId}`
        : '(artifact URL will be available after workflow completes)';

    return `${summaryComment}

---
📦 **Triage Artifact**: [View workflow run](${artifactUrl}) (JSON artifact available for 90 days)`;
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

    const triageResult = buildTriageResult(config, issue, result, existingLabels, labelsToAdd);
    const outputPath = `triage-issue-${issueNumber}.json`;
    writeFileSync(outputPath, JSON.stringify(triageResult, null, 2));
    console.log(`📄 Wrote triage result to ${outputPath}`);

    // Note: Comment posting is handled by the workflow after artifact upload
    // so the comment can include the direct artifact download URL

    console.log('✨ Triage complete!');

    // Explicitly exit to prevent any lingering connections
    process.exit(0);
}

main().catch((error) => {
    console.error('❌ Triage failed:', error);
    process.exit(1);
});
