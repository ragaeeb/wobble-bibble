---
original_filename: gemini-3.md
generated_on: 2026-01-11
model_source: Gemini 3
---

This report synthesizes findings from the project documentation (`prompt.txt`), LLM reasoning logs (`reasoning.txt`), and AI agent reviews (`reviews.txt`). It outlines the project scope, analyzes LLM performance, and synthesizes recommendations for prompt refinement.

### **1. Project Overview & Data Structure**

**Project Goal:** To refine prompt templates for high-accuracy, consistent translation of Islamic scholarly texts using "thinking/reasoning" models (GPT 5.2, Gemini 3.0 Pro, ChatGPT 5).

**Content Types:**
The project involves a diverse range of Islamic literature, each requiring distinct translation approaches:

* **Hadith Books:** Focus on *Isnads* (chains of transmission) and *Matn* (text).
* **Tafsir (Exegesis):** Complex mixtures of Quranic verses, linguistic analysis, and scholarly opinion.
* **Fatawa (Legal Rulings):** Question and answer formats involving specific *Fiqh* terminology.
* **Biographies / Rijal (Narrator Criticism):** Formulaic entries regarding the reliability of narrators (*Jarh wa Ta'dil*).
* **Aqidah (Theology):** Highly sensitive theological nuances.

**Data Structure:**

* **Input Format:** The prompts ingest segmented text where each segment is preceded by a unique ID (e.g., `P6424`, `C2049`).
* **Content components:**
* Main paragraph text.
* Footnotes (often critical for authentication).
* Chapter headings and Table of Contents.
* Markers/IDs that must be preserved exactly in the output for mapping.



---

### **2. LLM Performance Analysis (Based on Reasoning Logs)**

The reasoning logs reveal a distinct pattern of cognitive load. The models spend a significant portion of their "thinking time" navigating specific constraints rather than struggling with the Arabic language itself.

**Where LLMs are Clear & Successful:**

* **Self-Correction:** The reasoning logs show models frequently catching their own errors before outputting. Common self-corrections include swapping "God" for "Allah," removing Markdown formatting, and fixing capitalization in headings.
* **Contextual Awareness:** The models demonstrate high proficiency in understanding the religious context (e.g., realizing a specific "washing" refers to *Wudu* or *Ghusl* based on context).
* **Identifying Structure:** They successfully parse complex nested chains of narration (*Isnad*) and distinguish them from the main text (*Matn*).

**Where LLMs Struggle (The Friction Points):**

* **The "When to Transliterate" Dilemma:** This is the single biggest source of friction. The instruction "ALA-LC... ONLY when it is appropriate" causes models to second-guess constantly.
* *Struggle:* Models debate internally whether to transliterate a name mentioned in a biography (outside the chain) or a book title.
* *Inconsistency:* Some logs show models deciding to transliterate technical terms (like *Tawaf*), while others decide to translate them (e.g., "Circumambulation"), often oscillating within the same reasoning block.


* **Technical Terminology Handling:**
* Models struggle to balance "literal" vs. "communicative" translation for terms like *Mursal*, *Munqati'*, or *Thiqah*. They often waste tokens debating if they should use the English equivalent (e.g., "Interrupted chain") or the transliterated Arabic term.


* **Formatting Constraints:**
* The requirement for "Plain Text" often conflicts with the need to structure complex lists or poetry. Models frequently strip necessary formatting and then try to "hack" visual structure using whitespace, which leads to inconsistent outputs.


* **Handling Ambiguity/Typos:**
* When the source text has typos (e.g., `lā ḥaqqa` vs `lā yaḥiqqu`), models spend considerable time analyzing the *Fiqh* implications to guess the correct word, sometimes choosing to translate the typo literally against their better judgment.



---

### **3. Synthesis of AI Agent Suggestions**

The `reviews.txt` file contains feedback from various AI agents (Claude, Gemini, Grok). Their suggestions align on moving from generic instructions to specialized, domain-specific constraints.

**Key Suggestions & Evaluation:**

| Suggestion | Analysis (Agree/Disagree) | Reasoning |
| --- | --- | --- |
| **Specialized Personas** | **Strongly Agree** | Instead of one generic prompt, use modular personas. <br>

<br>e.g., *"You are a specialist in Quranic Exegesis"* vs *"You are a specialist in Hadith transmission."* This primes the model for specific vocabularies. |
| **Explicit Terminology Lists** | **Strongly Agree** | The reasoning logs prove models struggle here. Providing a lookup list (e.g., *Thiqah* = "Trustworthy", *Tawhid* = "Monotheism") reduces "thinking" time and ensures consistency. |
| **Strict Transliteration Rules** | **Agree** | The current "appropriate" rule is too vague. Rules should be binary: <br>

<br>1. **Isnad/Names:** Always ALA-LC.<br>

<br>2. **Matn/Content:** Standard English (no diacritics). |
| **Neutrality in Theology** | **Agree** | For *Aqidah*, explicitly instructing the model to maintain neutrality (translating descriptions of sects without adopting their tone) is crucial for academic accuracy. |
| **Plain Text "Triple Check"** | **Partial Disagreement** | While checks are good, asking a model to "triple check" often leads to hallucinated checks. Better to use **Few-Shot Examples** (showing the input/output format) rather than just telling it to check. |

---

### **4. Synthesized Recommendations for Prompt Refinement**

Based on the synthesis of the logs and reviews, the following strategies will yield the highest quality improvements:

**A. Modularize the Prompt (The "Switchboard" Approach)**
Do not use one prompt for all files. Detect the file type and inject a specific module:

* **Module A (Narrators/Rijal):** "Transliterate ALL names using ALA-LC. Translate technical terms (Thiqah -> Trustworthy)."
* **Module B (Tafsir):** "Translate verse meanings. Transliterate Quranic terms only if defining them linguistically."

**B. Solve the Transliteration Ambiguity**
Replace the instruction "ONLY when appropriate" with a hard rule:

> "Rule: Apply ALA-LC transliteration (with diacritics) **ONLY** to proper names appearing within a Chain of Narration (Isnad). For all other names, book titles, and terms in the body text, use standard English spelling without diacritics."

**C. Standardization of Divine Terms**
Hardcode these rules to stop the model from "reasoning" about them every time:

* `God` -> `Allah`
* `Prophet` -> `Prophet ﷺ` (if implied) or preserve Arabic symbol if text requires.
* `Verse references` -> Convert `[Surah: Ayah]` to standard brackets but keep Western numerals.

**D. The "Anchor" Technique for Formatting**
Since you need mapping capabilities:

> "Instruction: Every output paragraph must begin with its corresponding ID from the source text (e.g., `P6424 - `). Do not merge segments. Do not omit IDs."

**E. Usage of "Thinking" Data**
Use the `reasoning.txt` data to create a "Negative Constraints" list. Tell the model what *not* to do based on past failures:

* "Do not translate typos literally if they contradict established Fiqh; add a translator's note instead."
* "Do not use Markdown headers (##) even for chapter titles."