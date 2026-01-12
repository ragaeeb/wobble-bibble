### Peer Review Report: Wobble-Bibble Islamic Translation Prompt Lab (v4.0)

**Reviewer:** Grok 4 (xAI)  
**Date:** January 11, 2026  

#### 1. Overall Score: Logic Consistency and Academic Rigor  
**9/10**  

The system demonstrates exceptional academic rigor. The stacked architecture (master + genre-specific add-ons) is elegant and modular, allowing precise adaptation without bloating the core logic. The emphasis on fidelity—preserving polemics, resisting emendation, and enforcing structural boundaries (IDs, isnads)—aligns perfectly with scholarly translation standards. The existing CRITICAL NEGATIONS block in `master_prompt.md` is already one of the strongest safety-override mechanisms I have seen in prompt engineering for sensitive domains.

The score is not a perfect 10 because residual instruction collisions (especially around parentheses and transliteration scope) and minor formatting noise still create arbitration overhead, as evidenced in the provided `peer_review_synthesis.md` and `synthesis.md`.

#### 2. Top 3 Weaknesses  

1. **Parentheses Governance Collision (Highest Severity)**  
   The master prompt restricts parentheses to “ONLY for: (a) required technical-term pairs `translit (English)`, (b) dates/codes if explicitly authorized by the active Add-on.”  
   However, several add-ons implicitly or explicitly require additional uses:  
   - `jarh_wa_tadil.md` and `hadith.md` expect `(d. 256 AH)` or `(kh/m/d)`.  
   - `encyclopedia_mixed.md` inherits Q&A needs that can involve codes/dates.  
   Result: Models must arbitrate whether the add-on “explicitly authorizes” the exception, leading to hesitation, deletion of dates, or inconsistent application. This was flagged repeatedly in the peer review synthesis as the #1 arbitration trap.

2. **Transliteration Scope Creep / Blobbing Persistence**  
   Despite strong rules distinguishing proper names (translit-only) vs. common nouns (translit (English)), the master’s broad clause “Any Arabic-script personal name/title/place anywhere = FULL ALA-LC” overrides add-on attempts at narrower scoping in mixed texts.  
   In polymath works (Albani, Ibn Taymiyyah), this causes “blobbing” of common terms like *miḥrāb*, *jihād*, or *karāmāt* when they appear outside strict isnad contexts. The priority matrix in `encyclopedia_mixed.md` helps, but the master’s global scope still wins by default, leading to bare transliteration where definition is required.

3. **Markdown Noise Leakage from Add-ons**  
   Multiple add-ons use Markdown bold syntax (`**Questioner:**`, `**The Shaykh:**`) despite the master’s explicit “Plain text only (no markdown/rich formatting).”  
   This creates a direct contradiction: the model sees bold markup in the prompt itself, increasing the risk of markdown bleeding into output (e.g., outputting **bold** labels or accidental formatting). This is especially risky in Q&A heavy genres (fatawa, mixed).

#### 3. Proposed 3–5 Specific Negation Rules (Add to CRITICAL NEGATIONS block in master_prompt.md)

These are phrased as hard negations to maximize override strength against RLHF tendencies:

1. **DO NOT use parentheses for anything except: (a) technical-term pairs in the format `translit (English)` on first occurrence per segment, (b) death/birth dates explicitly formatted as “(d. XXX AH)” or “(born XXX AH)”, (c) book codes explicitly formatted as “(m)”, “(kh)”, etc., when they appear in the source text.**  
   (This resolves the parentheses collision by enumerating all allowed cases centrally, preventing arbitration.)

2. **DO NOT apply full ALA-LC transliteration to common nouns, technical terms, or concepts (e.g., miḥrāb, jihād, karāmāt); always pair them as `translit (English)` on first use per segment, even when they appear outside isnad chains.**  
   (Directly hardens the anti-blobbing rule and overrides the master’s overly broad “anywhere” clause.)

3. **DO NOT output any markdown, bold, italics, bullets, headers, or rich formatting under any circumstances; use plain text colons only for labels (e.g., Questioner: instead of **Questioner:**).**  
   (Eliminates formatting noise contradiction.)

4. **DO NOT narrate, describe, or reference internal mode switching, genre triggers, priority matrices, or rule arbitration; apply rules silently and output only the translation.**  
   (Prevents meta-talk leakage from complex mixed-genre logic.)

5. **DO NOT soften, contextualize, or add disclaimers to sectarian, polemical, or harsh terms (e.g., Rāfiḍah, Jahmiyyah, dajjāl, kufr); always translate them literally with exact author intent.**  
   (Reinforces existing safety override with higher specificity.)

#### 4. Specific Review of `encyclopedia_mixed.md` (Genre-Switching & Mode-Locking)

The prompt is the strongest of the genre add-ons for handling polymath texts. Key strengths:

- The **Priority Matrix** (Isnad > Technical Criticism > Legal/Doctrinal > Narrative) combined with **Genre Triggers** (transmission verbs, jarḥ terms, ruling terms) provides a clear, hierarchical decision tree that minimizes mode-locking.
- Explicit instruction “Do not output any mode labels or bracket tags” and “SEGMENTATION: Do not merge genres” effectively prevents meta-talk.
- Disambiguation examples for ambiguous terms (ṣaḥīḥ, sunnah) are excellent.

Remaining risks:
- Mode-locking can still occur if a long paragraph begins with an isnad and then shifts to fiqh without a clear trigger verb—the model may continue applying full ALA-LC to later names/terms due to the master’s broader scope rule.
- The Q&A structural rule shares the same markdown bold issue as fatawa.md.

Overall effectiveness: **8.5/10**. With the proposed negations #2 and #4 above, it would reach 9.5/10—robust enough for even the most volatile Albani-style texts.

#### 5. Backtick/Formatting Noise Check

- **Critical Issue**: Multiple add-ons use backtick-like markdown bold (`**Text**`) for labels:  
  - `encyclopedia_mixed.md`: **Questioner:** / **The Shaykh:**  
  - `fatawa.md`: same pattern.  
  This directly contradicts the master’s “Plain text only (no markdown/rich formatting)” and risks output contamination.
- No literal backticks (`` ` ``) appear in any prompt, which is good.
- Recommendation: Replace all `**` with plain colon syntax immediately (e.g., “Questioner:” and “The Shaykh:”). This is a one-line fix across two files.

#### Additional Notes on Other Objectives

- **Safety Override Integrity**: Already strong (9/10) due to existing CRITICAL NEGATIONS. Proposed negation #5 would make it virtually unbreakable.
- **Structural Integrity (Q&A Triggers)**: Solid with “force a NEW LINE” language, but vulnerable to markdown noise as noted.
- **Arabic Leakage Guard**: The conditional logic (“If Arabic script appears in output…”) is clever self-correction, but could be strengthened by moving it into the master as a negation.
- **Token Efficiency**: Excellent overall—prompts are concise and modular. Only bloat is redundant verb maps across add-ons; consider consolidating common isnad verbs into master if testing shows no genre harm.
- **Refinement SOP (REFINEMENT_GUIDE.md)**: Highly practical for AI agents (9/10). The controlled label vocabulary is sufficient and searchable. Minor suggestion: add labels `parentheses_collision`, `markdown_leak`, and `mode_locking` to capture emerging patterns from this review cycle.

This system is among the most sophisticated prompt-engineering efforts I have evaluated for scholarly translation in sensitive domains. Implementing the proposed negations and cleaning the markdown noise would push it to near-optimal robustness.