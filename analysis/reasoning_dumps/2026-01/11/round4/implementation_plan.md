# Round 4 Implementation Plan

## 1. Analysis of Regressions
### GPT-5-Thinking-Mini
- **Failure**: Persistent newline insertion after Q&A labels (`The Shaykh:\nText`).
- **Failure**: Missing diacritics on `wudu` (should be `wuḍūʾ`).

### GPT-5.2-Thinking
- **Failure**: Transliterating long phrases/supplications (`Allāhumma...`) without providing the English meaning.
- **Failure**: Lowercasing `Salafiyyah` (`al-salafiyyah`) when it should be a proper name.

## 2. Proposed Changes

### A. Q&A Formatting (Fatawa & Encyclopedia)
**Problem**: The user instruction "Force a NEW LINE for the utterance" is ambiguous. Models interpret it as "Label \n Text".
**Fix**: Rewrite the rule to strict spatial terms.
- **Old**: "Force a NEW LINE for the utterance."
- **New**: "Start the utterance on a new line, BUT keep the Label and Text on the SAME line (e.g., `Label: Text`)."

### B. Locked Glossary Expansion (Master Prompt)
**Problem**: `wuḍūʾ` and `Salafiyyah` are drifting.
**Fix**:
- Add `wuḍūʾ` to Ritual Terms.
- Reinforce `Salafiyyah` (Capitalized) in Proper Names.

### C. Mandatory Translation Rule (Master Prompt)
**Problem**: Models transliterate supplications but forget the translation.
**Fix**: Add a rule to "TRANSLATION COUPLING".
- "If you transliterate a phrase (e.g., a duʿāʾ or poem), you MUST follow it with the English translation in parentheses or immediately after."

## 3. Targeted Files
- `prompts/master_prompt.md` (Glossary, Translation Rule)
- `prompts/fatawa.md` (Q&A Rule)
- `prompts/encyclopedia_mixed.md` (Q&A Rule consistency)
