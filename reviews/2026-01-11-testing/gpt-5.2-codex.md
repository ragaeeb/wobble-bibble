# Peer Review: Wobble-Bibble Prompt Stack 1

## Overall Score (Logic Consistency & Academic Rigor)
**7.5 / 10**

Rationale: The master prompt is strong on non-negotiables (IDs, no Arabic, no inference, anti-sanitization) and most add-ons reinforce it. The system is academically grounded, but there are visible collisions and formatting cues that can still cause output drift (notably markdown-style labels, parentheses policies, and mixed-genre switch ambiguity). The SOP is solid but could be tightened for faster triage of recurring failure shapes.

## Top 3 Weaknesses

1. **Markdown leakage via Q&A labels**
   - Add-ons (e.g., `fatawa.md`, `encyclopedia_mixed.md`) instruct output labels using `**Questioner:**` and `**The Shaykh:**`, which conflicts with the master’s “Plain text only (no markdown)” rule. This is a direct instruction collision and can cause markdown output formatting drift.

2. **Common-noun “blobbing” is still possible in mixed segments**
   - The mixed prompt defines `translit (English)` for common nouns on first occurrence, but it does not clearly prioritize that rule over the glossary lock or over the “Proper Names” rule when a term can be both a proper and common noun (e.g., “Sunnah” as a source vs. as legal status). The priority matrix helps, but it’s not explicit about “term-class decision > transliteration decision,” so a model could still output bare transliteration for common nouns when the segment also includes names.

3. **Genre-switch boundaries remain underspecified**
   - The mixed prompt calls for switching at “boundaries,” but does not define what counts as a boundary in a single segment (e.g., narrator chain ends and legal ruling begins without a clear delimiter). This encourages mode-locking, especially when narration/fiqh are fused. The “SEGMENTATION: Do not merge genres” line is a good principle but not operationally precise.

## Suggested Negation Rules (3–5 “Do NOT…”)

1. **Do NOT use markdown markers** (no `**`, backticks, bullet glyphs) in output labels or formatting.
2. **Do NOT output bare transliteration for any common noun**, even if it appears adjacent to a proper name or isnad chain; use `translit (English)` on first occurrence per segment.
3. **Do NOT carry a prior genre’s formatting rules past its boundary**, even if the segment continues; reset to the new genre rules at the first legal/doctrinal trigger.
4. **Do NOT treat glossary locks as permission to skip the term-pair rule** for common nouns (i.e., glossary is a spelling lock, not a formatting override).
5. **Do NOT emit parenthetical examples unless explicitly authorized by the active add-on** (reinforces strict parentheses governance and reduces accidental markdown-like output).

## Review of `encyclopedia_mixed.md`

**Strengths**
- Clear anti-meta-talk and “no mode tags” instruction.
- Explicit “Priority Matrix” and “Genre Triggers” provide a useful heuristic for multi-mode parsing.
- Strong guidance for “blobbing” prevention in common nouns with first-occurrence rule.

**Weaknesses / Risks**
- **Boundary ambiguity**: “translate sequentially observing the rule switch at the boundary” does not define how to find the boundary when isnad and fiqh are interleaved without explicit labels.
- **Label formatting conflict**: The Q&A labels use `**Questioner:**` and `**The Shaykh:**` which violates the “plain text only” requirement in master.
- **Exonym rule uses parentheses**: “Filasṭīn (Palestine)” adds a non-technical parenthetical pair in a way that may collide with master rules. If retained, it should be explicitly listed as an authorized parentheses case in this add-on.

**Recommendation**: Define a deterministic boundary heuristic (e.g., “switch to FIQH rules immediately after a ruling verb such as yajibu/yuḥarramu/ḥalāl/ḥarām even if still in a single segment”). Also replace markdown labels with plain text labels (e.g., “Questioner:” / “The Shaykh:”).

## Backtick / Formatting Noise Audit

- The master prompt uses backticks around `translit (English)` and the add-ons use bold `**Questioner:**`. These create markdown-like tokens that can leak into output, especially when models try to “mirror” formatting. Removing backticks/bold from instruction text or explicitly negating their use in output would reduce accidental markdown generation.

## Instruction Collision Highlights

- **Plain-text-only vs. bold labels**: `master_prompt.md` prohibits markdown, but `fatawa.md` and `encyclopedia_mixed.md` instruct markdown-style output labels.
- **Parentheses governance vs. exonym rule**: The master allows parentheses only for technical term pairs and dates/codes; the mixed prompt uses parentheses for modern exonyms, which is a third category not explicitly authorized by master unless stated.

## Safety Override Integrity

- The master’s “CRITICAL NEGATIONS” are strong and direct, and add-ons reinforce “no sanitization” in key places. However, there is no single rule stating that safety overrides are “always-on” even when ambiguity exists. A short negation like “Do NOT soften polemics even if offensive” should be redundantly repeated in mixed-mode and jarḥ/taʿdīl contexts to reduce RLHF drift.

## Arabic Leakage Guard

- The mixed and fatawa prompts include a minimal “Arabic leakage” repair rule, which is good. But it should clarify that the “repair” occurs silently (no commentary) and should not cause removal of adjacent Latin text. It might also explicitly forbid Arabic script in headings/labels (e.g., “Al-Sāʾil”) in output.

## Token Efficiency Notes

- The master prompt is concise for its scope, but some repeated constraints (no inference, no emendation, no sanitization) appear in both the critical negations and general rules. Consider consolidating duplicates into the CRITICAL NEGATIONS block to reduce bloat.
- Several add-ons repeat similar text around Q&A structure and Arabic leakage. Consider a shared “structural micro-block” that is pasted into relevant add-ons to keep them uniform and shorter.

## Refinement SOP Review (`REFINEMENT_GUIDE.md`)

**Strong points**
- Clear artifacts list and case folder layout; good for reproducibility.
- Controlled vocabulary labels and triage steps are well-specified.
- The “Sibling Check” and regression steps are pragmatic.

**Weak points**
- The label set could use explicit “mode_locking” or “genre_boundary_ambiguity” for mixed prompts to capture the exact failure class.
- The notes template could include “Boundary trigger present?” or “Trigger missing?” to identify systematic boundary failures quickly.

**Suggestion**: Add a label for `mode_locking` and a short line in the notes template that records whether any of the “Genre Triggers” were present but ignored.

# Peer Review — GPT-5.2-Codex 2

## Overall Score (Logic Consistency + Academic Rigor)
**8/10** — The core logic is strong and rigorous, with clear negations and a well-scoped transliteration policy. The remaining issues are primarily instruction collisions (markdown vs. plain text), a few ambiguous formatting permissions (parentheses usage for exonyms), and some structural triggers that could be tightened to avoid collapse in mixed Q&A passages.

---

## Top 3 Weaknesses

1. **Markdown Collision in Q&A Labels**
   - **Issue:** The `master_prompt.md` bans markdown (“Plain text only”), yet both `encyclopedia_mixed.md` and `fatawa.md` specify bold labels: `**Questioner:**` / `**The Shaykh:**`.
   - **Impact:** High risk of the model outputting markdown even when explicitly prohibited.
   - **Fix direction:** Switch to plain-text labels (`Questioner:` / `The Shaykh:`) and explicitly forbid markdown in the add-ons to avoid conflict.

2. **Parentheses Permission Ambiguity (Exonyms vs. Technical Terms)**
   - **Issue:** Master allows parentheses only for technical term pairs or dates/codes. The mixed add-on introduces geopolitics exonyms like `Filasṭīn (Palestine)` without explicitly re-authorizing parentheses for exonyms as a special case.
   - **Impact:** Potential internal collision (“Parentheses allowed only for technical terms” vs. “Use for exonyms once”). This could lead to either no exonyms or inconsistent parentheses usage.
   - **Fix direction:** Add a tight clause in the mixed add-on (or master) authorizing exonym pairs explicitly as a third allowed parentheses case, or move exonym pairs into the technical-term bucket.

3. **Q&A Triggers Too Narrow for Mixed Dialogues**
   - **Issue:** The mixed add-on only triggers on `Al-Sāʾil` / `Al-Shaykh` or explicit English labels. Real-world texts frequently include variants (`al-sā'il`, `قال السائل`, `Q:` / `A:`). 
   - **Impact:** Paragraph merging or collapsed dialogues, especially in mixed-discipline texts (the scenario most likely to contain interrupts and turn-taking).
   - **Fix direction:** Expand Q&A trigger list to include Arabic-script and common shorthand variants, or add a small generic rule: “If a segment contains alternating question/answer markers, force line breaks and labels.”

---

## Proposed Negation Rules (3–5)

1. **Do NOT output any markdown, including bold, italics, bullets, or backticks.**
2. **Do NOT use parentheses for anything except explicitly allowed categories (technical-term pairs, dates/codes, and any add-on–authorized exonym pairs).**
3. **Do NOT emit Q&A labels without a line break; each question/answer must start on its own line.**
4. **Do NOT introduce English exonyms without a paired transliteration or explicit authorization in the add-on.**
5. **Do NOT announce genre switching or internal rule changes (no “now switching to isnad/fiqh mode”).**

---

## Review of `encyclopedia_mixed.md` (Genre Switching + Meta-Talk)

**Strengths**
- The **Priority Matrix** and **Genre Triggers** are well-structured and should reduce mode-locking by explicitly enumerating switch points and precedence order.
- The **Segmentation** rule is clear about sequential handling and avoids forced blending.

**Risks & Improvements**
- **Meta-talk risk:** “Start Isnad Rules” / “Start Quote Rules” can invite internal narration. Tighten with a negation rule that forbids any meta labels and insists on silent switching.
- **Structural clarity:** The Q&A label formatting must be plain text. The current bold labels directly conflict with the master’s “no markdown” rule.
- **Parentheses scope:** The exonym rule uses parentheses (e.g., `Filasṭīn (Palestine)`) but the master only allows parentheses for technical terms or dates/codes. This should be re-authorized explicitly to avoid collision.

**Verdict:** The mixed add-on is strong for switching, but it needs explicit “no meta talk” plus tighter formatting permissions to prevent markdown leakage and ensure consistent parentheses governance.

---

## Backtick / Formatting Noise Audit

**Findings**
- Multiple prompts use inline backticks for `translit (English)` and examples like `wājib (obligatory)`.
- Two add-ons specify bold labels using `**...**`.

**Risk**
- These formatting cues can leak into output, especially in long runs or when the model is under pressure to format.

**Recommendation**
- Replace backticks with plain text quoting (e.g., “translit (English)”) and remove bold markup from all output labels.
- Add an explicit negation: “Do NOT output any backticks or markdown formatting.”

---

## Instruction Collisions Checklist (Quick Scan)

- **Markdown vs. Plain Text:** `master_prompt.md` bans markdown; `encyclopedia_mixed.md` and `fatawa.md` instruct bold output labels → **collision**.
- **Parentheses Governance:** Master limits parentheses; mixed add-on allows exonym pairs without explicit allowance → **potential collision**.
- **Structural Rules:** “Force NEW LINE” is good but limited triggers may allow dialogue collapse → **coverage gap**, not a direct contradiction.

---

## Refinement SOP Practicality

**Assessment:** The SOP is practical, concise, and structured for real-world forensic debugging. The taxonomy is strong and should capture the current failure shapes (blobbing, structure collapse, mode-locking, etc.).

**Small improvement suggestion:** Consider adding a label for “markdown leak / formatting leak” (e.g., `formatting_markdown_leak`) to help track violations of the plain-text rule.

# Wobble-Bibble Prompt Lab Peer Review (GPT-5.2-Codex) 3

## Score (1–10)
**Logic consistency:** 7.5/10  
**Academic rigor:** 8/10

### Rationale
The master prompt is strong on structure, fidelity, and transliteration scope, and the mixed add-on attempts to handle genre switching with a priority matrix. The biggest risks are (a) formatting collisions with “plain text only,” (b) Q&A label injection that can be interpreted as “extra fields,” and (c) token-noise that invites markdown or meta-output. The SOP is practical and research-friendly but could use a small label expansion for newer failure shapes (meta-talk, markdown leakage).

---

## 1) Instruction Collisions (Master vs. Add-ons)
1. **Markdown/formatting conflict**: The master says “Plain text only (no markdown/rich formatting),” but both `fatawa.md` and `encyclopedia_mixed.md` instruct bold output labels (`**Questioner:**`, `**The Shaykh:**`). This is a direct collision and may trigger markdown output formatting.
2. **“No extra fields” vs. Q&A label insertion**: The master forbids extra fields unless present. The add-ons instruct labels even mid-segment; if those labels are not present in the Arabic, this can be interpreted as adding non-source structure.
3. **Parentheses/inline format governance**: The master restricts parentheses to `translit (English)` pairs; add-ons contain backtick syntax and example parentheticals that could be mistaken as output requirements unless clearly framed as “instructional only.”

---

## 2) Safety Override Integrity
The master’s “CRITICAL NEGATIONS” are explicit and repeated in add-ons. The system is strong but still vulnerable to “softening by paraphrase.” A stronger, single-line negation that explicitly bans “politeness paraphrase” and “generic replacements” would help counter RLHF defaults.

---

## 3) The “Blobbing” Test
The add-ons explicitly require `translit (English)` for common nouns and transliteration-only for proper names. This is good, but there is a leakage risk if a model treats “sect names” and “group labels” as common nouns. One additional line clarifying that **sects are proper names** (translit only) would reduce ambiguity.

---

## 4) Structural Integrity (Q&A Triggers)
The new-line rule is good, but it doesn’t explicitly say “only when those labels appear in the source.” In mixed texts, the model may invent labels to restore “structure.” This creates a risk of output drift and could trigger a false positive for “extra fields.”

---

## 5) Arabic Leakage Guard (Proper vs. Common Noun)
The guard exists, but it’s split across master and add-ons. Because leakage correction is duplicated, it’s easy to drift between scopes (e.g., proper names in book titles vs. common nouns in technical terms). A single precedence line would reduce confusion: “If Arabic script leaks: decide proper vs. common noun first, then apply either translit-only or `translit (English)`.”

---

## 6) Meta-Talk Risk
The add-ons use “Priority Matrix,” “Genre Triggers,” and “Start Isnad Rules.” While these are internal instructions, the phrasing may tempt some models to narrate their mode decisions. A compact negation in add-ons would help: “Do NOT announce mode switches or rule application.”

---

## 7) Token Efficiency / Prompt Bloat
- Multiple “no extra fields/no citations/no bracket notes” statements can be condensed.
- The transliteration section in the master is essential but verbose; it could be compressed into a precedence list (Arabic script → ALA‑LC; Latin already → keep; glossary overrides).
- The add-on priority matrix is clear but long; collapsing to four short bullet triggers would reduce token load without sacrificing logic.

---

## 8) Refinement SOP Practicality
The SOP is clear and reproducible. Two small upgrades:
1. **Add a “meta_talk” and “markdown_output” label** to `07_labels.txt` to cover new failure shapes.
2. **Explicitly capture refusal/safety boilerplate** in `06_notes.md` so sanitization failures are easy to detect.

---

## Top 3 Weaknesses
1. **Formatting collision**: Bold labels in add-ons contradict “plain text only.”
2. **Q&A label scope ambiguity**: The model might insert labels when the Arabic lacks them, violating “no extra fields.”
3. **Mode/priority language could provoke meta-output** in long mixed segments.

---

## Proposed Negation Rules (3–5)
1. **Do NOT** output markdown formatting (bold, italics, backticks, bullets, or headers).
2. **Do NOT** insert Q&A labels unless the source explicitly contains them.
3. **Do NOT** replace polemical terms with polite or generic paraphrases (e.g., “a sect” in place of Rāfiḍah).
4. **Do NOT** announce mode switches or describe which rule you are applying.
5. **Do NOT** use parentheses for anything other than required `translit (English)` pairs or explicitly authorized dates/codes.

---

## Review of `prompts/encyclopedia_mixed.md`
**Strengths**
- Clear priority matrix for mixed genres and explicit safety override.
- Strong anti‑blobbing rule for common nouns.
- Explicit Arabic leakage remediation.

**Weaknesses / Missing clarifications**
- Output label format uses markdown (`**Questioner:**`), conflicting with master.
- Q&A trigger lacks the “only if present in source” clause.
- “Genre triggers” are listed, but there is no “do not narrate mode” negation, which can invite meta-talk.

**Suggested one‑line fix (token‑lean)**
> “When Q&A labels appear in the source, output them as plain text (no markdown) and do not add any labels not present in the segment.”

---

## Backtick / Formatting Noise Audit
- Backticks appear in `master_prompt.md`, `fatawa.md`, and `encyclopedia_mixed.md` for `translit (English)` examples. While likely instructional, they can encourage markdown output. Consider removing backticks and using plain text examples instead.
- Bold markers (`**...**`) in add-ons are a direct markdown trigger; they should be replaced with plain text labels.

---

## Overall Verdict
The system is academically strong, but it needs small, high‑impact cleanups to avoid format drift (markdown), eliminate ambiguous Q&A label injection, and prevent meta‑narration in mixed‑genre passages. These are minimal changes that preserve fidelity while improving robustness.

# Wobble-Bibble Peer Review (GPT-5.2-Codex)

## Score (1–10)
**Logic consistency:** 7.5/10  
**Academic rigor:** 8/10

## Top 3 Weaknesses
1. **Markdown leakage in output labels**: The mixed prompt mandates bold output labels (`**Questioner:**`, `**The Shaykh:**`), which conflicts with the Master’s plain-text-only rule and risks Markdown output. This also creates instruction collisions between add-on and master. 【F:prompts/encyclopedia_mixed.md†L6-L8】【F:prompts/master_prompt.md†L12-L14】
2. **Parentheses scope conflict (exonyms vs. master constraints)**: The mixed prompt allows place-name pairs like `Filasṭīn (Palestine)`, but the Master only allows parentheses for technical-term pairs or explicit add-on authorization for dates/codes. This can cause a rule collision and encourage non-technical parenthetical usage. 【F:prompts/encyclopedia_mixed.md†L11-L12】【F:prompts/master_prompt.md†L12-L14】
3. **Ambiguity in Q&A segmentation vs. “No restructuring”**: The add-on requires forced newlines for Q&A markers, which could be interpreted as restructuring if segments are not already line-broken. The Master says “Do NOT merge, split, or reorder segments,” but does not clarify that line breaks inside a segment are allowed for structure, increasing collision risk. 【F:prompts/encyclopedia_mixed.md†L6-L7】【F:prompts/master_prompt.md†L10-L11】

## Proposed Negation Rules (3–5)
1. **Do NOT use Markdown formatting in output** (no bold, italics, bullet prefixes, or backticks), even for Q&A labels. 【F:prompts/master_prompt.md†L12-L14】
2. **Do NOT use parentheses for exonyms or clarifying glosses unless explicitly declared as a technical-term pair or authorized date/code rule.** 【F:prompts/master_prompt.md†L12-L14】
3. **Do NOT alter segment boundaries**: line breaks are permitted only within the same segment and only to surface explicit labels (Q/A), never to split or merge segment IDs. 【F:prompts/master_prompt.md†L10-L11】【F:prompts/encyclopedia_mixed.md†L6-L7】
4. **Do NOT output mode names, priority labels, or genre tags** (e.g., “Hadith mode,” “Rijal rules”), even if a rule switch occurs mid-segment. 【F:prompts/encyclopedia_mixed.md†L3-L4】
5. **Do NOT replace a proper-name transliteration with an English exonym unless the input already uses that exonym.** This avoids unintended normalization or “helpful” substitution. 【F:prompts/master_prompt.md†L13-L15】

## Encyclopedia Mixed Prompt Review (Genre Switching + Meta-talk Risk)
- **Strengths**: The explicit Priority Matrix and trigger list are good for reducing mode-locking by making rule-switches explicit and ordered. The “NO MODE TAGS” line is a solid guard against meta-talk. 【F:prompts/encyclopedia_mixed.md†L3-L4】【F:prompts/encyclopedia_mixed.md†L20-L31】
- **Weak points**:
  - The Q&A output labels currently require bold Markdown, which can cause markdown leakage and encourage meta-formatting rather than plain text. 【F:prompts/encyclopedia_mixed.md†L6-L8】
  - The “SEGMENTATION: Do not merge genres” + forced Q&A new lines could be read as “split segments,” so it would benefit from explicit clarification that the segment ID remains single and only line breaks may be inserted within it. 【F:prompts/encyclopedia_mixed.md†L33-L33】【F:prompts/master_prompt.md†L10-L11】
  - The “GEOPOLITICS” exonym rule conflicts with the Master’s parentheses constraints and can invite parenthetical glossing beyond technical terms. 【F:prompts/encyclopedia_mixed.md†L11-L12】【F:prompts/master_prompt.md†L12-L14】

## Backtick / Formatting Noise Check
- Backticks around `translit (English)` and Markdown bold (`**Questioner:**`) are present in the add-on. These increase the chance of markdown output, which conflicts with the Master’s “plain text only” rule. Consider removing backticks and bold markers or rephrasing as plain text instructions. 【F:prompts/encyclopedia_mixed.md†L7-L14】【F:prompts/master_prompt.md†L12-L14】

## Refinement SOP Assessment
- The SOP is practical and well-scoped for agent use: it enforces artifact capture, controlled labeling, and minimal fixes. Labels cover current failure shapes (blobbing, structure collapse, mixed-genre switch), and the “sibling check” and regression rules are solid. One gap: there is no label for “markdown leakage” or “formatting meta,” which is a recurring risk given the prompt’s emphasis on “no markdown.” 【F:REFINEMENT_GUIDE.md†L55-L79】【F:REFINEMENT_GUIDE.md†L99-L117】