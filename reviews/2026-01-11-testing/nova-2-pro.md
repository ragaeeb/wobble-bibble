### Critical Peer Review of Wobble-Bibble Islamic Translation Prompt Lab

---

## 1. **System Score (1-10)**  
**Logic Consistency & Academic Rigor: 7/10**  

**Rationale:**  
- **Strengths:** Strict fidelity rules, explicit safety overrides, and structured refinement protocol demonstrate strong academic intent. The "Critical Negations" block in `master_prompt.md` effectively combats model sanitization.  
- **Weaknesses:** Collisions between `master_prompt.md` and genre add-ons (especially parentheses/transliteration scope) cause rule arbitration. Inconsistent handling of "common nouns" vs. "proper names" risks "blobbing."  

---

## 2. **Top 3 Weaknesses**

### **1. Instruction Collisions (Arbitration Trap)**  
**Issue:**  
- **Parentheses Conflict:** `master_prompt.md` restricts parentheses *only* to `translit (English)`. But `hadith.md`/`tafsir.md` require `(d. 256 AH)` and `[2:255]`. Models drop dates/citations to comply with Master.  
- **Transliteration Scope Conflict:** Master mandates *full* ALA-LC for *any* Arabic name, but `encyclopedia_mixed.md` intends Isnad-only scope. Result: Book titles like *Ṣaḥīḥ* get transliterated unnecessarily.  

**Impact:** Models freeze in rule arbitration (observed in synthesis reports).  

### **2. The "Blobbing" Test Failure**  
**Issue:**  
- `encyclopedia_mixed.md`’s rule:  
  > *"COMMON NOUNS/TERMS (e.g., jihād, miḥrāb, karāmāt): Do NOT output bare transliteration."*  
  But it fails to define **where "first occurrence" ends**. Models either:  
  - Transliterate *all* instances (e.g., `Miḥrāb` every time), violating "no bare transliteration."  
  - Apply `translit (English)` to **proper names** (e.g., `Ibn (Son)`), violating "Proper Names = Translit Only."  

**Impact:** Inconsistent term handling undermines academic utility.  

### **3. Safety Override Integrity Gaps**  
**Issue:**  
- Safety overrides rely on passive instructions (*"translate literally"*). But no **active negation** blocks exist for:  
  - **Disclaimers:** Models still prepend *"As an AI..."*  
  - **Softening:** *"Rafidah (a historical group)"* instead of literal `Rāfiḍah`.  
- `master_prompt.md`’s *"NO SANITIZATION"* is a single line. LLMs’ RLHF layers easily override weak instructions.  

**Impact:** Polemical fidelity compromised in ~30% of stress tests (per synthesis report).  

---

## 3. **Proposed "Negation Rules"**  
Add these to `master_prompt.md` **CRITICAL NEGATIONS** block. Negations override RLHF safer than permissions.

```md
## CRITICAL NEGATIONS (OBEY ABSOLUTELY):
...
6. NO DISCLAIMERS: DO NOT output "As an AI", "This may be sensitive", or any self-referential apology.
7. NO SOFTENING: DO NOT add explanatory clauses to polemical terms (e.g., "(a historical sect)"). Output raw term.
8. NO PARENTHESES EXPANSION: DO NOT add extra parentheses beyond allowed uses (translit pairs, dates, codes).
9. NO COMMON NOUN TRANSLITERATION: DO NOT output bare transliterated common nouns (e.g., *Miḥrāb*). Always use `translit (English)`.
10. NO MODE LABELS: DO NOT output "[Hadith Mode]", "[Fiqh Mode]", or similar meta-tags.
```

---

## 4. **Review of `encyclopedia_mixed.md` (Genre-Switching)**  

### **Strengths**  
- **Priority Matrix:** Explicit order (`Isnad > Jarh > Fiqh`) reduces ambiguity.  
- **Genre Triggers:** `"ḥaddathanā" -> Isnad Rules` is well-defined.  

### **Weaknesses & Fixes**  
#### **A. "Mode-Locking" Risk**  
**Issue:**  
No mechanism to **reset** mode after a trigger. If a paragraph starts with Isnād but shifts to Fiqh, models stay in "Hadith Mode" (over-transliterating `wājib`).  

**Fix:** Add **"Reset Clause"** to `encyclopedia_mixed.md`:  
```md
## MODE RESET (Prevent Locking):
- After translating a segment boundary (P####), discard active mode. Re-evaluate genre from the *next* trigger.
- If no trigger in next segment, default to PRIORITY MATRIX #4 (Narrative).
```

#### **B. Missing "First Occurrence" Guard**  
**Issue:**  
`COMMON NOUNS` rule lacks binding to *segment boundaries*. Models apply `translit (English)` globally, causing repetition.  

**Fix:** Add precision:  
```md
### COMMON NOUN HANDLING:
- Apply `translit (English)` **ONLY** to the **first occurrence per segment**.  
- Subsequent uses: English-only (e.g., "jihad" after "jihād (struggle)").
```

#### **C. "Meta-Talk" Risk**  
**Issue:** Rules like *"Apply locally"* invite narration (e.g., *"Switching to Fiqh mode..."*).  

**Fix:** Replace vague terms with **direct commands**:  
```md
## NO META-TALK:
DO NOT describe rule application. Translate sequentially.
```

---

## 5. **Backtick/Formatting Noise Check**  

### **Findings**  
1. **No Markdown in Output:** All `prompts/final/*.md` correctly specify *"Plain text only (no markdown)"*.  
2. **Backticks Used Correctly:**  
   - `translit (English)` uses parentheses (allowed).  
   - **Risk:** `fatawa.md`/`fiqh.md` use *backticks* in docs (e.g., \`wājib (obligatory)\`), but **final prompts omit them**. ✅ **Safe.**  
3. **Header Noise:**  
   - All add-ons start with `USE: Paste MASTER prompt...`. This is **necessary instruction**, not noise.  
   - **No `---` front matter** in final prompts (metadata headers are omitted per README). ✅ **Compliant.**  

### **Recommendation**  
- **Remove residual backticks** from documentation examples (e.g., in `AGENTS.md` *"translit (English)"* is shown correctly).  
- **Add explicit ban** in `master_prompt.md`:  
  > *"DO NOT output backticks (`), asterisks (*), or any markdown symbols."*  

---

## 6. **Meta-Talk & "Mode" Terminology Risk**  

### **Analysis**  
- **`master_prompt.md`:** ✅ Safe. Uses *"CRITICAL NEGATIONS"* — no self-reference.  
- **Genre Add-ons:**  
  - `encyclopedia_mixed.md` uses *"Apply HADITH rules"* — **risky**. Models may narrate *"Applying Hadith rules..."*.  
  - `REFINEMENT_GUIDE.md` uses *"Mode-Locking"* — **internal doc only** (not part of prompt). ✅ Acceptable.  

### **Fix**  
In **all add-ons**, replace *"Apply [X] rules"* with **direct commands**:  
```md
## ISNAD TRIGGER:
If "ḥaddathanā" appears:  
  - Use FULL ALA-LC for all names until end of isnād chain.  
  - Map verbs exactly as defined.  
  - DO NOT describe this process.
```

---

## 7. **Token Efficiency & Bloat**  

### **Issues**  
1. **Redundant Rules:**  
   - `master_prompt.md` defines *"SALUTATION"* but all add-ons repeat *"ﷺ"* handling. → **Wasteful.**  
   - `fatawa.md`/`fiqh.md` both redefine *"AL-CASING"* → **Duplicate.**  

2. **Over-Explained Examples:**  
   - `encyclopedia_mixed.md` includes *"e.g., ʿAbd Allāh b. Yūsuf"* — unnecessary if Master already defines it.  

### **Optimizations**  
Apply **Lean Rule Protocol**:  
```md
## EFFICIENCY RULES:
- ONLY define rules **not** in MASTER.
- Omit examples if MASTER covers them.
- Use bullet points, not paragraphs.
```

**Savings Estimate:** 15-20% token reduction.  

---

## 8. **Refinement SOP (`REFINEMENT_GUIDE.md`) Review**  

### **Strengths**  
- Clear folder structure (`YYYY-MM/DD/{case_id_slug}`).  
- Controlled `07_labels.txt` vocabulary prevents noise.  

### **Weaknesses**  
#### **A. Labels Insufficient for Current Failures**  
**Missing Labels:**  
- `safety_override_failure` (for disclaimers)  
- `parentheses_collision`  
- `mode_reset_failure`  

**Fix:** Add to **Labels Taxonomy**:  
```md
## 5) Labels taxonomy
- ...
- safety_override_failure
- parentheses_collision
- mode_reset_failure
```

#### **B. "Minimal Fix Idea" Too Vague**  
*Example template:*  
> *"Minimal fix idea (one prompt change, not a rewrite):"*  

**Problem:** Encourages partial fixes. SOP should enforce **"One Rule, One Case"** discipline.  

**Fix:** Update **Section 7**:  
```md
## 7) Triage → fix workflow
...
4) Make **ONE** prompt change per batch:
   - Must be a **single sentence** negation or clarification.
   - Example: *"Add 'DO NOT output disclaimers' to CRITICAL NEGATIONS."*
```

#### **C. No `prompt_hash` Enforcement**  
**Issue:** Teams skip hashing, causing version drift.  

**Fix:** Make mandatory in `03_run_info.txt`:  
> *"Critical: Include SHA-256 hash of concatenated `master + add-on` text."*  

---

## Summary of Actions  

| **Area**               | **Action**                                                                 |
|------------------------|----------------------------------------------------------------------------|
| **Instruction Collisions** | Resolve parentheses/transliteration scope in `master_prompt.md`          |
| **Blobbing**           | Add "first occurrence per segment" rule to `encyclopedia_mixed.md`        |
| **Safety Overrides**   | Add 4 negation rules (#6–#9) to `master_prompt.md`                        |
| **Mode-Locking**       | Add "MODE RESET" clause to `encyclopedia_mixed.md`                        |
| **SOP Labels**         | Add `safety_override_failure`, `parentheses_collision`, `mode_reset_failure` |