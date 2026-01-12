# Synthesis of AI Agent reviews for Token Optimization

After reviewing the feedback from Claude 4.5, Grok 4.1, and Kimi k2, a clear consensus has emerged: **The "Matrix" structure is superior, but the Draft implementation was dangerously underspecified.**

## Consensus: The "Missing Rules" Regression Risk
All agents flagged that I accidentally dropped critical "fine-print" rules during compression. Specifically:
1.  **Month Names** (Claude, Grok): The rule "Translate contextually, otherwise ALA-LC" was missing.
2.  **Book Titles** (Claude, Grok): The rule "Do not translate titles" was missing, inviting hallucinations like "The Authentic Collection of Bukhari".
3.  **Triggers** (Kimi, Grok): The `STATE LOGIC` for encyclopedia mixed dropped the explicit quote triggers (`qāla al-muṣannif`), creating a major mode-switching regression risk.
4.  **Override Ambiguity** (Claude): "Add-ons override this" is too vague for non-thinking models.

## Implementation Plan (Amended)

I will implement the **Matrix Structure**, but with the **Hardening Amendments** suggested by the Peer Reviewers.

### 1. Hardened Master Prompt (`TRANSLITERATION MATRIX`)
Instead of the generic draft, I will use this explicit version:

```markdown
TRANSLITERATION MATRIX:
1. SCOPE: Transliterate explicit Arabic-script Person/Place/Book-Titles to FULL ALA-LC (Add-ons define scope).
   - BOOK TITLES: Do NOT translate meanings; transliterate only.
   - MONTH NAMES: Translate to English only if explicitly a time marker; otherwise FULL ALA-LC.
2. LATIN INPUT: Preserve existing English/Latin spellings (do not "upgrade" diacritics) UNLESS matching GLOSSARY.
3. FORMAT:
   - al-Casing: Lowercase `al-` mid-sentence; Capitalize name after (`al-Salafīyyah`).
   - Tā Marbūṭah: `-ah` (pause/default); `-at` (construct state/iḍāfah).
   - Connectors: `b.` (mid-chain); `Ibn` (start/fixed-name element).
4. COUPLING: DO NOT output multi-word transliterations without immediate English: `translit (English)`.
```

### 2. Hardened Encyclopedia Prompt (`STATE LOGIC`)
I will restore the explicit triggers Kimi flagged as missing:

```markdown
STATE LOGIC (Priority: Isnad > Rijal > Fiqh > Narrative):
- ISNAD (Triggers: `ḥaddathanā`, `akhbaranā`, `ʿan`): Use FULL ALA-LC for names.
- RIJAL (Triggers: jarḥ/taʿdīl terms like `thiqah`, `ḍaʿīf`): Use `translit (English)` for ratings.
- QUOTE/WEAK (Triggers: `qāla al-muṣannif`, `yuqālu`, `zuiʿma`): Apply Quote Rules; do not Restructure.
- RESET: When chain ends (at `qāla`/`matn`), STOP Isnad/Rijal rules. Return to Narrative.
```

### 3. Glossary Optimization (Bonus)
I will also apply Claude's suggestion to densify the `LOCKED GLOSSARY` into a list format to save further tokens.

## Action Items
1.  Update `prompts/master_prompt.md` with the new **Hardened Matrix**.
2.  Update `prompts/encyclopedia_mixed.md` with the **Hardened State Logic**.
3.  Update `prompts/master_prompt.md` `LOCKED GLOSSARY` section.
