# Round 2 Testing Synthesis (Jan 11)

**Source Cases**:
- `2026-01-11_gpt-5.2_fatawa_albani`
- `2026-01-11_gemini_3.0_pro_fatawa_albani`
- `2026-01-11_gpt-5-thinking-mini_fatawa_albani`

## 1. Top Regressions Identified

### A. Arabic Leakage (Severity: High)
- **Failure**: Models are still outputting Arabic words like `اختلاف` (ikhtilāf), `الأصل` (al-aṣl), and `جماعت` (jamāʿat) inside English sentences.
- **Affected Models**: GPT-5.2.
- **Diagnosis**: The `NO ARABIC SCRIPT` rule is being overridden by the "fidelity" instruction to preserve meaning, leading models to quote the Arabic term before translating it.

### B. Glossary & Capitalization Drift (Severity: Medium)
- **Failure**: `sunnah` and `mushaf` are frequently lowercased (`sunnah`, `mushaf`) even when referring to the corpus or the physical book, violating the convention `Sunnah` (corpus) / `suunah` (practice).
- **Affected Models**: All.
- **Diagnosis**: The specific capitalization rules for these terms are too subtle or buried. "Sunnah = Prophetic practice" might be interpreted as a common noun instruction.

### C. Transliteration Scope & Diacritics (Severity: Medium)
- **Failure**:
  - `The Sheikh` instead of `The Shaykh`.
  - `Ta'ifah` (missing dot/ayn) instead of `Ṭāʾifah`.
  - `Muhammad` (missing dot) instead of `Muḥammad`.
- **Affected Models**: Gemini 3.0 Pro, GPT-5 Thinking Mini.
- **Diagnosis**: "Full ALA-LC" is competing with standard English spelling for common Islamic terms. The prompt needs to explicitly lock these common terms to their diacritic forms.

### D. Q&A Formatting Instability (Severity: Low)
- **Failure**: Newlines inserted unpredictably after `Questioner:` or `The Shaykh:`.
- **Affected Models**: GPT-5 Thinking Mini.
- **Diagnosis**: The prompt format examples might be ambiguous or the model's own formatting preferences are bleeding through.

## 2. Root Cause Analysis
- **"Fidelity" vs "Constraint" Conflict**: Models prioritize "capturing the exact word" (Arabic leak) over the negative constraint because the negative constraint is a general rule, while the specific context feels like an exception.
- **Glossary Weakness**: Common terms (`Sheikh`, `Sunnah`, `Hadith`) have strong "English Standard" gravity that pulls models away from ALA-LC unless explicitly anchored.

## 3. Action Plan (Hardening Phase 2)

### Fix 1: "Nuclear" No-Arabic Negation
- Update `master_prompt.md` to explicitly forbid Arabic script *even for technical terms*.
- Text: "ABSOLUTE BAN: Do NOT output Arabic script (e.g., لا, الله) under any circumstances except ﷺ. Use transliteration for ALL Arabic terms."

### Fix 2: Locked Glossary Anchor
- Add a explicit "LOCKED TERMS" table to `master_prompt.md` or `encyclopedia_mixed.md` for high-frequency drift items:
  - `Shaykh` (not Sheikh)
  - `Ḥadīth` (not Hadith)
  - `Sunnah` (Capitalized for Corpus)
  - `Muḥammad` (with dots)

### Fix 3: Q&A Format Rigidifier
- In `fatawa.md`, explicitly ban newlines after labels: "Label must be on the SAME line as the text."
