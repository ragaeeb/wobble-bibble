### 1. Score (logic-consistency & academic-rigor)

**8 / 10**

*The stack is impressively systematic—iron-rules live in a single master prompt and every add-on inherits them.  The locked glossary, Unicode allow-list, three-pass QA loop, and the dedicated refinement SOP give the project strong academic discipline.  Two points are deducted for residual contradictions (see below) and for a few places where “soft” wording still leaves room for model arbitration.* 

---

### 2. Top 3 weaknesses

| #     | Weakness                                                                                                                                                                                                                                                                                                                              | Evidence & Impact                                                                                                                         |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | **Instruction collision on transliteration vs. “no-Arabic” rule** – the master prompt bans “Arabic script” but does not explicitly exempt Latin-extended diacritics every time.  Several add-ons repeat *“translate literally; do not soften”* without re-stating the allow-list, so models sometimes drop ʿ/ḥ/ā characters or panic. | Master prompt summarises ban while allow-list is a separate bullet; synthesis report lists this as the “No Arabic characters paradox”. ,  |
| **2** | **Safety-override not centralised** – add-ons (e.g., *jarh_wa_tadil*, *encyclopedia_mixed*) rely on the reader remembering the override in README.  If a user forgets to paste README lines, some genre prompts contain no explicit denial of sanitisation, letting RLHF win.                                                         | Safety guidance lives in README not in every prompt; only *encyclopedia_mixed* alludes to “do not soften” in line 446.                    |
| **3** | **Prompt bloat / redundant verbiage** – phrases like “USE: Paste MASTER prompt above this.” and repeating glossary instructions appear in every add-on.  In a UI the user already pastes manually; these dozen lines cost ~30–40 tokens per run.                                                                                      | Add-ons begin with long meta-instructions (e.g., lines 438-444 of *encyclopedia_mixed*).                                                  |

---

### 3. Suggested **negation rules** to tighten behaviour

1. **Do NOT output any meta-narration or explain the translation process.**
   *(Prevents GPT-5.2’s “I will now…” habit.)*

2. **Do NOT replace required translit (English) pairs with English-only synonyms.**
   *(Stops silent term-simplification.)*

3. **Do NOT invent, fill, or reorder missing isnād links, IDs, or segment numbers.**

4. **Do NOT apply ALA-LC diacritics to names already written in Latin script in the source.**

5. **Do NOT omit Latin-extended characters (ā ʿ ḥ etc.)—they are *not* “Arabic script”.**

These can live in **master_prompt.md** so every stack inherits them.

---

### 4. Review of **`encyclopedia_mixed.md`**

**Strengths**

* Local rule-switching is clear: “within each segment, apply the relevant rule-set locally” .
* Disambiguation of overlapping terms (ṣaḥīḥ, sunnah) anticipates common collisions .
* Explicit ban on mode tags prevents “genre labels” leaking into output.

**Gaps / risk of “mode-lock”**

1. **No hierarchy for simultaneous cues.**  If a line contains *both* fiqh ruling and narrator criticism, the prompt doesn’t decide which takes precedence, leaving the model to guess.

2. **Safety reminder missing.**  Only a brief “do not soften” for polemics (line 446).  Embedding the universal safety-override would harden compliance.

3. **Missing guidance for poetry & historical chronology**, both frequent in polymath works (Ibn Taymiyyah’s *al-Jawāb al-Ṣaḥīḥ* interleaves poetry snippets and battle dates).

4. **Token waste.**  The first two lines are meta-instructions the model never needs once pasted.

**Recommendation**

Add a micro-routing table at the top:

```
PRIORITY ORDER: (1) Isnad segment → hadith rules
(2) Ruling keywords (ḥarām / wājib…) → fiqh rules
(3) Jarh/taʿdīl keywords → narrator rules
Else default to plain narrative.
```

…and insert the negation rules #1 & #5 above to guard against meta-talk and lost diacritics.

---

**Overall**, the lab is on solid footing; a handful of concise “Do NOT” clauses and the removal of repeated meta-boilerplate would raise consistency, fight RLHF drift, and free ~100 tokens per stacked prompt without sacrificing fidelity.
