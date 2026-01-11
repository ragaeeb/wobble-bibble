## 1) Score (1–10)

**Logic consistency:** **6.5 / 10**
**Academic rigor / fidelity orientation:** **8 / 10**

Why: the system is strongly fidelity-forward (IDs-first, no inference, no added sources) , but there are a few *real* rule-collisions between the master and add-ons that will force models into arbitration (and that’s exactly the failure mode your synthesis warns about: “policy arbitration” consuming reasoning) .

---

## 2) Instruction collisions (master vs add-ons)

### Collision A — **Parentheses ban vs genre needs**

Master: “**Parentheses are allowed only** for required technical-term pairs in the form: translit (English).” 
But jarḥ/taʿdīl explicitly requires preserving codes that often appear **in parentheses** like “(kh) (m) …” , and hadith also preserves “rumuz/codes” .

**Net effect:** models will sometimes “sanitize” by deleting parentheses/codes to comply with master, damaging scholarly utility.

**Minimal fix idea:** change the master rule to:

> “Parentheses may be used **only** for (a) technical-term pairs **and** (b) parentheses that already exist in the source segment (e.g., book codes). Do not introduce other parentheses.”

### Collision B — **Transliteration scope is “anywhere” vs add-on intent to scope it**

Master: “Any Arabic-script personal name/title **anywhere** = FULL ALA-LC.” 
Hadith add-on: “Distinguish isnad vs matn” , and your synthesis explicitly flags “transliteration boundary confusion” as a major failure mode .

**Net effect:** “anywhere” defeats the very scoping that reduces drift; it increases diacritics “creep” into matn/commentary where many editors prefer conventional spellings.

**Minimal fix idea:** put an explicit **precedence** line in master:

> “If an add-on defines a narrower transliteration scope for a genre, follow the add-on scope (while keeping Unicode and ‘no Arabic script except ﷺ’).”

### Collision C — **“No extra fields / no invented brackets” vs tafsīr verse formatting**

Master: “No extra fields… do not add… bracket notes…” 
Tafsīr add-on mandates formatting Qur’an citations as “[2:255]” and braces for quoted Qur’an text .

**Net effect:** if the Arabic does *not* already include a bracketed reference, a strict reading of master makes the tafsīr rule “illegal,” and models will flip-flop.

**Minimal fix idea:** in tafsīr add-on, explicitly tie the formatting to presence of an ayah pointer in the segment (even if not bracketed), e.g.:

> “If the segment includes a surah:ayah reference in any form, normalize it to [s:a]. Otherwise, keep the citation style as written.”

---

## 3) Top 3 weaknesses (most consequential)

### 1) **Missing conflict-resolution / precedence rule**

You *conceptually* stack prompts (“master + add-on”), but nowhere is it stated: “Add-on overrides master when they conflict, except Golden Rules.” This is why you get “policy arbitration” .

**One-line fix:** add to master (near top):

> “PRECEDENCE: Golden Rules > this master > add-on. When master and add-on conflict, follow the add-on unless it violates Golden Rules.”

(Or invert depending on your intent—but make it explicit.)

### 2) **Safety override isn’t “anti-sanitization” enough at the output surface**

You do say “Sectarian/polemical terms: translate literally…”  and add-ons repeat “do not soften” (e.g., jarḥ prompt) , but what often happens in practice is *not* outright refusal—it's:

* euphemism substitution (“extremists” / “certain group”),
* dropping slurs/harsh adjectives,
* adding moral framing/disclaimers.

Your current rules don’t explicitly forbid those common “sanitization shapes.”

### 3) **Repo-level internal contradiction between “analysis recommendations” and “final master”**

Your synthesis recommends, as a proposed fix, correcting obvious typos and adding a note , while the master forbids correction and forbids editorial notes  and reiterates “Typos/dialect: Do not correct; translate as written.” 

Even if the synthesis is “just research,” this contradiction can mislead refiners and pollute future iterations.

---

## 4) 3–5 specific “Negation Rules” to strengthen the system

These are designed to target *actual* RLHF-sanitization failure shapes and formatting drift, while staying token-lean.

1. **Do NOT euphemize polemics.**
   Do NOT replace sectarian labels or insults with generalized substitutes (“a group,” “some people,” “extremists”). Translate the specific label literally as used.

2. **Do NOT delete harsh modifiers.**
   Do NOT omit pejorative adjectives/nouns (e.g., “liar,” “imposter,” etc.) when they appear in the Arabic; keep the harshness intact. (This aligns with jarḥ’s “must be translated literally; do not soften.” )

3. **Do NOT add framing/disclaimers.**
   Do NOT add content warnings, apologies, moral commentary, modern political reframing, or “as an AI…” statements. Output translation only.

4. **Do NOT “normalize” structure.**
   Do NOT merge/split/reorder IDs or compress chains/lists “for readability.” IDs must remain first token and in order .

5. **Do NOT introduce new punctuation schemas.**
   Do NOT add brackets/parentheses/labels unless (a) present in the source segment, or (b) explicitly required by an add-on rule (e.g., technical term pairs) .

(That #5 also cleanly resolves the parentheses-vs-rumuz conflict.)

---

## 5) Token efficiency (prompt bloat) — what to cut/merge

The master is already fairly compact, but the biggest wins are from **eliminating repeated negatives** and **compressing enumerations**:

* **Merge “no inference” + “no editorial notes” + “no extra fields”** into one “NO INSERTIONS” line, because they currently repeat similar prohibitions .
* **Glossary:** keep it, but consider splitting into:

  * “global locked” (very small, truly universal)
  * “genre locked” (jarḥ terms, fiqh terms, uṣūl terms), since add-ons already do this well.
* **Example line:** the master example is helpful, but if token pressure matters, it’s one of the first safe deletions .
* **Transliteration section:** it’s doing many jobs at once (names, places, titles, months) . A short decision-order (3–5 lines) often reduces dithering more than a long paragraph.

---

## 6) Edge case coverage gaps (especially for “mixed” works)

Even with `encyclopedia_mixed.md`, you’re still missing explicit handling for a few common polymath edge cases:

* **Arabic-Indic digits / numeral normalization.** Your synthesis notes digit issues as a model weakness , but prompts don’t say whether to keep Arabic-Indic numerals as-is, convert to Western digits, or preserve both.
* **Inline poetry / sajʿ / rhymed prose outside tafsīr.** Tafsīr has a poetry rule , but mixed works will also contain verse.
* **Variant readings / qirāʾāt / “qīla… wa qīla” chains** that look like isnād logic but are not transmission chains.
* **Manuscript apparatus**: marginalia, “in some copies…,” sigla, lacuna markers, illegible text markers.
* **Quotations inside quotations** (fiqh quoting hadith quoting someone): without a local scoping instruction, models often “mode-lock” to hadith handling across the whole segment.

---

## 7) Refinement SOP review (practicality + metadata signal)

Overall: **practical and agent-friendly**. It forces exact prompt-stack capture (critical for stacked systems) , defines a clean case folder schema , and uses controlled labels for later clustering .

Two improvements that would add a lot of pattern-recognition signal:

1. **Add a “failure signature” line** to `06_notes.md`: a short literal snippet of the wrong behavior (e.g., “removed (kh) codes”; “changed Rāfiḍah → ‘rejectors’”). This makes later retrieval much stronger than labels alone.

2. **Add a “prompt diff” artifact** (e.g., `09_patch.txt`) that records the *exact* minimal change made + why. You already encourage minimal fixes —this just makes it auditable.

Also: your SOP tells refiners to “Prefer negations” , which matches how models actually comply under conflict—good call.

---

## 8) `encyclopedia_mixed.md` review (genre-switching without mode-lock)

What it does well:

* It explicitly forbids mode tags  (good: tags often cause unwanted schema output).
* It states “apply the relevant rule-set locally within each segment” , which is the right *principle* for mid-paragraph switching.
* It includes high-value disambiguations for **ṣaḥīḥ** and **sunnah** —these are classic “mode-lock” triggers.

Where it’s still vulnerable:

* “Within each segment” is sometimes too coarse. A single segment can contain: isnād → matn → fiqh inference → jarḥ comment. Without a line-level instruction, models often apply hadith-name diacritics or hadith verb mapping beyond the isnād span.
* It doesn’t explicitly say: **“Do not carry the prior segment’s mode forward.”** (That’s a surprisingly common failure.)

Minimal hardening edits (token-lean) I’d add to `encyclopedia_mixed.md`:

* **SEGMENT RESET:** “Treat each segment independently; do not carry a mode from the previous segment.”
* **SPAN SCOPE:** “Apply hadith isnād rules only to the isnād span (per master isnād boundary); revert immediately after matn begins.” (This leverages your master’s boundary definition )
* **LOCAL QUOTES:** “If a segment quotes a different genre, apply rules only inside the quotation.”

That should materially reduce “mode-locking” while keeping the add-on short.

---

If you want the single highest ROI change: **fix the parentheses collision + add an explicit precedence rule.** Those two patches alone will remove a lot of arbitration pressure and prevent “silent scholarly-data loss” (codes, sigla, etc.).
