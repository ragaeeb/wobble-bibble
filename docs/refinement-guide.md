# The Wobble-Bibble Refinement Protocol (SOP)

This SOP defines a disciplined loop for improving `prompts/*` using real failed/struggling runs. The goal is to fix model behavior (dithering, sanitization, hallucination, formatting drift) with minimal, testable prompt edits.

## 0) Key Premise: "Inheritance" in Web UIs
"Inheritance" is conceptual only. Models cannot read files from this repo in a web UI.
Always record the exact stacked prompt text you used: `master_prompt.md` pasted first + one add-on pasted below it.

## 1) When to Open a Refinement Case
Create a GitHub Issue whenever any of these happen:
- IDs dropped/merged/reordered/reformatted
- Arabic script leaked (other than ﷺ) or other forbidden characters appear
- Transliteration boundary error (wrong scope, missing diacritics, wrong b./Ibn)
- Technical term drift (e.g., ṣaḥīḥ validity vs authenticity; sunnah ambiguity)
- Sanitization of polemics or legal rulings ("safety panic")
- Citation/source invented or templated
- "Correction loop" / emendation / best-guess reconstruction (hallucination risk)
- Term-format drift (e.g., outputting English-only keywords when `translit (English)` was required)
- Arabic leakage inside term-pairs (e.g., `اختلاف (disagreement)` instead of `ikhtilāf (disagreement)`)
- Long dithering or self-contradiction across the same segment set

## 2) How to File a Case
1. Go to **Issues → New Issue → Prompt Refinement Case**
2. Fill in the structured form:
   - **Model**: Select from the dropdown (e.g., `gemini-3.0-pro`)
   - **Prompt Add-on**: Select the genre add-on used (e.g., `hadith`)
   - **Failure Type**: Check all applicable labels
   - **Input**: Paste the exact Arabic segments sent to the model
   - **Output**: Paste the model's raw output
   - **Expected Output**: Paste what the correct output should look like
   - **Reasoning Trace**: Paste the model's thinking block (if available)
   - **Prompt Stack**: Paste the combined Master + Addon prompt
   - **Diagnosis**: Explain why the output is wrong
   - **Proposed Fix**: Your hypothesis and suggested prompt edit

## 3) Failure Type Labels (Taxonomy)
Use these labels when filing an issue. Check all that apply.

| Label | Definition |
| :--- | :--- |
| `ids_alignment` | Segment IDs dropped, duplicated, merged, or invented |
| `arabic_leak` | Arabic script in output (other than ﷺ) |
| `translit_boundary` | Transliterated a word that should be translated, or vice versa |
| `safety_sanitization` | Model softened, omitted, or added disclaimers to controversial text |
| `glossary_conflict` | Ignored a locked anchor (e.g., *Sheikh* instead of *Shaykh*) |
| `formatting_drift` | Lost structure (Markdown leak, newline drift, label issues) |
| `mode_locking` | Stuck in one logic mode when text switched genres |
| `term_format_drift` | Failed to use `translit (English)` format for technical terms |
| `citation_hallucination` | Invented a source or hallucinated missing text |
| `diacritics_drop` | Lazy transliteration (e.g., *Uthman* instead of *ʿUthmān*) |

## 4) Triage → Fix Workflow
This repo uses a “round-based” refinement loop. Each round corresponds to one batch of reports for one (or a small set of related) failure modes.

### Folder Glossary (Quick Map)
- `extracted_bugs/<category>/`: Primary intake of reports as JSON (`prompt`, `reasoning`, `response`).
- `bugs/rounds/<round>/`: Active refinement rounds and artifacts for a specific fix cycle.
- `archive/reports/`: Historical reports/evidence referenced for peer review context.
- `archive/benchmarks/`: Larger benchmark corpora; include only when needed.

### Round workflow (the process to follow)
1. **Collect reports**
   - Primary intake: `extracted_bugs/<category>/` as JSON (`prompt`, `reasoning`, `response`).
   - Legacy intake (if present): `bug_reports/<category>/` as `.txt` dumps.
   - Each report typically contains: (a) stacked prompt text, (b) Arabic input, (c) model output, (d) reasoning (if available).
2. **Synthesize + diagnose**
   - Read every report and validate what *actually* broke (don’t trust the user blurb blindly).
   - Extract repeated failure patterns and likely triggers.
   - Identify instruction collisions (master vs add-on) and “escape hatches” (idioms, formatting defaults, etc.).
3. **Create the round artifacts (in `bugs/rounds/<round>/`)**
   - `01_synthesis.md`: diagnosis + proposed fix + minimal diffs (and/or proposed rewritten blocks).
   - `02_peer_review_packet.md`: reviewer context + proposal + questions. Include BEFORE/AFTER full prompt text if the change is large; otherwise include a diff.
   - `examples_consolidated.txt`: small evidence bundle distilled from many reports (token-lean attachment).
   - `prompt.txt`: plain-text reviewer prompt for copy/paste to agents.
   - `reviews/`: drop peer-review notes here as `*.md` files.
4. **Peer review**
   - Send the reviewer `prompt.txt` plus the small attachments:
     - `02_peer_review_packet.md`
     - `examples_consolidated.txt`
     - the specific `prompts/*.md` files being changed (and, for big refactors, BEFORE + AFTER text in the packet).
   - If you want a single-file bundle, generate a `peer_review_context.txt` instead (see below).
   - **Single‑packet mode (no prompt files attached)**: If reviewers will only receive `prompt.txt` + `02_peer_review_packet.md` + `01_synthesis.md` + `examples_consolidated.txt`, then `02_peer_review_packet.md` MUST be self‑contained:
     - include minimal project context,
     - include the exact prompt stack under review,
     - include BEFORE/AFTER excerpts (or a diff) for every changed line.

### Single-file peer review bundle (recommended)
Use this when you want one file that includes the reviewer prompt + evidence + project context.

1. Ensure the round artifacts exist:
   - `bugs/rounds/<round>/prompt.txt`
   - `bugs/rounds/<round>/01_synthesis.md`
   - `bugs/rounds/<round>/examples_consolidated.txt`
2. Ensure project overview exists:
   - `docs/project_context.md`
3. Include the exact prompt stack files used in the cases (example: `master_prompt.md` + `encyclopedia_mixed.md`).
4. Run `code2prompt` with this exact command shape:
```bash
code2prompt -O bugs/rounds/<round>/peer_review_context.txt \
  -i "bugs/rounds/<round>/prompt.txt" \
  -i "bugs/rounds/<round>/01_synthesis.md" \
  -i "bugs/rounds/<round>/examples_consolidated.txt" \
  -i "docs/project_context.md" \
  -i "prompts/master_prompt.md" \
  -i "prompts/encyclopedia_mixed.md" \
  .
```
Notes:
- Do NOT include `docs/refinement-guide.md` in the peer review bundle (process docs, not review context).
- Keep the bundle lean; include only the prompts actually used in the reported cases.
5. **Update synthesis with reviews**
   - Append an addendum section to `01_synthesis.md` (do NOT delete the original synthesis):
     - Collective agreement (what most reviewers converge on)
     - Unique points (one-off suggestions)
     - Explicit AGREE / DISAGREE / OUT OF SCOPE decisions (with rationale)
     - Updated final proposal and next steps
6. **Implement the fix**
   - Apply the agreed prompt edits in `prompts/`.
   - If the proposal is risky/large, create **sandbox variants** for trial runs (do not ship as canonical IDs):
     - `bugs/rounds/<round>/master_prompt_new.md`
     - `bugs/rounds/<round>/<addon>_new.md`
7. **Regenerate + regression-check**
   - Run `bun run generate` to refresh the bundled prompt output.
   - Run `bun test` to ensure prompt bundling and validators still pass.
   - Re-run 2–3 older cases likely impacted (same genre, different content).
8. **Close the loop**
   - If this was tracked as an issue: link the change and record the round folder as evidence.

### Standard Fix Patterns
- **For Arabic Leakage**: Define `Transliteration` as `Latin Only`
- **For Spelling Drift**: Use a "LOCKED ANCHORS" list for high-frequency terms
- **For Structure Drift**: Use spatial constraints ("SAME LINE", "NO BLANK LINES")

## 5) When to Update vs Create New Add-on
**Update an existing prompt when:**
- The fix is a local clarification and does not harm other genres

**Create a new add-on under `prompts/` when:**
- Rules for Genre A actively harm Genre B
- Glossary collision is chronic (e.g., *sunnah* as legal status vs Prophetic tradition)
- The text is structurally distinct (manual vs Q&A vs mixed polymath)

**New add-on requirements:**
- Must be pasteable under `prompts/master_prompt.md`
- Must not require external file reads
- Must not introduce output tags/labels unless explicitly requested
- Do NOT introduce placeholder tokens like `[Source]` that invite hallucination

## 6) Checklist Before Saving a Prompt Update
- [ ] Does it fix the reported error in at least 1 real case?
- [ ] Does it preserve Golden Rules (IDs, no Arabic output except ﷺ, no invented sources)?
- [ ] Is it concise (token-lean) and unambiguous?
- [ ] Did you avoid creating new contradictions with existing prompts?
