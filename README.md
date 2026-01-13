# wobble-bibble 🕌

[![npm version](https://img.shields.io/npm/v/wobble-bibble.svg)](https://www.npmjs.com/package/wobble-bibble)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Status](https://img.shields.io/badge/Status-Active_Research-green)
![Version](https://img.shields.io/badge/Prompts-v4.0_Optimized-blue)
![Focus](https://img.shields.io/badge/Focus-Academic_Fidelity-orange)
[![wakatime](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/f2110f75-cd59-4395-9790-b971ad3a8195.svg)](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/f2110f75-cd59-4395-9790-b971ad3a8195)

TypeScript library for Islamic text translation prompts with LLM output validation and prompt stacking utilities.

## Installation

```bash
npm install wobble-bibble
# or
bun add wobble-bibble
```

## Features

- **Bundled Prompts**: 8 optimized translation prompts (Hadith, Fiqh, Tafsir, etc.) with strongly-typed access
- **Translation Validation**: Catch LLM hallucinations like malformed segment IDs, Arabic leaks, forbidden terms
- **Prompt Stacking**: Master + specialized prompts combined automatically

## Quick Start

### Get Translation Prompts

```typescript
import { getPrompt, getPrompts, getPromptIds } from 'wobble-bibble';

// Get a specific stacked prompt (strongly typed)
const hadithPrompt = getPrompt('hadith');
console.log(hadithPrompt.content); // Master + Hadith addon combined

// Get all available prompts
const allPrompts = getPrompts();

// Get list of prompt IDs for dropdowns
const ids = getPromptIds(); // ['master_prompt', 'hadith', 'fiqh', ...]
```

### Validate LLM Output

```typescript
import {
    validateTranslations,
    detectArabicScript,
    detectForbiddenTerms,
    detectNewlineAfterId,
} from 'wobble-bibble';

const llmOutput = `P1234 - Translation of first segment
P1235 - Translation of second segment`;

// Full validation pipeline
const result = validateTranslations(llmOutput, ['P1234', 'P1235']);
if (!result.isValid) {
    console.error('Error:', result.error);
}

// Individual detectors
const arabicWarnings = detectArabicScript(llmOutput); // Soft warnings
const forbiddenError = detectForbiddenTerms(llmOutput); // Hard error
const newlineError = detectNewlineAfterId(llmOutput); // Hard error
```

## API Reference

### Prompts

| Function | Description |
|----------|-------------|
| `getPrompt(id)` | Get a specific stacked prompt by ID (strongly typed) |
| `getPrompts()` | Get all available stacked prompts |
| `getStackedPrompt(id)` | Get just the prompt content string |
| `getMasterPrompt()` | Get raw master prompt (for custom addons) |
| `getPromptIds()` | Get list of available prompt IDs |
| `stackPrompts(master, addon)` | Manually combine prompts |

### Validation (Hard Errors)

| Function | Description |
|----------|-------------|
| `validateTranslations(text, expectedIds)` | Full validation pipeline |
| `validateTranslationMarkers(text)` | Check for malformed IDs (e.g., `P123$4`) |
| `detectNewlineAfterId(text)` | Catch `P1234\nText` (Gemini bug) |
| `detectForbiddenTerms(text)` | Catch Sheikh, Koran, Hadith, Islam, Salafism |
| `detectImplicitContinuation(text)` | Catch "implicit continuation" text |
| `detectMetaTalk(text)` | Catch "(Note:", "[Editor:" |
| `detectDuplicateIds(ids)` | Catch same ID appearing twice |

### Validation (Soft Warnings)

| Function | Description |
|----------|-------------|
| `detectArabicScript(text)` | Detect Arabic characters (except ﷺ) |
| `detectWrongDiacritics(text)` | Detect â/ã/á instead of macrons |

### Utilities

| Function | Description |
|----------|-------------|
| `extractTranslationIds(text)` | Extract all segment IDs from text |
| `normalizeTranslationText(text)` | Split merged markers onto separate lines |
| `findUnmatchedTranslationIds(ids, expected)` | Find IDs not in expected list |
| `formatExcerptsForPrompt(segments, prompt)` | Format segments for LLM input |

## Available Prompts

| ID | Name | Use Case |
|----|------|----------|
| `master_prompt` | Master Prompt | Universal grounding rules |
| `hadith` | Hadith | Isnad-heavy texts, Sharh |
| `fiqh` | Fiqh | Legal terminology |
| `tafsir` | Tafsir | Quranic exegesis |
| `fatawa` | Fatawa | Q&A format |
| `encyclopedia_mixed` | Encyclopedia Mixed | Polymath works |
| `jarh_wa_tadil` | Jarh Wa Tadil | Narrator criticism |
| `usul_al_fiqh` | Usul Al Fiqh | Legal methodology |

## Prompt Development

See [REFINEMENT_GUIDE.md](./REFINEMENT_GUIDE.md) for the methodology used to develop and test these prompts.

## License

MIT
