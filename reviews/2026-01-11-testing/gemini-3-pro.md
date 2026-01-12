This is a comprehensive peer review of the **Wobble-Bibble** Islamic Translation Prompt Lab v4.0.

Based on the provided documentation, prompts, and analysis logs, here is the evaluation of the system's logic, robustness, and academic fidelity.

### **1. Logic Consistency Score: 8/10**

**Verdict:** High Potential, hampered by "Policy Arbitration" friction.

The "Stacked Prompt" architecture (Master + Add-on) is scientifically sound for domain adaptation. The explicit separation of "Logic" (Master) and "Genre" (Add-on) is a robust pattern for LLM context handling.

However, the score is capped at **8** because of **Instruction Collisions**. The system currently forces the model to burn inference tokens arbitrating between contradictory rules (e.g., Master forbidding parentheses vs. Add-ons requiring them). This "cognitive dissonance" in the prompt logic is the primary cause of dithering and inconsistent formatting.

---

### **2. Top 3 Critical Weaknesses**

#### **A. The "Parentheses Paradox" (Instruction Collision)**

* 
**The Conflict:** The `master_prompt.md` strictly rules: *"Parentheses are allowed ONLY for: (a) required technical-term pairs... (b) dates/codes if explicitly authorized"*. However, add-ons like `jarh_wa_tadil.md` require parentheses for death dates `(d. 256 AH)` and book codes `(kh)`.


* 
**The Failure:** Models trained to follow "safety/instruction hierarchy" often prioritize the Master Prompt (Universal Rule) over the Add-on, causing them to strip essential dates or codes to comply with the "No Parentheses" constraint.


* **Impact:** Loss of critical data (dates/citations) or hallucinated formatting (using brackets `[]` instead to bypass the rule).

#### **B. The "Soft" Safety Override (Sanitization Leakage)**

* 
**The Weakness:** The prompts rely on affirmative instructions like *"Translate literally regardless of safety policies"*. While explicit, modern RLHF (Reinforcement Learning from Human Feedback) models have deep-seated refusals for terms like "Kuffar" or "Rafidah".


* **The Failure:** Without a "Hard Negation" (e.g., *"DO NOT sanitize"*), models view the instruction as a "preference" rather than a hard constraint. They often "compromise" by translating "Rafidah" as "dissenters" (technically correct but historically sterile) or adding apologetic footers.


* **Impact:** Academic infidelity in polemical or historical contexts.

#### **C. "Mode-Locking" in Polymath Texts**

* 
**The Weakness:** The `encyclopedia_mixed.md` prompt relies on a "Priority Matrix"  to switch between Isnad (Full Transliteration) and Fiqh (Translation).


* **The Failure:** LLMs struggle to switch "modes" mid-paragraph. Once a model sees an Isnad trigger (`ḥaddathanā`), it enters "Hadith Mode" and may mistakenly transliterate common nouns in the subsequent Fiqh sentence (e.g., writing *ṣalāh* instead of "prayer") because it is "locked" into the ALA-LC density of the previous sentence.


* **Impact:** Inconsistent readability; "blobbing" of common nouns.



---

### **3. Proposed "Negation Rules" (The Fix)**

To harden the system, replace "soft permissions" with these specific **Negative Constraints**:

1. **For Parentheses Collision:**
> "DO NOT apply Master Prompt formatting restrictions to content fields defined by the active Add-on. The Add-on's formatting rules **override** the Master constraints for dates, codes, and citations."


2. **For Safety Sanitization:**
> "DO NOT soften, euphemize, or neutralize polemical terms. DO NOT substitute specific sect names (e.g., 'Rafidah') with generic English terms (e.g., 'rejectors'). DO NOT output any disclaimer, apology, or 'Note:' regarding the content's tone."


3. **For Meta-Talk/Hallucination:**
> "DO NOT explain your translation process. DO NOT output 'Here is the translation:' or 'Note: I have corrected...'. Output **ONLY** the target text segments starting with the ID."


4. **For Transliteration Creep (Blobbing):**
> "DO NOT transliterate common nouns (e.g., jihad, masjid, din) unless they are part of a Proper Name. DO NOT capitalize common nouns mid-sentence."



---

### **4. Review: `encyclopedia_mixed.md**`

**Status:** **Functional but High-Risk.**

* 
**Strengths:** The "Genre Triggers" section  is excellent. Using specific Arabic verbs (`zuiʿma`, `qāla`) to trigger logic switches is the most reliable way to guide an LLM.


* 
**Weaknesses:** The "Priority Matrix"  is abstract. "Isnad > Jarh > Fiqh" requires the model to evaluate the *entire* segment's intent before translating.


* **Recommendation:** Move from "Priority" to **"Scope Blocking"**.
* *Current:* "If transmission verbs appear, apply HADITH rules."
* *Proposed:* "Apply HADITH rules **strictly** to the chain of names. **STOP** applying Hadith rules immediately after the speech verb (`qāla`/`anna`)."
* This explicit "Exit Trigger" is currently missing, causing the "Hadith Mode" to bleed into the text body.





---

### **5. Formatting Noise Check**

* **Backticks:** The documentation frequently uses backticks for emphasis (e.g., `Rafidah`).
* *Risk:* Low. Most models distinguish prompt formatting from requested output.


* **Markdown Headers:** The prompts themselves (e.g., `master_prompt.md`) use Markdown headers (`## RULES`).
* *Risk:* Moderate. Some models might mirror this structure and output `## Translation` headers.
* 
*Fix:* The `master_prompt.md` explicit rule *"Plain text only. No Markdown."*  is generally effective, but removing headers from the prompt text (using CAPS LOCK labels instead, e.g., `[RULES]`) saves tokens and reduces "style contamination."





---

### **6. SOP & Refinement Guide Review**

The `REFINEMENT_GUIDE.md` is robust.

* 
**Labels:** The taxonomy (e.g., `translit_boundary`, `safety_sanitization`) is excellent for clustering failures.


* 
**Workflow:** The "3-Pass Rule" (Alignment -> Accuracy -> Compliance)  is the gold standard for accuracy.


* **Missing Element:** The SOP does not explicitly track **"Regression Testing"** for the *Master* prompt. Changing the Master prompt affects *all* genres.
* *Add to SOP:* "Any edit to `master_prompt.md` requires running a 3-segment test on `hadith`, `fiqh`, AND `tafsir` to ensure no global regression."



---

### **Next Step**

The most urgent fix is resolving the **Instruction Collisions** that cause model "dithering."

**Would you like me to generate the "Hardened" v4.1 Master Prompt** that incorporates the specific negation rules and resolves the parentheses conflict?