/**
 * Prompts for the Triage Agent's Gemini calls
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Load prompt rules from the prompts directory
 */
export function loadPromptRules(repoRoot: string): string {
    const promptsDir = join(repoRoot, 'prompts');

    const files = [
        'master_prompt.md',
        'hadith.md',
        'fatawa.md',
        'fiqh.md',
        'tafsir.md',
        'encyclopedia_mixed.md',
        'jarh_wa_tadil.md',
        'usul_al_fiqh.md',
    ];

    const rules: string[] = [];
    for (const file of files) {
        try {
            const content = readFileSync(join(promptsDir, file), 'utf-8');
            rules.push(`## ${file}\n${content}`);
        } catch {
            // File doesn't exist, skip
        }
    }

    return rules.join('\n\n---\n\n');
}

/**
 * System prompt explaining the triage agent's role
 */
export const SYSTEM_PROMPT = `You are an expert AI triage agent for a prompt refinement system.
Your job is to analyze LLM translation outputs and identify rule violations.

The system translates Classical Islamic texts (Arabic to English) using strict rules.
When an LLM produces incorrect output, users file refinement requests.
You must parse their submission and identify which rules were violated.

Be thorough but precise. Only flag violations you can clearly identify with evidence.`;

/**
 * Prompt for parsing the combined dump file into sections
 */
export const PARSE_DUMP_PROMPT = `Parse this combined dump file into its component sections.
The file typically contains:
1. PROMPT STACK - The master prompt + addon prompt text
2. INPUT - Arabic text segments (with IDs like P1234)
3. OUTPUT - The model's English translation
4. REASONING - The model's thinking/reasoning trace (may be absent)

Look for section markers like "---", "===", headers, or natural breaks.
If sections aren't clearly marked, infer them from content:
- Arabic script = Input
- English translation with segment IDs = Output
- Instructions about translation = Prompt Stack
- "Thinking", "Reasoning", analysis text = Reasoning

Return a JSON object with these fields:
- promptStack: string
- inputArabic: string
- output: string
- reasoningTrace: string

If a section can't be identified, return an empty string for it.

COMBINED DUMP:
{dumpContent}`;

/**
 * Prompt for analyzing output and detecting violations
 */
export const ANALYZE_PROMPT = `Analyze this LLM translation output for rule violations.

## USER HINTS (prioritize these)
{hints}

## TRANSLATION RULES
{rules}

## INPUT (Arabic)
{input}

## OUTPUT (Model's translation)
{output}

## REASONING TRACE
{reasoning}

Identify ALL rule violations. For each:
1. ruleId: Use one of these exact IDs:
   - Core: NO_SANITIZATION, NO_META_TALK, NO_MARKDOWN, NO_EMENDATION, NO_INFERENCE, NO_RESTRUCTURING, NO_INVENTED_SEGMENTS, NO_ARABIC_SCRIPT
   - Transliteration: ALA_LC_SCHEME, DIACRITIC_FALLBACK, STANDARDIZED_TERMS, IBN_CONNECTOR, PROPER_NAMES
   - Structure: SEGMENT_ID_FORMAT, MULTI_LINE_SEGMENTS, QA_STRUCTURE, OUTPUT_COMPLETENESS, OUTPUT_UNIQUENESS
   - Technical Terms: DEFINITION_RULE, OPAQUE_TRANSLITERATION, PARENTHESES_GOVERNANCE, WORD_CHOICE_ALLAH, MODERN_REGISTER
   - Genre: ISNAD_VERBS, JARH_TADIL_TERMS, FIQH_TERMS, USUL_TERMS, AYAH_CITATION, ATTRIBUTE_THEOLOGY, HONORIFICS, KHILAF_ATTRIBUTION, MODE_RESET, SUNNAH_AMBIGUITY

2. severity: "high", "medium", or "low"
   - high: Core violations (Arabic leak, invented segments, sanitization)
   - medium: Transliteration/structure issues
   - low: Minor term format issues

3. evidence: Quote the exact problematic text (max 100 chars)

4. segmentId: If in a specific segment (e.g., "P1234")

Also determine which FAILURE TYPE labels apply:
- arabic_leak, formatting_drift, safety_sanitization, ids_alignment
- translit_boundary, glossary_conflict, mode_locking
- term_format_drift, citation_hallucination, diacritics_drop

Return JSON:
{
  "violations": [
    { "ruleId": "...", "severity": "...", "evidence": "...", "segmentId": "..." }
  ],
  "failureTypes": ["arabic_leak", ...]
}`;

/**
 * Prompt for generating the summary comment
 */
export const SUMMARY_PROMPT = `Generate a helpful summary comment for this GitHub issue.

The issue is a prompt refinement case where an LLM produced incorrect translation output.

## Detected Violations
{violations}

## Failure Types
{failureTypes}

Write a concise, professional comment (max 500 chars) that:
1. Summarizes what was found
2. Lists the main issues
3. Notes the labels that were applied

Use markdown formatting. Be helpful but brief.`;
