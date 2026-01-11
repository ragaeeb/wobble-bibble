# Wobble-Bibble Prompt System Peer Review

## Scope
This review focuses on the stacked prompt system (master + add-ons) and the refinement SOP, with emphasis on instruction collisions, safety-override robustness, token efficiency, edge-case coverage, and mixed-genre behavior.

## 1) System Score (Logic Consistency & Academic Rigor)
**Score: 7.5 / 10**

**Rationale (short):** The master prompt is strict and academically oriented, and the add-ons are clear about genre-specific constraints. However, a few rule collisions exist (especially around parentheses usage), and mixed-genre handling can be made more deterministic to prevent mode-locking or overly dominant genre behaviors.

## 2) Top 3 Weaknesses
1) **Parentheses collision between master and add-ons.**
   - The master prompt allows parentheses *only* for `translit (English)` technical-term pairs, but jarh/ta'dil explicitly uses parentheses for dates like `(d. 256 AH)` and tafsir uses braces plus bracketed references. This creates direct conflict on output formatting and can lead to compliance failures. A hard rule with a narrow exception list would reduce contradictions.

2) **Safety override language is present but not forceful enough against RLHF sanitization.**
   - The master prompt says “translate literally” and mentions polemics, and fatawa says “do not soften,” but there is no explicit prohibition on hedging, disclaimers, euphemisms, or tone dilution (e.g., “harsh” softened to “critical”). This is the biggest real-world failure mode for academically faithful translations.

3) **Mixed-genre handling lacks explicit conflict resolution and structural instructions.**
   - `encyclopedia_mixed.md` asserts “apply relevant rule-set locally,” but it lacks practical tie-breakers (e.g., when a term like “ṣaḥīḥ” appears in a grading clause embedded in a fiqh paragraph) and doesn’t explicitly handle switches between isnad, legal reasoning, and narrative history within the same segment.

## 3) Proposed “Negation Rules” (Do NOT...)
Add the following concise negation rules to the master prompt or the mixed add-on to reduce ambiguity and safety drift:

1) **Do NOT soften, euphemize, or replace harsh polemical labels** (e.g., do not replace “kāfir”/“rāfiḍī” with “critic” or “opponent”). Translate the term literally as written.
2) **Do NOT add hedging or safety disclaimers** (e.g., “the author is being harsh,” “this term is offensive,” “historical context”). Only translate what appears in the segment.
3) **Do NOT add explanatory parentheses** other than allowed technical-term pairs or explicitly permitted exceptions (e.g., dates if allowed). If exceptions exist, list them once in the master prompt to avoid collisions.
4) **Do NOT normalize or “fix” authorial contradictions** (e.g., retracting a view, contradictory rulings, conflicting gradings). Preserve the author’s shift verbatim.
5) **Do NOT translate genre markers into a different register** (e.g., don’t reframe isnad verbs into narrative prose or rephrase qāla/qīla into academic paraphrase). Maintain literal structural cues.

## 4) Instruction Collisions & Consolidation Opportunities
**Collision: Parentheses restrictions**
- Master: parentheses only for translit (English).
- Jarh/ta'dil: uses parentheses for dates `(d. 256 AH)`.
- Tafsir: braces and bracketed verse refs are okay, but should be explicitly exempted from the “parentheses only” rule, otherwise the system is inconsistent about allowed formatting.

**Collision: “No extra fields” vs. add-on labeling**
- Master prohibits extra fields and notes, but add-ons use structural labels like “Questioner:” and “Answer:”. This is likely okay, but should be clarified as “structural labels present in Arabic are allowed” to prevent misinterpretation as “added fields.”

**Collision: Transliteration vs. English labels**
- Master mandates “plain text only” and “no markdown,” while fiqh/usul add-ons recommend inserting English structural labels (Chapter:, Section:, Issue:). This is acceptable if the Arabic explicitly signals headings, but needs a single rule in master to clarify that “structure labels are allowed when explicitly present.”

## 5) Token Efficiency (Prompt Bloat)
- The master prompt combines several discrete rule blocks into long lines. Consider reformatting into short bullet-like lines to reduce cognitive load without adding tokens (each line can be shorter, not necessarily more).
- The glossary is long and is used in multiple genres; a shorter “top priority glossary” plus a link to add-ons could be more token-efficient when stacking.
- The repeated “USE: Paste MASTER prompt above this” appears in every add-on; it could be removed in practice or shortened to “Requires MASTER above.”

## 6) Edge Case Coverage Gaps
- **In-segment genre switches** (e.g., isnad → legal reasoning → historical narrative within a single segment): No explicit tie-breaker for *intra-segment* term disambiguation beyond a few examples (ṣaḥīḥ, sunnah).
- **Mixed narrative and isnad**: Guidance is missing for narrative interjections inside isnad chains (e.g., “then he said” or evaluative asides). A single “isnad boundary micro-rules” clause could prevent mis-parsing.
- **Cross-genre quotations**: No explicit rule for when fiqh cites a hadith with an embedded isnad; this is common and might need a “treat embedded isnad with hadith rules” line in mixed add-on.
- **Ruling status lines**: Fatawa add-on implies a final ruling line, but mixed add-on doesn’t mention how to preserve or spot these lines in hybrid texts.

## 7) Refinement SOP Practicality
**Strengths:** The SOP is practical, disciplined, and oriented around minimal diffs and case capture. The structured file naming and label taxonomy are strong for future model analysis.

**Potential improvements:**
- The “prompt stack hash” in the optional index could be standardized (e.g., sha256 of `04_prompt_stack.txt`) for reproducibility.
- Labels are good, but some edge cases in “mixed genre switching” might benefit from sublabels (e.g., “mixed_in_segment” vs “mixed_between_segments”).
- The note template is concise, but adding a single line for “competing rules in conflict” could make patterns more searchable.

## 8) Review of `encyclopedia_mixed.md` (Mode Switching)
**What works:**
- It explicitly prohibits mode tags and frames mixed-genre behavior “within each segment,” which reduces output pollution.
- It already disambiguates two of the most frequent collisions (ṣaḥīḥ, sunnah) and clarifies hadith grading behavior.

**Where it may still mode-lock or drift:**
- The “within each segment, apply the relevant rule-set locally” line is conceptually correct but operationally underspecified. Without tie-breakers, an LLM may default to the most recent or most salient genre.
- There is no explicit “if hadith isnad appears inside fiqh/tafsir, use hadith rules for that clause only” instruction.
- There is no explicit rule for *structural preservation* when switching genres in one segment (e.g., headings + isnad + ruling line), which could cause flattening into narrative prose.

**Suggested minimal fix (token-lean):**
- Add a single rule to the mixed add-on: “If a clause is isnad, apply hadith rules only to that clause; resume local genre rules after the clause ends.”
- Add a sentence clarifying that any explicit headings or Q&A labels present in Arabic must be preserved regardless of genre switching.

---

If you want, I can translate these into minimal diff edits for the master and mixed add-on while keeping token counts lean.