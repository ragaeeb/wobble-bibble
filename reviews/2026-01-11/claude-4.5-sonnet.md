# Peer Review: Wobble-Bibble Islamic Translation Prompt Lab

## Overall Assessment Score: **8.5/10**

This is an impressively rigorous system that demonstrates deep understanding of both LLM failure modes and Islamic scholarly text structures. The diagnosis of "ambiguity as bottleneck" is excellent, and the stacked prompt architecture is sound. However, there are critical instruction collisions and edge cases that could undermine consistency under adversarial conditions.

---

## Top 3 Critical Weaknesses

### 1. **The "Transliteration Boundary" Paradox Remains Unsolved**
**Severity: High**

The `master_prompt.md` states:
> "Isnad narrator names = FULL ALA-LC (diacritics). Rijal subject header = FULL ALA-LC. Any Arabic-script personal name/title anywhere = FULL ALA-LC"

But then immediately contradicts this with:
> "Names/titles already in Latin/English in the input: keep as written (do not 'upgrade' diacritics)"

**The collision:** What happens when a mixed-input segment contains:
- `P101 - Ibn Taymiyyah said that Ø§Ø¨Ù† تيمية argued...`

The rule says "Arabic-script personal name = FULL ALA-LC" but also "Latin names: keep as written." A model will dither here because:
1. Should `Ø§Ø¨Ù† تيمية` become `Ibn Taymiyyah` (matching the existing Latin form)?
2. Or should it become `Ibn Taymiyyah` (independent ALA-LC)?
3. What if the Latin form is slightly wrong (`Ibn Taimiyya` vs. `Ibn Taymiyyah`)?

**Impact on `encyclopedia_mixed.md`:** This prompt has NO additional guidance on handling mixed-script inputs within the same segment, making it vulnerable to the exact "Transliteration Boundary" confusion identified in `synthesis.md`.

**Recommended Fix:**
```
MIXED-SCRIPT PRIORITY: If a segment contains both Arabic-script and Latin-script versions of the same name, use the Arabic-script version as authoritative and apply FULL ALA-LC. Ignore the Latin version. If only Latin exists, preserve as written.
```

---

### 2. **"No Inference" Rule is Ambiguous Under Truncation**
**Severity: Medium-High**

The master prompt says:
> "No inference: do not guess missing text, supply omitted words, normalize/correct Arabic"

But `synthesis.md` identifies "The Tharid Incident" where literal translation creates theological absurdity. The resolution was:
> "If literal translation implies error... prioritize Tafsir-based contextual meaning"

**The collision:** "Tafsir-based contextual meaning" IS inference. Models will interpret this as permission to "fill gaps" whenever they detect potential absurdity.

**Real-world failure scenario:**
```
P405 - ‫والثريد أفضل من...‬ [segment truncated]
```

A model might:
1. See truncation mid-sentence
2. Recognize "Tharid is better than..." as potential theological error
3. Apply the "Theology-First" override
4. **Infer/complete** the sentence as "Tharid is better than [other foods]"

This violates the "no inference" rule but follows the "theological absurdity" escape clause.

**Impact on `jarh_wa_tadil.md` and `hadith.md`:** These prompts deal with fragmented isnads and broken chains. The "no inference" rule is critical here, but the theological override creates a loophole.

**Recommended Fix:**
```
TRUNCATION PROTOCOL: If a segment ends mid-sentence or mid-word, translate exactly what is present and append [incomplete segment]. Do NOT complete the thought. The "Theology-First" rule applies ONLY to complete sentences where the literal Arabic creates logical impossibility (e.g., comparative constructions that imply superiority to Allah). Truncation is not theological error.
```

---

### 3. **Safety Override Lacks Concrete Examples and Negative Penalties**
**Severity: Medium**

The system correctly identifies "Safety Traps" as a major friction point. The current override language is:

From `master_prompt.md`:
> "Sectarian/polemical terms: translate literally with proper ALA-LC (e.g., Rāfiḍah)"

From `jarh_wa_tadil.md`:
> "Harsh terms (e.g., dajjāl, khabīth, rāfiḍī) must be translated literally; do not soften."

**The problem:** These are *permissions* ("you may translate harshly") rather than *mandates with penalties*. Models trained on safety RLHF will still "negotiate" because:
1. The prompt doesn't explicitly forbid softening
2. There's no consequence for sanitization
3. No examples of "wrong" sanitized output vs. "correct" literal output

**Test case that will likely fail:**
```
P789 - ‫وهذا من أقوال الرافضة الخبيثة‬
```

Expected: "This is among the vile sayings of the Rāfiḍah"
Likely GPT-4 output: "This is among the objectionable positions of certain Shi'i groups"

The model sanitizes because there's no *negative example* showing this is wrong.

**Recommended Fix:**
```
SAFETY OVERRIDE (MANDATORY): Academic fidelity requires preserving the author's original polemical tone. DO NOT:
- Replace specific sect names (Rāfiḍah, Khawārij, Murji'ah) with generic labels ("certain groups", "some scholars")
- Soften harsh evaluative terms (khabīth→vile, NOT "problematic"; ḍalāl→misguidance, NOT "alternative view")
- Add qualifying phrases ("some would say", "in the author's view")
WRONG: "This is among the positions some consider problematic"
RIGHT: "This is among the vile positions of the Rāfiḍah"
```

---

## Proposed Negation Rules (5 High-Value Additions)

### Negation Rule #1: **No Transliteration Creep**
```
DO NOT apply ALA-LC diacritics to:
- English loanwords already standardized in Islamic discourse (Quran, Sharia, Hadith when used as English words)
- Geographical names with established English forms (Mecca, Medina, Damascus)
- Month names when translated to English equivalents
- Common food/object terms translated to English (dates, bread, sword)
```

**Rationale:** Prevents over-application of the "Any Arabic-script personal name = FULL ALA-LC" rule to non-name contexts.

---

### Negation Rule #2: **No Meta-Process Narration**
```
DO NOT output procedural commentary such as:
- "Let me first check the isnad..."
- "I will now apply the transliteration rules..."
- "This appears to be a fiqh term, so I will use..."
- "Upon review, I notice that..."
OUTPUT ONLY: The translated segment with its ID.
```

**Rationale:** Addresses the GPT-5.2 "Meta-Narration" weakness identified in `synthesis.md`. Models waste tokens describing their process instead of executing it.

---

### Negation Rule #3: **No Reconstructive Emendation**
```
DO NOT "fix" apparent errors by:
- Reconstructing missing harakat (vowel marks)
- Choosing between variant readings (qira'at)
- Normalizing dialectical forms to Classical Arabic
- Correcting perceived scribal errors
IF the text appears corrupted, translate it as written. If translation is impossible, output: [untranslatable as written - possible corruption]
```

**Rationale:** Closes the "Theology-First" loophole for truncation/corruption cases.

---

### Negation Rule #4: **No Source Invention**
```
DO NOT add citations, footnotes, or source attributions unless explicitly present in the Arabic segment. This includes:
- [Sahih al-Bukhari] type tags
- (Narrator: X) labels
- Hadith grading commentary (ṣaḥīḥ/ḥasan/ḍaʿīf) unless the source text contains it
- Volume/page references
DO NOT create placeholder structures like [Source: ___] or (See: ___).
```

**Rationale:** Prevents hallucination, especially in `hadith.md` where models might "helpfully" add missing takhrij.

---

### Negation Rule #5: **No Contextual Pronoun Resolution**
```
DO NOT resolve ambiguous pronouns (he/him/his/it) by:
- Inserting names in brackets [ʿUmar]
- Using appositives (ʿUmar, may Allah be pleased with him, said...)
- Substituting the referent directly
KEEP pronouns as pronouns unless the Arabic explicitly uses a name/title.
```

**Rationale:** Prevents subtle inference that violates the "no guessing" rule. Common in tafsir and hadith commentary where long discourses use pronouns for previously mentioned figures.

---

## Review of `encyclopedia_mixed.md`

### Strengths:
1. **No Mode Tags directive** prevents the "mode-locking" problem
2. **Local rule application** ("within each segment, apply the relevant rule-set locally") is the correct approach
3. **Disambiguation examples** for ṣaḥīḥ (authentic vs. valid) and sunnah (Prophetic practice vs. recommended) address real collisions

### Critical Gaps:

#### Gap #1: **No Switching Signal Detection Rules**
The prompt says "apply the relevant rule-set locally" but doesn't define HOW to detect the switch. Models will guess.

**Example failure case:**
```
P1501 - ‫وأما حديث "خير الناس قرني" فقد رواه البخاري عن عبد الله بن مسعود رضي الله عنه وهو حديث صحيح. والصحيح في المذهب أن...‬
```

This segment contains:
1. Hadith citation with isnad
2. Hadith grading (ṣaḥīḥ = authentic)
3. Fiqh ruling (ṣaḥīḥ = the sound position in the madhhab)

Without explicit switch-detection rules, a model might:
- Apply isnad rules to the entire segment (wrong)
- Apply fiqh rules to the isnad (wrong)
- Dither for 20 seconds deciding

**Recommended Addition:**
```
GENRE MARKERS: Detect switches by:
- Isnad verbs (ḥaddathanā, akhbaranā) → activate hadith rules
- Fiqh ruling terms (al-ṣaḥīḥ fī al-madhhab, al-rājiḥ) → activate fiqh rules
- Jarh phrases (thiqah, ḍaʿīf, matrūk) → activate jarh/taʿdīl rules
- Tafsir markers (qāla Mujāhid fī qawlihi taʿālā) → activate tafsir rules
Each sentence can switch genre mid-flow.
```

---

#### Gap #2: **No Cross-Genre Glossary Conflict Resolution**
The prompt provides disambiguation for ṣaḥīḥ and sunnah, but what about other high-collision terms?

**Missing collisions:**
- **ḥadīth**: Can mean "narration" (hadith literature) OR "recent/new" (fiqh context: ḥadīth al-ʿahd = recently married)
- **daʿīf**: Can mean "weak hadith" OR "weak legal position" OR "weak narrator"
- **qawī**: Can mean "strong hadith" OR "strong legal position"
- **mawḍūʿ**: Can mean "fabricated hadith" OR "topic/subject" (mawḍūʿ al-kitāb = subject of the book)

**Recommended Addition:**
```
CROSS-GENRE TERM PRIORITY:
- If isnad context: ṣaḥīḥ = ṣaḥīḥ (authentic); ḍaʿīf = ḍaʿīf (weak)
- If fiqh ruling context: ṣaḥīḥ = ṣaḥīḥ (valid); ḍaʿīf = ḍaʿīf (weak position)
- If rijal context: ḍaʿīf = ḍaʿīf (weak narrator)
DEFAULT: Use the primary genre of the sentence containing the term.
```

---

#### Gap #3: **Retraction Handling is Underspecified**
The prompt says:
> "If the author retracts (kuntu aqulu... wa-al-ana aqulu...), make the change explicit in English."

But it doesn't specify HOW. Models will improvise formatting.

**Likely outputs:**
- "I used to say X, but now I say Y" (good)
- "**Previous position:** X. **Current position:** Y" (markdown violation)
- "[Author's note: This supersedes his earlier view in Book Z]" (inference violation)

**Recommended Addition:**
```
RETRACTION FORMAT: kuntu aqulu... → I used to say... ; wa-al-āna aqulu... → but now I say...
Do NOT add labels like "Former view:" or create comparison tables.
```

---

## Refinement SOP Review

### Strengths:
1. **Granular file structure** (01_input, 02_output, etc.) is excellent for LLM analysis
2. **Label taxonomy** is well-designed and covers the identified friction points
3. **File size limits** (200-400 KB chunks) show awareness of context window constraints

### Weaknesses:

#### Weakness #1: **No "Expected Behavior" Template**
The SOP mentions optional `08_expected.txt` but doesn't provide a template. Without standardized "gold" examples, pattern detection across cases will be noisy.

**Recommended Addition to SOP:**
```
## Expected Behavior Template (08_expected.txt)
For each failed segment, provide:
SEGMENT_ID: P{ID}
INPUT (Arabic): {paste}
WRONG OUTPUT: {what the model produced}
VIOLATION: {which rule from master/add-on}
RIGHT OUTPUT: {corrected translation}
RULE FIX NEEDED: {specific prompt modification}
```

---

#### Weakness #2: **No Regression Test Protocol**
The SOP says "Regression check: Re-run 2-3 older cases" but doesn't define:
- Which cases to prioritize
- How to select representatives
- What constitutes "pass/fail"

**Recommended Addition:**
```
## Regression Test Selection
When updating a prompt, re-test:
1. One "Transliteration Boundary" case (name handling)
2. One "Safety Override" case (polemical term)
3. One "Glossary Conflict" case (ṣaḥīḥ/sunnah/ḍaʿīf disambiguation)
PASS CRITERIA: Output matches 08_expected.txt exactly (character-by-character for IDs/transliteration).
```

---

#### Weakness #3: **No "False Negative" Detection**
The current SOP focuses on overt failures (IDs dropped, Arabic leaked, etc.) but doesn't capture *subtle* failures like:

- Over-transliteration (applying ALA-LC to English loanwords)
- Under-transliteration (missing diacritics on required names)
- Synonym drift (using "authentic" in one segment, "sound" in another for ṣaḥīḥ)

**Recommended Addition:**
```
## Subtle Failure Labels (add to taxonomy)
- translit_overreach (ALA-LC applied to non-name terms)
- translit_underreach (missing diacritics on Arabic-script names)
- glossary_synonym_drift (using English-only when translit (English) required)
- connector_inconsistency (mixing "b." and "ibn" mid-chain)
```

---

## Final Recommendations (Prioritized)

### Priority 1 (Critical - Address Immediately):
1. **Add the "Mixed-Script Priority" rule** to `master_prompt.md` (solves Weakness #1)
2. **Add the "Truncation Protocol"** to clarify the Theology-First override (solves Weakness #2)
3. **Add negative examples** to Safety Override sections (solves Weakness #3)

### Priority 2 (High - Before Next Model Test):
4. **Add Genre Switching Detection markers** to `encyclopedia_mixed.md` (Gap #1)
5. **Add Cross-Genre Term Priority table** to `encyclopedia_mixed.md` (Gap #2)
6. **Implement all 5 Negation Rules** across relevant prompts

### Priority 3 (Medium - Improve Long-Term Consistency):
7. **Create `08_expected.txt` template** in `REFINEMENT_GUIDE.md`
8. **Define regression test selection criteria**
9. **Expand label taxonomy** for subtle failures

---

## Closing Assessment

This project demonstrates **world-class prompt engineering discipline**. The synthesis report's diagnosis of "ambiguity as bottleneck" is profound and correct. The stacked architecture is sound.

However, the system is vulnerable to **instruction collision under adversarial conditions** (mixed inputs, truncated segments, rapid genre-switching). The current prompts would score ~9/10 on "clean" academic texts but might drop to 6-7/10 on:
- OCR-corrupted manuscripts
- Polymath works with mid-sentence genre switches
- Texts mixing Arabic script and Latin transliteration

**The fixes are surgical, not architectural.** With the recommended negation rules and gap-fillers, this system could achieve 9.5/10 reliability across all conditions.

The SOP is **production-ready** but would benefit from standardized regression templates and subtle-failure detection labels.

**Recommended next step:** Run a "stress test" using Ibn Taymiyyah's *Majmūʿ al-Fatāwā* (which switches between fiqh, tafsir, hadith grading, and polemics within single paragraphs) to validate `encyclopedia_mixed.md` under real adversarial conditions.