# The Wobble-Bibble Refinement Protocol (SOP)

This SOP defines a disciplined loop for improving `prompts/*` using real failed/struggling runs. The goal is to fix model behavior (dithering, sanitization, hallucination, formatting drift) with minimal, testable prompt edits.

## 0) Key premise: “Inheritance” in web UIs
“Inheritance” is conceptual only. Models cannot read files from this repo in a web UI.
Always record the exact stacked prompt text you used: `master_prompt.md` pasted first + one add-on pasted below it.

## 1) When to open a refinement case
Create a case folder whenever any of these happen:
- IDs dropped/merged/reordered/reformatted
- Arabic script leaked (other than ﷺ) or other forbidden characters appear
- Transliteration boundary error (wrong scope, missing diacritics, wrong b./Ibn)
- Technical term drift (e.g., ṣaḥīḥ validity vs authenticity; sunnah ambiguity)
- Sanitization of polemics or legal rulings (“safety panic”)
- Citation/source invented or templated
- “Correction loop” / emendation / best-guess reconstruction (hallucination risk)
- Term-format drift (e.g., outputting English-only keywords when `translit (English)` was required)
- Arabic leakage inside term-pairs (e.g., Arabic script used as the “translit” half: `اختلاف (disagreement)` instead of `ikhtilāf (disagreement)`)
- Long dithering or self-contradiction across the same segment set

## 2) Storage layout (small, searchable, LLM-friendly)
Do NOT dump everything into one giant file. Use one folder per case:

`archive/benchmarks/YYYY-MM/DD/{case_id_slug}/`

Example:
`archive/benchmarks/2026-01/11/2026-01-11_gpt52-thinking_mughni_ids_dropped/`

Case ID rules:
- ASCII only, no spaces
- Format: `YYYY-MM-DD_modelShort_problemSlug`

## 3) What to capture (required artifacts)
In each case folder, save these files (copy/paste exact text):

`01_input.txt`
- The exact Arabic segments as sent (including IDs).

`02_output.txt`
- The model’s final output as received.

`03_run_info.txt`
- Model name/version, date/time, UI/platform, and settings (thinking on/off, temperature, etc.).
- Critical: List the prompt versions used (e.g., `prompts/master_prompt.md (v4) + prompts/hadith.md (v4)`).
- Prompt Hash (if using version control or hashing tool): The short hash of the prompt stack.
  - Define Prompt Hash as: hash of `04_prompt_stack.txt` (master + add-on), not of the Arabic input/output.

`04_prompt_stack.txt`
- The exact prompt text you pasted (Master + Specialized Add-on).
- Do not include the Arabic content here (keep that in `01_input.txt` to keep things modular).
- **NOTE:** Do NOT save `prompt_master.txt` and `prompt_addon.txt` as separate files. Only save this combined stack to reduce directory clutter.

`05_reasoning_raw_01.md` (and more chunks if needed)
- The model’s reasoning trace, "thinking" block, or explanation. Capture whatever the platform provides.
- If reasoning is not available, create the file anyway and write: `Reasoning not available in this UI/model.`

`06_notes.md`
- Your diagnosis (template below).

`07_labels.txt`
- 3–10 labels (one per line) from the controlled vocabulary below.

Optional (high leverage):
`08_expected.txt`
- A small “gold” expected translation (1–3 segments) demonstrating “correct.”

## 4) File size rules (so future LLM analysis works)
Keep files small enough to paste into a model later:
- Target each file <= ~200–400 KB
- If reasoning is long, split into chunks:
  - `05_reasoning_raw_01.md`
  - `05_reasoning_raw_02.md`
  - ...
- Prefer splitting on segment-ID boundaries. If not possible, split every few minutes of reasoning.
- At the top of each reasoning chunk, add a short human header:
  - `Chunk: 01/04 (covers P1201–P1230)`

## 5) Labels taxonomy (controlled vocabulary)
Use these labels in `07_labels.txt` (add more only when needed).

| Label | Definition / When to Use |
| :--- | :--- |
| **ids_alignment** | **CRITICAL.** Any issue where Segment IDs are dropped, duplicated, merged, or drift from the source. Includes "invented" IDs (e.g., splitting one segment into P12a/P12b). |
| **arabic_leak** | Arabic script appears in output (other than `ﷺ`). |
| **unicode_violation** | Forbidden characters (emojis, complex accents like `â/ã`, extended math symbols) appear. |
| **translit_boundary** | Model transliterates a word that should be translated (e.g. *kitāb* instead of Book) or translates a name that should be transliterated (*The Father of Hurayrah*). |
| **name_connector_b_rule** | Failure to use `b.` for *ibn/bin* in the middle of a chain, or using `b.` at the start of a name. |
| **glossary_conflict** | Model ignores a "Locked Anchor" (e.g., using *Sheikh* instead of *Shaykh*, or *Koran* instead of *Qurʾān*). |
| **term_format_translit_english** | Failure to use the `translit (English)` format for the first occurrence of a technical term (e.g., just saying "bid'ah" or just "innovation"). |
| **safety_sanitization** | Model softens, omits, or adds disclaimers to controversial text (e.g., Jihad, Takfir, slavery) instead of translating literally. |
| **citation_hallucination** | Model invents a source (e.g., `[Sahih Bukhari]`) that isn't in the Arabic text, or hallucinates a "missing" part of the text. |
| **typo_emendation** | Model "fixes" a typo in the Arabic source (e.g., translates "bull" as "revolution" because it thinks the author made a mistake). Hallucination risk. |
| **fiqh_dispute_resolution** | (Fiqh Mode) Model tries to "solve" the legal issue instead of just translating the text. |
| **hadith_isnad_parse** | (Hadith Mode) Failure to identify the chain boundary, or mangling the narrator names. |
| **jarh_terms_nuance** | (Rijal Mode) Mistranslating specific narrator criticism terms (e.g., *Saduq* vs *Thiqah*). |
| **tafsir_attributes** | (Tafsir Mode) Misinterpreting Divine Attributes (e.g., interpreting "Hand" metaphorically when author meant literally). |
| **mixed_genre_switch** | Model gets stuck in one mode (e.g., Isnad) when text switches to another (e.g., Narrative), or vice versa. form of **mode_locking**. |
| **formatting_drift** | General loss of structure (e.g., forgetting to bold labels, losing line breaks). |
| **blobbing_common_nouns** | Capitalizing common nouns as if they were proper names (e.g., *The Imām* instead of *the imām*). |
| **structure_collapse_qa** | Q&A format breaks down (e.g., Question and Answer run into the same paragraph). |
| **markdown_leak** | Bold/Italic/Headers appear despite "Plain Text" rule. |
| **parentheses_collision** | Parentheses used for unauthorized purposes (commentary, glosses) in violation of restrictions. |
| **mode_locking** | Model applies rules from previous section to current section (e.g. treating common words as narrators). |
| **gravity_well_drift** | Model reverts to generic internet spelling for high-frequency terms (e.g. *Sunni* instead of *Sunnī*) despite explicit rules. |
| **diacritics_drop** | Lazy transliteration (e.g., *Uthman* instead of *ʿUthmān*) or inconsistent application. |
| **label_newline_drift** | Inserting a newline after a label when it should be inline (e.g., `Questioner:\nText`). |
| **term_pair_pluralization** | Incorrectly pluralizing the pair (e.g., *hadith (report)s*) instead of rephrasing (*reports (ahadith)*). |

## 6) Notes template (`06_notes.md`)
Keep this short and factual:

- Context:
  - Book/author (if known):
  - Genre add-on used:
  - Segment IDs affected:
  - Prompt Hash (optional, for tracking versions):
- Observed failure:
- Drift checklist (optional): Shaykh/Sheikh; Qurʾān/Quran; Muḥammad/Muhammad; muṣḥaf/mushaf; Salafīyyah/Salafism; Ṭāʾifah/Ta'ifah; Sunnah casing.
- Collision Note (if rule conflict):
- Why it’s wrong (one sentence):
- What the output should have done instead:
- Hypothesis (what rule ambiguity triggered it):
- Minimal fix idea (one prompt change, not a rewrite):
- Status: triaged | fixed | partial | not_fixed

## 7) Triage → fix workflow (disciplined)
1) Collect the case folder immediately (don’t rely on chat history).
2) Label it (`07_labels.txt`) and write notes (`06_notes.md`).
3) Batch similar cases (5–20) by shared labels.
4) Make one minimal prompt change to fix one failure mode:
   - Prefer negations: “Do NOT …” beats repeating a rule.
5) **Sibling Check**: If fixing a structural issue (e.g., Q&A format) or term handling in one prompt (e.g., `mixed`), check if the same weakness exists in sibling prompts (e.g., `fatawa`).
6) Regression check:
   - Re-run 2–3 older cases likely impacted (same genre, different content).
7) Record outcome in `06_notes.md` (status + prompt version/date).

### Pro-Tip: Standard Fix Patterns
- **For Arabic Leakage**: Don't just say "No Arabic". Define `Transliteration` as `Latin Only`.
- **For Spelling Drift**: Use a "LOCKED ANCHORS" list for high-frequency terms (`Shaykh`, `Muḥammad`).
- **For Structure Drift**: Use spatial constraints ("SAME LINE", "NO BLANK LINES") rather than just formatting examples.

## 8) When to update vs branch (new add-on)
Update an existing prompt when:
- The fix is a local clarification and does not harm other genres.

Create a new add-on under `prompts/` when:
- Rules for Genre A actively harm Genre B (style/format/term priorities conflict), or
- Glossary collision is chronic (e.g., sunnah as legal status vs Prophetic tradition), or
- The text is structurally distinct (manual vs Q&A vs mixed polymath).

New add-on requirements:
- Must be pasteable under `prompts/master_prompt.md`
- Must not require external file reads
- Must not introduce output tags/labels unless explicitly requested by the Arabic
- Do NOT introduce placeholder tokens like `[Source]` that invite hallucination.

## 9) Index (Optional, if high volume)
Maintain a small index for searchability if desired:
`archive/benchmarks/index.tsv`

Columns:
`date	model	case_id	genre_addon	labels	top_segment_ids	one_line_summary	prompt_stack_hash	status`

## 10) Checklist before saving a prompt update
- Does it fix the reported error in at least 1 real case?
- Does it preserve Golden Rules (IDs, no Arabic output except ﷺ, no invented sources)?
- Is it concise (token-lean) and unambiguous?
- Did you avoid creating new contradictions with existing prompts?
