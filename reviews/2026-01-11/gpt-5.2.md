# Wobble-Bibble Prompt Lab — Peer Review

## Score (1–10)
**Logic consistency:** 7/10  
**Academic rigor:** 8/10

**Rationale:** The master prompt is disciplined and mostly consistent, but there are a few rule collisions across add-ons (notably parentheses usage, and Qur’anic reference formatting) that can cause deterministic conflicts. The SOP is strong for reproducibility but could capture a bit more signal about mixed-genre context shifts and prompt-stack metadata.

---

## Top 3 Weaknesses

1. **Parentheses rule collisions (formatting ambiguity).**
   * **Master** allows parentheses **only** for technical-term pairs (`translit (English)`), but **jarh_wa_tadil** requires parentheses for dates `(d. 256 AH)` and **tafsir** uses bracketed references that can be treated as extra annotations. This can force a direct contradiction in output formatting and reduce compliance consistency.

2. **Qur’anic reference injection risk.**
   * In **tafsir**, the rule “translate Qur’an text in braces `{…} [2:255]`” can conflict with the **master** ban on adding fields/notes unless explicitly present. If the input has Qur’anic text but not a full citation, the prompt still asks the model to output a citation, which is an implicit augmentation and violates the “no extra fields” constraint.

3. **Mixed-genre disambiguation lacks tie-breakers and boundary triggers.**
   * **encyclopedia_mixed** says “apply relevant rule-set locally,” but does not define **how to detect a genre switch** or what to do when rules overlap (e.g., fiqh ruling plus isnad in a single sentence, or jarh terms embedded in a legal ruling). This leaves the model to guess and encourages “mode-locking” based on early context.

---

## Proposed Negation Rules (Do NOT…)

Add these as short, high-priority negations in the master (or in a short “global guardrails” block used by all add-ons):

1. **Do NOT use parentheses for anything except `translit (English)` technical-term pairs.**
   * If dates or other metadata must be shown, prefer commas or “d. 256 AH” without parentheses unless the source explicitly uses them.

2. **Do NOT add verse references or citations that are not explicitly present in the segment.**
   * If the segment contains Qur’anic text without a reference, translate it but **omit** brackets like `[2:255]` unless the segment already includes a reference.

3. **Do NOT assume genre continuity across sentences or segments.**
   * Re-evaluate the applicable sub-rules at **every sentence** or **at each explicit cue** (e.g., isnad verbs, jarh terms, legal heading markers).

4. **Do NOT normalize or reinterpret polemical labels into euphemisms, even if they are offensive.**
   * Translate literally with ALA-LC and preserve tone.

5. **Do NOT infer missing isnad links or metadata in mixed-genre passages.**
   * If a chain is truncated or implied, leave it as written.

---

## Instruction Collisions & Suggested Fixes (Master vs Add-ons)

### Collision A: Parentheses usage
- **Master:** parentheses only for technical-term pairs.
- **Jarh/taʿdil:** dates in parentheses `(d. 256 AH)`.

**Fix:** Replace the jarh/taʿdil date format with “d. 256 AH” (no parentheses), or explicitly allow **date parentheses** as a second permissible parentheses case in the master.

### Collision B: Qur’anic reference formatting
- **Master:** no added fields or citations unless present.
- **Tafsir:** outputs `[2:255]` and braces `{…}` for Qur’anic text, potentially inventing a reference.

**Fix:** Condition the tafsir rule:
- “Only output `[2:255]` if the Arabic includes the reference or the segment already includes it.”
- Keep braces `{…}` for quoted Qur’anic text, but do not append a reference unless present.

### Collision C: New-line / role labels within a segment
- **Master:** “SEGMENT_ID - English translation.”
- **Jarh & mixed Q&A:** may require multiple lines (e.g., “Questioner: … / Answer: …”).

**Fix:** Add a short master note: “Line breaks are allowed within a segment when the Arabic uses role labels or speakers.”

---

## Token Efficiency Review (Prompt Bloat)

**Candidates for trimming without losing strictness:**
- **Master glossary list** is long and repeated in multiple add-ons’ examples. You could compress to “Locked glossary terms are listed; apply only when the Arabic exact term appears.”
- **Example line** in master (“P405 - …”) is helpful but can be shortened to a single-line format spec to save tokens.
- **Isnad boundary list** in master could be compacted by referencing “common transmission verbs (ḥaddathanā/akhbaranā/an/samiʿtu)” rather than enumerating variants in multiple add-ons.

**High-value keepers (do not trim):**
- “No Arabic script except ﷺ.”
- “No inference / no emendation.”
- “Parentheses reserved for translit (English).”

---

## Edge-Case Coverage Gaps (Especially for Mixed Texts)

1. **Multi-genre within a single sentence:**
   * Example: chain + jarh grading + fiqh ruling in one clause. A rule is needed to prioritize isnad parsing first, then jarh terms, then fiqh terms within the same sentence.

2. **Embedded poetry or rhymed prose within biographies or tafsir:**
   * Only tafsir addresses poetry line breaks; mixed and hadith do not mention verse handling if poetry appears inside a biography or isnad context.

3. **Quotations of earlier scholars inside a ruling:**
   * In mixed texts, distinguish quoted material (e.g., “qāla fulān”) from author voice and preserve attributions without normalizing to the author’s voice.

4. **Mixed Arabic/Latin citations or abbreviations:**
   * Master allows Latin text “as written,” but add-ons do not clarify whether to preserve punctuation and spacing around codes (kh/m/d/t/s/q/4) across mixed segments.

---

## Review of `encyclopedia_mixed.md` (Genre Switch Handling)

**Strengths:**
- The “apply rule-set locally” directive is correct and essential for polymath texts.
- Explicit disambiguation for ṣaḥīḥ and sunnah reduces a common cross-genre failure.
- Q&A and retraction cues are good safeguards against narrative drift.

**Weaknesses / Risks:**
- **No explicit genre-switch triggers.** It lacks cues like “isnad verbs → hadith rules,” “ruling terms → fiqh rules,” “rijal verbs → jarh rules,” etc. Without explicit triggers, the model may stay locked in the first identified genre.
- **Overlapping rule precedence is unclear.** If a line contains both grading terminology and a fiqh ruling, it’s unclear which glossary/format to prioritize.
- **No guidance for Qur’anic citations in mixed texts.** If a mixed passage includes Qur’anic quoting, it lacks the tafsir rule for braces and references (even if that rule needs to be conditional, it should be stated).

**Targeted improvements (concise):**
- Add a short “switch cues” line: “Isnad verbs → hadith; jarh phrases → jarh; ruling terms → fiqh/usul; Qur’an quotes → tafsir handling.”
- Add a **tie-breaker** note: “If multiple cues appear, handle isnad formatting first, then jarh grading, then fiqh/usul term formatting.”
- Clarify that Qur’anic citations must be preserved only if present (avoid generating references).

---

## Refinement SOP Practicality (REFINEMENT_GUIDE.md)

**Strengths:**
- The storage schema is clear, consistent, and LLM-friendly.
- Required artifacts are precise and reproducible.
- The “one minimal change per fix” rule supports clean regression testing.

**Gaps / Enhancements:**
- **Prompt stack hash** is listed in the index format but there’s no recipe to compute it. Add a short line: “Use SHA256 of `04_prompt_stack.txt` and store the first 8–12 chars.”
- **Genre switch metadata** is not captured. Add an optional note field to `06_notes.md` for “dominant genre vs inserted genre,” which helps analyze mixed-genre errors.
- **Sampling note**: When multiple segments fail, note whether the issue is systemic or isolated (e.g., “fails every 5–10 segments”). This helps distinguish prompt ambiguity from one-off input noise.

---

## Summary Recommendations (Minimal, High-Impact)

1. Resolve the parentheses conflict by either removing date parentheses in jarh/taʿdil or explicitly allowing dates as a second permitted parentheses case.
2. Make tafsir references conditional to avoid inventing `[2:255]` when not in source.
3. Add short, explicit genre-switch triggers and precedence ordering to `encyclopedia_mixed.md`.
4. Add 1–2 metadata fields in the SOP for mixed-genre cues and prompt-stack hash generation.