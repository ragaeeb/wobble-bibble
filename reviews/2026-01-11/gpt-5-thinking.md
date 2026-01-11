# Peer review — Wobble-Bibble Islamic Translation Prompt Lab

## 1) Score (logic consistency & academic rigor)

**8/10.**
The stack is coherent, opinionated, and grounded in concrete rules (ALA-LC, ID preservation, Unicode allow-list). The **master** cleanly encodes non-negotiables (IDs first, plain text, no inference, locked glossary, Unicode allow-list) and the add-ons mostly specialize without overreach.  
Rigor shows up again in the SOP (case taxonomy, artifacts, “prefer negations,” regression checks).  

---

## 2) Top 3 weaknesses (with concrete collisions/risks)

1. **Parentheses / citation formatting collisions**

* The **master** restricts parentheses **only** to `translit (English)`. 
* But **jarḥ wa-taʿdīl** tells the model to output dates in parentheses `(d. 256 AH)` and uses parenthesized rumūz, which violates the master’s constraint as written. 
* **Tafsīr** prescribes normalized verse brackets and braces (`[2:255]`, `{…}`), which *may* also clash with “no extra fields unless present.”  
  **Impact:** Models will dither about whether dates/rumūz/braces are allowed, re-introducing “formatting anxiety.” 

2. **Ambiguity protocol vs. creed literalism (safety-override edge)**

* The **master** says: if literal meaning implies a theological error, “use contextual meaning from tafsīr.” 
* The **encyclopedia_mixed** add-on says: “Translate attributes literally; do not reinterpret.” 
  **Impact:** On a sentence where a literal syntactic read looks theologically absurd (the classic *tharīd*-type pitfall), the add-on can push one way while the master pushes another—exactly the kind of arbitration that burns tokens. 

3. **Token redundancy & duplicated mappings**

* ISNĀD verb maps appear in **hadīth** *and* **encyclopedia_mixed**; similar guidance repeats across files (“paste master above this”, jarḥ rumūz notes, etc.).  
* README already claims “token optimized,” but there’s still consolidation room (single shared verb map; one-liner references to shared sections). 
  **Impact:** Extra tokens = shallower lookback for long segments and more room for policy arbitration.

---

## 3) Targeted “Negation Rules” (drop-in, token-lean)

Add these to the **master** (so they govern all add-ons):

1. **No meta** — *Do NOT* add content warnings, policy caveats, or “As an AI…” meta-narration. Output only the translation.
2. **No invented refs** — *Do NOT* invent verse numbers, ḥadīth gradings, sources, cross-refs, or footnotes not present in the segment. 
3. **No diacritic downgrades** — *Do NOT* replace ALA-LC characters with ASCII, and *do NOT* drop the `b.` connector. 
4. **No mode carry-over** — *Do NOT* keep a genre mode beyond the current clause; after punctuation or a chain boundary (`qāla`, `H` tahwīl, etc.) reassess the local genre. 
5. **No extra parentheses** — *Do NOT* use parentheses except for `translit (English)` pairs **and** the explicit exceptions listed in add-ons (e.g., jarḥ dates, rumūz). If not listed, don’t add them.  

*(Rule 5 both preserves the master’s minimalism and legalizes the jarḥ/taʿdīl exceptions so models stop dithering.)*

---

## 4) Instruction collisions (where to tighten)

* **Parentheses scope:** Make the master the single source of truth by explicitly whitelisting add-on exceptions: “Parentheses reserved for `translit (English)`; additionally allowed **only** for jarḥ dates/rumūz and any add-on’s stated exceptions.”  
* **Creed ambiguity precedence:** Add an order: “If *Ambiguity* and *Creed/Attributes literalism* conflict, apply the Ambiguity rule only where a literal read yields a theological impossibility; otherwise obey literalism.” Cite this precedence in **encyclopedia_mixed** to prevent arbitration loops.  
* **Tafsīr citations:** Clarify “Use `[2:255]` **only if** a verse reference of any form is present; do not manufacture a reference.” That keeps faith with “no extra fields unless present.”  

---

## 5) Token-efficiency quick wins

* **Centralize shared maps/tables:** Move ISNĀD verb map to the master (one compact line), and in add-ons replace with “(uses master ISNĀD map).” 
* **Reference, don’t repeat:** Replace repeated “paste master above” boilerplate with a single opening line across add-ons.
* **Tighten glossary:** Keep the locked glossary but prune duplicates (e.g., avoid repeating “hadith” inside `(hadith)` where redundant). 

---

## 6) Edge-case coverage (gaps & add-on ideas)

* **Biographical dictionaries / ṭabaqāt**: handling birth/death strings, kunyas, nisbas, and cross-refs; harmonize with jarḥ terms but with biography-first structure.
* **Manuscript apparatus**: sigla for variants, lacunae, marginalia; define a *literal* representation scheme in plain text.
* **Chronicles / history (akhbār/tārīkh)**: date normalization (AH/CE), battle/polemics tone + isnād-lite chains.
* **Arabic-Indic digits**: explicit rule to normalize `٠١٢٣٤٥٦٧٨٩` → `0–9` (ASCII) to avoid Unicode bans and counting errors—this is a known pain point in the synthesis. 
* **Q&A / sermons outside fatāwā**: brief add-on for khutbah/waʿẓ where quotation, duʿāʾ, and audience address patterns recur.

These can be green-lit via the SOP’s branching criteria (new add-on when A harms B / chronic glossary collision / distinct structure). 

---

## 7) Refinement SOP — practicality & minor upgrades

**What’s strong:** clear artifacts, controlled labels, small files, hashing, regression checks, and the guidance to “prefer negations.”   

**Upgrade suggestions (still token-lean):**

* Add a 6-line **run-sheet** to `03_run_info.txt`: `{prompt_stack_hash | token_count_in | token_count_out | time_to_first_token | total_cost | model_latency}` for pattern mining. (You already capture the hash/IDs; this rounds it out.) 
* Provide a tiny **regex lint** block teams can run before saving: check (a) ID at start, (b) forbidden Unicode, (c) parentheses policy, (d) diacritic presence in isnād names.
* Keep a 10-segment **A/B smoke test** per genre; re-run it whenever the master/add-on changes (fits your regression step). 

---

## 8) Focused review: `encyclopedia_mixed.md` and mode-switching

**What’s good:** The add-on explicitly says “apply the relevant rule-set locally,” maps core isnād verbs, distinguishes jarḥ phrases, fiqh/uṣūl term formatting, and protects polemics. That’s the right intent. 

**What’s thin / how to harden it (without bloat):**

* **Add a trigger lexicon & precedence ladder (one line each):**
  “**Triggers:** isnād verbs → hadith; jarḥ keywords → jarḥ; legal grading/terms → fiqh; `Al-Sāʾil`/`Al-Shaykh` → fatwā/Q&A.” 
  “**Precedence:** hadith chain > jarḥ phrase > fiqh/uṣūl term > polemics.” (Prevents jarḥ terms inside a chain from flipping the whole segment.)
* **Add a reset rule:** “**Reset mode after** a colon, period, `qāla`, tahwīl `H`, or paragraph break; re-detect on the next clause.” (Prevents “mode-locking”.)
* **Creed ambiguity note:** Point to the master’s Ambiguity clause for theological impossibilities to avoid conflict. 

These three lines cost very few tokens but remove most arbitration burn.

---

### Bottom line

The lab is already very strong. Resolve the few rule collisions (parentheses/citations; creed ambiguity precedence), fold duplicate maps into the master, and add the tiny mode-switching micro-rules above. That should push you from **8/10 → 9/10** with minimal token cost. 
