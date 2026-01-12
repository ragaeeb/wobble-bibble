# AGENTS.md - Information for AI Assistants

This file provides context for AI agents working on this repository to understand the project mission and data structure.

## Mission
The mission of this repository is to solve the "Friction Points" in Arabic-to-English translation of Islamic scholarly materials. We use LLM reasoning logs to identify where models "panic" or "dither" and fix those behaviors through rigid, rule-based prompt engineering.

See **[REFINEMENT_GUIDE.md](REFINEMENT_GUIDE.md)** for the SOP on how to analyze model failures and update prompts.

## Directory Map for Agents

### 1. Analysis & Synthesis
If you are asked to understand *why* a certain rule exists, look here:
- **`analysis/synthesis.md`**: Summarizes all known struggles (e.g., Transliteration Boundary confusion, Safety Traps, Theological Absurdity handling).
- **`analysis/reports/*.md`**: Contains granular analysis of specific model families.

### 2. Prompt Templates
If you are asked to generate a translation or refine a prompt, use these as your base.
**Note**: These files are "Zero-Waste" and contain **only** the raw rule blocks (no titles, no usage instructions, no YAML).
- **`prompts/final/master_prompt.md`**: The universal grounding prompt.
- **`prompts/final/`**: specialized variants (add-ons) for Fiqh, Hadith, Tafsir, etc.

### 3. Standards
- **Transliteration definition (Critical)**: Transliteration = Latin letters only (ALA-LC with diacritics). Arabic script is forbidden everywhere in output (including inside parentheses/quotes) except `ﷺ`.
- **Transliteration**: We use **ALA-LC** with diacritics for Arabic-script personal names and place names (and isnad narrator names). If the input already uses Latin/English spellings, keep them as written (do not “upgrade” diacritics), except locked glossary terms may be normalized.
- **Name connectors**: mid-chain بن/ابن -> `b.` (e.g., ʿAbd Allāh b. Yūsuf; Aḥmad b. Taymiyyah). Initial `Ibn` stays `Ibn` (e.g., Ibn Taymiyyah).
- **Honorifics**: Use `ﷺ` for Prophet Muhammad. Do not use Arabic script for others; use English (e.g., "may Allah be pleased with him").
- **Output Format**: Plain text only. No Markdown. Preserve IDs (e.g., `P1234`).
- **Technical term pairs**: Use `translit (English)` for technical terms (parentheses are reserved for this use; avoid other parenthetical commentary).

## Handling Common Issues
- **Safety Overrides**: We prioritize **Fidelity** over "Safety" sanitization for academic purposes. If a model hesitates to translate a polemical term (like Rafidah), the prompts explicitly instruct a literal translation.
- **Inference**: Models are instructed **NOT** to infer missing text in truncated segments.
- **Typos/Scribal Errors**: Do not correct or emend; translate as written (avoid “best-guess” reconstructions).
- **Polymath Works**: For scholars like Albani/Ibn Taymiyyah who switch disciplines, use `prompts/final/encyclopedia_mixed.md` (do not output any mode tags/labels).

## Recent Refinement Lessons (Jan 11 Round 2 Hardening)
1.  **Fidelity vs. Negation**: Models prioritize "fidelity constraint" (quote original logic) over generic "No Arabic" bans.
    *   **Fix**: Explicitly redefine "Transliteration" = "Latin letters only". Explicitly ban Arabic "inside brackets/quotes".
2.  **Gravity Wells**: Common English spellings (`Sheikh`, `Sunnah`, `Hadith`) act as gravity wells, pulling models away from strict ALA-LC.
    *   **Fix**: Use "Locked Glossary Anchors" (Explicitly forbidden vs. required forms) for these specific high-frequency terms.
3.  **Structural Rigidity**: Q&A labels prone to drift (inserting newlines).
    *   **Fix**: Enforce "Label and Text must be on SAME LINE" explicitly.
4.  **Round 2 Drift Anchors**: High-frequency terms drift to plain English spellings or wrong casing.
    *   **Fix**: Lock anchors explicitly (examples): Shaykh (not Sheikh), Muḥammad (not Muhammad), Qurʾān (not Quran), muṣḥaf (not mushaf), Salafīyyah (not Salafism), Ṭāʾifah (not Ta'ifah).
5.  **Sunnah Ambiguity**: `sunnah/Sunnah` meanings collide (corpus/source vs legal status vs generic practice).
    *   **Fix**: Prompts must state the convention explicitly (and disambiguate by context) or models will drift to generic lowercase.
6.  **Prompt Artifacts Cause Leakage**: Backticks and “mode” phrasing inside prompts can leak into output.
    *   **Fix**: Avoid backticks in prompt examples; avoid “switching modes” phrasing (use “apply X rules” and do not output mode talk).

## Recent Refinement Lessons (Jan 11 Hardening)
1.  **Markdown "Leakage"**: Models instructed to use bold output labels (e.g., `**Label:**`) often interpret this as permission to use Markdown elsewhere. **Fix**: Use Plain Text labels (`Label:`) and forbid markdown globally.
2.  **Parentheses "Paradox"**: If Master forbids parentheses but Add-ons imply them (without explicit authorization), models freeze/dither. **Fix**: Explicitly enumerate allowed parentheses formats (dates, codes) in the Master Prompt.
3.  **Mode-Locking in Mixed Texts**: Models get stuck in "Isnad Mode" (Full ALA-LC) if a segment switches to Fiqh without a clear reset. **Fix**: Add "Mode Reset" triggers to return to Narrative base state after a chain ends.

## Recent Refinement Lessons (Al-Albani Cycle)
1.  **Distinguish Proper vs. Common Nouns**:
    *   **Failure**: "Blobbing" (transliterating *miḥrāb* as just *Miḥrāb*).
    *   **Fix**: Explicitly split rules: Proper Names = Translit Only; Common Nouns = Must Define (`translit (English)`).
2.  **Structure Over Mapping**:
    *   **Failure**: Q&A labels buried in paragraphs.
    *   **Fix**: Use "Force NEWLINE" commands for structural triggers (`Al-Sāʾil`, `Qāla`), rather than simple `Term=Translation` maps.
3.  **Sibling Check**:
    *   **Fix**: If you fix a logic bug in `mixed` (e.g., Q&A format), always audit `fatawa.md` for the same bug.

## AI Peer Review & Synthesis
To ensure the robustness of these prompts, we periodically run a "Peer Review" cycle where other high-intelligence agents (Claude 4.5, GPT-5, Gemini 3, Grok 4) stress-test the templates.

### 1. Generating Review Context
We use `code2prompt` to bundle the entire project logic and instructions for the reviewing agents.
**Command:**
```bash
code2prompt -O PEER_REVIEW_CONTEXT.txt -i "README.md" -i "AGENTS.md" -i "REFINEMENT_GUIDE.md" -i "analysis/synthesis*.md" -i "prompts/final/*.md" .
```
*Note: This command excludes the heavy `analysis/reasoning_dumps/` and `reviews/` folders to keep context concise (~10-15k tokens).*

### 2. Synthesis Methodology (The "Agent Stack" Protocol)
If you are asked to synthesize feedback from new reviews, follow this logic:
1.  **Identify Instruction Collisions**: Look for where the `master_prompt.md` rules (global) contradict specialized `add-on` rules (local). Example: Master forbids parentheses, but Hadith needs them for dates.
2.  **Harden via Negations**: Move from "Stay literal" (soft permission) to "DO NOT sanitize or add disclaimers" (hard negation). Negations are more effective at overriding RLHF safety guardrails.
3.  **Tiered Priority**: In mixed-discipline texts, implement a **Priority Matrix** (e.g., Isnad > Jarh > Fiqh) to resolve ambiguous term usage (e.g., "Sahih" meaning different things in different modes).
4.  **Regression Check**: Ensure any fix for one failure mode doesn't break a "Golden Rule" (like dropping Segment IDs).

### 3. Recent Lessons Learned (Post-Review Update)
1.  **Arbitration Trap**: Models "freeze" or dither when rules fight. Always ensure Add-on rules explicitly state they override Master constraints where necessary.
2.  **Safety Override Persistence**: LLMs will revert to safety-compliant "polite" translations at the first sign of ambiguity. The "CRITICAL NEGATIONS" block in the Master prompt must be maintained as a high-priority guardrail.
3.  **Mode-Locking**: In long segments, models may get "locked" into the first detected mode (e.g., Hadith mode). Use "Genre Triggers" (transmission verbs vs. legal ruling terms) to force mid-segment switching.
4.  **Parentheses Governance**: Parentheses are the most common source of formatting failure. Keep their usage extremely restricted and clearly defined (Technical Term vs. Dates vs. Codes).

## Revision Protocol
Always follow the **3-Pass Rule** defined in the master prompt:
1. Alignment (IDs/Order)
2. Accuracy (Context/Terms)
3. Compliance (No Arabic/Translit)
