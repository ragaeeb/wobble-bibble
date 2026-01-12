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
The following file is provided:
- **`PEER_REVIEW_CONTEXT.txt`**: Contains `README.md`, `AGENTS.md`, `REFINEMENT_GUIDE.md`, the synthesis/research reports, and all `prompts/final/` templates.

---

### Analysis Tasks
1.  **Score the current system (1-10)** on logic consistency and academic rigor.
2.  **Highlight the top 3 weaknesses** (e.g., where "blobbing" or "mode-locking" might still occur).
3.  **Propose 3-5 specific "Negation Rules"** (Do NOT...) that would strengthen the system.
4.  **Review the `encyclopedia_mixed.md` prompt** for its ability to handle sudden genre-switching without "meta-talk" or "mode-locking."
5.  **Check for "Backtick/Formatting" noise** that might invite the LLM to use markdown in its output.
