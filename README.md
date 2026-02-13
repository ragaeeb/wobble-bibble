# wobble-bibble 🕌

[![npm version](https://img.shields.io/npm/v/wobble-bibble.svg)](https://www.npmjs.com/package/wobble-bibble)
[![codecov](https://codecov.io/gh/ragaeeb/wobble-bibble/graph/badge.svg?token=3BCT73JB7F)](https://codecov.io/gh/ragaeeb/wobble-bibble)
[![Size](https://deno.bundlejs.com/badge?q=wobble-bibble@latest&badge=detailed)](https://bundlejs.com/?q=wobble-bibble%40latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bun](https://img.shields.io/badge/Runtime-Bun-black?logo=bun)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue?logo=typescript)](https://www.typescriptlang.org)
[![Linter: Biome](https://img.shields.io/badge/Linter-Biome-FFB13B?logo=biome)](https://biomejs.dev)
![Status](https://img.shields.io/badge/Status-Active_Research-green)
![Version](https://img.shields.io/badge/Prompts-v4.0_Optimized-blue)
![Focus](https://img.shields.io/badge/Focus-Academic_Fidelity-orange)
![Standard](https://img.shields.io/badge/Standard-ALA--LC-darkred)
[![wakatime](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/f2110f75-cd59-4395-9790-b971ad3a8195.svg)](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/f2110f75-cd59-4395-9790-b971ad3a8195)

TypeScript library for Islamic text translation prompts with LLM output validation and prompt stacking utilities.

Live demo: [wobble-bibble.surge.sh](https://wobble-bibble.surge.sh)

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
- **Gold Standards**: [High-fidelity reference dataset](docs/gold-standard.md) for benchmarking

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
import { validateTranslationResponse } from 'wobble-bibble';

const segments = [
    { id: 'P1234', text: '... Arabic source for P1234 ...' },
    { id: 'P1235', text: '... Arabic source for P1235 ...' },
];

const llmOutput = `P1234 - Translation of first segment
P1235 - Translation of second segment`;

const result = validateTranslationResponse(segments, llmOutput, {
    config: {
        allCapsWordRunThreshold: 5,
    },
});
if (result.errors.length > 0) console.error(result.errors);
```

### Validation Error Ranges

Every validation error now includes a `range` with `start`/`end` indices pointing into the **raw response string** you passed in, plus `matchText` for precise highlighting.

```typescript
import type { ValidationError } from 'wobble-bibble';

const error: ValidationError = {
    type: 'arabic_leak',
    message: 'Arabic script detected: "الله"',
    matchText: 'الله',
    range: { start: 14, end: 18 }, // raw response indices (end is exclusive)
};
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

### Validation

| Function | Description |
|----------|-------------|
| `validateTranslationResponse(segments, response, options?)` | Unified validator for LLM translation responses (IDs, Arabic leak, invented IDs, gaps, speaker-label drift, Allah vs God usage, etc.) |
| `VALIDATION_ERROR_TYPE_INFO` | Human-readable descriptions for each `ValidationErrorType` (for UI/logging) |
| `normalizeTranslationTextWithMap(text)` | Normalize response text and return a normalized-index → raw-index map |

### Fixers

| Function | Description |
|----------|-------------|
| `fixCollapsedSpeakerLines(text, config?)` | Insert line breaks before mid-line speaker labels; infers labels if none provided |
| `fixAll(text, options)` | Apply fixers for selected `ValidationErrorType`s (e.g., `collapsed_speakers`) |
| `FixConfig` | Configuration for fixers (optional speaker labels, punctuation) |
| `FixResult` | Fix output (fixed text, applied fixes, counts) |

### Utilities

| Function | Description |
|----------|-------------|
| `formatExcerptsForPrompt(segments, prompt)` | Format segments for LLM input |
| `normalizeTranslationText(text)` | Normalize newlines and split merged markers onto separate lines |
| `normalizeTranslationTextWithMap(text)` | Normalize response text and return a normalized-index → raw-index map |
| `extractTranslationIds(text)` | Extract all segment IDs from "ID - ..." markers |

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

See `docs/refinement-guide.md` for the methodology used to develop and test these prompts.
See `AI_REVIEW_PROMPT.md` for the peer-review prompt template used when sending round packets to external agents.
See `docs/migration-guide.md` for breaking validation API changes and upgrade steps.
This repository is now a single-package library (no workspace subpackages).

## License

MIT
