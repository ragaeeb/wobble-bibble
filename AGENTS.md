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
If you are asked to generate a translation or refine a prompt, use these as your base:
- **`prompts/final/master_prompt.md`**: The universal grounding prompt.
- **`prompts/final/`**: specialized variants for Fiqh, Hadith, Tafsir, etc.

### 3. Standards
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

## AI Peer Review & Synthesis
To ensure the robustness of these prompts, we periodically run a "Peer Review" cycle where other high-intelligence agents (Claude 4.5, GPT-5, Gemini 3, Grok 4) stress-test the templates.

### 1. Generating Review Context
We use `code2prompt` to bundle the entire project logic and instructions for the reviewing agents.
**Command:**
```bash
code2prompt --path . --output PEER_REVIEW_CONTEXT.txt
```
*Note: Ensure `.gitignore` excludes `PEER_REVIEW_CONTEXT.txt` to avoid repository bloat.*

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
