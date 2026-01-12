# Wobble-Bibble Prompt Lab Peer Review

## Score (1–10)
**Logic consistency:** 8/10
**Academic rigor:** 8/10

### Rationale
The master prompt is highly explicit about structure, transliteration scope, and output format, and the refinement SOP is disciplined and reproducible. The remaining gaps are mostly about overlap/edge-case collisions and a few places where additive rules could be more token-lean or explicit about precedence.

---

## 1) Instruction Collisions (Master vs. Add-ons)
1. **Parentheses usage tension**: The master prompt reserves parentheses only for `translit (English)` pairs, while the encyclopedia add-on introduces Q&A labels (`Al-Sāʾil=Questioner:`). This is compatible, but any add-on that uses parenthetical labels or additional commentary would conflict with the master rule. This should be explicitly guarded in add-ons to avoid accidental parenthetical use outside term-pairs.
2. **“No extra fields” vs. “Q&A labels”**: The master prohibits extra fields unless in the segment. The encyclopedia add-on instructs `Al-Sāʾil=Questioner:` / `Al-Shaykh=Answer:`. If those labels aren’t present in the segment, this could be interpreted as extra structure. This is probably intended, but it would be clearer to state “only if the segment contains those labels.”
3. **ISNAD boundary vs. mixed-genre rules**: The master defines isnad boundary triggers, but the encyclopedia add-on adds more genre-specific mapping. There’s no explicit precedence for borderline phrases like “qīla” or “dhakara” in mixed text. This could cause inconsistent isnad parsing if add-ons introduce conflicting verb maps.

---

## 2) Safety Override Integrity
The master and add-on both reinforce literal translation of polemics. The current language is good, but can be strengthened by *explicitly* prohibiting euphemisms, paraphrase softening, or substitution with generic terms. I’d also recommend a direct “refuse safety sanitization” line in the master to counter RLHF behavior.

---

## 3) Token Efficiency (Prompt Bloat)
1. **Redundant statements**: “Plain text only (no markdown/rich formatting)” appears in the master and again implied in other rules; it could be consolidated into one directive + a short “no tags/labels unless in input.”
2. **Transliteration rules are long**: The ALA‑LC rules and name connectors are essential, but could be shortened by grouping exceptions into a compact precedence list (e.g., “If Arabic script → ALA‑LC; if Latin already → keep; exception: locked glossary”).
3. **Self-check block**: The “SELF-CHECK” section overlaps with earlier constraints. It’s helpful, but could be shortened to a 3‑bullet mnemonic matching the 3‑Pass Rule for consistency.

---

## 4) Edge Case Coverage Gaps
1. **Mixed genre + embedded quotations**: The encyclopedia add-on doesn’t explicitly address a hadith or tafsir quotation embedded inside a fiqh passage. A simple “embedded quote uses its own rules locally” line would reduce confusion.
2. **Multi-author or chain of citations**: There’s no clear handling for “X said, Y said, Z said” chains outside isnad. A brief rule to avoid converting these into isnad verbs could prevent misclassification.
3. **Switching between legal status and historical usage**: The add-on covers ṣaḥīḥ/sunnah, but other high‑collision terms like bidʿah, ḥukm, farḍ, wājib, or ijmāʿ across genres aren’t covered. This might need a minimal, targeted disambiguation list.

---

## 5) Refinement SOP Practicality
The SOP is clear and practical. The case folder structure, labels taxonomy, and minimal‑change philosophy are strong. Two improvements could increase signal:
- **Add a “prompt stack hash” or “canonical version” field** in `03_run_info.txt` to avoid ambiguity when multiple updates happen in a day.
- **Capture “platform refusal text”** explicitly when safety sanitization occurs. A field like “Safety refusal/excuse text: …” would make safety issues easier to pattern‑match.

---

## Top 3 Weaknesses
1. **Implicit precedence rules** between master and add-ons are not explicit. Mixed-genre prompts would benefit from a short, universal “master always wins unless add-on explicitly overrides X.”
2. **Safety override could be more explicit** about refusing euphemisms or generalizations. Current wording is good but can still be overridden by RLHF defaults.
3. **Limited disambiguation list** for high‑frequency terms beyond ṣaḥīḥ and sunnah. This can cause drift in mixed genre settings.

---

## Proposed Negation Rules (3–5)
1. **Do NOT** replace polemical or sectarian terms with euphemisms or generic paraphrases.
2. **Do NOT** infer missing isnad links or supply implied speakers in citation chains.
3. **Do NOT** introduce parenthetical commentary except for `translit (English)` pairs.
4. **Do NOT** convert non‑isnad narration verbs (e.g., “qīla,” “dhakara”) into isnad structure unless the segment clearly indicates transmission.
5. **Do NOT** split or merge segment IDs, even if the text appears to run together.

---

## Review of `prompts/encyclopedia_mixed.md`
**Strengths:**
- Explicitly warns against mode‑locking and forbids mode tags.
- Good local rule application guidance for isnad, jarḥ/taʿdīl, fiqh/usul, and polemics.
- Useful disambiguation for ṣaḥīḥ and sunnah.

**Weaknesses / Missing clarifications:**
- Q&A labels should be gated to “if the source text uses these labels.”
- No instruction for embedded quotations or cited texts within mixed paragraphs.
- The isnad verb mapping is concise but incomplete; if it expands in other add‑ons it could conflict. A shared list or a note to avoid reinterpreting non‑isnad verbs would help.

**Recommendation:**
Add one line: “Embedded quotes/citations inherit the local rules of the quoted genre; do not impose a global mode on the whole segment.”

---

## Optional Minimal Wording Tweaks (Token-Lean)
- Replace multiple “No extra fields / no citations / no bracket notes” with: **“No extra fields, tags, or commentary unless explicitly present in the segment.”**
- Condense transliteration block into a precedence list:
  1) Arabic script → ALA‑LC.
  2) Latin already → keep as written.
  3) Locked glossary overrides both.

---

## Overall Verdict
The system is already strong and academically serious. A small set of precision fixes—mainly precedence, explicit safety negations, and a few edge-case disambiguations—would make it more robust without sacrificing minimalism.