### Critical Peer Review of Wobble-Bibble Islamic Translation Prompt Lab

---

## 1. **System Score (1-10)**

### **Logic Consistency: 7/10**  
The stacked prompt model (`master_prompt.md` + specialized add-on) is logically sound and well-structured. Rules are clearly defined, and the inheritance model is sensible. However, there are **instruction collisions** (see below) that create ambiguity in edge cases.

### **Academic Rigor: 8/10**  
The system excels in prioritizing **fidelity**, **literalism**, and **structural preservation** (IDs, Isnads). The focus on avoiding sanitization, hallucinations, and typological corrections aligns with scholarly standards. The **Refinement Protocol (SOP)** is systematic and data-driven, which is excellent for iterative improvement.

**Overall Score: 7.5/10**  
The system is strong but has room for tightening rule conflicts and token efficiency.

---

## 2. **Top 3 Weaknesses**

### **Weakness #1: Instruction Collisions Between Master and Add-ons**
Several add-ons reintroduce rules that **conflict** with or **duplicate** the master prompt, creating ambiguity.

#### **Examples:**
#### **a. Transliteration Scope Conflict**
- **Master (`master_prompt.md`):**  
  > *"Isnad narrator names = FULL ALA-LC (diacritics). Rijal subject header = FULL ALA-LC."*  
  It does **not** define what is an "Isnad" beyond transmission verbs.
- **Hadith (`hadith.md`):**  
  > *"Distinguish isnad vs matn; do not guess identities..."*  
  This is redundant but **does not clarify boundaries** beyond what the master already says.
- **Encyclopedia (`encyclopedia_mixed.md`):**  
  > *"Within each segment, apply the relevant rule-set locally: isnad parts follow hadith-style handling..."*  
  This **assumes** the model can detect "isnad parts" — but the master prompt’s definition is vague.  
  **Risk:** Model may over-transliterate biographical headers or under-transliterate matn names.

#### **b. Terminology Glossary Overlap**
- **Master:** Defines a **locked glossary** (e.g., `Thiqah -> thiqah (trustworthy)`).
- **Jarh/Wa Ta’dil (`jarh_wa_tadil.md`):** Redefines the same terms (e.g., `thiqah (trustworthy)`).
- **Result:** Redundant rules waste tokens and risk **inconsistent formatting** (e.g., master says `translit (English)`, add-on might imply `translit (English)` again — but what if the add-on uses different parentheses logic?).

#### **c. “No Arabic Script” vs. ALA-LC Diacritics**
- **Master:**  
  > *"No Arabic script output except ﷺ."*  
  > *"Allowed Latin + Latin Extended (āīūḥʿḍṣṭẓʾ)..."*
- **But:** ALA-LC diacritics (`ā, ʿ, ḍ`, etc.) are **Unicode characters** — and some models misinterpret “No Arabic characters” to mean **no Unicode diacritics** at all.
- **Encyclopedia add-on:** Does not re-clarify this, so the conflict persists.
- **Risk:** Models may strip diacritics (`Ahmad` instead of `Aḥmad`) to comply with “No Arabic script.”

---

### **Weakness #2: Safety Override Integrity is Not Robust Enough**
The system correctly prioritizes **fidelity over safety**, but the instructions are **not aggressive enough** to override model RLHF training.

#### **Evidence from `synthesis.md`:**
> **F. Political & Sectarian Polarity (The "Safety" Trap):**  
> *"Models hesitate when encountering sectarian labels (e.g., "Rafidah", "Ikhwan al-Muflisin") or jihad-related terms."*  
> **Result:** "Sanitized" translations that lose original polemical intent.

#### **Problem Areas:**
- **Master Prompt:**  
  > *"Sectarian/polemical terms: translate literally with proper ALA-LC (e.g., Rāfiḍah). Typos/dialect: Do not correct; translate as written."*  
  This is **too passive**. It does **not** explicitly forbid the model from adding “neutralizing” commentary like *“(a historical term for...)”* or softening labels.
  
- **Jarh/Wa Ta’dil add-on:**  
  > *"Harsh terms (e.g., dajjāl, khabīth, rāfiḍī) must be translated literally; do not soften."*  
  This is better, but still **does not penalize the model** for adding explanatory notes or “contextualizing” the term.

#### **Why it’s insufficient:**
LLMs (especially GPT-family) are **hard-wired** to avoid “hate speech.” A weak instruction like *“translate literally”* is often overridden by internal safety layers.  
**Result:** Models still output softened terms (e.g., “rejectors” instead of “Rāfiḍah”) or add disclaimers.

---

### **Weakness #3: Prompt Bloat & Token Inefficiency**
Despite the goal of minimalism, many rules are **redundant**, **wordy**, or use **markdown-like structures** that waste tokens.

#### **Examples:**

#### **a. Redundant Rule Restatement**
- **Master:** Already defines `NAME CONNECTORS`, `ISNAD BOUNDARY`, `UNICODE`, `GLOSSARY`.
- **Every add-on** restates parts of these rules (e.g., `hadith.md` redefines `ISNAD VERBS`, `jarh_wa_tadil.md` redefines `GLOSSARY`).
- **Impact:** When stacking `master + encyclopedia_mixed`, the prompt becomes **>1200 tokens** — too long for web UI efficiency.

#### **b. Verbose Formatting**
- **Master:**  
  > *"TRANSLITERATION: Isnad narrator names = FULL ALA-LC (diacritics). Rijal subject header = FULL ALA-LC. Any Arabic-script personal name/title anywhere = FULL ALA-LC..."*  
  This could be compressed into a **decision table** (see proposed Negation Rules).

#### **c. Unused Metadata**
- All prompts include **front-matter** like:  
  ```yaml
  ---
  original_filename: master_prompt.md
  generated_on: 2026-01-11
  model_source: Synthesized Expert Assistant
  ---
  ```  
  Per `AGENTS.md`:  
  > *"When pasting prompts into a web UI, you may omit the optional metadata header at the top of prompt files (`--- ... ---`) to save tokens."*  
  **But** the system does **not enforce** this — users may leave them in, wasting tokens.

---

## 3. **Proposed Negation Rules (`Do NOT...`)**  
These rules are **token-lean**, **enforce strictness**, and directly address weaknesses.

> **Negation rules are superior to positive instructions** because they override model safety/“helpful” behavior more effectively.

---

### **Negation Rule #1: Do NOT re-interpret or soften polemical terms.**  
> **Rule:**  
> `Do NOT add explanatory notes, parentheses, or softened synonyms for sectarian/polemical terms. Translate EXACT string as written.`  
>   
> **Why it works:**  
> - Directly blocks models from adding “(historical term)”, “(pejorative)”, or replacing “Rāfiḍah” with “rejectors”.
> - Overrides RLHF safety by **forbidding** the *act* of sanitization, not just instructing literalism.

---

### **Negation Rule #2: Do NOT apply transliteration outside defined boundaries.**  
> **Rule:**  
> `Do NOT transliterate any name/word outside ISNAD or RIJAL HEADER unless it is Arabic-script personal/place name.`  
>   
> **Why it works:**  
> - Solves the **“Transliteration Boundary Confusion”** (Synthesis #1A).
> - Prevents over-transliteration into book titles, common nouns, or matn content.
> - Forces model to use **only** the 3 cases defined in master:  
>   1. Isnad chains  
>   2. Rijal biographical headers  
>   3. Arabic-script personal/place names  

---

### **Negation Rule #3: Do NOT use English-only equivalents for locked glossary terms.**  
> **Rule:**  
> `Do NOT translate locked glossary terms into English-only form. Always use translit (English).`  
>   
> **Why it works:**  
> - Prevents models from writing “trustworthy” instead of `thiqah (trustworthy)`.
> - Eliminates ambiguity from add-ons that restate glossary — now the master’s glossary is **non-overrideable**.

---

### **Negation Rule #4: Do NOT add, remove, or correct any text.**  
> **Rule:**  
> `Do NOT add missing words, correct typos, or emend scribal errors. Translate exactly what is written.`  
>   
> **Why it works:**  
> - Directly blocks the **“Dialect & Textual Corruption”** panic (Synthesis #G).
> - Prevents models from “fixing” `lā ḥaqqa` → `lā ḥaqq bihi` or adding sources.

---

### **Negation Rule #5: Do NOT output any metadata, tags, or mode labels.**  
> **Rule:**  
> `Do NOT output brackets, tags, mode labels (e.g., [HADITH], [FIQH]), or metadata headers.`  
>   
> **Why it works:**  
> - Specifically targets `encyclopedia_mixed.md`’s risk of **“mode-locking”** (adding `[HADITH]` when discipline switches).
> - Enforces **plain text only**, per master rule.

---

## 4. **Review of `encyclopedia_mixed.md` for Genre-Switching**

### **File: `prompts/final/encyclopedia_mixed.md`**

```md
ENCYCLOPEDIA / MIXED (Polymath works: fiqh + hadith analysis + rijal + usul + history/polemics)
USE: Paste MASTER prompt above this. This add-on is for texts that switch disciplines mid-paragraph.
NO MODE TAGS: Do not output any mode labels or bracket tags.
PRIORITY: Within each segment, apply the relevant rule-set locally: isnad parts follow hadith-style handling; jarh/ta'dil phrases use translit (English); fiqh/usul terms use translit (English); polemics are literal.
DISAMBIGUATION: ṣaḥīḥ in hadith grading = ṣaḥīḥ (authentic). ṣaḥīḥ in fiqh validity = ṣaḥīḥ (valid). sunnah as hadith/legal source = sunnah (Prophetic practice). sunnah as legal status = sunnah/mustaḥabb (recommended) when context is a ruling.
HADITH CORE: If isnad appears, map verbs (Haddathana=Narrated to us; Akhbarana/Informed us; An=From; Sami'tu=I heard) and keep FULL ALA-LC for Arabic-script narrator names; do not invent grading or missing links.
TAKHRIJ/GRADING: If the author grades (ṣaḥḥaḥa/ḥassana/ḍaʿʿafa), translate literally and keep the cited work as written in the segment; do not add placeholder sources.
Q&A: If present, Al-Sāʾil=Questioner: ; Al-Shaykh=Answer:.
CREED/POLEMICS: Translate attributes literally when the author does; do not reinterpret. Translate harsh polemics literally; do not soften.
RETRACTION: If the author retracts (kuntu aqulu... wa-al-ana aqulu...), make the change explicit in English.
```

---

### **Critical Assessment**

#### **✅ Strengths**
- **Clear Intent:** Explicitly designed for **sudden genre-switching** (“mid-paragraph”).
- **No Mode Tags:** Explicitly forbids `[HADITH]`, `[FIQH]` tags — crucial for fidelity.
- **Local Rule Application:** Correctly instructs to apply rules **within each segment** based on content type.
- **Disambiguation Table:** Handles key term collisions (`ṣaḥīḥ`, `sunnah`) — excellent for polymath texts.

#### **❌ Weaknesses & Risks**

##### **1. Vague Boundary Definition (“isnad parts”, “jarh/ta'dil phrases”)**
- **Problem:** The phrase *“isnad parts follow hadith-style handling”* assumes the model can **detect** what is “isnad” — but the master prompt’s definition is ambiguous (starts at transmission verbs).
- **Risk:** Model may:
  - Fail to transliterate a name because it misidentifies it as “matn”.
  - Over-transliterate a name in the matn because it thinks it’s part of a chain.
- **Fix:** Add a **decision sub-rule**:
  > `If a transmission verb (Haddathana, Akhbarana, An, Sami'tu) appears, treat ALL names from that verb until the start of speech content (Qala/Anna) as ISNAD — apply FULL ALA-LC.`

##### **2. No Fallback for Unclear Segments**
- **Problem:** In **rapid genre switches**, a single segment may contain **both** fiqh ruling **and** hadith isnad **and** polemic.
- **Current Rule:** *“apply the relevant rule-set locally”* — but does **not** specify **priority** if multiple rules apply.
- **Risk:** Model may apply the **wrong** rule (e.g., treat a polemic term as fiqh term).
- **Fix:** Add **priority order**:
  > `Priority order for mixed segments:  
  > 1. If ISNAD verbs present → apply HADITH rules to that clause.  
  > 2. If JARH/TA’DIL terms present → apply translit (English).  
  > 3. If FIQH/USUL terms present → apply translit (English).  
  > 4. If POLEMICS present → translate literally.`  

##### **3. Missing Safety Override Reinforcement**
- **Problem:** The add-on says *“Translate harsh polemics literally; do not soften.”* — but this is **not strong enough** (see Weakness #2).
- **Risk:** Model still may sanitize “Rāfiḍah” → “rejecters” under safety filters.
- **Fix:** Add a **Negation Rule** specific to this add-on:
  > `Do NOT soften, explain, or replace polemical terms (e.g., Rāfiḍah, Dajjāl). Output EXACT term as written in translit (English).`

##### **4. Token Inefficiency**
- The add-on restates rules already in master (e.g., `HADITH CORE` redefines verb mappings).
- **Fix:** Remove redundant restatements. Rely on master’s rules unless **overridden**.

---

### **Recommendations for `encyclopedia_mixed.md`**

1. **Add Boundary Clarity:**  
   ```md
   ISNAD DETECTION: If segment contains Haddathana/Akhbarana/An/Sami'tu, apply FULL ALA-LC to ALL names from verb until Qala/Anna.
   ```

2. **Add Priority Order:**  
   ```md
   PRIORITY ORDER (for mixed clauses):
   1. ISNAD clause → HADITH rules
   2. JARH/TA'DIL phrase → translit (English)
   3. FIQH/USUL term → translit (English)
   4. POLEMICS → literal translation
   ```

3. **Strengthen Safety Override:**  
   ```md
   Do NOT soften, gloss, or replace polemical terms. Output EXACT term as written in translit (English).
   ```

4. **Remove Redundancies:**  
   Delete lines that repeat master’s rules (e.g., `HADITH CORE` verb mapping — master already has it).

---

## **Summary of Recommendations**

| Area                  | Action                                                                 |
|-----------------------|------------------------------------------------------------------------|
| **Instruction Collisions** | Add **boundary definitions** (isnad detection); remove glossary restatements; clarify Unicode diacritic rule. |
| **Safety Override**   | Add **Negation Rules** (#1, #5) to block sanitization, softening, and explanatory notes. |
| **Token Efficiency**  | Remove metadata headers in production use; compress rules into **decision tables**; eliminate redundant add-on clauses. |
| **Edge Case Coverage**| Add **priority order** to `encyclopedia_mixed.md`; create add-on for **Qur’anic exegesis with embedded hadith** (if needed). |
| **Refinement SOP**    | Ensure `REFINEMENT_GUIDE.md` requires **negation rules** in fixes; add **“Negation Rule Efficacy”** checklist. |

---

## Final Thoughts

The Wobble-Bibble system is **well-designed** for high-fidelity translation but needs **tighter rule enforcement** and **anti-safety layers**. Implementing the proposed **Negation Rules** and tightening genre-switching logic will make it robust against model sanitization and ambiguity.