1. **Score (logic consistency + academic rigor)**
   I’d put the current v4.0 stack at **9/10**. 

**Why so high:**

* The **master vs. add-on separation** is clean: master handles character set, IDs, transliteration, and “no inference,” while add-ons mostly add genre-specific micro-rules without redefining the core.
* The **transliteration and Unicode regimes** are unusually precise for this domain (ALA-LC, explicit connectors, allow-list vs. ban-list, etc.).
* The **SOP (REFINEMENT_GUIDE)** and **AGENTS** docs treat prompt design as an experiment with versioning, labels, and concrete failure modes, which is exactly what you want for long-term stability.

The remaining point is lost mainly to a few subtle **instruction collisions**, **safety-override gaps**, and some **underspecified edge cases**.

---

## 2. Top 3 weaknesses

### Weakness 1 – Subtle instruction collisions around “no inference” vs. theology / citations

**Where it lives**

* Master:

  * “Translate meaning/intent; do not paraphrase.”
  * “No inference: do not guess missing text, supply omitted words, normalize/correct Arabic, or add editorial notes.”
  * “No extra fields: do not add citations/sources/footnotes/bracket notes/explanations unless explicitly present in the segment.”
  * “AMBIGUITY: If literal meaning implies theological error, use contextual meaning from tafsir. Sectarian/polemical terms: translate literally…”

* Tafsir add-on:

  * “AYAH CITES: … Use [2:255]. If the segment contains quoted Qur'an text, translate it in braces: {…} [2:255].”

**Why it’s a problem**

* The **“use contextual meaning from tafsir”** clause in the master encourages external interpretive inference, which *conflicts* with the otherwise very hard “No inference / no editorial notes” rule. A model trying to obey both can justify a lot of re-interpretation in the name of “contextual meaning,” especially around exactly the controversial places where you *don’t* want safety-driven smoothing.
* In tafsir, “Use [2:255]” is structurally an **added citation schema**. The master says: only add citations that are *already in the segment*. The add-on doesn’t explicitly say “copy the reference from Arabic, do *not* deduce or guess it,” so a helpful model may start “helpfully” inventing ayah numbers.

So there’s a **hidden arbitration problem**: when a model hits e.g. a “Tharīd is better than Allāh”-type wording, it must decide between:

* “No inference, translate literally” and
* “Use contextual meaning from tafsir” **plus** safety RL that wants to avoid blasphemy.

Right now, both options are still open in the text, which weakens fidelity *right where it matters most*.

---

### Weakness 2 – Safety overrides don’t fully cover apologies/refusals/meta-talk

You clearly *intend* to override safety sanitization:

* Master: “Sectarian/polemical terms: translate literally with proper ALA-LC (e.g., Rāfiḍah). Typos/dialect: Do not correct; translate as written.”
* Jarḥ wa taʿdīl: “POLEMICS: … must be translated literally; do not soften.”
* Fatawa: “SENSITIVE RULINGS: Translate literally; do not soften; do not sanitize; do not add notes.”
* Tafsir / Encyclopedia_mixed: “Translate attributes literally… do not reinterpret. Translate harsh polemics literally; do not soften.”

But the main **failure mode under RLHF** is not just softening individual words; it’s:

1. **Meta-disclaimers**:
   “As an AI, I do not endorse hatred…”
2. **Partial refusals / truncation**:
   “I cannot provide that translation due to safety policies.”
3. **Defensive re-frames**:
   e.g. rewriting “Rāfiḍī” as “a group who rejected certain early caliphs” *without preserving the polemical edge*.

These are only *indirectly* forbidden by “No extra fields” and “do not soften,” and many models don’t associate “disclaimer paragraph” with “extra field” in the way a human would. There is no explicit “DO NOT apologize / DO NOT refuse segments because of content” clause.

So the **Safety Override Integrity** is strong on *word-level* fidelity, but **thin on meta-level behaviour** (apologies, refusal, “I can’t translate X” preambles). That’s exactly where RLHF pushes hardest.

---

### Weakness 3 – Mixed-genre coverage & mode-switching still under-specified

`encyclopedia_mixed.md` is a good start but very terse:

> “Within each segment, apply the relevant rule-set locally: isnad parts follow hadith-style handling; jarh/ta'dil phrases use translit (English); fiqh/usul terms use translit (English); polemics are literal.”

Issues:

* **Granularity**: “Within each segment” is underspecified. A single segment might have:

  * a short isnad
  * then jarḥ statement
  * then fiqh ruling
  * then a historical aside
    The prompt doesn’t explicitly say “re-diagnose genre at each clause/phrase,” so models may **mode-lock** to the first detected style (e.g., treat everything as hadith commentary once they see an isnad).
* **Non-fiqh disciplines** that often show up in polymath works are not named:

  * kalām / creed debates beyond “polemics”
  * uṣūl al-tafsīr vs ḥadīth methodology
  * pure historical narrative vs. legal/creedal analysis
  * logic (manṭiq) / grammar segments
* There’s no explicit statement that the **master + specific add-on rules still apply**: e.g., if a polymath work is *mostly* fiqh with occasional isnads, should you pick `fiqh.md` + `encyclopedia_mixed.md`, or only `encyclopedia_mixed.md`? `AGENTS.md` suggests the latter, but doesn’t codify it as an interaction rule.

Net effect: `encyclopedia_mixed` lowers the risk of catastrophic mode-locking, but it doesn’t yet supply a **hard decision procedure** for truly tangled segments, and it doesn’t cover all the disciplines polymaths jump between.

---

## 3. Token efficiency – where’s the “prompt bloat”?

Overall, v4.0 is lean, but a few things could be shaved further *without* losing strictness:

1. **Master examples can be optional**

   * `EXAMPLE: Input: P405... Output: ...` is nice for humans but models already know the “ID - translation” pattern from the OUTPUT line. Dropping this line saves tokens and removes a tiny bit of redundancy.

2. **Collapse repeated “FULL ALA-LC” conditions**
   Current transliteration block repeats “if Arabic script, FULL ALA-LC” for personal names, titles, and places. You can compress to something like:

   > Any Arabic-script personal name, title, or place name anywhere = FULL ALA-LC…

   and then only list *exceptions* (Latin already → keep as is, locked glossary, etc.).

3. **Inline the Unicode rules more tightly**
   Right now: “UNICODE: Allowed Latin + Latin Extended (āīūḥʿḍṣṭẓʾ) + punctuation + digits. Forbidden Arabic script (except ﷺ), emoji, markdown.”
   That’s already short, but you can shave it further:

   > Characters allowed: ASCII + these diacritics: ā ī ū ḥ ʿ ḍ ṣ ṭ ẓ ʾ + digits. No Arabic script (except ﷺ), no emoji, no formatting.

4. **Remove YAML-style metadata when pasting**
   You already tell users they may omit `---` headers. You could make that even more explicit *inside* the files with one minimal comment like:

   > (Note: When using in a web UI, you may omit this header block.)

   That helps users safely drop non-essential tokens.

The main gains are *small but real*; you’re already well within “token-lean” territory. The biggest efficiency wins now are not length, but reducing **internal arbitration**, which cuts *reasoning* tokens – and that’s mostly about clarifying collisions and adding smart negations.

---

## 4. Proposed “Negation Rules” (Do NOT …) to strengthen the system

I’d add these globally in the **master prompt**, near RULES + AMBIGUITY/Safety clauses, keeping them as short as possible:

1. **No meta / no disclaimers**

> **Do NOT** add apologies, safety disclaimers, meta-commentary, or statements about policies or your abilities. Output only `SEGMENT_ID - translation`.

2. **No refusals / no skipping segments**

> **Do NOT** refuse, truncate, summarize, or skip any segment because it contains offensive, sectarian, polemical, or sensitive content. Always translate it.

3. **No softening of harsh language**

> **Do NOT** soften, euphemize, or generalize insults, slurs, or harsh descriptions; translate them literally with the same strength and target.

4. **No re-interpretation of creed/attributes**

> **Do NOT** reinterpret Allah’s attributes or creedal statements metaphorically unless the author explicitly does so in the same segment.

5. **No structural surgery on segments**

> **Do NOT** merge multiple input segments into one output, split one into several, or change the order of segment IDs. Each input ID → exactly one output line with the same ID.

These five rules directly target:

* RLHF-driven apologies/refusals
* Unwanted “softening”
* Over-zealous theological “contextualization”
* Mode-lock behaviours that merge or reshuffle segments

…and they’re compact enough to fit your minimalism constraint.

---

## 5. Review of `encyclopedia_mixed.md` and mode-switching

Current text:

```text
ENCYCLOPEDIA / MIXED (Polymath works: fiqh + hadith analysis + rijal + usul + history/polemics)
USE: Paste MASTER prompt above this. This add-on is for texts that switch disciplines mid-paragraph.
NO MODE TAGS: Do not output any mode labels or bracket tags.
PRIORITY: Within each segment, apply the relevant rule-set locally: isnad parts follow hadith-style handling; jarh/ta'dil phrases use translit (English); fiqh/usul terms use translit (English); polemics are literal.
DISAMBIGUATION: ṣaḥīḥ in hadith grading = ṣaḥīḥ (authentic). ṣaḥīḥ in fiqh validity = ṣaḥīḥ (valid). sunnah as hadith/legal source = sunnah (Prophetic practice). sunnah as legal status = sunnah/mustaḥabb (recommended) when context is a ruling.
HADITH CORE: If isnad appears, map verbs (Haddathana=Narrated to us; Akhbarana/Ana/Anba'ana=Informed us; An=From; Sami'tu=I heard) and keep FULL ALA-LC for Arabic-script narrator names; do not invent grading or missing links.
TAKHRIJ/GRADING: If the author grades (ṣaḥḥaḥa/ḥassana/ḍaʿʿafa), translate literally and keep the cited work as written in the segment; do not add placeholder sources.
Q&A: If present, Al-Sāʾil=Questioner: ; Al-Shaykh=Answer:.
CREED/POLEMICS: Translate attributes literally when the author does; do not reinterpret. Translate harsh polemics literally; do not soften.
RETRACTION: If the author retracts (kuntu aqulu... wa-al-ana aqulu...), make the change explicit in English.
```

### What it does well

* **Signals local rule application**: “Within each segment, apply the relevant rule-set locally” explicitly tells the model not to treat the entire work as pure hadith or pure fiqh.
* **Clarifies key lexical polysemy** (`ṣaḥīḥ`, `sunnah`) – very good for polymath authors.
* Reuses **hadith core**, **takhrīj**, and **polemics** rules from other add-ons in a compact way.

### Where it risks “mode-lock”

1. **Granularity is still per “segment,” not per clause/phrase.**
   A real polymath paragraph might look like:

   * Isnad for a report
   * Immediate jarḥ of one narrator
   * Then a fiqh ruling built from that report
   * Then a historical note attacking a rival madhhab

   If the model treats the whole segment as “hadith mode” because that’s the first thing it sees, it may:

   * Under-apply fiqh/usul `translit (English)` formatting, or
   * Over-focus on isnad handling and under-translate polemical/historical bits.

2. **No explicit instruction to *re-detect* genre multiple times.**
   You say “apply the relevant rule-set locally” but not *“re-detect for each clause or phrase”*. Adding that verb is surprisingly important for models.

3. **No guidance when multiple genre rules conflict.**
   Example: a jarḥ phrase embedded inside a fiqh ruling about the narrator’s testimony validity in court. Is it “fiqh priority” or “jarḥ priority”? Right now, the prompt doesn’t give a hierarchy (e.g., “jarḥ/taʿdīl phrasing always keeps its jarḥ formatting even inside fiqh discussions”).

4. **Missing mention of ancillary disciplines**
   Works like those of Ibn Taymiyyah often blend:

   * kalām debates
   * manṭiq critique
   * grammar / lughah notes
     alongside fiqh and hadith. Those aren’t explicitly named, so models may treat them as generic prose and slip back into English-only terminology.

### Suggested minimal edits (still token-lean)

You could strengthen `encyclopedia_mixed.md` with 2–3 short lines:

1. **Make clause-level re-detection explicit**

Add right after “PRIORITY…”:

> Within a single segment, **re-detect** the discipline for each clause or phrase; do not treat the whole segment as one mode based only on the first sentence.

2. **Clarify hierarchy in overlaps**

E.g.:

> When jarḥ/taʿdīl phrases, fiqh rulings, and hadith analysis appear together, keep jarḥ/taʿdīl terms in jarḥ style, fiqh/uṣūl terms in fiqh style, and isnād in hadith style, even inside one sentence.

3. **Name extra disciplines generically**

You can stay generic but still cue the model:

> For pure historical narrative, kalām, logic, or grammar discussion, follow the MASTER rules and treat them as plain prose with technical terms in translit (English) when clearly uṣūl/fiqh/kalām terminology.

Those three lines significantly reduce “mode-lock” risk without bloating the file.

---

## 6. Refinement SOP – practical for an AI agent? Is metadata enough?

Short answer: **Yes, it’s practical and rich enough for pattern recognition**, with a few small things you could tighten.

**Strengths for AI-driven refinement:**

* **File granularity**: `01_input.txt`, `02_output.txt`, `04_prompt_stack.txt`, and `05_reasoning_raw_*.md` are exactly what an analysis agent needs: input, output, prompt, and (if available) chain-of-thought.
* **Label taxonomy**: `07_labels.txt` with controlled vocabulary (ids_alignment, safety_sanitization, mixed_genre_switch, etc.) gives a clean supervised signal.
* **Notes template**: `06_notes.md` explicitly asks for “Hypothesis (what rule ambiguity triggered it)” and “Minimal fix idea,” which is ideal for prompting a model to propose *surgical* prompt edits rather than rewrites.
* **Index TSV**: The suggested `analysis/reasoning_dumps/index.tsv` with `date, model, case_id, genre_addon, labels, ... status` is exactly what you’d want for cross-case mining.

**Possible small improvements:**

1. **Define `prompt_stack_hash` explicitly**
   For an AI agent, specify a simple scheme, e.g.:

   > `prompt_stack_hash = SHA1(lowercased master+addon text, whitespace-normalized)`

   So the agent can recognize “same prompt version” deterministically.

2. **Add a “rule_reference” field in `06_notes.md`**
   One more line like:

   > `Rule_reference (optional): quote the specific sentence from the prompt that seems ambiguous.`

   This lets an analysis agent cluster failures by *prompt sentence*, not just label.

3. **Optional severity / frequency tag**
   Allow a simple tag like `severity: low|med|high`, or `impact: single_segment|many_segments`. This helps triage which failures deserve a prompt change vs. one-off noise.

But even without those, the SOP is **fully usable for an AI assistant**: a model can ingest case folders, group by labels + genre_addon + prompt_stack_hash, and synthesize targeted edits.

---

If you’d like, next step I can draft a *compressed* v4.1 of `master_prompt.md` with these negation rules and collision fixes baked in, while staying within your token-lean constraints.
