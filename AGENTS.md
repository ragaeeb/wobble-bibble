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

## Lessons Learned (for future Agents)
1.  **Do Not Sanitize**: Prompt engineering here fights against the RLHF "Safety" training of models. Always uphold the "Safety Override" clauses in the prompts when refining them.
2.  **Transliteration is a Minefield**: The biggest struggle point is deciding what to transliterate and how. Keep the rules consistent with `prompts/final/master_prompt.md` and avoid ad-hoc exceptions in modules.
3.  **Token Efficiency Matters**: Avoid adding markdown-like formatting, long examples, or metadata that users will paste into web prompts. Keep prompt templates short and plain.
4.  **“Inheritance” is not automatic**: LLMs cannot read referenced files in a web UI. Users must paste `master_prompt.md` + one add-on in the same chat input.

## Revision Protocol
Always follow the **3-Pass Rule** defined in the master prompt:
1. Alignment (IDs/Order)
2. Accuracy (Context/Terms)
3. Compliance (No Arabic/Translit)
