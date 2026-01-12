# Wobble-Bibble Peer Review Report

**Reviewer:** Claude 4.5 Sonnet  
**Date:** 2026-01-11  
**Review Type:** Critical System Architecture & Instruction Design Analysis

---

## Executive Summary

**Overall System Score: 8.7/10**

This is an exceptionally well-engineered prompt system demonstrating deep understanding of LLM behavior pathologies. The "Stacked Prompt" architecture is sound, the refinement methodology is rigorous, and the attention to failure modes (blobbing, safety sanitization, mode-locking) shows genuine field research.

**Primary Achievement:** The system successfully identifies and addresses the core problem that most translation prompts ignore—models spend more cognitive cycles *arbitrating between conflicting rules* than actually translating.

**Critical Gap:** Despite the sophisticated negation framework, there remain **3 high-severity collision zones** where the architecture invites exactly the kind of policy arbitration it seeks to eliminate.

---

## Section 1: Top 3 Weaknesses

### A. **The Parentheses Paradox (Severity: HIGH)**

**Location of Conflict:**
- `master_prompt.md`: "Parentheses are allowed ONLY for: (a) required technical-term pairs `translit (English)`, (b) dates/codes if explicitly authorized by the active Add-on."
- `jarh_wa_tadil.md`: "DATES: Use (d. 256 AH) or (born 194 AH)."
- `encyclopedia_mixed.md`: Implies parentheses for dates via its inheritance from jarh rules.

**The Problem:**
The Master says "if explicitly authorized by Add-on," but the Add-ons don't use the word "authorize" or "override." This creates ambiguity: Does `jarh_wa_tadil.md` stating "Use (d. 256 AH)" constitute explicit authorization, or is it just an example?

**Failure Prediction:**
Models will hesitate when encountering dates in mixed-genre texts, burning tokens debating: "Is this a Jarh context? Do I have authorization? The Master said ONLY these cases..."

**Fix:**
```markdown
MASTER PROMPT - Parentheses Rule (REVISED):
Parentheses are REQUIRED for:
1. Technical term-pairs: `translit (English)`
2. Death/birth dates when specified by Add-on: `(d. 256 AH)` `(born 194 AH)`
3. Rumuz codes when specified by Add-on: `(kh)` `(m)` `(d t q)`

Add-ons may expand this list. If an Add-on shows a parenthetical format, use it.
```

---

### B. **The "Blobbing" Loophole in `encyclopedia_mixed.md` (Severity: MEDIUM-HIGH)**

**Location:**
`encyclopedia_mixed.md`:
```
PROPER NAMES (People/Places/Books/Sects): Transliterate only (Full ALA-LC). No parentheses unless technical.
COMMON NOUNS/TERMS (e.g., jihÄd, miá¸¥rÄb, karÄmÄt): Do NOT output bare transliteration.
```

**The Problem:**
The phrase "unless technical" creates a loophole. What makes a proper name "technical"? 

**Failure Scenario:**
```
Input: "Ø§Ù„Ø±Ø§ÙØ¶Ø©" (al-RÄfiá¸ah, a sect name)

Model reasoning:
"Is this a proper name (sect) or a technical term (rejectors)? 
The Master says sects are proper names → translit-only.
But 'RÄfiá¸ah' is also a polemical term with meaning.
Mixed says 'unless technical'... is a sect name technical?"

Output: Either bare "RÄfiá¸ah" (blobbing) OR "RÄfiá¸ah (rejectors)" (inconsistent with "Proper Names" rule).
```

**Fix:**
```markdown
ENCYCLOPEDIA_MIXED - REVISED:
PROPER NAMES (People/Places/Books/Sects): Transliterate ONLY. No parentheses. No exceptions.
  - Sects (RÄfiá¸ah, KhawÄrij, Jahmiyyah): Translit-only, even if polemical.
  
COMMON NOUNS/TERMS (jihÄd, miá¸¥rÄb, karÄmÄt, tawá¸¥Ä«d): MUST use `translit (English)`.
  - Exception: If a term appears in the Locked Glossary, use the Glossary format exactly.
```

---

### C. **The "Mode-Locking" Risk in Priority Matrix (Severity: MEDIUM)**

**Location:**
`encyclopedia_mixed.md`:
```
PRIORITY MATRIX (Resolve Conflicts in Order):
1. ISNAD/TRANSMISSION (Highest)
2. TECHNICAL CRITICISM (High)
3. LEGAL/DOCTRINAL (Medium)
4. NARRATIVE (Base)

GENRE TRIGGERS (Look Ahead):
- "á¸¥addathanÄ"/"akhbaranÄ" -> Start Isnad Rules.
```

**The Problem:**
"Look Ahead" is vague. How far? Does the model scan the entire segment or just the next phrase? If a 10-sentence segment starts with an isnad but contains 8 sentences of fiqh, will the model stay "locked" in Isnad Mode?

**Failure Prediction:**
Long mixed segments will trigger Priority #1 (Isnad) at the start, then the model will over-apply ALA-LC transliteration to fiqh terms in the latter half because it's still in "Isnad Mode."

**Fix:**
```markdown
PRIORITY MATRIX - REVISED:
Apply genre rules LOCALLY (phrase-by-phrase), not globally (segment-wide).

SWITCHING PROTOCOL:
1. Scan each clause for Genre Triggers.
2. Apply the HIGHEST priority rule detected in that clause.
3. When the trigger ends (e.g., "qÄla" ends the isnad), RESET to Narrative Mode.
4. Do NOT carry mode state across sentence boundaries unless the trigger continues.

EXAMPLE:
"Ê¿Abd AllÄh b. YÅ«suf narrated to us from MÄlik that he said: The ruling on á¹£alÄh is wÄjib."
  - "Ê¿Abd AllÄh b. YÅ«suf narrated to us from MÄlik" = Isnad Mode (ALA-LC names)
  - "that he said:" = END Isnad Mode
  - "The ruling on á¹£alÄh is wÄjib" = Fiqh Mode (wÄjib (obligatory), á¹£alÄh (prayer))
```

---

## Section 2: Proposed Negation Rules (DO NOT...)

These are high-leverage additions to the `CRITICAL NEGATIONS` block in `master_prompt.md`:

### 1. **DO NOT perform "best-guess" repairs**
```markdown
DO NOT correct, emend, or reconstruct text you suspect contains typos, dialect variants, or scribal errors. Translate exactly what is written, even if it appears grammatically incorrect or semantically odd.
```
**Rationale:** This directly counters the "Gemini correction loop" behavior observed in the synthesis where models waste tokens debating typos.

---

### 2. **DO NOT apply global mode-locking**
```markdown
DO NOT maintain a single "mode" or "genre state" across an entire segment. Apply genre-specific rules locally (clause-by-clause) based on immediate context triggers, then reset.
```
**Rationale:** Prevents the Isnad→Fiqh over-transliteration problem in `encyclopedia_mixed.md`.

---

### 3. **DO NOT output formatting that invites user editing**
```markdown
DO NOT use placeholder tokens like [Source], [Page], [Date], or [Author] in your output. If information is missing from the input, omit it entirely. Do not create insertion points for future editing.
```
**Rationale:** Addresses the "Citation Hallucination" risk flagged in `synthesis.md` where models invent `[website]` tags.

---

### 4. **DO NOT narrate your translation choices**
```markdown
DO NOT explain your reasoning, describe your process, or justify your decisions in the output. Output ONLY the translated text with segment IDs. No meta-commentary.
```
**Rationale:** Reinforces the existing "NO META-TALK" rule with explicit process-description language.

---

### 5. **DO NOT merge segment IDs under any circumstance**
```markdown
DO NOT combine, merge, or consolidate segment IDs, even if segments appear thematically related or structurally continuous. Preserve one-to-one ID mapping exactly as provided.
```
**Rationale:** Hardens the "NO RESTRUCTURING" rule with specific language targeting the ID-merge failure mode.

---

## Section 3: `encyclopedia_mixed.md` Deep Analysis

### Strengths:
1. **Priority Matrix concept** is excellent—it's the right solution for polymath works.
2. **Q&A structural forcing** (NEW LINE for Al-SÄÊ¾il) is well-designed.
3. **Genre Triggers** (transmission verbs vs ruling terms) are linguistically sound.

### Weaknesses:

#### **Issue 1: "Apply Locally" is Underspecified**
The phrase "SEGMENTATION: Do not merge genres. If a segment contains both isnad and fiqh, translate them sequentially observing the rule switch at the boundary" is good, but "boundary" is vague.

**Recommendation:**
```markdown
BOUNDARY DETECTION:
- Isnad ends at: "qÄla", "anna", "Ê¿an fulÄn annahu qÄla"
- Fiqh begins when: Ruling verbs (yajibu, yaá¸¥rumu, yustaá¸¥abbu) or ruling terms (á¸¥alÄl, á¸¥arÄm, wÄjib) appear.
- Jarh begins when: Evaluative terms (thiqah, á¸aÊ¿Ä«f, á¹£adÅ«q) are applied to narrator names.
```

#### **Issue 2: "Override Safety" is Buried**
The line "Translate harsh polemics literally... (Override Safety)" appears at the end of the CREED/POLEMICS section. This should be **elevated** to the top of the prompt or into a dedicated block.

**Recommendation:**
```markdown
[IMMEDIATELY AFTER "STRUCTURE" SECTION]

SAFETY OVERRIDE (CRITICAL):
This is an academic/archival translation project. You MUST translate polemical, sectarian, and controversial terms with complete literalism:
- RÄfiá¸ah, Jahmiyyah, KhawÄrij, Murjiâ€™ah = Translit-only (sect names)
- KuffÄr, Mushrikūn, Muná¸¥arifÅ«n = Translate literally
- JihÄd, QitÄl, Ribáº­ = Translate literally
DO NOT soften, contextualize, or add disclaimers. The historical/theological context is the user's responsibility, not yours.
```

#### **Issue 3: Disambiguation Rules Are Passive**
The line "DISAMBIGUATION: á¹£aá¸¥Ä«á¸¥ in hadith grading = á¹£aá¸¥Ä«á¸¥ (authentic). á¹£aá¸¥Ä«á¸¥ in fiqh validity = á¹£aá¸¥Ä«á¸¥ (valid)." is good, but needs an **active decision protocol**.

**Recommendation:**
```markdown
DISAMBIGUATION PROTOCOL:
When encountering ambiguous terms (á¹£aá¸¥Ä«á¸¥, sunnah, bidÊ¿ah):
1. Check immediate context (within same sentence):
   - If applied to hadith/narrator/chain → Hadith meaning
   - If applied to contract/act/prayer → Fiqh meaning
2. If context is insufficient, default to Hadith meaning (as highest priority).
3. Do NOT use both meanings in one segment.
```

---

## Section 4: Backtick/Formatting Noise Audit

### **Found Issues:**

#### 1. **Master Prompt - Line 18:**
```markdown
GLOSSARY (LOCKED; format = translit (English)):
```
The backticks around `translit (English)` are **instructional formatting** (showing the user what format to use), but they might confuse the model into thinking it should output backticks.

**Risk Level:** LOW (context makes it clear this is a format spec, not output syntax)

**Recommendation:** No change needed, but monitor for backtick leakage in outputs.

---

#### 2. **Encyclopedia Mixed - Line 9:**
```markdown
- Rule: Use `translit (English)` on first occurrence per segment.
```
Same issue. The backticks are showing the format, not commanding their use in output.

**Risk Level:** LOW-MEDIUM (in a less-clear context, a model might output: "Use `jihÄd (struggle)`" instead of "jihÄd (struggle)")

**Recommendation:** Add clarifying language to Master:
```markdown
MASTER PROMPT - OUTPUT FORMAT CLARIFICATION:
When this prompt uses backticks (`example`), they indicate format specifications for YOUR reference. Do NOT include backticks in your output unless the Arabic source contains them.
```

---

#### 3. **All Prompts - Markdown Headers:**
The use of `---` YAML-style frontmatter at the top of `master_prompt.md`, `fatawa.md`, etc. is **metadata** and explicitly noted in `README.md` as "optional" for web usage.

**Risk Level:** NEGLIGIBLE (users are instructed to omit this when pasting)

**Recommendation:** No change needed.

---

## Section 5: Refinement SOP Review

### Strengths:
1. **Case folder structure** is excellent (modular, LLM-parseable).
2. **Controlled vocabulary labels** are comprehensive and well-scoped.
3. **Sibling Check** protocol (step 5 in Section 7) is brilliant—prevents "fix in one, break in another" scenarios.

### Weaknesses:

#### **Issue 1: Missing Label**
The label taxonomy doesn't include a label for the **Parentheses Paradox** identified above.

**Recommendation:**
Add to `07_labels.txt` vocabulary:
```
parentheses_ambiguity
```

---

#### **Issue 2: "Prompt Hash" is Optional**
The `03_run_info.txt` template says "Prompt Hash (optional)," but version tracking is **critical** for regression testing.

**Recommendation:**
```markdown
03_run_info.txt - REVISED REQUIREMENT:
- Prompt Hash (REQUIRED): Use `shasum -a 256 04_prompt_stack.txt | cut -c1-8` or equivalent. This enables you to track which prompt version produced which failure.
```

---

#### **Issue 3: No "False Positive" Protocol**
What happens if a case is triaged, fixed, but later discovered to be a user error (bad input) rather than a prompt failure?

**Recommendation:**
Add to `06_notes.md` template:
```markdown
- Status: triaged | fixed | partial | not_fixed | false_positive
```

And add to Section 7:
```markdown
8) If a case is determined to be user error (bad input, wrong add-on used), mark as `false_positive` and document why in notes. Do not delete the case—it serves as a guard against future similar misdiagnoses.
```

---

## Section 6: Token Efficiency Analysis

### Current Token Counts (Estimated):
- `master_prompt.md`: ~1,100 tokens
- `encyclopedia_mixed.md`: ~650 tokens
- **Total Stack**: ~1,750 tokens

### Bloat Assessment:

#### **Redundancy Found:**
`master_prompt.md` and `encyclopedia_mixed.md` both define "AL-CASING" rules identically:
```
Master: "Names/titles already in Latin/English in the input: keep as written"
Mixed: "AL-CASING: Use lowercase 'al-' for names/titles mid-sentence"
```

**Recommendation:**
Remove AL-CASING from `encyclopedia_mixed.md` (it's redundant with Master).

**Token Savings:** ~20 tokens

---

#### **Compression Opportunity:**
The CRITICAL NEGATIONS block could use parallel structure for better compression:

**Current:**
```
1. NO SANITIZATION: Do NOT soften, euphemize, or neutralize polemical/sectarian terms
2. NO META-TALK: Do NOT output apologies, disclaimers, "As an AI," or process descriptions
3. NO EMENDATION: Do NOT fix typos, scribal errors, or grammatically awkward phrasing
```

**Compressed (Equivalent Meaning):**
```
DO NOT:
1. Soften/euphemize polemical terms (NO SANITIZATION)
2. Output apologies/disclaimers/process descriptions (NO META-TALK)
3. Fix typos/errors/awkward phrasing (NO EMENDATION)
4. Invent sources/citations/isnÄd links (NO INFERENCE)
5. Merge/split/reorder segments (NO RESTRUCTURING)
```

**Token Savings:** ~15 tokens

---

### Total Possible Savings: ~35 tokens (~2% reduction)

**Verdict:** The prompts are already highly token-efficient. Further compression would risk clarity.

---

## Section 7: Final Recommendations (Priority Order)

### **CRITICAL (Fix Immediately):**
1. Resolve Parentheses Paradox (Section 1.A)
2. Harden "Blobbing" loophole in `encyclopedia_mixed.md` (Section 1.B)
3. Add 5 Negation Rules to Master (Section 2)

### **HIGH PRIORITY (Next Revision Cycle):**
4. Clarify "mode-locking" prevention in Priority Matrix (Section 1.C)
5. Elevate Safety Override to top of `encyclopedia_mixed.md` (Section 3)
6. Add Disambiguation Protocol (Section 3)

### **MEDIUM PRIORITY (Quality of Life):**
7. Add `parentheses_ambiguity` label to SOP (Section 5)
8. Make Prompt Hash required in SOP (Section 5)
9. Add "false_positive" status to SOP (Section 5)

### **LOW PRIORITY (Nice to Have):**
10. Add backtick clarification to Master (Section 4)
11. Remove AL-CASING redundancy in Mixed (Section 6)

---

## Closing Assessment

This is **outstanding work**. The system demonstrates:
- Deep understanding of LLM failure modes
- Rigorous engineering discipline (SOP, versioning, regression testing)
- Genuine field research (reasoning log analysis)

The identified weaknesses are **architectural edge cases**, not fundamental flaws. With the proposed fixes, this system would score **9.5/10**—approaching the theoretical limit for prompt-based constraint enforcement.

**Key Insight for Future Work:**
The "Parentheses Paradox" reveals a deeper pattern: **Authorization Language Matters**. When the Master says "if authorized by Add-on," the Add-on must use explicit authorization syntax ("This Add-on AUTHORIZES parentheses for dates"). Implicit authorization (just showing examples) creates ambiguity.

Consider developing a **Governance Vocabulary** for Add-ons:
- `OVERRIDES`: This rule replaces Master rule X
- `EXTENDS`: This rule adds to Master rule X
- `AUTHORIZES`: This rule permits exception Y to Master constraint Z

This would eliminate all remaining collision zones.

**Final Score: 8.7/10** → **Projected Score After Fixes: 9.5/10**