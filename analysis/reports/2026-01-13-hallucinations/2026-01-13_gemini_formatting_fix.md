# Proposal: Gemini 3.0 Formatting & Segment Alignment Fix

## 1. Problem Analysis

### A. The Gemini Newline Bug
**Symptom:**  
Gemini 3.0 output: `P1234\nTranslation text...`  
Expected output: `P1234 - Translation text...`

**Diagnosis:**  
The model is likely over-prioritizing the `STRUCTURE` instruction in `encyclopedia_mixed.md` which commands "Start NEW LINE for speaker". It interprets the Segment ID as a "Label" or explicitly separates the ID from the content to satisfy a "Plain Text" heuristic that dislikes the " - " separator (viewing it as "markdown-like" or header formatting).

### B. Segment Alignment Drift & Hallucinations
**Symptom:**  
Models (GPT-5.2, Gemini) occasionally drop IDs, merge segments, or hallucinates "correction" segments (e.g. `P5458c`).

**Diagnosis:**  
The "3-Pass Rule" (Alignment, Accuracy, Compliance) defined in `master_prompt.md` is currently a passive instruction ("SELF-CHECK: Verify IDs"). In high-inference models, this check happens implicitly but isn't structurally enforced. The `No Inference` rule is too soft ("Models are instructed NOT to infer..."). It needs to be a "Critical Negation" to prevent the model from filling gaps in the source text.

## 2. Hypothesis

1.  **Separator Collapse**: The prompt asks for `SEGMENT_ID - English`. The hyphen is a "weak" separator in the model's token probability map compared to `\n` which is heavily reinforced by the "Plain Text" and "New Line for Speaker" instructions.
2.  **Mode Bleeding**: In `encyclopedia_mixed.md`, the switch from "Isnad Mode" to "Narrative Mode" relies on semantic triggers (`qāla`). If the trigger is ambiguous (e.g. nested quotes), the model stays in Isnad mode, causing it to over-transliterate plain words or merge segments it thinks are part of the chain.

## 3. Proposed Changes

### A. Master Prompt (`prompts/master_prompt.md`)

**Change 1: ID-Locking (The "Iron Grip")**  
Replace the generic "Preserve Segment ID" rule with a rigid formatting constraint.

*Current:*
> OUTPUT: SEGMENT_ID - English translation.

*Proposed:*
> OUTPUT FORMAT: `[ID] - [Text]`.
> CRITICAL: You must use the hyphen separator ` - ` immediately after the ID. Do NOT use a newline after the ID.
> Example: `P1234 - Translation...` (Correct) vs `P1234\nTranslation...` (Forbidden).

**Change 2: Anti-Hallucination Negation**  
Reinforce the "No Inference" rule in the `CRITICAL NEGATIONS` block.

*Add:*
> 8. NO INVENTED SEGMENTS (Do not create IDs like P1234a unless present in input).

### B. Add-on Prompt (`prompts/encyclopedia_mixed.md`)

**Change 1: Speaker Label Disambiguation**  
Clarify that Segment IDs are NOT "Speakers" to prevent the "New Line" rule from hitting them.

*Current:*
> Q&A: Whenever "Al-Sāʾil:"/"Al-Shaykh:" appear: Start NEW LINE for speaker.

*Proposed:*
> Q&A STRUCTURE:
> - Triggers: "Al-Sāʾil:" / "Al-Shaykh:".
> - Action: Start NEW LINE for these speakers *within* the segment text. 
> - CONSTRAINT: This does NOT apply to the Segment ID. The ID must stay on the same line as the start of text.

**Change 2: Harder Mode Reset**  
Add a negative constraint to the `RESET` logic.

*Current:*
> RESET: When chain ends (at `qāla`/`matn`), STOP Isnad/Rijal rules. Return to Narrative.

*Proposed:*
> RESET: At "qāla" or start of Matn: IMMEDIATE STOP of Isnad rules. Do NOT carry Isnad transliteration style into the Matn.

## 4. Token Optimization Strategy

*   **Remove "Role" redundancy**: The `master_prompt.md` starts with `ROLE: Expert academic translator...`. The `AGENTS.md` context often acts as a pre-prompt. We can shorten the Role definition in the Master Prompt to 1 line if needed, but it's currently lean.
*   **Compress Glossary**: The glossary in `master_prompt.md` is dense. We can group terms by category to save tokens on repetition of `translit (English)`.

## 5. Verification Plan

1.  **Unit Test (Gemini 3.0)**: Run a batch of 10 segments containing Q&A using the new `encyclopedia_mixed.md` stack. Verify `grep "P[0-9]\+ - "` matches 100% of lines.
2.  **Regression Test (GPT-5.2)**: Run the "Hallucination Case" (P5458c) input. Verify model does not invent the missing segment.
