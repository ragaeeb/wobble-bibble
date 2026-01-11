# Peer Review: Wobble-Bibble Islamic Translation Prompt Lab

## Scope
This review covers the stacked prompt system (master + genre add-ons) and the refinement SOP with attention to instruction collisions, safety-override integrity, token efficiency, edge case coverage, and mixed-genre handling.

## Score (1–10)
**8.2 / 10** for logic consistency and academic rigor.

## Top 3 Weaknesses
1. **Ambiguity about Arabic-script “exceptions” beyond ﷺ**
   The master prompt forbids Arabic script except ﷺ, but several domain terms and labels (e.g., al- prefixes, kitab names, transliterations) are allowed only in Latin + diacritics. The rules could be misread by a model as “don’t output any Arabic characters,” but also conflict with “FULL ALA-LC” when the source uses Arabic-script. This can cause avoidance behavior when a model is unsure whether a token is Arabic script or Latin diacritic.

2. **Instruction collisions in mixed-genre switches (fiqh/ḥadīth/usūl/polemics)**
   The mixed add-on says “apply the relevant rule-set locally” while the master prompt is global and absolute. There is a potential clash around terms like “sunnah” and “ṣaḥīḥ” that can flip meaning across disciplines; the mixed prompt partially resolves this but only for two terms. The model might still lock into one genre for adjacent terms (e.g., jarḥ/taʿdīl terms or uṣūl-specific technicals), especially when a single segment contains both isnād and fiqh rulings.

3. **Refinement SOP lacks a compact “decision note” for collisions**
   The SOP captures failures well, but it does not force the analyst to describe “which rule(s) collided and which should win.” Without this, fixes can become additive (“more rules”) rather than clarifying precedence, which increases bloat and raises conflict risk in future iterations.

## Proposed 3–5 Negation Rules (Do NOT...)
1. **Do NOT translate transliterated names into English** (e.g., do not turn ʿAbd Allāh into “Servant of God”), even when the text is clearly theological or polemical.
2. **Do NOT treat a single segment as a single genre** when the segment contains isnād + legal ruling + evaluation terms; apply micro-scoped handling per phrase.
3. **Do NOT normalize or “upgrade” Latin spellings into ALA-LC** unless a locked glossary item explicitly requires it.
4. **Do NOT collapse jarḥ/taʿdīl formulae into generic English adjectives**; keep the technical term pair format when present.
5. **Do NOT infer or supply missing isnād links** even if the chain appears incomplete.

## Instruction Collisions (Master vs. Add-ons)
- **Parentheses restriction vs. need for disambiguation**: The master prompt reserves parentheses for “translit (English)” technical term pairs. However, the mixed add-on uses a slash (sunnah/mustaḥabb) which could tempt the model to add parenthetical clarifications. This is a mild collision risk and could be tightened by explicitly forbidding parenthetical disambiguation beyond the technical pair format.
- **No Arabic script output vs. Q&A labels**: The mixed add-on prescribes “Al-Sāʾil=Questioner” and “Al-Shaykh=Answer” which are Latin with diacritics (OK), but could be misconstrued as requiring Arabic script labels; consider a short “Latin only” reminder in the add-on to reduce confusion.

## Safety Override Integrity
- The master prompt has clear instructions for literal translation of polemical terms and a “do not sanitize” posture. This is strong, but **it could be reinforced by explicitly prioritizing “fidelity over safety” in a shorter negation rule** to reduce RLHF override. A single, high-salience “Do NOT soften polemical or legal terms” line in add-ons (especially mixed) will reinforce.

## Token Efficiency (Prompt Bloat)
- The master prompt is concise but includes several “one-off” examples (e.g., Unicode list and multiple transliteration examples). These are helpful but could be compressed by moving some examples to a single line. For instance, the transliteration examples and the Unicode list could be shortened to “Latin + Latin Extended ALA-LC diacritics only; no Arabic script except ﷺ.”
- The mixed add-on is quite lean; the only bloat risk is the “HADITH CORE” verb mapping list. It could be shortened to a single sentence with a pointer: “map transmission verbs to standard English; do not add missing links.”

## Edge Case Coverage (Beyond mixed genre)
- **Intra-segment genre switches**: The mixed add-on handles local rules, but there is no explicit rule for “interleaved quotations” (e.g., a fiqh discussion quoting a hadith with isnād inside the same segment). A short rule could state that quoted blocks inherit the appropriate rules, and that outside-quote content continues the base genre.
- **Legal maxims vs. technical terms**: Terms like qāʿida (maxim) or ḍابط (rule) may not be consistently treated as technical terms if they appear without explicit cues. A micro-rule could clarify when these should be rendered as translit (English) vs. English-only.
- **Named works and collections in Arabic script**: The master prompt says “Book titles: keep as written if already Latin/English; if Arabic script, FULL ALA-LC; do not translate titles.” This is adequate, but mixed genres often cite partial titles inside commentary; a quick reminder in mixed add-on could reduce accidental translation.

## Refinement SOP (Practicality)
- **Strengths**: The SOP is operationally clear, forces minimal prompt changes, and encodes a rigorous case-capture process. The label taxonomy is strong and aligns with observed failure modes.
- **Gap**: Add a mandatory “collision note” line in `06_notes.md` to record which rules conflicted and which rule should win. This helps reduce bloat by clarifying precedence rather than adding more rules.
- **Signal capture**: The SOP’s required artifacts are sufficient for pattern recognition. The only missing piece is a short “expected behavior rationale” to explain why a given fix is minimal. This could be optional to avoid bloat.

## Review: `encyclopedia_mixed.md` and Genre-Switching
- The add-on correctly acknowledges mid-paragraph switches and forbids mode tags, which avoids the common “mode-lock” failure.
- The disambiguation rules for ṣaḥīḥ and sunnah are good but too narrow; additional disambiguations (e.g., isnād-related jarḥ/taʿdīl adjectives) may be needed to avoid reinterpreting technical terms in a fiqh register.
- Q&A label handling is clear and should work across disciplines. Consider adding a short clause to apply Q&A labels only when the source uses explicit dialogue markers.
- Overall: robust for the most common switches, but should explicitly mention quoted hadith blocks nested within fiqh commentary to prevent genre lock at the segment level.

## Suggested Minimal Edits (Optional)
If you want a minimal and token-lean improvement pass, consider:
- One “Do NOT soften polemics” negation added to the mixed add-on.
- One-line clarification in the SOP notes template: “Rule collision (if any) and winning rule.”
- One-liner in mixed add-on for quoted material: “Quoted blocks inherit their native genre rules.”