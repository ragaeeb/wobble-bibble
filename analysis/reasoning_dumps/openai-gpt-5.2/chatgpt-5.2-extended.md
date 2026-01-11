---
original_filename: chatgpt-5.2-extended.md
generated_on: 2026-01-11
model_source: Chatgpt 5.2 Extended
---

Below is what your “reasoning dump” reveals about **(a)** where these reasoning models consistently struggle and **(b)** what they find unambiguous / easy—plus **prompt-level fixes** that directly target those failure modes.

---

## What is very clear to the models (they consistently “get it”)

### 1) Core mission + fidelity constraints

Across the dump, the models repeatedly lock onto these requirements correctly and early:

* **“Accuracy first”** (literal by default, interpretive only when needed).
* **Preserve IDs/segment markers** (e.g., `P215b -`) exactly.
* **Plain-text output** (no markdown), with lists as **line breaks + hyphens**.
* **Translate Qur’an and Hadith text into English** (don’t leave Arabic matn in place).
* **Keep “Allah” for الله** (and treat “ilāh/إله” differently as a common noun when relevant).
* **Handle footnotes / bracketed source refs** and keep them tied to the right sentences.

This is good news: the models understand your “translation contract” and prioritize it.

### 2) The “narrator-only ALA-LC” rule is understood in principle

They repeatedly restate the core idea:

* **Use ALA-LC (diacritics) for narrator names in isnād only.**
* **Don’t ALA-LC everything else** (modern figures, random proper nouns, etc.).

Even when they later wobble, they *do* understand your intent.

---

## Where the models struggle (recurring pain points)

### 1) Transliteration scope: narrators vs. everyone else vs. technical terms

This is *the* biggest source of indecision loops.

In the dump, models repeatedly ask themselves questions like:

* “Should I also ALA-LC scholars? collectors? book titles?”
* “Are technical terms (‘aqeedah/manhaj/tawhid) allowed with diacritics?”
* “If diacritics are allowed, why restrict them to narrators?”

**Observed failure mode:** the model keeps re-litigating transliteration policy mid-task, which leads to inconsistent outputs across segments (and across runs).

**What’s missing in the prompt:** a **complete transliteration decision tree** that covers:

* narrators in isnād,
* hadith collectors when referenced (bibliographic vs. actual narrator),
* scholars/modern names,
* book titles,
* technical terms (fiqh/usul/aqidah terms),
* place names and surah names.

### 2) “No Arabic characters” vs. allowed symbols vs. diacritics

Models show uncertainty about what counts as “Arabic characters”:

* They correctly treat **ﷺ** as allowed.
* They’re unsure about:

  * **Latin diacritics** (ḥ, ʿ, ā) — allowed by Unicode but sometimes treated as “Arabic-adjacent.”
  * **Arabic punctuation** vs. Latin punctuation.
  * Whether **surah names** in Arabic script must be converted to Latin script (they assume yes, but they debate whether to use diacritics).

**Observed failure mode:** they sometimes “over-restrict” and strip useful Latin diacritics even when you would accept them, or they inconsistently apply them.

**What’s missing:** an explicit statement like:

* “Arabic script characters (Unicode Arabic blocks) are forbidden; **Latin letters with diacritics are allowed** but restricted by the transliteration rules below.”

### 3) The ﷺ rule is under-specified in edge cases

You gave a very specific example:

* “وصلى الله وسلم وبارك” → translate normally (no ﷺ) because it does not explicitly contain “صلى الله عليه وسلم”.

But the dump shows models repeatedly debating:

* whether to add ﷺ anyway “for respect,”
* whether to add ﷺ whenever the Prophet is mentioned,
* whether to add ﷺ when meaning is equivalent but wording differs.

**Observed failure mode:** inconsistent application—sometimes they follow your rule, sometimes they rationalize an exception.

**What’s missing:** a hard rule that resolves all variants, e.g.:

* “Only output ﷺ when the source explicitly contains صلى الله عليه وسلم (or its exact contracted form), otherwise translate the meaning in English without ﷺ.”

(Or, if you *do* want ﷺ for a broader set of formulas, define that set explicitly.)

### 4) Qur’an reference handling is inconsistent (surah naming + bracket policy)

The dump shows repeated uncertainty about:

* whether to render `[البقرة]` as `[al-Baqarah]` or `(al-Baqarah 2:42)` or both,
* whether to use diacritics in surah names (al-Nisāʾ vs al-Nisa),
* how to handle **partial verses** or verses truncated by the source formatting.

**Observed failure mode:** outputs vary between:

* transliterating surah names,
* anglicizing surah names,
* mixing bracket styles within the same job.

**What’s missing:** a single canonical reference format with examples.

### 5) “Plain text / no formatting” conflicts with “citations” and footnotes

In the dump, the model repeatedly worries about “system requires citations” and tries to invent patterns like `(website)`.

Even if your real workflow does or doesn’t require citations, the model is clearly unsure where citations belong and what format is acceptable.

**Observed failure mode:**

* it may add extra “citation lines,”
* or embed parenthetical sources inconsistently,
* or hesitate and delay translation.

**What’s missing:** explicit instruction for **source/citation rendering** (especially for footnotes and bracketed `[Source]` strings you already have).

### 6) Output truncation / “ellipsis hallucination”

There’s a whole section where the model thinks the original contains ellipses (“…”) but it’s actually **display truncation** during debugging/printing.

**Observed failure mode:** if your pipeline shows truncated previews, reasoning models may infer missing text and try to “preserve ellipses” that are not in the source.

**What’s missing:** a directive like:

* “Never infer omissions; only preserve ellipses if they are present in the input text exactly.”

### 7) Instruction overload → repeated “meta-planning” instead of translating

The dump contains lots of “I will now…” planning, re-checking, revising transliteration standards, etc.

**Observed failure mode:** reasoning models burn tokens/time on internal policy debate, increasing chances of inconsistency and drift—especially when the content type shifts (hadith → tafsir → polemics → list headings → footnotes).

**What’s missing:** a **priority order** + a short pre-flight checklist so the model stops re-deriving rules.

---

## What the dump implies about content types that cause extra difficulty

### Hadith-heavy text (isnād + matn + collector refs)

Hard bits:

* distinguishing narrators (ALA-LC) vs bibliographic attributions (“narrated by al-Bukhari”),
* deciding whether Muhammad’s name in isnād gets diacritics or not,
* keeping isnād structure while still producing fluent English.

### Fiqh / fatawa Q&A

Hard bits:

* technical terms where a pure English translation loses precision (bayyinah/yamin, jarh/ta‘dil, tabdi‘, etc.),
* deciding when to parenthesize transliterations.

### “Mixed structure” segments (TOC, headings, footnotes, quotes)

Hard bits:

* honoring your heading case rules,
* keeping list formatting (line breaks + hyphens),
* preserving bracketed metadata while translating its contents.

---

## Prompt changes that would directly reduce these struggles

### 1) Add a strict, explicit transliteration matrix

You want something like this embedded in the prompt (models clearly need it):

**Transliteration tiers**

1. **Isnād narrators** → ALA-LC with full diacritics (only personal names inside isnād).
2. **Non-isnād personal names (scholars/modern figures)** → *simplified romanization, no diacritics* (define whether you want “bin/ibn,” “al-”, etc.).
3. **Technical terms** → choose one:

   * Option A (minimal): translate to English; only keep Arabic term if ambiguity remains, **without diacritics** (aqeedah, manhaj, tawhid).
   * Option B (scholarly): keep term in simplified transliteration, **no diacritics**, with a short English gloss on first occurrence per document.

**Collectors and books (explicit)**

* “Narrated by al-Bukhari / Muslim / Abu Dawud” = bibliographic → simplified forms, no diacritics.
* If a collector is actually part of an isnād *as a named narrator in the chain*, then treat as narrator and ALA-LC.

Right now, the model keeps guessing these rules.

### 2) Resolve the ﷺ edge cases with a single hard rule

Pick one and state it unequivocally:

* **Strict textual rule (recommended for consistency):** output ﷺ **only** when the Arabic input contains the exact formula “صلى الله عليه وسلم” (or the exact token you accept as equivalent). Otherwise translate the meaning without ﷺ.

If you prefer a broader religious-respect rule, define the exact list of phrases that trigger ﷺ.

### 3) Define one canonical Qur’an reference format

Example spec (choose one):

* **Format:** `(Qur'an 2:42)` and use **English** surah names only if you must mention them, otherwise omit.
* Or: `[al-Baqarah 2:42]` consistently.

Then add: “If the source already contains a bracketed reference, keep it but convert Arabic script to Latin script.”

### 4) Make “no Arabic characters” unambiguous in Unicode terms

Add:

* “Do not output any Arabic-script Unicode characters (Arabic blocks), except ﷺ.”
* “Latin letters with diacritics are allowed **only** where specified (ALA-LC narrators).”

This single sentence eliminates a large amount of dithering in the dump.

### 5) Add a conflict-resolution priority order

Your prompt should tell the model what to do when rules collide:

1. Preserve IDs and segmentation
2. Preserve meaning (accuracy)
3. Preserve formatting constraints (plain text, lists)
4. Apply transliteration rules
5. Apply stylistic preferences (flow, readability)

Right now, models keep revisiting priorities midstream.

### 6) Add a “no inference” rule for truncation/omissions

* “Do not guess missing text.”
* “Preserve ellipses only if present in the input.”

This prevents the “ellipsis hallucination” loop seen in the dump.

### 7) Add an explicit output QA checklist (models like checklists)

Example:

* Scan: no Arabic script appears (except ﷺ).
* IDs unchanged.
* No markdown.
* Lists use line breaks + hyphens.
* ALA-LC appears only on isnād narrators.
* “Allah” vs “god/deity” rules followed.
* Bracketed refs preserved and normalized.

This reduces re-litigating decisions.

---

## Bottom line diagnosis

Your models are not struggling with Arabic comprehension as much as they are struggling with **policy completeness**:

* You have **strong constraints**, but several are **underspecified at the edges** (transliteration scope, ﷺ triggers, Qur’an ref style, diacritics policy, citation/footnote policy).
* Reasoning models respond by “solving the policy” repeatedly, which creates inconsistency.

If you want, I can turn these findings into **one consolidated “translation prompt template”** plus **two variants** (a *minimal* output policy vs a *scholarly* output policy), using the same decision matrix so GPT-5.2 Thinking / Gemini Pro behave consistently across hadith/tafsir/fatawa/biographies/TOC/footnotes.
