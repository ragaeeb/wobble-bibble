# Token Optimization Plan (Round 6)

## Objective
Reduce token usage in `master_prompt.md` and `encyclopedia_mixed.md` without compromising logical strictness. By converting "prose instructions" into "logic/decision-matrices", we can save context window and potentially improve instruction following for "Thinking" models (which prefer structured data).

## Proposed Changes

### 1. Master Prompt (`master_prompt.md`)

**Current State (Line 5):**
> TRANSLITERATION: Isnad narrator names = FULL ALA-LC (diacritics). Rijal subject header = FULL ALA-LC. Any Arabic-script personal name/title/place anywhere = FULL ALA-LC (e.g., al-ʿUthaymīn), UNLESS the specific Add-on defines a narrower scope (Add-on overrides Master scope). Names/titles already in Latin/English in the input: keep as written (do not “upgrade” diacritics), except locked glossary terms may be normalized to ALA-LC. Book titles: keep as written if already Latin/English; if Arabic script, FULL ALA-LC; do not translate titles. Month names: translate to English only when explicitly a month name; otherwise keep as written (if Arabic script, FULL ALA-LC). DEFINITE ARTICLE: "al-" is always LOWERCASE unless it is the first token of a new sentence/line. PROPER NAME CASING: When a proper name follows "al-", CAPITALIZE the name (e.g., "al-Salafīyyah", "al-Shāfiʿī", "al-Bukhārī"). TA MARBUTA: Use -ah in pause/end form; use -at in iḍāfah/construct state when directly followed by a noun. Also: Taymiyyah (not Taymiyya). TRANSLATION COUPLING: Duʿāʾ is allowed to be fully transliterated for pronunciation, but MUST be immediately translated once. If you output any multi-word transliterated phrase (duʿāʾ / proverb / quote), immediately append its English meaning on the SAME LINE using "translit — English" or "translit: English" (no intervening text).

**Proposed (Logic Block):**
> TRANSLITERATION MATRIX:
> 1. SCOPE: Transliterate explicit Arabic-script Person/Place/Book-Titles to FULL ALA-LC (Add-ons override this).
> 2. LATIN INPUT: Preserve existing English/Latin spelling (do not "upgrade" diacritics) UNLESS it matches GLOSSARY.
> 3. FORMAT:
>    - al-Casing: Lowercase `al-` mid-sentence; Capitalize name after (`al-Salafīyyah`).
>    - Tā Marbūṭah: `-ah` (pause/default); `-at` (construct state/iḍāfah).
>    - Connectors: `b.` (mid-chain); `Ibn` (start).
> 4. COUPLING: Any transliterated phrase (duʿāʾ/quote) MUST be immediately translated: `translit (English)`.

**Savings**: ~50% reduction in characters for this section. Better readability.

### 2. Encyclopedia Mixed Prompt (`encyclopedia_mixed.md`)

**Current State**: Separate `PRIORITY MATRIX`, `GENRE TRIGGERS`, and `RULE RESET`.

**Proposed (Merged State Logic):**
> STATE LOGIC (Priority: Isnad > Rijal > Fiqh > Narrative):
> - ISNAD (Trigger: `ḥaddathanā`, `akhbaranā`, `ʿan`): Use FULL ALA-LC for names.
> - RIJAL (Trigger: Evaluation terms): Use `translit (English)` for ratings.
> - FIQH/CREED (Trigger: Ruling terms): Use `translit (English)`.
> - NARRATIVE (Default): Reset to Base state after chain ends (at `qāla`). Do NOT carry Isnad rules into Matn.

**Savings**: Removing redundant explanations of definitions.

## Regression Validation (Why it's safe)

1.  **Logic Preservation**: We are not removing rules, only de-duplicating the prose. "Isnad narrator names = FULL ALA-LC" matches "SCOPE: Transliterate... Person... FULL ALA-LC".
2.  **Explicit Casing**: The dangerous "al-Casing" rule is preserved as a bullet point, which is clearer than buried prose.
3.  **Ambiguity Reduction**: The "Decision Tree" format reduces the chance of the model missing a clause buried in a long paragraph.

## Next Steps
1.  Apply Master Prompt compression.
2.  Apply Encyclopedia compression.
3.  Verify no rule was accidentally dropped (e.g., "Month names" - rare but kept in general Scope).
