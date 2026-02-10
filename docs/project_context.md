# Project Context — wobble-bibble

## What this repo is
`wobble-bibble` is a TypeScript library that:
1) **Manages prompt stacks** for Arabic→English translation of Islamic scholarly texts.  
2) **Validates LLM outputs** for structural and content errors.  
3) **Supports prompt refinement** using round-based analysis and peer review.

The goal is high-fidelity, rule-driven translation with strict formatting guarantees.

## How the prompt stack works
Prompts live in `prompts/*.md` and are “zero-waste” rule blocks.
- `prompts/master_prompt.md`: global rules
- Examples: no Arabic script except ﷺ, output format, ID integrity, transliteration rules.
- Genre add-ons (e.g., `prompts/encyclopedia_mixed.md`) add specialized constraints.
- The library stacks Master + one add-on for a final prompt.

## Output constraints (high priority)
- **Plain text only**, no Markdown.
- **Arabic script forbidden** anywhere in output except ﷺ.
- **Segment IDs** must appear exactly once and in order.
- **Speaker-label line breaks** must match the source: do not merge turns.
- **Transliteration** uses ALA‑LC with diacritics; technical terms use `translit (English)`.

## Validation scope
`src/validation.ts` checks for:
- ID alignment (missing/duplicated/invented IDs).
- Arabic leakage.
- Formatting drift (speaker label line breaks, colon labels, merged turns).
- Other constraints (diacritics, ALL CAPS, archaic register, etc.).

Errors include raw string ranges (`start`/`end`) and `matchText` for UI highlighting.

## Refinement workflow (round-based)
Use `docs/refinement-guide.md` as SOP. Each round produces:
- `01_synthesis.md` (diagnosis + proposal)
- `02_peer_review_packet.md` (reviewer context)
- `examples_consolidated.txt` (evidence bundle)
- `prompt.txt` (copy/paste reviewer prompt)
- `reviews/` (peer feedback)

Round artifacts live under `bugs/rounds/<round>/`.
Incoming case dumps often live under `extracted_bugs/<category>/` as JSON (`prompt`, `reasoning`, `response`).
