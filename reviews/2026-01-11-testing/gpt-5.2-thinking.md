I reviewed the stacked prompt system in **PEER_REVIEW_CONTEXT.txt**  and focused on where it will actually break under “policy arbitration,” sanitization pressure, and formatting drift.

## 1) Score (logic consistency + academic rigor): **8/10**

**Why it’s strong:** the Master has an explicit “hard negations” block (sanitization / meta-talk / emendation / inference / restructuring)  and a clear Unicode allow/deny statement , plus a tight output schema (“SEGMENT_ID - …”) . The mixed prompt adds a priority matrix + triggers that directly target mode-locking .

**Why it’s not 9–10:** there are still *live collisions* that can cause freezing/token burn (the repo itself calls this “policy arbitration” ), plus a couple of rules that will leak markdown or fail to trigger on real Arabic Q&A markers.

---

## 2) Top 3 weaknesses (highest risk failure modes)

### Weakness #1 — **Markdown / formatting collision (will leak into output)**

* Master says: **plain text only (no markdown/rich formatting)** .
* But multiple add-ons *explicitly instruct markdown bold* for speaker labels: `**Questioner:**` and `**The Shaykh:**`  (same issue in `encyclopedia_mixed.md` ).
  **Impact:** models will sometimes copy the literal `**` into the translation, violating “no markdown,” and in worst cases “learn” that formatting is allowed and start emitting other markdown-ish habits.

### Weakness #2 — **Q&A “structure triggers” are brittle for real Arabic**

Your Q&A trigger text is *Latinized*: `"Al-Sāʾil:"/"Al-Shaykh:"` . In actual Arabic source, the markers are commonly Arabic script (السائل/الشيخ/س/ج/السؤال/الجواب…) or paraphrastic (“قال السائل…”).
**Impact:** the very problem you’re trying to solve (“Q&A labels buried in paragraphs” ) will still occur because the trigger won’t fire in many real inputs.

### Weakness #3 — **Proper-vs-common boundary still ambiguous in edge cases (“blobbing” + scope creep)**

You *do* have the right core rule: common nouns must not be bare transliteration; first occurrence per segment must be `translit (English)` , and you have an Arabic-leak fallback .
But the classification still breaks on common real cases:

* **Title phrases that contain common nouns** (“Masjid …”, “Kitāb …”, “Bāb …”) — are these “proper names” (no parentheses) or “common nouns” (must gloss)? Your “Proper Names = no parentheses” rule  collides with your need to gloss common nouns.
* **Latin-in-input common nouns**: Master says “Names/titles already in Latin/English… keep as written” , which can accidentally “license” bare loanwords unless the common-noun rule is stated as overriding *even when already Latin*.

---

## 3) 5 “Negation Rules” that will harden the system (token-lean, high leverage)

1. **DO NOT output any markdown tokens** in translations (including `**`, backticks, bullets, headings, or code fences). Use plain ASCII punctuation only.
2. **DO NOT emit a transliterated common noun without an English gloss in the same segment on first occurrence**, even if the source already spells it in Latin letters.
3. **DO NOT treat title-phrases as “proper-name exemptions” if they contain a common noun used generically** (e.g., “masjid,” “bāb,” “kitāb” when not part of a fixed title).
4. **DO NOT output any internal-control vocabulary** (e.g., “mode,” “matrix,” “trigger,” “self-check,” “override,” “policy”). These concepts must never appear in the translation.
5. **DO NOT delete parentheses/codes/dates that exist in the source text** (book codes like `(kh)` etc. appear in your jarḥ template expectations ). Treat them as literal characters to preserve.

(These align with your own synthesis emphasis that “hard negations” outperform soft permissions .)

---

## 4) `encyclopedia_mixed.md` review (genre switching + meta-talk / mode-locking)

### What it does well

* The **Priority Matrix + explicit triggers** is the right direction and directly addresses the “mode-locking” diagnosis .
* “Do not merge genres… observe the rule switch at the boundary” is conceptually correct .

### Where it will still fail (and how to fix without bloat)

1. **Internal contradiction: “Proper names… no parentheses” vs geopolitics exonyms with parentheses**

   * Proper names rule: “No parentheses unless technical” 
   * Then: `Filasṭīn (Palestine)` 
     **Fix:** explicitly carve this as the single exception (“Only for modern exonyms: translit (Exonym). Otherwise no parentheses for names.”). Right now, a model can stall deciding which line wins.

2. **Meta-talk risk via “rules language”**
   You already say “NO MODE TAGS” , but the prompt repeatedly uses “Priority Matrix / Genre Triggers / Start X Rules” . Some models will echo these nouns in long runs unless explicitly forbidden (see Negation #4).

3. **Boundary detection is still underspecified**
   Master defines an isnād boundary keyed to transmission verbs and “Qala/Anna” transitions , but the mixed prompt should *explicitly* say: “When isnād ends (first ‘He said:’ boundary), stop applying isnād-name rules to what follows.” Otherwise, the model can “stay in isnād posture” and over-transliterate the fiqh section.

---

## 5) Backtick / formatting noise audit (things that invite markdown output)

### Highest risk items to remove/replace

* **Bold markers in output instructions**: `**Questioner:**` / `**The Shaykh:**`  — this is the cleanest, most direct markdown leak.
* **Backticks around required surface forms** like `` `translit (English)` `` . These are less dangerous than `**`, but they do prime “code formatting.” Prefer plain quotes or caps: `TRANSLIT (ENGLISH)`.

### Also worth trimming (token + noise)

* The YAML-ish headers (`--- original_filename…`) inside prompt files are safe if users omit them, but they are still visual “markdown context.” Your README already tells users they can omit metadata headers ; I’d go one step further and remove these headers from the *final* pasteable templates to reduce accidental inclusion.

---

## Refinement SOP quick review (practicality + labels)

Overall, the SOP is usable and disciplined (good artifact checklist + “Sibling Check”) , and the controlled vocabulary covers your current major failures (e.g., `blobbing_common_nouns`, `structure_collapse_qa`, `mixed_genre_switch`) .

Two missing labels that would materially help:

* **meta_talk_leak** (captures “Mode/Status narration” specifically; currently it gets lumped into `formatting_drift`)
* **markdown_leak** (specifically captures `**`, bullets, code fences, backticks in output)

---

### If you only make 2 edits this cycle

1. **Remove markdown from all “OUTPUT LABELS”** (replace `**Questioner:**` with `Questioner:` everywhere). This resolves a direct Master-vs-add-on collision  .
2. **Expand Q&A triggers to include actual Arabic-script markers** (السائل/الشيخ/س:/ج:/السؤال/الجواب) so the “force newline” instruction actually fires in real corpora .

If you want, I can propose exact replacement text for just those two blocks in a token-minimal form (without rewriting the rest of the prompts).
