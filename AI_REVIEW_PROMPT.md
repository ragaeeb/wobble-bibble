## Context
You are reviewing the **Wobble-Bibble Islamic Translation Prompt Lab**. This project focuses on high-fidelity Arabic-to-English translation of classical and contemporary Islamic scholarly texts (Hadith, Fiqh, Tafsir, etc.).

The core challenge is that standard LLM behaviors (RLHF safety filters, "helpful" emendations, and inconsistent transliteration) often degrade the academic and historical utility of these translations.

## Objectives
We have developed a **Stacked Prompt System** consisting of a `master_prompt.md` (logic layer) and several specialized add-ons (genre layer). We have also defined a rigorous **Refinement Protocol (SOP)** to treat prompt engineering as iterative research based on model reasoning logs.

### Your Goal
Perform a critical peer review of the attached codebase/prompts. Focus on:
1.  **Instruction Collisions**: Are there rules in the `master` that might contradict specialized add-ons?
2.  **Safety Override Integrity**: Are the instructions for "Safety Overrides" (maintaining polemical/harsh tone) robust enough to fight against model sanitization?
3.  **Token Efficiency**: Identify any "prompt bloat." Can instructions be more concise without losing strictness?
4.  **Edge Case Coverage**: Identify missing protocols for multi-disciplinary texts (though `encyclopedia_mixed.md` exists, what else?).
5.  **Refinement SOP**: Is the `REFINEMENT_GUIDE.md` practical for an AI agent to follow? Does the metadata capture enough signal for pattern recognition?

## Constraints
- **Minimalism**: We prioritize plain text and token-lean instructions.
- **Fidelity**: Literalism and structural preservation (IDs, Isnads) are paramount over English-only fluency.

---

### Attachment Information
The following file is provided:
- **`PEER_REVIEW_CONTEXT.txt`**: Contains `README.md`, `AGENTS.md`, `REFINEMENT_GUIDE.md`, the `synthesis.md` research report, and all `prompts/final/` templates.

---

### Analysis Tasks
1.  **Score the current system (1-10)** on logic consistency and academic rigor.
2.  **Highlight the top 3 weaknesses** you find.
3.  **Propose 3-5 specific "Negation Rules"** (Do NOT...) that would strengthen the system.
4.  **Review the `encyclopedia_mixed.md` prompt** for its ability to handle sudden genre-switching without "mode-locking."
