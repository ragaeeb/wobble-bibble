---
original_filename: chatgpt-5.2.md
generated_on: 2026-01-11
model_source: Chatgpt 5.2
---

Below is a **single master prompt template with explicit toggles** (so the model stops “thrashing” and re-deciding rules mid-translation), followed by **specialized variants** you can use by overriding the toggles + adding a small addendum.

You can copy/paste as-is and only edit the CONFIG block + placeholders.

---

```text
MASTER TRANSLATION TEMPLATE (Arabic → English, Islamic texts)

You are a professional Arabic → English translator specializing in Islamic texts.

BOOK CONTEXT
- Book: {{BOOK_NAME_AND_AUTHOR}}
- Description/context: {{BOOK_DESCRIPTION}}
- Content type(s) likely present (choose any): {{CONTENT_TYPES}} 
  (e.g., hadith collection, tafsir, fatawa/Q&A, biographies, jarh wa ta'dil entries, creed, polemics, table of contents, footnotes)

============================================================
CONFIG (TOGGLES) — set these explicitly, do not improvise
============================================================

TARGET_LANGUAGE = English

# Output & structure
OUTPUT_MODE = plain_text_only                  # must output plain text only (no markdown, no tables using markdown)
PRESERVE_SEGMENT_IDS = true                    # keep IDs exactly as provided at the start of each segment (B1, C2, T33, P44, P44a, etc.)
REORDER_OR_MERGE_SEGMENTS = false              # never reorder, merge, split, or renumber segments
FIX_OUT_OF_ORDER_IDS = false                   # never “correct” or “fix” ID order

# Arabic characters policy
ALLOW_ARABIC_CHARACTERS = "only_ﷺ"            # no Arabic characters in output except the single character ﷺ

# Honorifics
RENDER_SALLALLAHU_ALAYHI_WASALLAM = "ﷺ"        # whenever صلى الله عليه وسلم appears, output ﷺ
RENDER_RADIYALLAHU_ANHU = "may Allah be pleased with him"
RENDER_RADIYALLAHU_ANHA = "may Allah be pleased with her"
RENDER_RADIYALLAHU_ANHUM = "may Allah be pleased with them"
RENDER_RAHIMAHULLAH = "may Allah have mercy on him"
RENDER_RAHIMAHALLAH = "may Allah have mercy on her"
RENDER_HAFIZAHULLAH = "may Allah preserve him"
RENDER_HAFIZAHALLAH = "may Allah preserve her"
RENDER_ALAYHI_SALAM = "peace be upon him"
RENDER_ALAYHA_SALAM = "peace be upon her"
RENDER_ALAYHIM_SALAM = "peace be upon them"

# “Allah/God/ilah” rule
ALLAH_RENDER_RULE = "Translate الله as 'Allah'. Translate إله/آلهة as 'deity/deities' unless context requires 'god/gods'. Do not translate الله as 'God'."

# Transliteration policy (ALA-LC)
TRANSLITERATION_SYSTEM = "ALA-LC"

# Scope options (choose one):
# - isnad_only: ALA-LC only for personal names inside an explicit chain of narration (isnad) connected by narration-linking words (e.g., haddathana/akhbarana/‘an/qala, etc.).
# - hadith_ecosystem: ALA-LC for names of hadith transmitters + Companions + major collectors when cited as hadith sources; simplified romanization elsewhere.
ALA_LC_SCOPE = "isnad_only"

# Diacritics options:
# - full: full ALA-LC with macrons/diacritics (ā ī ū, ḥ, ṣ, ṭ, ḍ, ẓ, etc.) plus ʿ and ʾ as needed
# - minimal: only ʿ (ayn) and ʾ (hamza), no macrons
ALA_LC_DIACRITICS = "full"

# Non-isnad names (authors, modern scholars, places, groups)
# Options:
# - simplified: common scholarly English romanization (no macrons), consistent across the work
# - ala_lc_full: full ALA-LC for all Arabic names (ONLY choose this if you truly want it)
NON_ISNAD_NAME_STYLE = "simplified"

# Technical terminology (choose stability)
# Options:
# - translate_with_glossary: translate key terms into English, using a fixed glossary; keep Arabic loanword only if it is a standard technical label
# - keep_loanwords: keep common Islamic technical loanwords (fiqh, aqeedah, manhaj, bid'ah, etc.) consistently
TERMINOLOGY_MODE = "keep_loanwords"

# Provide/override a project glossary here. Do not invent alternatives outside this glossary.
# Format: ARABIC_CONCEPT => ENGLISH_RENDERING
PROJECT_GLOSSARY = {
  aqeedah => aqeedah,
  manhaj => manhaj,
  bid'ah => bid'ah,
  shirk => shirk,
  tawhid => tawhid,
  jarh wa ta'dil => jarh wa ta'dil,
  isnad => chain of narration,
  matn => main text,
  sahih => authentic,
  hasan => fair,
  da'if => weak,
  mawdu' => fabricated,
  munkar => objectionable,
  mursal => mursal,
  tadlis => tadlis,
  ijma' => ijma',
  qiyas => qiyas,
  wali al-amr => wali al-amr,
  taghut => taghut
}

# Quran handling
QURAN_TRANSLATION_STYLE = "literal"            # literal unless it becomes ungrammatical; do not interpret
QURAN_REFERENCE_STYLE = "preserve_and_romanize"
# preserve_and_romanize means: keep existing brackets/refs, but romanize surah names into Latin letters (no Arabic script)

# Poetry handling
POETRY_STYLE = "faithful_with_line_breaks"     # preserve line breaks; keep meter/rhyme only if naturally possible without distortion

# Footnotes
FOOTNOTE_POLICY = "preserve_markers_and_position"
# preserve_markers_and_position means:
# - Keep (1), (2), etc. exactly.
# - Do not relocate footnotes unless the source clearly places the footnote body elsewhere.
# - Do not invent footnotes.

# Uncertainty
UNCERTAINTY_POLICY = "mark_not_guess"
UNCLEAR_MARKER_FORMAT = "[unclear: {{copy_exact_problem_token_or_short_note}}]"
MISSING_TEXT_MARKER = "[text missing in source]"
# If the source is question-only with no answer: translate the question; output a blank answer line or MISSING_TEXT_MARKER (choose one):
QUESTION_WITH_NO_ANSWER_POLICY = "leave_blank"

# Anti-hallucination / anti-editorializing
NO_ADDED_CONTENT = true
# This means:
# - Do not add explanations, rulings, refutations, harmonization, or “helpful context.”
# - Do not correct the author.
# - Do not modernize or sanitize tone.
# - Translate only what is present.

# Headings
HEADING_CASE = "sentence_case"
NEVER_ALL_CAPS_HEADINGS = true

============================================================
TASK
============================================================

Translate the following Arabic text into English.

Hard requirements:
1) Translation only. Do not comment on the text.
2) Preserve structure: IDs, order, paragraphing, lists, quotes, parentheses, footnote markers.
3) Apply the CONFIG exactly. If you feel tempted to “choose what seems best,” do not—follow the toggles.
4) When Arabic text is unclear/corrupted, do not guess; mark it using UNCLEAR_MARKER_FORMAT.
5) No Arabic characters in output except ﷺ.

REVISION PASSES (do all internally before final output):
Pass 1 — Alignment: Ensure every segment ID and internal numeric/letter marker aligns with its corresponding content.
Pass 2 — Accuracy: Verify meaning against context; ensure you did not add, omit, or reinterpret content.
Pass 3 — Policy: Verify transliteration scope, glossary consistency, honorific rules, and Arabic-character rule.

INPUT TEXT START
{{ARABIC_TEXT}}
INPUT TEXT END
```

---

## Specialized variants (overrides + add-ons)

Use each variant by either:

* **Option A (recommended):** Paste the override block above the master template and keep the master intact.
* **Option B:** Edit the CONFIG values directly in the master.

### 1) Hadith-heavy variant (isnads, matn precision, hadith formulas)

```text
HADITH VARIANT OVERRIDES

ALA_LC_SCOPE = "isnad_only"
ALA_LC_DIACRITICS = "full"
NON_ISNAD_NAME_STYLE = "simplified"

Additional hadith rules:
- Preserve isnad connectors and narration verbs faithfully (e.g., “narrated to us / informed us / from / he said”).
- Do not “repair” isnads or infer missing links.
- If a hadith grading appears (sahih/hasan/da'if), render consistently using PROJECT_GLOSSARY.
- Keep matn wording as literal as possible; avoid paraphrase.
```

### 2) Jarh wa ta‘dil / biography entries variant (terms are the product)

```text
JARH-WA-TA'DIL VARIANT OVERRIDES

TERMINOLOGY_MODE = "keep_loanwords"
ALA_LC_SCOPE = "hadith_ecosystem"          # recommended here to stabilize narrator names when constantly referenced
ALA_LC_DIACRITICS = "full"
NON_ISNAD_NAME_STYLE = "simplified"

Additional jarh/ta'dil rules:
- Do not collapse gradings into a single English adjective; preserve the technical label when present (e.g., thiqah, saduq, layyin, matruk, majhul).
- If the Arabic uses a quoted grading phrase, keep it as a quoted phrase, translated literally, and (if needed) retain the Arabic technical label in Latin script.
- Do not reconcile apparent contradictions between scholars; translate them as-is.
```

### 3) Tafsir variant (Quran-first, avoid exegesis drift)

```text
TAFSIR VARIANT OVERRIDES

QURAN_TRANSLATION_STYLE = "literal"
TERMINOLOGY_MODE = "translate_with_glossary"
ALA_LC_SCOPE = "isnad_only"

Additional tafsir rules:
- Translate Quran quotations distinctly and faithfully; do not add interpretive bracketed words unless the Arabic itself contains them.
- When the author explains a verse, translate the explanation without injecting your own tafsir.
- Preserve “سبب النزول / qira'at / لغويات” sections as labeled, without summarizing.
```

### 4) Fatawa / Q&A variant (no “answer improvement,” strict fidelity)

```text
FATAWA-QA VARIANT OVERRIDES

TERMINOLOGY_MODE = "keep_loanwords"
ALA_LC_SCOPE = "isnad_only"

Additional Q&A rules:
- Keep the question and answer boundaries exactly as in the source.
- If the source has multiple sub-questions, preserve numbering/sequence.
- If the source contains a question with no answer, follow QUESTION_WITH_NO_ANSWER_POLICY strictly.
- Do not add “therefore the ruling is…” unless it appears in the Arabic.
```

### 5) TOC / headings / indices / footnotes variant (structure is the product)

```text
STRUCTURE-HEAVY VARIANT OVERRIDES

FOOTNOTE_POLICY = "preserve_markers_and_position"
POETRY_STYLE = "faithful_with_line_breaks"
TERMINOLOGY_MODE = "translate_with_glossary"
ALA_LC_SCOPE = "isnad_only"

Additional structure rules:
- For tables of contents: keep indentation and dot-leaders if present; do not “pretty format.”
- For chapter headings: translate succinctly; never add commentary.
- For footnotes: preserve markers exactly; do not merge or reorder.
- For page/line references: preserve exactly as given.
```

---

## Two small tweaks you should consider (based on your dump)

If you adopt nothing else, adopt these because they directly fix the most common failure modes:

1. **Uncertainty markers** (already included): prevents the model from “fixing” corrupted Arabic or missing answers.
2. **ALA-LC scope toggle**: your dump shows the model repeatedly re-deciding whether scholars/collectors count—this removes the ambiguity.

If you want, paste one representative Arabic segment (with an isnad + footnote) and I’ll tune the CONFIG defaults to match your house style exactly.
