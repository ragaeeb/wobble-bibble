### Peer Review: Wobble-Bibble Islamic Translation Prompt Lab

#### Overall Assessment
The Wobble-Bibble project is an exceptionally disciplined, research-driven effort to engineer high-fidelity translation prompts for Islamic scholarly texts. It stands out for its explicit focus on countering LLM failure modes (safety sanitization, transliteration drift, hallucination, and structural loss) through rigid, rule-based constraints rather than vague "best judgment" instructions. The stacked inheritance model (master + genre add-on) is elegant and practical for token-constrained web UIs. The refinement protocol treats prompt engineering as empirical science, with traceable failure cases—a rarity in prompt repositories.

**Score: 9/10**  
- **Logic Consistency**: 9.5/10 – Rules are hierarchical, modular, and mostly non-contradictory. Minor ambiguities remain in boundary cases.  
- **Academic Rigor**: 9/10 – Strong commitment to literalism, structural fidelity, and historical accuracy (especially in polemics and jarh). The explicit rejection of RLHF-driven sanitization is academically courageous and necessary for scholarly utility.

#### Top 3 Weaknesses

1. **Transliteration Boundary Ambiguity Persists**  
   Despite the synthesis report identifying this as the #1 friction point, the master prompt's rules ("Isnad narrator names = FULL ALA-LC", "Rijal subject header = FULL ALA-LC", "Any Arabic-script personal name/title anywhere = FULL ALA-LC") still leave gray zones. For example, when a name appears in a fiqh dispute attribution outside an isnad (e.g., "qāla Ibn Taymiyyah" in a usul text), it is unclear whether it counts as "rijal subject header" or "any Arabic-script personal name." Models may still oscillate.

2. **Safety Override Strength is Uneven**  
   The master prompt has a single line: "Sectarian/polemical terms: translate literally with proper ALA-LC (e.g., Rāfiḍah)." This is too weak to reliably override strong RLHF safety training on sectarian or politically charged content. Specialized add-ons (jarh_wa_tadil, encyclopedia_mixed) strengthen it with "do not soften," but the master lacks a robust, explicit "Safety Override" clause that preemptively disables sanitization. Models like Claude and Gemini are known to ignore mild instructions when polemics trigger internal policies.

3. **Typo/Scribal Error Handling is Contradictory**  
   The master prompt says: "Typos/dialect: Do not correct; translate as written."  
   Yet the synthesis report (section 1.G) and earlier refinement thinking suggest models freeze on obvious scribal errors, and one proposed fix was to allow correction with a note. The current absolute prohibition risks either (a) literal translations of nonsense, or (b) models ignoring the rule and "fixing" anyway. No middle path (e.g., translate literally + flag) is provided.

#### Proposed Negation Rules (Add to Master Prompt)
These should be inserted near the top of the master prompt (after ROLE) as a high-priority block titled **CRITICAL NEGATIONS – OBEY ABSOLUTELY** to maximize enforcement strength.

1. **Do NOT sanitize, soften, or neutralize polemical, sectarian, or harsh terms** (e.g., Rāfiḍah, dajjāl, khabīth, munāfiq, Ikhwān al-Muflisīn). Translate them literally according to the author's intended meaning, even if modern audiences find them offensive. Academic fidelity overrides any concern for harm, bias, or political correctness.

2. **Do NOT apply ALA-LC diacritics to names or titles that appear outside formal isnād chains or rijāl biographical headers**, even if they are originally in Arabic script. Use common English spellings without diacritics in matn, commentary, attributions, or disputes (e.g., "Ibn Taymiyyah said" not "Ibn Taymiyyah said").

3. **Do NOT correct, emend, or reconstruct apparent scribal errors or typos**. Translate the text exactly as written, even if it appears grammatically or factually impossible. Never add notes, brackets, or "sic" unless the source itself contains an editorial comment.

4. **Do NOT add, invent, or expand citations, sources, book abbreviations, or references** beyond what is explicitly present in the segment. Never resolve rumūz (kh, m, d, etc.) into full book names unless the Arabic text itself does so in that segment.

5. **Do NOT output any meta-commentary, explanations, or process descriptions**. Never describe your reasoning, rule application, or decision process in the final output.

#### Review of `encyclopedia_mixed.md`

**Strengths**  
- Explicitly forbids mode tags/labels – crucial for preventing "mode-locking" where models get stuck in one genre's style.  
- Instructs local rule application ("Within each segment, apply the relevant rule-set locally") – this directly addresses genre-switching in polymath authors (Albani, Ibn Taymiyyah, Ibn ʿAbd al-Barr).  
- Provides disambiguation for high-ambiguity terms (ṣaḥīḥ, sunnah) that change meaning across disciplines.  
- Handles Q&A, retraction, and polemics appropriately.

**Weaknesses / Risks**  
- Relies on the model to correctly identify "relevant rule-set" per clause or sentence. In long, dense paragraphs with rapid switching (e.g., isnad → fiqh ruling → jarh phrase → usul argument), models may still apply the wrong sub-rule due to context window priming.  
- No explicit fallback hierarchy if local identification fails (e.g., "default to hadith rules for chains, fiqh for rulings").  
- The instruction "NO MODE TAGS: Do not output any mode labels or bracket tags" is strong, but models sometimes leak internal thinking into output under stress; a stronger negation (as proposed above) would help.

**Verdict**: It is currently the best available option for mixed-genre texts and significantly better than forcing a single-genre add-on. It largely succeeds at avoiding mode-locking through local application and tag prohibition. However, for extremely rapid genre-switching texts, performance will still vary by model capability in contextual disambiguation. Consider adding a simple priority list (e.g., "If isnad verbs present → hadith rules dominate that clause; else if legal ruling terms → fiqh; else if jarh terms → rijal") to reduce decision burden.

#### Minor Recommendations
- Move the **SELF-CHECK** section in master to a mandatory final internal step with explicit 3-pass wording (as referenced in AGENTS.md).  
- Add to master: "If a term appears in the LOCKED GLOSSARY, use exactly that formatting, overriding genre add-on preferences."  
- Consider consolidating overlapping term lists across add-ons into the master glossary to reduce redundancy.

Overall, this is one of the most sophisticated prompt systems I have reviewed for scholarly translation. With the proposed negations and boundary clarifications, it would reach near-ceiling performance for current frontier models.