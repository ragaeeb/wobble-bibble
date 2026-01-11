---
original_filename: synthesis.md
generated_on: 2026-01-11
model_source: Synthesis
---

# AI Reasoning Analysis Synthesis: Islamic Translation Prompts

## Executive Summary
**Ambiguity is the primary bottleneck.**
Across all analyzed models (GPT-5.2 Thinking, Gemini 3.0 Pro, Claude Sonnet 3.5), the primary source of failure and "inference burn" is not a lack of Arabic comprehension, but **policy arbitration**. Models spend 40-70% of their reasoning trace debating *which* rule applies to edge cases (e.g., "Does 'No Arabic' mean no diacritics?", "Is a biography an Isnad?", "Should I fix this typo?").

By replacing "soft" instructions ("use judgment") with **hard decision tables** and **strict categorization**, we can drastically reduce inference time and improve consistency.

---

## 1. Top 5 Universal Struggles (The "Friction Points")

### A. The "Transliteration Boundary" Confusion (High Severity)
Models struggle to define the "limit" of ALA-LC transliteration. They oscillate between strict Isnad-only application and creeping transliteration into:
1.  **Biographical Headers** (Is "Imam Ahmad" a narrator here?)
2.  **Book Titles** (Transliterate *Sahih* or translate *Authentic*?)
3.  **Calendar Months** (Transliterate *Rabi' al-Akhir* or translate *Fourth Month*?)
*   **Result:** Inconsistent outputs where some names/titles have diacritics and others don't.

### B. The "No Arabic Characters" Paradox
Models misinterpret "No Arabic Characters" as a ban on *any* non-ASCII character, leading to the stripping of essential ALA-LC diacritics (`ḥ`, `ʿ`, `ā`).
*   **The Conflict:** "Use accurate ALA-LC transliteration" (requires Unicode diacritics) vs. "Do not use Arabic characters."
*   **Result:** Models strip diacritics or panic and output raw Arabic script, violating the plain text rule.

### C. Technical Terminology: Translate vs. Transliterate
Models waste significant time debating whether to translate standard Islamic terms or keep them as transliterated loanwords.
*   **The Struggle:** "Should I write 'Pilgrimage' or '*Hajj*'?", "Trustworthy" or "*Thiqah*?".
*   **Result:** Inconsistent terminology (e.g., using "Hajj" in one sentence and "Major Pilgrimage" in the next).

### D. The "Tharid" Incident: Theology vs. Literalism
Models freeze when literal translation implies theological absurdity (e.g., "Tharid is better than Allah").
*   **The Struggle:** Literal syntax (`min` = "from/than") vs. Logical/Theological impossibility.
*   **Result:** Models either translate literally (creating blasphemous errors) or stop to "investigate" and add unplanned commentary.

### E. Formatting Anxiety (Citations & Plain Text)
Models are confused by conflicting requirements for "plain text" vs. "structured citations/footnotes."
*   **The Struggle:** How to format footnotes, editor notes, and Qur'an citations without violating the "no markdown" rule.
*   **Result:** "Hallucinated" formatting (e.g., adding `(website)` tags) or dropping strict segmentation IDs.

### F. Political & Sectarian Polarity (The "Safety" Trap)
Models hesitate when encountering sectarian labels (e.g., "Rafidah", "Ikhwan al-Muflisin") or jihad-related terms.
*   **The Struggle:** Fidelity to source vs. Safety/Hate Speech policies. Models often debate "sanitizing" terms (e.g., translating "Rafidah" generally as "rejectors" instead of the specific sect label) or adding defensive commentary.
*   **Result:** "Sanitized" translations that lose the original polemical intent of the author.

### G. Dialect & Textual Corruption ("Scribal Errors")
Models freeze on typos (e.g., `lā ḥaqqa` instead of `lā ḥaqq bihi`) or Yemeni/Local dialects (e.g., `samīlah` as "club" vs "moustache").
*   **The Struggle:** "Should I fix this obvious typo?" vs. "Translate exactly what is written."
*   **Result:** Paralysis. Models burn tokens researching the typo instead of translating or flagging it.

---

## 2. Model-Specific Nuances

| Model Family | Key Strengths | Specific Weaknesses |
| :--- | :--- | :--- |
| **GPT-5.2 Thinking** | Excellent "Process" adherence; best at multi-pass revision. | Prone to "Meta-Narration" (describing what it *will* do instead of doing it). Needs strict "No Meta" rule. |
| **Gemini 3.0 Pro** | Strongest at "Role Adoption" and Theological nuances. | Struggles most with "Dialect vs. Classical" (e.g., Yemeni idioms) and "Arabic-Indic Digits". |
| **Claude Sonnet 3.5** | Best at "Clean Output" and strict formatting limits. | Most sensitive to "Transliteration Scope" ambiguity; prone to over-transliterating if not checked. |

---

## 3. Action Plan: Prompt Refinements

### Fix #1: The Transliteration Decision Table ("Isnad Tokens")
Replace the "Isnad-only" rule with a strict **Token Definition**:
> **Transliteration Rules:**
> 1.  **ISNAD NAMES:** Apply full ALA-LC *only* to names appearing within a formal chain (from `Narrated...` to `said:`).
> 2.  **BIO HEADERS:** Treat biographical subject headers as **Isnad Names**.
> 3.  **MATN/CONTENT:** Use standard English spelling (no diacritics) for all names *inside* the narration body.

### Fix #2: The "Unicode Allow-List"
Clarify the "No Arabic" rule:
> **Character Set Rules:**
> *   **FORBIDDEN:** Formatting (Markdown, HTML), Arabic Script (Unicodes U+0600–U+06FF), Emoji.
> *   **ALLOWED:** Latin Extended-A (for ALA-LC diacritics: `ā`, `ī`, `ū`, `ḥ`, `ʿ`, `ḍ`, `ṣ`, `ṭ`, `ẓ`), Standard Punctuation.
> *   **EXCEPTION:** The single symbol `ﷺ` is allowed and *required* for Prophet salutations.

### Fix #3: The "Locked Glossary"
Provide a mandatory glossary for technical terms to stop decision loops:
> **Terminology Glossary (MANDATORY):**
> *   `Hajj` (keep as Hajj)
> *   `Umrah` (keep as Umrah)
> *   `Thiqah` -> "Trustworthy (Thiqah)"
> *   `Da'if` -> "Weak (Da'if)"
> *   `Sanad` -> "Chain of Narration"

### Fix #4: The "Theology-First" Disambiguation Protocol
> **Ambiguity Protocol:**
> 1.  **Theological Absurdity:** If literal translation implies error (e.g., "better than Allah"), prioritize **Tafsir-based contextual meaning**.
> 2.  **Sectarian Terms:** Translate polemical terms (e.g., "Rafidah") **literally** as used by the author. Do not sanitize or soften for modern political correctness.
> 3.  **Typos/Dialect:** If a word is clearly a typo (e.g., `lā ḥaqqa`), translate the **intended correction** and add a `[Note: Text corrected from 'X']`.

### Fix #5: Strict Output Schema
Force a specific output format for every segment type:
> **Output Schema:**
> *   **Segments:** `P{ID} - {Transliterated Isnad if present}: {Translated Content}`
> *   **Citations:** `[Source: {BookName}, {Vol}:{Page}]` (placed at end of segment)
> *   **Quran:** `Qur'an {Surah}:{Ayah}` (No Surah Name)
> *   **Abbreviations:** Use `B` for Bukhari, `M` for Muslim (Defined List).

---

## 4. Next Steps
1.  **Generate "Master Prompt" Template:** Create a single, modular prompt template incorporating these fixes.
2.  **Create "Genre Variants":** Adapt the master prompt for **Hadith** (Isnad-heavy), **Fiqh** (Term-heavy), and **Tafsir** (Theology-heavy).
3.  **Test Cycle:** Run the new prompts against the "Tharid" edge case and a dense biographical entry to verify the "Transliteration Boundary" fix.
