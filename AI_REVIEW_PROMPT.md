## Context
You are reviewing the **Wobble-Bibble Islamic Translation Prompt Lab**. This project focuses on high-fidelity Arabic-to-English translation of classical and contemporary Islamic scholarly texts (Hadith, Fiqh, Tafsir, etc.).

The core challenge is that standard LLM behaviors (RLHF safety filters, "helpful" emendations, and inconsistent transliteration) often degrade the academic and historical utility of these translations.

## Objectives
We have developed a **Stacked Prompt System** consisting of a `master_prompt.md` (logic layer) and several specialized add-ons (genre layer). We have also defined a rigorous **Refinement Protocol (SOP)** to treat prompt engineering as iterative research based on model reasoning logs.

### Your Goal
Perform a critical peer review of the attached codebase/prompts. Focus on:
1.  **Instruction Collisions**: Are there rules in the `master` that might contradict specialized add-ons?
2.  **Safety Override Integrity**: Are the instructions for "Safety Overrides" (maintaining polemical/harsh tone) robust enough to fight against model sanitization?
3.  **The "Blobbing" Test**: Does the system effectively prevent "bare transliteration" of common nouns (e.g., mihrab, jihad) while allowing translit-only for proper names?
4.  **Structural Integrity**: Are the Q&A triggers robust enough to prevent paragraph merging/collapse during complex dialogues?
5.  **Arabic Leakage Guard**: Assess the conditional logic for Proper vs. Common noun leakage.
6.  **Meta-Talk Risk**: Identify if "Mode" or "Status" terminology in instructions might cause the AI to narrate its internal process.
7.  **Token Efficiency**: Identify "prompt bloat" and ensure rules are concise but strictly actionable.
8.  **Refinement SOP**: Is the `REFINEMENT_GUIDE.md` practical for an AI agent? Are the labels sufficient for capturing current failure shapes?

## Constraints
- **Minimalism**: We prioritize plain text and token-lean instructions.
- **Fidelity**: Literalism and structural preservation (IDs, Isnads) are paramount over English-only fluency.

---

### Attachment Information
Peer review is done per “round”. You will usually be given a small, token-lean packet rather than the entire repo.

Common attachments (round-based):
- `bug_reports/<round>/prompt.txt`: copy/paste instruction prompt (plain text)
- `bug_reports/<round>/02_peer_review_packet.md`: context + proposal + questions (often includes BEFORE/AFTER for large changes)
- `bug_reports/<round>/examples_consolidated.txt`: small evidence bundle distilled from many reports
- The specific `prompts/*.md` files being changed (and sometimes the current baseline versions for comparison)

---

### Analysis Tasks
1.  **Score the proposal (1-10)** on logic consistency and academic rigor.
2.  **Find instruction collisions / loopholes** introduced by the proposed change (master vs add-on, exceptions vs bans).
3.  **Regression risk assessment**: list the top 3–5 likely regressions and why.
4.  **Token efficiency**: propose safe ways to reduce tokens without weakening “Golden Rules”.
5.  **Negation hardening**: propose 3–5 compact “Do NOT …” rules that close known failure modes.
6.  **Structure robustness**: check that Q&A triggers do not cause invented labels, newline drift, or ID reprinting.
7.  **Blobbing test**: ensure the system prevents bare transliteration of common nouns/objects while allowing translit-only for proper names.
