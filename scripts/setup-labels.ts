/**
 * Label Setup Script
 *
 * Creates all required labels for the AI-powered issue triage system.
 * Run manually: bun run scripts/setup-labels.ts
 *
 * Environment:
 * - GITHUB_TOKEN: Required (auto-detected from gh CLI if not set)
 * - GITHUB_REPOSITORY: Optional (auto-detected from package.json if not set)
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

interface RepoInfo {
    owner: string;
    repo: string;
}

/**
 * Parse owner/repo from a GitHub URL
 * Supports: https://github.com/owner/repo, git+https://github.com/owner/repo.git
 */
function parseGitHubUrl(url: string): RepoInfo | null {
    const match = url.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
    if (match) {
        return { owner: match[1], repo: match[2] };
    }
    return null;
}

/**
 * Get repository info from environment or package.json
 */
function getRepoInfo(): RepoInfo {
    // 1. Check GITHUB_REPOSITORY env var (set in CI: "owner/repo")
    if (process.env.GITHUB_REPOSITORY) {
        const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
        if (owner && repo) {
            return { owner, repo };
        }
    }

    // 2. Check GITHUB_REPOSITORY_OWNER + derive repo from package.json name
    if (process.env.GITHUB_REPOSITORY_OWNER) {
        // Try to get repo name from package.json
        const pkgPath = join(import.meta.dir, '../package.json');
        if (existsSync(pkgPath)) {
            const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
            if (pkg.name) {
                return { owner: process.env.GITHUB_REPOSITORY_OWNER, repo: pkg.name };
            }
        }
    }

    // 3. Parse from package.json repository field or homepage
    const pkgPath = join(import.meta.dir, '../package.json');
    if (existsSync(pkgPath)) {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

        // Try repository.url first
        if (pkg.repository?.url) {
            const info = parseGitHubUrl(pkg.repository.url);
            if (info) {
                return info;
            }
        }

        // Try homepage
        if (pkg.homepage) {
            const info = parseGitHubUrl(pkg.homepage);
            if (info) {
                return info;
            }
        }
    }

    console.error('Error: Could not determine repository owner/name');
    console.error('Set GITHUB_REPOSITORY env var or ensure package.json has repository.url');
    process.exit(1);
}

/**
 * Get GitHub token from environment or gh CLI
 */
function getGitHubToken(): string {
    // Check environment first (CI will have this set)
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

    console.error('Error: GITHUB_TOKEN not set and gh CLI not available');
    console.error('Either set GITHUB_TOKEN env var or login with: gh auth login');
    process.exit(1);
}

interface LabelDefinition {
    name: string;
    color: string;
    description: string;
}

const LABELS: LabelDefinition[] = [
    // System labels
    { color: '7057ff', description: 'Prompt refinement case', name: 'prompt-refinement' },
    { color: 'fbca04', description: 'Awaiting AI triage', name: 'triage' },
    { color: '0e8a16', description: 'AI triage complete', name: 'triaged' },

    // Model labels
    { color: '1d76db', description: 'Model: Gemini 3.0 Pro', name: 'model:gemini-3.0-pro' },
    { color: '1d76db', description: 'Model: GPT-5.2 Thinking', name: 'model:gpt-5.2-thinking' },
    { color: '1d76db', description: 'Model: GPT-5o Thinking Mini', name: 'model:gpt-5o-thinking-mini' },
    { color: '1d76db', description: 'Model: Grok 4 Expert', name: 'model:grok-4-expert' },
    { color: '1d76db', description: 'Model: Grok 4.1 Thinking', name: 'model:grok-4.1-thinking' },

    // Addon labels
    { color: 'c5def5', description: 'Addon: Master prompt only', name: 'addon:master_prompt_only' },
    { color: 'c5def5', description: 'Addon: Hadith', name: 'addon:hadith' },
    { color: 'c5def5', description: 'Addon: Fatawa', name: 'addon:fatawa' },
    { color: 'c5def5', description: 'Addon: Fiqh', name: 'addon:fiqh' },
    { color: 'c5def5', description: 'Addon: Tafsir', name: 'addon:tafsir' },
    { color: 'c5def5', description: 'Addon: Encyclopedia Mixed', name: 'addon:encyclopedia_mixed' },
    { color: 'c5def5', description: 'Addon: Jarh wa Tadil', name: 'addon:jarh_wa_tadil' },
    { color: 'c5def5', description: 'Addon: Usul al-Fiqh', name: 'addon:usul_al_fiqh' },

    // Failure type labels
    { color: 'd73a4a', description: 'Arabic script in output (except ﷺ)', name: 'arabic_leak' },
    { color: 'd73a4a', description: 'Markdown, newline, or structural issues', name: 'formatting_drift' },
    { color: 'd73a4a', description: 'Model softened or added disclaimers', name: 'safety_sanitization' },
    { color: 'd73a4a', description: 'Segment IDs dropped, merged, or invented', name: 'ids_alignment' },
    { color: 'd73a4a', description: 'Wrong transliteration scope', name: 'translit_boundary' },
    { color: 'd73a4a', description: 'Ignored locked anchors', name: 'glossary_conflict' },
    { color: 'd73a4a', description: 'Stuck in one logic mode', name: 'mode_locking' },
    { color: 'd73a4a', description: 'Missing translit (English) format', name: 'term_format_drift' },
    { color: 'd73a4a', description: 'Invented sources', name: 'citation_hallucination' },
    { color: 'd73a4a', description: 'Lazy transliteration', name: 'diacritics_drop' },

    // Core rule labels
    { color: 'f9d0c4', description: 'Rule: No sanitization', name: 'rule:NO_SANITIZATION' },
    { color: 'f9d0c4', description: 'Rule: No meta talk', name: 'rule:NO_META_TALK' },
    { color: 'f9d0c4', description: 'Rule: No markdown', name: 'rule:NO_MARKDOWN' },
    { color: 'f9d0c4', description: 'Rule: No emendation', name: 'rule:NO_EMENDATION' },
    { color: 'f9d0c4', description: 'Rule: No inference', name: 'rule:NO_INFERENCE' },
    { color: 'f9d0c4', description: 'Rule: No restructuring', name: 'rule:NO_RESTRUCTURING' },
    { color: 'f9d0c4', description: 'Rule: No invented segments', name: 'rule:NO_INVENTED_SEGMENTS' },
    { color: 'f9d0c4', description: 'Rule: No Arabic script', name: 'rule:NO_ARABIC_SCRIPT' },

    // Transliteration rule labels
    { color: 'fef2c0', description: 'Rule: ALA-LC diacritics', name: 'rule:ALA_LC_SCHEME' },
    { color: 'fef2c0', description: 'Rule: Diacritic fallback', name: 'rule:DIACRITIC_FALLBACK' },
    { color: 'fef2c0', description: 'Rule: Standardized terms', name: 'rule:STANDARDIZED_TERMS' },
    { color: 'fef2c0', description: 'Rule: b./Ibn connector', name: 'rule:IBN_CONNECTOR' },
    { color: 'fef2c0', description: 'Rule: Proper names', name: 'rule:PROPER_NAMES' },

    // Structure rule labels
    { color: 'd4c5f9', description: 'Rule: Segment ID format', name: 'rule:SEGMENT_ID_FORMAT' },
    { color: 'd4c5f9', description: 'Rule: Multi-line segments', name: 'rule:MULTI_LINE_SEGMENTS' },
    { color: 'd4c5f9', description: 'Rule: Q&A structure', name: 'rule:QA_STRUCTURE' },
    { color: 'd4c5f9', description: 'Rule: Output completeness', name: 'rule:OUTPUT_COMPLETENESS' },
    { color: 'd4c5f9', description: 'Rule: Output uniqueness', name: 'rule:OUTPUT_UNIQUENESS' },

    // Technical term rule labels
    { color: 'bfdadc', description: 'Rule: Definition on first occurrence', name: 'rule:DEFINITION_RULE' },
    { color: 'bfdadc', description: 'Rule: Opaque transliteration', name: 'rule:OPAQUE_TRANSLITERATION' },
    { color: 'bfdadc', description: 'Rule: Parentheses governance', name: 'rule:PARENTHESES_GOVERNANCE' },
    { color: 'bfdadc', description: 'Rule: Allah vs God', name: 'rule:WORD_CHOICE_ALLAH' },
    { color: 'bfdadc', description: 'Rule: Modern register', name: 'rule:MODERN_REGISTER' },

    // Genre-specific rule labels
    { color: 'c2e0c6', description: 'Rule: Isnad verbs', name: 'rule:ISNAD_VERBS' },
    { color: 'c2e0c6', description: 'Rule: Jarh/Tadil terms', name: 'rule:JARH_TADIL_TERMS' },
    { color: 'c2e0c6', description: 'Rule: Fiqh terms', name: 'rule:FIQH_TERMS' },
    { color: 'c2e0c6', description: 'Rule: Usul terms', name: 'rule:USUL_TERMS' },
    { color: 'c2e0c6', description: 'Rule: Ayah citation', name: 'rule:AYAH_CITATION' },
    { color: 'c2e0c6', description: 'Rule: Attribute theology', name: 'rule:ATTRIBUTE_THEOLOGY' },
    { color: 'c2e0c6', description: 'Rule: Honorifics', name: 'rule:HONORIFICS' },
    { color: 'c2e0c6', description: 'Rule: Khilaf attribution', name: 'rule:KHILAF_ATTRIBUTION' },
    { color: 'c2e0c6', description: 'Rule: Mode reset', name: 'rule:MODE_RESET' },
    { color: 'c2e0c6', description: 'Rule: Sunnah ambiguity', name: 'rule:SUNNAH_AMBIGUITY' },
];

async function createLabel(token: string, owner: string, repo: string, label: LabelDefinition): Promise<void> {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/labels`, {
        body: JSON.stringify(label),
        headers: {
            Accept: 'application/vnd.github.v3+json',
            Authorization: `token ${token}`,
            'Content-Type': 'application/json',
        },
        method: 'POST',
    });

    if (response.status === 201) {
        console.log(`✅ Created: ${label.name}`);
    } else if (response.status === 422) {
        // Label already exists, try to update it
        const updateResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/labels/${encodeURIComponent(label.name)}`,
            {
                body: JSON.stringify({ color: label.color, description: label.description }),
                headers: {
                    Accept: 'application/vnd.github.v3+json',
                    Authorization: `token ${token}`,
                    'Content-Type': 'application/json',
                },
                method: 'PATCH',
            },
        );

        if (updateResponse.ok) {
            console.log(`🔄 Updated: ${label.name}`);
        } else {
            console.log(`⚠️  Exists but couldn't update: ${label.name}`);
        }
    } else {
        console.log(`❌ Failed: ${label.name} (${response.status})`);
    }
}

async function main(): Promise<void> {
    const token = getGitHubToken();
    const { owner, repo } = getRepoInfo();

    console.log(`Setting up ${LABELS.length} labels for ${owner}/${repo}...\n`);

    for (const label of LABELS) {
        await createLabel(token, owner, repo, label);
        // Small delay to avoid hitting secondary rate limits
        await new Promise((r) => setTimeout(r, 100));
    }

    console.log('\n✨ Done!');
}

main();
