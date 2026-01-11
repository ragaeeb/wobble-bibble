### Synthesized Report: Refining Prompt Templates for Accurate Translation of Islamic Texts

#### 1. Project Overview
This project focuses on developing and refining highly specialized prompt templates for LLMs (primarily reasoning-heavy models like GPT-5.2 Thinking, Gemini 3.0 Pro, Claude Sonnet 4.5, and Grok-4.1 Thinking) to translate Arabic Islamic texts into English. The goal is maximum accuracy, consistency, and fidelity to technical terminology while adhering to strict output constraints (plain text only, no markdown, preserve segment IDs, limited Arabic characters, ALA-LC transliteration applied selectively).

The texts span a wide range of Islamic disciplines, and the prompts are tailored (or need tailoring) to each genre because the challenges differ significantly across hadith collections, tafsir, fiqh, rijāl, fatāwā, etc.

#### 2. Types of Content Translated
We translate diverse Islamic source material, segmented into small chunks with unique IDs (P####, C###, N###, T###, F####, etc.) for easy mapping back to the original.

Major categories observed:

- **Hadith collections** (e.g., Musnad Aḥmad, Mustakhraj Abū ʿAwānah, Sunan Abī Dāwūd, Musnad-related works): Full isnāds + matn, chapter headings, occasional author commentary or grading.
- **Tafsīr works** (e.g., Ṭabarī, ʿAbd al-Razzāq, Fakhr al-Dīn al-Rāzī): Qurʾānic verses, multiple transmitted interpretations, linguistic discussions, isnāds for āthār.
- **Fiqh and Uṣūl al-Fiqh** (e.g., al-Umm of al-Shāfiʿī, al-Mughnī of Ibn Qudāmah, al-Uṣūl of al-Sarkhasī, Fatāwā al-Hindiyyah): Legal reasoning, evidence citation, madhhab-specific terminology.
- **Fatāwā and Q&A** (e.g., Albānī, Muqbil b. Hādī): Contemporary rulings, manhaj discussions, jarḥ wa-taʿdīl of modern figures, polemics.
- **Rijāl / Jarḥ wa-Taʿdīl** (e.g., Tahdhīb al-Kamāl of al-Mizzī, al-Ḍuʿafāʾ of al-ʿUqaylī, Siyar Aʿlām al-Nubalāʾ): Biographical entries, layered names/kunyā/nisab/laqab, grading statements, source codes in parentheses.
- **Biographical / Ṭabaqāt works** (e.g., entries with long name chains and titles).
- **ʿAqīdah / Theological works** (e.g., refutations, creedal poems).
- **Footnotes and marginalia** (e.g., Kitāb al-Muṣannaf of Ibn Abī Shaybah): Variant readings, manuscript notes, short technical comments.
- **Chapter headings / structural elements only** (e.g., Ṭabarī headings, tables of contents).
- **Polemical / manhaj works** (e.g., Abū l-Ḥasan al-Maʿribī’s refutation).

#### 3. Current Input Structure
- A base prompt defining role, general rules (accuracy, literal preference with contextual exceptions, terminology handling, plain-text output, ﷺ and Allah rules, preserve IDs exactly, no markdown).
- Book-specific customizations (book title, genre-specific guidance).
- Triple-check or double-check revision process.
- The Arabic text segmented with IDs at the start of each paragraph or logical unit.
- Strict constraints: no Arabic except ﷺ, no added verbs in lists, no uppercase headings, no markdown.

#### 4. LLM Performance Analysis (from reasoning dumps)

**Areas where LLMs perform very well (clear instructions):**
- Preserving segment IDs exactly and in order.
- Using ﷺ correctly and translating الله → Allah.
- Plain-text output (most models now obey “no markdown” reliably).
- Basic transmission verbs (ḥaddathanā → “narrated to us”, akhbaranā → “informed us”).
- Not attempting to “fix” seemingly out-of-order IDs.
- Handling straightforward prose translation with natural English flow.

**Areas where LLMs struggle the most (recurring issues across models):**
1. **Transliteration scope creep**: Almost every model over-applies ALA-LC diacritics to non-narrator names (book authors, scholars mentioned in commentary, place names, technical terms). They often add macrons/ḥ/ṭ etc. to everything “Arabic-sounding” despite the explicit limitation “only on the names of the narrators in the chain.”
2. **Terminology inconsistency**: 
   - Hadith gradings: alternating between “ṣaḥīḥ” (transliterated) vs. “authentic” vs. “sound.”
   - Jarḥ wa-taʿdīl terms: “weak” vs. “ḍaʿīf” vs. “infirm”; “trustworthy” vs. “thiqa.”
   - Fiqh rulings: wājib/obligatory/mandatory.
   - No fixed mapping provided → models guess or vary.
3. **Literal vs. idiomatic balance**: Models frequently err too literal (producing awkward English) or too paraphrastic (losing nuance in technical passages). The vague “prefer literal except when context fits to translate by meaning” causes oscillation.
4. **Structural / list handling**: Biographical entries and rijāl works are often “sentencified” (adding “He is…” or verbs) instead of keeping list-like structure. Variant name readings get merged or rephrased.
5. **Footnotes and variants**: Models struggle with manuscript notes (¬١, parentheses, bracketed codes); some translate the symbols, others ignore distinctions.
6. **Poetry and chapter headings**: Line breaks sometimes lost; headings over-capitalized or rephrased.
7. **Genre-specific blind spots**: 
   - Tafsīr: conflating Qurʾānic text vs. exegete’s words.
   - Fatāwā: colloquial dialect not always rendered naturally.
   - Rijāl: source codes (س, د ت ق) sometimes altered or explained instead of preserved.

#### 5. Synthesis of Previous AI Agent Suggestions

**Common valuable suggestions I agree with:**
- Structured prompt sections ([ROLE], [GENERAL RULES], [GENRE-SPECIFIC GUIDANCE], [TRANSLITERATION RULES], [TERMINOLOGY MAPPING], [OUTPUT CONSTRAINTS], [REVISION PROCESS]) → greatly improves parsing.
- Provide explicit terminology mappings (e.g., ṣaḥīḥ → “authentic”, ḥasan → “good”, ḍaʿīf → “weak”; or decide to keep transliterated with fixed spelling).
- Include 1–2 short worked examples in the prompt (a full isnād + matn translation) — agents unanimously say this is more effective than paragraphs of rules.
- Clarify “literal vs. meaning” more precisely: “Translate literally unless doing so would produce ungrammatical or unclear English, in which case use the most natural English equivalent while preserving all technical meaning.”
- Separate genre-specific add-ons (hadith, tafsir, rijāl, fiqh, fatāwā) as modular sections that can be slotted in.
- Explicit guidance for biographical lists: “Do not add verbs; preserve list structure.”
- For footnotes: clear rules on preserving symbols and variant indicators.

**Suggestions I partially agree with:**
- Allowing minimal formatting (line breaks for poetry, indentation for chains) → conflicts with hard “plain text only, no markdown” rule, but line breaks are usually safe and improve readability for long chains.
- Translating honorifics like raḍiya Allāhu ʿanhu → “may Allah be pleased with him” → useful for Companions, but risks adding text; better to have an optional toggle.

**Suggestions I disagree with or find less useful:**
- Translating الله as “God” in some contexts — contradicts the explicit rule.
- Adding inline notes for ambiguities — violates plain-text requirement.
- Overly long prompts (>800 words) — agents sometimes produce bloated versions that models truncate or ignore parts of.
- Removing the triple-check revision instruction — it has proven very effective at reducing hallucinations.

#### 6. Key Takeaways and Recommended Next Steps
- The core prompt is already strong in constraints and structure, but needs tighter scoping of ALA-LC (explicit negative rule: “Do NOT apply diacritics to book titles, author names outside chains, technical terms, or general proper nouns”) and a fixed terminology table.
- Genre-specific modules are essential — a single “one-size-fits-all” prompt cannot handle the divergent challenges of hadith chains vs. dense Hanafi uṣūl reasoning vs. terse rijāl entries.
- Including concrete examples (especially a rijāl entry and a footnote block) will likely yield the biggest accuracy gain.
- Final output format adherence is now good; the remaining errors are almost entirely in transliteration scope and terminology consistency.

This synthesis indicates we are close to a highly reliable template set — primarily needing clearer boundaries on transliteration, standardized term mappings, modular genre sections, and worked examples.