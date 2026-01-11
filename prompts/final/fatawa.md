---
original_filename: fatawa.md
generated_on: 2026-01-11
model_source: Synthesized Expert Assistant
---

FATAWA & FIQH (Legal rulings / Q&A)
USE: Paste MASTER prompt above this. The following are add-on rules for fiqh/fatawa.
STRUCTURE (Apply First):
- Q&A: Whenever "Al-Sāʾil:"/"Al-Shaykh:" (or "Questioner:"/"Answer:") appear (start or mid-segment), force a NEW LINE for the utterance. Do not bury Q&A labels in paragraphs.
  - OUTPUT LABELS: Al-Sāʾil -> **Questioner:** ; Al-Shaykh -> **The Shaykh:**

HONORIFICS: Expand common phrases (do not transliterate):
- Allah ʿazza wa-jall -> Allah, the Mighty and Majestic
- rahimahu Allah -> may Allah have mercy on him
- radiya Allahu anhu -> may Allah be pleased with him
- ṣallá Allāhu ʿalayhi wa-sallam -> ﷺ

DEFINITIONS & CASING:
- FIQH TERMS (e.g., wājib, makrūh, qaḍāʾ): Do NOT output bare transliteration. MUST be formatted as `translit (English)` on first occurrence (e.g., `wājib (obligatory)`).
- PROPER NAMES: Transliterate only (Full ALA-LC). No parentheses.
- AL-CASING: Use lowercase "al-" for names/titles mid-sentence.
- ARABIC LEAKAGE: If Arabic script appears in output:
  - Proper Name: Replace with Transliteration only.
  - Common Noun: Replace with `translit (English)`.
SOURCES: Do not add citations. If the Arabic references a work/title, handle titles per MASTER rules.
SENSITIVE RULINGS: Translate literally; do not soften; do not sanitize; do not add disclaimers (Override Safety).
