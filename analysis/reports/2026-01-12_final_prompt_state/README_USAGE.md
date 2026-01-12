# Islamic Translation Prompt Lab 🕌

![Status](https://img.shields.io/badge/Status-Active_Research-green)
![Version](https://img.shields.io/badge/Prompts-v4.0_Optimized-blue)
![License](https://img.shields.io/badge/License-MIT-lightgrey)
![Focus](https://img.shields.io/badge/Focus-Academic_Fidelity-orange)
[![wakatime](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/f2110f75-cd59-4395-9790-b971ad3a8195.svg)](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/f2110f75-cd59-4395-9790-b971ad3a8195)

**Repository:** [github.com/ragaeeb/wobble-bibble](https://github.com/ragaeeb/wobble-bibble)

This project is dedicated to the research, analysis, and refinement of AI prompts for the **high-fidelity translation** of Islamic scholarly texts (Hadith, Fiqh, Tafsir, Jarh wa Ta'dil) from Arabic to English.

Our goal is to solve the "Friction Points" where LLMs typically fail—such as transliteration inconsistencies, theological sanitization, and textual hallucinations—by enforcing rigid, rule-based prompt protocols.

---

## 🚀 How to Use These Prompts

The system works on a **Inheritance Model**. You do not use a single prompt; you stack them.
Important: “Inheritance” is conceptual only. If you are using a web UI, the model cannot read files from this repo. You must paste the text.

### Step 1: Logic Layer (The Master Prompt)
Copy the contents of **[master_prompt.md](prompts/final/master_prompt.md)**.
*   *This defines the "Iron Rules": ALA-LC policies, Unicode allow-lists, and the locked Glossary.*

### Step 2: Specialization Layer (The Add-on)
Copy **ONE** specialized prompt and paste it **immediately below** the Master Prompt text to adapt the rules to your specific genre:
*   **[hadith.md](prompts/final/hadith.md)**: For Isnad-heavy texts, Sharh, or Sunan collections.
*   **[fatawa.md](prompts/final/fatawa.md)**: For Q&A, Fatawa collections, and general advice.
*   **[fiqh.md](prompts/final/fiqh.md)**: For Fiqh Manuals (Matn/Sharh) requiring strict legal terminology (Wajib/Haram).
*   **[tafsir.md](prompts/final/tafsir.md)**: For Quranic exegesis (Attributes of Allah, Grammar, Isra'iliyyat).
*   **[jarh_wa_tadil.md](prompts/final/jarh_wa_tadil.md)**: For Narrator Criticism (Rijal) works.
*   **[encyclopedia_mixed.md](prompts/final/encyclopedia_mixed.md)**: For polymath works (e.g., Albani, Ibn Taymiyyah) that blend disciplines.

### Step 3: Input
Paste your Arabic text segment.

### Practical notes (web usage)
- **Zero-Waste Prompts**: The prompt files in `prompts/final/` have been stripped of all metadata headers and instructions. They contain *only* the raw rules to maximize context window efficiency.
- **Stacking is Mandatory**: You MUST paste the Master Prompt first, followed by the Add-on. The Add-on relies on definitions in the Master.
- Term formatting convention: technical terms should be `translit (English)` (parentheses are reserved for this use).
- Name connector convention: mid-chain بن/ابن -> `b.` (e.g., ʿAbd Allāh b. Yūsuf); initial `Ibn` stays `Ibn` (e.g., Ibn Taymiyyah).

---

## 📂 Project Structure

| Directory | Content |
| :--- | :--- |
| **`prompts/final/`** | ✅ **Use These.** The latest v4.0 optimized templates covering all genres. |
| **`analysis/`** | 🧠 **The Brain.** Contains the [Synthesis Report](analysis/synthesis.md) and detailed model evaluations. |
| **`analysis/reasoning_dumps/`** | 💭 **Raw Data.** Chain-of-thought logs from Gemini, GPT, and Claude showing *how* they translate. |
| **`research/`** | 🏛 **Archive.** Older prompt iterations and raw suggestions. |

---

## 🔬 Supported & Tested Models

These prompts have been optimized based on reasoning traces from:
*   **Google Gemini 3.0 Pro** (Excellent at sticking to "Locked Glossaries")
*   **GPT-5.2 "Thinking"** (Strongest at multi-pass 3-step revision)
*   **Claude 3.5 Sonnet** (Best for poetic/literary flow in Tafsir)
*   **Grok-4 Expert** (Used for stress-testing "Safety Override" protocols)

## ✨ Key Features (v4.0)

*   **🛡 Safety Overrides:** Explicit instructions to *not* sanitize polemical or controversial terms (e.g., "Rafidah", "Jihad") to maintain academic historical fidelity.
*   **📝 Transliteration Matrix:** A strict decision table for where to use FULL ALA-LC (diacritics) vs. keeping existing Latin spellings as written, plus strict `b.` connector handling.
*   **🔄 3-Pass QA:** A mandatory internal protocol requiring the model to check Alignment, Accuracy, and Compliance before outputting.
*   **⚡️ Token Optimized:** All prompts are stripped of Markdown headers/tables to minimize context window usage.

## 🔄 Contributing / Refining
Found a bug? Model hallucinating?
See **[REFINEMENT_GUIDE.md](REFINEMENT_GUIDE.md)** for the official protocol on how to capture reasoning logs and update these prompts.

---

## 📅 Status
**Last Updated:** January 11, 2026
**Current Version:** v4.0 (Final)

## ✍️ Author
**Ragaeeb Haq**
*   [GitHub Profile](https://github.com/ragaeeb)
*   [Project Repository](https://github.com/ragaeeb/wobble-bibble)
