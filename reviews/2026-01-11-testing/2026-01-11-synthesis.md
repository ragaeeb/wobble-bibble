---
original_filename: analysis/reports/2026-01-11-synthesis.md
generated_on: 2026-01-11
model_source: Synthesis (Antigravity)
---

# Jan 11 Peer Review Synthesis: The "Arbitration" Cycle

## Executive Summary
The Jan 11 peer review cycle (Al-Albani Refinement) confirms that strictly "stacking" prompts has exposed a new class of failure: **Arbitration Latency**. Models are not failing to translate; they are failing to decide *which rule wins* when Master and Add-on instructions collide.

**Dominant Failure Mode:** "Instruction Collision" leading to dithering or fallback to safety defaults.

---

## 1. Top 3 Collisions (Analysis)

### A. The "Markdown" Collision (High Severity)
*   **Conflict:** `master_prompt.md` explicitly forbids Markdown ("Plain text only").
*   **Violation:** `encyclopedia_mixed.md` and `fatawa.md` explicitly instruct the use of **bold** labels (`**Questioner:**`).
*   **Result:** Models violate the negative constraint to fulfill the positive formatting instruction, causing "Markdown Leakage" (bolding, headers) in the final output.

### B. The "Parentheses" Paradox (Medium Severity)
*   **Conflict:** `master_prompt.md` restricts parentheses to *only* `translit (English)` pairs. it allows exceptions "if authorized," but the add-ons do not use explicit "authorization" syntax.
*   **Violation:** `jarh_wa_tadil.md` and `hadith.md` require parentheses for dates `(d. 256 AH)` and codes `(m)`.
*   **Result:** Models hesitate to include dates/codes, or strip them to comply with the Master rule, resulting in data loss.

### C. The "Blobbing" Loophole (Medium Severity)
*   **Conflict:** `encyclopedia_mixed.md` distinguishes Proper Names (translit only) from Common Nouns (translit + define).
*   **Loophole:** The definition of "Proper Name" is loose. Models treat polemical groups ("Rafidah") or technical concepts ("Sunnah") as Proper Names to avoid the complexity of defining them.
*   **Result:** "Blobbing" -> Bare transliteration of terms that *should* be defined for the reader.

---

## 2. Structural Weakness: Mode-Locking
In mixed-genre texts (Al-Albani), the "Priority Matrix" is effective but lacks an **Exit Trigger**.
*   **Pattern:** Model sees `ḥaddathanā` -> Enters "Isnad Mode" -> Transliterates everything.
*   **Failure:** Segment switches to Fiqh (ruling), but Model stays in "Isnad Mode" and over-transliterates common nouns.
*   **Fix:** Needs a "Local Application" rule (phrase-by-phrase) and an explicit "Mode Reset" after triggers.

---

## 3. Action Plan: The "Hardening" Phase

### Step 1: Resolve Collisions (Master)
*   **Markdown:** Remove all `**` bolding from Add-ons. Enforce "Plain Text Labels" (`Questioner:`).
*   **Parentheses:** Explicitly enumerate allowed Add-on patterns in the Master (Dates, Codes, Rumuz) so authorization is not ambiguous.

### Step 2: Harden Negations (Master)
Add high-specificity negations to `CRITICAL NEGATIONS`:
1.  **NO MARKDOWN:** Do NOT output bold, italics, or headers.
2.  **NO MODE TALK:** Do NOT narrate genre switches ("Switching to Fiqh...").
3.  **NO STEALTH SANITIZATION:** Do NOT replace polemical terms with generic euphemisms.

### Step 3: Mixed-Mode Logic (Encyclopedia)
*   **Refine Triggers:** Add "Mode Reset" instruction.
*   **Proper Noun Scope:** Explicitly list Sects/Groups as "Proper Names" (Translit Only) to stop dithering.
*   **Common Nouns:** Enforce "First Occurrence per Segment" rule strictly.

### Step 4: SOP Update
*   Add labels: `markdown_leak`, `parentheses_collision`, `mode_locking`.
