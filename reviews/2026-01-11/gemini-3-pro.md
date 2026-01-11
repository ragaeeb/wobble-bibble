Here is a critical peer review of the **Wobble-Bibble Islamic Translation Prompt Lab** (v4.0).

### 1. System Scoring

**Score: 9/10**

* **Logic Consistency:** High. The "Inheritance Model" is conceptually brilliant for this domain. By separating the "Iron Rules" (ALA-LC, No-Markdown, ID preservation) from "Genre Nuance" (Isnad verbs vs. Fiqh terms), you minimize token waste and context confusion. The definitions for "Transliteration Boundaries" in `synthesis.md`  are accurately reflected in the `master_prompt.md`.


* **Academic Rigor:** Excellent. The explicit prioritization of "Fidelity over Safety" and the "No Inference" rule  directly address the most common failures of RLHF-aligned models in academic contexts. The refusal to standardize/sanitize polemics  is a critical feature for scholarly integrity.



### 2. Top 3 Weaknesses

**A. The "Exhaustive List" Trap in Add-ons**
In `hadith.md` and `fiqh.md`, you provide lists of verbs and technical terms (e.g., *Haddathana*, *wājib*). While helpful, LLMs often treat examples as **exhaustive limits** rather than **illustrative patterns**.

* *Risk:* If a text uses a rare Isnad verb like *anba'a* (without the suffix) or a Fiqh term not in the list (e.g., *mandūb* is listed, but *faḍīlah* isn't), the model may revert to generic English ("virtue") instead of the required `translit (English)` format because it didn't see an exact match in the "add-on" list.

**B. Implicit vs. Explicit Hierarchy Resolution**
The `README.md` states users must "stack" prompts, but the prompts themselves do not explicitly state which layer wins in a direct collision.

* 
*Risk:* `master_prompt.md` sets a "Locked Glossary". If a future `fiqh.md` update redefines a term from that locked list (e.g., handling *Sunnah* differently in a legal context), the model may dither between the Master's "Iron Rule" and the Add-on's "Specialization," causing the "Policy Arbitration" inference burn you noted in `synthesis.md`.



**C. The "No Mode Tags" Blind Spot in `encyclopedia_mixed.md**`
The `encyclopedia_mixed.md` prompt explicitly forbids "mode tags". While this keeps the output clean for the user, it robs the model of a "cognitive anchor."

* *Risk:* Complex polymath texts (like Ibn Taymiyyah) switch from *Isnad* to *Theology* to *Fiqh* in a single sentence. Without allowing the model to internally "tag" these shifts (even if just in a CoT block), the model is forced to switch rules "silently," increasing the likelihood of formatting drift (e.g., missing a transliteration because it didn't explicitly acknowledge it had entered "Isnad Mode").

### 3. Proposed "Negation Rules" (The Anti-Patterns)

To strengthen the system against the failures identified in `synthesis.md`, inject these Negation Rules into the `master_prompt.md`:

1. 
Anti-Meta-Narration (Targeting GPT-5.2 "Thinking" quirks ):


> "Do **NOT** output conversational fillers, preambles, or meta-commentary (e.g., 'Here is the translation', 'I will now translate'). Output **ONLY** the segment ID followed by the translation text."


2. 
Anti-Sanitization (Targeting "Safety" Traps ):


> "Do **NOT** modernize, soften, or euphemize polemical terms (e.g., *Rāfiḍah*, *Kāfir*). You are a historical archivist; preserving the author's original bias/tone is a requirement for accuracy, not a violation of safety policies."


3. 
Anti-Hallucination (Targeting Formatting Anxiety ):


> "Do **NOT** bold keywords, add bullet points, or insert structural formatting that does not exist in the source Arabic. If the Arabic is a flat paragraph, your English must be a flat paragraph."


4. 
Anti-Reconstruction (Targeting Typos/Dialects ):


> "Do **NOT** 'fix' scribal errors or typos in the translation. If the source says 'Monday' but context implies 'Tuesday', translate 'Monday'. Do not emend the text."



### 4. Review of `encyclopedia_mixed.md`

**Assessment:**
The prompt is a strong attempt to handle high-complexity texts, specifically addressing the "Polymath" problem. The instruction to "apply the relevant rule-set locally"  is the correct *logical* approach, but it places a massive cognitive load on the model's immediate context window.

**Critique:**
The instruction "NO MODE TAGS"  is risky. It assumes the model can perfectly track state changes invisibly.

**Recommendation:**
Modify `encyclopedia_mixed.md` to allow **Internal Reasoning Markers** that are stripped in the final step, or use a "delimiter" approach for the model's benefit.

*Current:*

> "PRIORITY: Within each segment, apply the relevant rule-set locally..." 
> 
> 

*Proposed:*

> "DYNAMIC SWITCHING: You must mentally detect the discipline of each clause.
> * If text is Isnad -> Apply `hadith.md` rules (Full ALA-LC).
> * If text is Legal Ruling -> Apply `fiqh.md` rules (Translit terms).
> * If text is Polemic -> Apply literalism.
> * **Do NOT** output labels for these switches, but ensure the *formatting* changes instantly at the boundary of the clause."
> 
> 

### 5. Review of `REFINEMENT_GUIDE.md`

**Assessment:**
The SOP is disciplined and rigorous. The "3-Pass Rule" (Alignment, Accuracy, Compliance)  is a gold standard for LLM translation. The "Labels Taxonomy"  is excellent for long-term dataset analysis.

**Gap:**
The process is heavily manual. "Copy the contents of... " and "Save these files... " creates friction. An agent or script should automate the "dumping" of the prompt stack.

**Next Step for User:**
Would you like me to generate a **Python script** that automates the "Refinement Case" creation? It could take a `case_id` and the input/output text, and automatically generate the folder structure (`01_input.txt`, `04_prompt_stack.txt`, `07_labels.txt`) defined in your SOP to save you manual copy-pasting time.