## Peer Review: Wobble-Bibble Islamic Translation Prompt Lab

### **Overall Score: 7.5/10**

**Rationale:** The system demonstrates exceptional architectural rigor with its stacked inheritance model, comprehensive failure-mode taxonomy, and disciplined SOP. However, token redundancy, residual ambiguity in genre-switching protocols, and insufficiently "hardened" safety override language prevent a higher score. The system is academically sound but operationally fragile at the edges.

---

### **Top 3 Critical Weaknesses**

#### **1. Mixed-Genre Mode-Locking & Trigger Insufficiency**
**Location:** `encyclopedia_mixed.md`, `master_prompt.md`  
**Risk:** Models will anchor to the first detected genre and ignore mid-segment switches, causing cascading transliteration and terminology errors.

**Details:** While the Priority Matrix is correct in theory, the **GENRE TRIGGERS** list is dangerously incomplete (only 3 verbs). Albani-style texts frequently use transmission markers like `ʿan`, `samiʿtu`, `qaṣṣaʿnī`, `arfaʿa`, or editor phrases like `qāla al-muḥaqqiq` that aren't listed. Worse, there are **no explicit EXIT triggers**—once in "Hadith Mode," the model has no signal to revert to Fiqh rules for subsequent rulings. The instruction "apply locally" is too vague; models need **boundary tokens** or **lookahead negation rules** (e.g., "If a ruling term follows an isnad, suspend isnad rules after the first complete sentence").

---

#### **2. Systemic Redundancy & Token Inflation**  
**Location:** Across all `prompts/*.md` except `master_prompt.md`  
**Risk:** Wasted context window, maintenance drift, and contradictory updates.

**Details:** The following rules are **copy-pasted identically** across 4+ add-ons (~150-200 tokens each):
- Q&A structure forcing ("Al-Sāʾil -> **Questioner:**")
- Arabic Leakage conditional logic
- AL-casing rules ("lowercase al- mid-sentence")
- PROPER NAMES vs COMMON NOUNS distinction

This violates the inheritance model's core principle: **Master should own universal mechanics; add-ons should own genre exceptions only**. The redundancy creates a versioning nightmare—updating the Q&A rule requires synchronized edits across `fatawa.md`, `encyclopedia_mixed.md`, and potentially others, risking desynchronization.

---

#### **3. Safety Override "Permeability"**
**Location:** `master_prompt.md` (CRITICAL NEGATIONS block)  
**Risk:** Frontier models (GPT-5.2+, Claude 4.5) will still sanitize via "stealth rewriting" when encountering high-polarity terms (e.g., `dajjāl`, `rāfiḍī`, `jihād`).

**Details:** The negations use strong language ("DO NOT sanitize") but lack **exemplary negative reinforcement**. Models trained on RLHF need explicit **prohibited output patterns** to override deeply ingrained safety policies. Without concrete examples like `INCORRECT: "rejectors (Rafidah)"` vs. `CORRECT: "Rāfiḍah"`, models will perform "soft sanitization"—adding parenthetical clarifications that violate the "no extra fields" rule while technically keeping the term. The system needs **anti-examples** and **severity escalation** language.

---

### **Proposed "Negation Rules" (Do NOT...)**  

These are **single-line, non-negotiable** rules to insert into the Master's CRITICAL NEGATIONS block:

1. **`DO NOT` append parenthetical clarifications to polemical terms** (e.g., never output `Rāfiḍah (a pejorative term for Shia)`; output only `Rāfiḍah`).  
2. **`DO NOT` infer or reconstruct truncated isnad chains**; if the segment ends with `...ʿan`, stop translation at the ellipsis—do not guess the missing narrator.  
3. **`DO NOT` switch transliteration granularity mid-text**; once a name is rendered in full ALA-LC (e.g., `al-Ḥāfiẓ Ibn Ḥajar`), preserve that exact spelling throughout the entire output segment.  
4. **`DO NOT` apply "helpful" English pluralization to transliterated terms**; output `karāmāt (miracles)` on first occurrence, but never `karāmāt(s)` or `karāmāt(s) (miracles)`.  
5. **`DO NOT` narrate genre transitions**; never output meta-phrases like `Now switching to Fiqh mode...` or `Applying Jarh rules here`—execute the switch silently.

---

### **`encyclopedia_mixed.md` Deep Dive**  

**Strengths:**  
- Explicit Priority Matrix prevents arbitration loops in theory.  
- DISAMBIGUATION section correctly handles `ṣaḥīḥ`/`sunnah` polysemy.  
- SEGMENTATION instruction forbids genre merging, preserving structural fidelity.

**Critical Gaps:**  
- **Meta-Talk Invitation:** Headers like `PRIORITY MATRIX`, `GENRE TRIGGERS`, and `DISAMBIGUATION` are instruction labels, but their explicitness may cause models to echo them in output (e.g., `**Priority Matrix Applied: Isnad detected**`). This violates the "No meta-talk" rule. These should be renamed to neutral, imperative terms like `CONFLICT RESOLUTION ORDER` and `MODE BOUNDARIES`.  
- **Trigger False Positives:** The trigger `qāla al-muṣannif` (the author said) is ambiguous—Albani often says `qāla al-muṣannif` to introduce a quote **within** a Fiqh discussion, which should **not** trigger blanket "Quote Rules" that suppress needed `translit (English)` pairs.  
- **No Fallback State:** If no trigger matches, the prompt defaults to "NARRATIVE (Base)" but never defines what "Narrative" means for transliteration scope, leading to blobbing risk in historical passages.  

**Verdict:** The prompt is **70% effective** but needs **lookahead buffer rules** and **anti-trigger negations** (e.g., `If qāla al-muṣannif is followed by fiqh terms, ignore Quote Rules`).

---

### **Backtick/Formatting Noise Audit**

| Location | Issue | Severity |
|----------|-------|----------|
| `master_prompt.md:18` | `` `translit (English)` `` | **Medium** - Backticks may cue markdown code fences in reasoning traces. |
| `encyclopedia_mixed.md:12` | `` `jihād, miḥrāb, karāmāt` `` | **Medium** - Inline backticks in examples could be mimicked. |
| `master_prompt.md:28` | Single backticks around `āīūḥʿḍṣṭẓʾ` | **Low** - Character list, but still formatting noise. |
| **All prompt YAML headers** | `---`, `original_filename:` | **High** - These markdown fences **must** be stripped before pasting into web UIs per README, but the prompt text itself doesn't warn against leaving them. This risks model confusion about allowed formatting. |

**Recommendation:** Replace all instructional backticks with **quotation marks** and add a specific negation: **`DO NOT` enclose terms or examples in backticks, markdown fences, or code blocks in your output.**  

---

### **SOP (`REFINEMENT_GUIDE.md`) Assessment**

**Practicality:** The guide is **excellent for human researchers** but **overwhelming for AI agents**. The 8-file artifact structure is rigorous but token-heavy for automated analysis. AI agents would benefit from a **condensed "Agent Version"**: a single `case_manifest.json` with key-value fields instead of 8 separate files.

**Label Sufficiency:** The 16-label taxonomy is **comprehensive** but misses emerging failure modes from the synthesis:
- **`mode_locking_mixed_genre`** (not captured by `mixed_genre_switch`)
- **`safety_stealth_sanitization`** (finer than `safety_sanitization`)
- **`translit_scope_creep`** (beyond `translit_boundary`)

**Missing:** No label for **"Backtick Echo"** or **"Instruction Parroting"** meta-talk failures.

---

### **Final Recommendation**

The system is **production-ready for single-genre texts** but requires **Phase 1 hardening** before deploying on complex polymath works:
1. **Consolidate** universal mechanics (Q&A, Leakage, Casing) into `master_prompt.md`.  
2. **Strengthen** CRITICAL NEGATIONS with anti-examples and stealth-sanitization detection.  
3. **Expand** `encyclopedia_mixed.md` triggers to 20+ patterns and add explicit exit clauses.  

Without these fixes, the ~8.5/10 academic rigor will degrade to ~6.5/10 in real-world edge cases due to mode-locking and token arbitration.