---
original_filename: nova-2-pro.md
generated_on: 2026-01-11
model_source: Nova 2 Pro
---

## Synthesis Report: Translation Prompt Template Refinement for Islamic Texts

### Overview
This report synthesizes findings from multiple sources including translator reasoning outputs, AI reviewer feedback, and sample translations. The goal is to refine prompt templates for accurately translating diverse Islamic texts (Quranic exegesis, hadith, fiqh, history, etc.) into English while preserving technical terminology, attribution, and context.

---

### Types of Content We Translate
1. **Hadith Literature**
   - *Ṣaḥīḥ al-Bukhārī*, *Ṣaḥīḥ Muslim*, *Sunan* collections, *Musnad* works
   - Contains: isnād (chains of narration), matn (text), narrator evaluations

2. **Quranic Exegesis (Tafsīr)**
   - *Tafsīr al-Ṭabarī*, *Mafātīḥ al-Ġayb* (al-Rāzī), *Tafsīr ʿAbd al-Razzāq*
   - Contains: verse explanations, linguistic analysis, scholarly disagreements

3. **Fiqh (Jurisprudence)**
   - *al-Umm* (al-Shāfiʿī), *al-Muġnī* (Ibn Qudāmah), *al-Ḥidāyah*
   - Contains: legal rulings (wājib, ḥarām), evidence (dalīl, ijmāʿ)

4. **History & Biography**
   - *Siyar Aʿlām al-Nubalāʾ* (al-Dhahabī), *Ṭabaqāt* works
   - Contains: biographical entries, chronological events

5. **Narrator Criticism (Jarḥ wa-Taʿdīl)**
   - *Tahdhīb al-Kamāl* (al-Mizzī), *Mīzān al-Iʿtidāl*
   - Contains: reliability assessments of narrators (thiqah, ḍaʿīf)

6. **Legal Fatawa**
   - *Fatāwá al-Hindīyyah*, individual scholar fatawa
   - Contains: practical rulings, scholarly opinions

7. **Usūl al-Fiqh**
   - *al-Uṣūl* (al-Sarakhsī)
   - Contains: legal theory, rule derivation methodology

8. **Grammar & Linguistics**
   - *Alfiya* (Ibn Mālik), *Ajurrumiya*
   - Contains: grammatical rules, examples

---

### Structure of Data Sent for Translation
Each translation segment follows a consistent format:
```
[ID] - [Arabic Text]
```
- **ID Prefixes**: 
  - `P` = Paragraph 
  - `C` = Chapter/Section Heading
  - `B` = Book Title
  - `N` = Narrator Entry (biographical)
  - `F` = Footnote/Marginalia
- **Content Types**:
  - Full isnād chains with narrator names
  - Quranic verses (with references like [البقرة: ٢٨٤])
  - Hadith matn
  - Scholarly commentary
  - Chapter headings
  - Poetic verses

---

### Key Translation Requirements Identified

#### 1. Transliteration Standards (ALA-LC)
- **Apply ONLY to narrator names in isnād chains** (e.g., *Muḥammad ibn Ismāʿīl*)
- **NOT applied** to:
  - General textual content
  - Technical terms (except when part of narrator names)
  - Place names (use standard English: Mecca, not Makkah)
  - Book titles (translate descriptively: *Kitāb al-Ṣalāh* → "The Book of Prayer")

#### 2. Religious Phrases & Symbols
| Arabic | English Equivalent | Notes |
|--------|---------------------|-------|
| صلى الله عليه وسلم | ﷺ | ONLY allowed Arabic character |
| الله | Allah | Always, even when generic "god" is meant |
| رحمه الله | may Allah have mercy on him | For deceased scholars |
| رضي الله عنه | may Allah be pleased with him | For Companions |

#### 3. Technical Terminology Handling
- **Hadith Sciences**: 
  - ṣaḥīḥ → sound/authentic
  - ḥasan → good
  - ḍaʿīf → weak
  - marfūʿ → elevated (to Prophet)
  - mawqūf → stopped (at Companion)
- **Fiqh Terms**:
  - wājib → obligatory
  - mustaḥabb → recommended
  - ḥarām → impermissible
  - makrūh → disliked
- **Quranic Sciences**:
  - asbāb al-nuzūl → occasions of revelation
  - nāsikh wa-mansūkh → abrogation

#### 4. Contextual Accuracy Priorities
Based on reviewer feedback and LLM reasoning struggles:

| Priority | Issue | Solution |
|----------|-------|----------|
| **Highest** | Misinterpretation of *ilāh* vs *Allah* | Explicit rule: "Translate الله as Allah. Translate إله/آلهة as 'god/gods' for false deities." |
| **High** | Literal vs. Meaning Balance | "Prefer faithful semantic translation over word-for-word. Use natural English for idioms." |
| **High** | Chain Preservation | "Preserve isnād structure exactly. Do not merge or reorder narrator names." |
| **Medium** | Poetry Handling | "Maintain line breaks. Prioritize meaning over rhyme." |
| **Medium** | Footnotes/Marginalia | "Preserve brackets/parentheses distinguishing main text from annotations." |

---

### LLM Struggles & Strengths Identified from Reasoning Outputs

#### Where LLMs Struggle Most
1. **Ambiguous Grammatical Cases**:
   - Difficulty determining correct interpretation of ambiguous Arabic syntax
   - *Solution*: "When syntax is ambiguous, provide most contextually appropriate translation and note alternatives only if significantly different in meaning."

2. **Complex Fiqh Scenarios**:
   - Struggles with intricate legal scenarios involving multiple conditions
   - *Example*: Inheritance calculations with multiple heirs and exclusions
   - *Solution*: Break down step-by-step in reasoning before final translation

3. **Idiomatic Expressions**:
   - Literal translation of idioms leads to confusion
   - *Example*: "كأنما ينظر في قعر الزجاجة" (as if looking at the bottom of a bottle)
   - *Solution*: Prioritize intended meaning over literal words

4. **Poetic Meter & Rhetoric**:
   - Difficulty preserving poetic structure while translating meaning
   - *Solution*: "For poetry, maintain line breaks. Prioritize meaning over rhyme/meter unless context demands form preservation."

5. **Cross-Context References**:
   - Missing connections between distant verses or hadiths in commentary
   - *Solution*: Implement multi-pass approach to track references

#### Where LLMs Excel
1. **Consistent Terminology**:
   - Excellent at maintaining consistent transliteration of names
   - Strong at applying defined terminology across large texts

2. **Structural Preservation**:
   - Precise at maintaining isnād chain structure
   - Reliable at preserving ID markers and segmentation

3. **Contextual Disambiguation**:
   - Good at using surrounding text to resolve ambiguous terms
   - Effective at distinguishing between different scholarly opinions

---

### AI Reviewer Suggestions Summary

#### From Claude-Sonnet-4.5 (Thinking)
1. **Added Specialized Templates**:
   - Created genre-specific prompts for Tafsīr, ʿAqīdah, Zuhd, Biographical texts
   - Included terminology mapping for each genre

2. **Improved Clarity**:
   - Clarified "Allah vs. ilāh" rule
   - Specified handling of honorifics beyond ﷺ
   - Added examples for ALA-LC edge cases

3. **Structural Improvements**:
   - Reordered revision passes: 
     1. Transliteration accuracy
     2. Context & terminology 
     3. Numeric alignment
   - Added consistency checks for repeated terms

#### From Gemini-3.0-Pro
1. **Role Definition**:
   - Introduced explicit [ROLE], [STYLE], [CONSTRAINTS] structure
   - Separated concerns for better LLM parsing

2. **Ambiguity Resolution**:
   - Added explicit handling for ambiguous segments
   - Introduced "briefly note ambiguity in [brackets]" approach

3. **Terminology Standardization**:
   - Provided fixed translations for technical terms
   - *Example*: "thiqah" → "trustworthy", "ṣadūq" → "truthful"

#### From Grok-4.1-Thinking-Beta
1. **Structural Clarity**:
   - Broke prompt into numbered sections
   - Reduced length by 20% while improving precision

2. **Edge Case Handling**:
   - Added rules for footnotes, variant readings, cross-references
   - Specified biographical formatting conventions

3. **Book-Type Specific Guidance**:
   - Provided tailored instructions for each genre
   - Included full example prompts for each type

---

### Recommended Refined Prompt Template (Master Version)

```text
[ROLE]
You are an expert Arabic-to-English translator specializing in classical Islamic heritage. You are translating excerpts from: {{BOOK_NAME}} ({{BOOK_TYPE}}).

[TRANSLATION STYLE]
1. Accuracy: Prioritize faithful semantic translation. Use natural English phrasing for clarity.
2. Terminology: Use established English terms for Islamic sciences ({{SPECIALIZED_FIELD}}).
3. Transliteration: ALA-LC ONLY for proper names in chains. Never transliterate general words.
4. Divine Names: "الله" → "Allah". "إله" → "god/gods" (false deities).
5. Honorifics: "صلى الله عليه وسلم" → "ﷺ". "رضي الله عنه" → "may Allah be pleased with him".

[CHAIN HANDLING]
- Format: "A narrated to us from B from C..."
- Standard terms: Ḥaddathana → Narrated to us, Akhbarana → Informed us, ʿAn → From

[OUTPUT RULES]
- Plain text only. NO markdown.
- Preserve ALL IDs (P####, C####, etc.) exactly.
- No Arabic characters except "ﷺ".
- Chapter headings: Title Case (never ALL CAPS).

[REVIEW PROCESS]
1. Transliteration accuracy (ALA-LC for names)
2. Context & terminology accuracy
3. Numeric marker alignment
4. Consistency check for repeated terms

[SPECIALIZED INSTRUCTIONS]
{{GENRE_SPECIFIC_GUIDELINES}}
```

### Genre-Specific Additions

#### For Hadith Books
```
GENRE_SPECIFIC_GUIDELINES: 
- Distinguish Isnād from Matn clearly.
- Translate hadith gradings literally: ṣaḥīḥ, ḥasan, ḍaʿīf.
- Preserve full chains verbatim.
```

#### For Tafsīr Books
```
GENRE_SPECIFIC_GUIDELINES:
- Translate verses with surah:ayah references.
- Preserve qirāʾāt discussions.
- Maintain distinctions between: Quranic text, prophetic hadith, scholarly interpretation.
- Key terms: tafsīr bi-al-maʾthūr (transmitted exegesis), asbāb al-nuzūl (occasions of revelation).
```

#### For Biographical Entries
```
GENRE_SPECIFIC_GUIDELINES:
- Full name with lineage using ALA-LC.
- Translate kunyahs: Abū → Abū, Umm → Umm.
- Translate nisbahs: al-Baṣrī → from Basra, al-Mufassir → the exegete.
- Format: Single-line unless line breaks exist.
```

---

### Implementation Recommendations

1. **Use Genre-Specific Prompts**: Select template based on book type
2. **Three-Pass Revision**: Always implement the structured review process
3. **Consistency Glossaries**: Maintain term mapping for key technical terms
4. **Handle Edge Cases**: Explicitly address footnotes, poetry, variant readings
5. **Validation**: Cross-check with multiple LLMs and human reviewers

This refined approach addresses the key pain points identified in reasoning outputs and reviewer feedback, providing a robust framework for high-quality Islamic text translation.