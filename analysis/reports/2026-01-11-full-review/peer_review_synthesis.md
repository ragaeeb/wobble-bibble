# AI Peer Review Synthesis Report

**Date:** 2026-01-11
**Source:** 12 AI Agent Reviews (Claude 4.5, GPT-5 series, Gemini 3, Grok 4, etc.)
**Consensus Score:** ~8.5/10 (High consistency, academic rigor)

## 1. Executive Summary
The peer review corps unanimously validated the "Stacked Prompt" architecture as sound and rigorous. However, they identified a cluster of **"Instruction Collisions"** where the `master_prompt.md` and genre add-ons actively fight each other, leading to "Policy Arbitration" (token burn) and erratic behavior.

**Key Insight:** The system relies too much on "soft permissions" (e.g., "translate literally") rather than "hard negations" (e.g., "DO NOT sanitize"). Strengthening these guardrails is the highest ROI fix.

---

## 2. Critical Weaknesses Identified

### A. Instruction Collisions (The "Arbitration Trap")
Models are freezing because rules actively contradict each other:
1.  **Parentheses:** Master says **"Parentheses ONLY for `translit (English)`"**, but Add-ons require `(d. 256 AH)` and `(m)`.
    *   *Result:* Models delete dates or codes to obey Master.
2.  **Transliteration Scope:** Master says **"Any Arabic name = FULL ALA-LC"**, but Add-ons imply scoping (e.g., Isnad only).
    *   *Result:* Transliteration creeps into book titles and common nouns.
3.  **Tafsir Formatting:** Master says **"No extra fields,"** but Tafsir requires `[2:255]`.
    *   *Result:* Models hesitate to add citations or "hallucinate" them when missing.

### B. Safety Override "Softness"
Current prompts say "translate literally," but do not explicitly **override** RLHF safety training.
*   **Failure Mode:** Models sanitize "Rāfiḍah" to "rejectors" or add "As an AI..." disclaimers because the prompt doesn't explicitly forbid these behaviors.
*   **Consensus:** We need "Negative Constraints" (DO NOT soften, DO NOT apologize).

### C. Mixed-Genre "Mode-Locking"
`encyclopedia_mixed.md` is too vague with "apply locally."
*   **Failure Mode:** Models see an isnad at the start of a paragraph and apply "Hadith Mode" to the subsequent Fiqh ruling (over-transliterating terms).
*   **Missing:** Explicit **Priority Order** (Isnad > Jarh > Fiqh) and **Genre Triggers** (Verbs = Isnad; Terms = Fiqh).

---

## 3. Action Plan (The "Fix List")

### Phase 1: Harden the Master Prompt (`master_prompt.md`)
1.  **Inject "Critical Negations" Block:**
    *   `DO NOT` sanitize/soften polemics.
    *   `DO NOT` output meta-commentary/apologies.
    *   `DO NOT` fix typos/errors (Anti-Repair).
2.  **Resolve Parentheses Conflict:**
    *   Allow parentheses for: (a) `translit (English)`, (b) dates/codes if specified by add-on.
3.  **Resolve Transliteration Scope:**
    *   Explicitly state: "If add-on defines a narrower scope, Add-on wins."

### Phase 2: Upgrade Mixed-Genre Handling (`encyclopedia_mixed.md`)
1.  **Add Priority Matrix:**
    *   1. Isnad (Hadith Rules)
    *   2. Jarh Phrase (Jarh Rules)
    *   3. Fiqh Term (Fiqh Rules)
2.  **Add Triggers:**
    *   Identify "Transmission Verbs" as Isnad triggers.
    *   Identify "Ruling Terms" as Fiqh triggers.
3.  **Reinforce Safety:**
    *   Explicitly mentioning "Polemic Mode" = Literal.

### Phase 3: Token Efficiency & SOP
1.  **Consolidate Verb Maps:** Move common Isnad verbs to Master? (Consensus mixed, but simpler to keep modular if Master is generic. Will keep modular for now, but remove redundancy).
2.  **Update SOP:** Add `prompt_hash` and `collision_note` fields to `REFINEMENT_GUIDE.md`.

---

## 4. Implementation Checklist

- [ ] **Master Prompt:** Add "CRITICAL NEGATIONS" block.
- [ ] **Master Prompt:** Fix Parentheses and Transliteration rules.
- [ ] **Mixed Prompt:** Add Priority Matrix and Triggers.
- [ ] **SOP:** Update template fields.
