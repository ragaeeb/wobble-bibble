# Red Team Review: 2026-01-12 Token Optimization Plan (Round 6)

## Executive Summary
**VERDICT: AMEND** — Token compression is directionally correct, but the current proposal increases interpretation degrees of freedom, which raises regression risk (especially for non-thinking / mid-tier models). This can be fixed with a few low-token “hard negations” and lexical trigger tightening.

Target: `analysis/reports/2026-01-12_token_optimization_plan.md`

---

## 1. Red Team Analysis (3 ways this could fail/regress)

### Failure Mode A: “Matrix as Summary” (standard models treat it as optional)
The proposal assumes “Thinking models prefer structured data,” but many models read matrices as a recap rather than binding constraints.

Risk pattern:
- The model follows the first few bullets and silently ignores later sub-clauses.
- It reverts to gravity wells (Sheikh/Muhammad/Quran) because anchors are no longer repeated in high-salience imperative form.

Regression symptoms:
- Partial compliance with casing/ta marbūṭah/b. vs Ibn rules
- Drift on locked anchors despite “matrix” existing

### Failure Mode B: Book Title Translation Ban becomes implicit → title coupling bug
The proposal’s COUPLING rule says transliterated phrases must be immediately translated. The scope rule includes Book Titles, which are often multi-word.

If the explicit “DO NOT translate titles” negation is not preserved verbatim, models will sometimes treat titles as “phrases” and append glosses:
- *Fatḥ al-Bārī (…)*, *Silsilat al-Aḥādīth… (…)*, etc.

This is not just cosmetic: it creates a cascade (citation drift, inconsistent title rendering, and accidental paraphrase).

### Failure Mode C: “STATE LOGIC / Trigger / Reset” reintroduces meta-talk leakage + arbitration latency
Even if intended as internal logic, “state/trigger/reset” language is a known leakage vector: models sometimes narrate switching or echo labels.

Also, triggers like “Evaluation terms” / “Ruling terms” are semantic categories, not lexical. That fuzziness increases:
- dither (“is this fiqh or narrative?”)
- inconsistent switching mid-sentence

Regression symptoms:
- “mode talk” appears in output
- incorrect application of rijāl/fiqh rules to narrative passages (or vice versa)

---

## 2. Logic Score (1–10)
**6.5 / 10**

Strength: good intent (dedupe prose, reduce token surface, introduce decision structure).

Weakness: the current draft removes/weakens explicit negations and uses fuzzy trigger categories, which increases hallucination surface under conflict.

---

## 3. Simulated Outcome (Thinking vs. Standard)

### “Thinking” model (high-capability)
Likely to treat the matrix as a checklist and comply more often, but will:
- over-reason about triggers and override semantics
- infer missing exceptions (months/titles) inconsistently
Net: higher average compliance, but sharper edge-case failures.

### Standard model (mid/low capability)
More likely to:
- treat the matrix as “guidance”
- comply with the first imperative rules only
- ignore “Add-ons override” semantics unless explicitly directional (narrow-only)
Net: more drift, especially on rare clauses that got compressed away.

---

## 4. Refinement Suggestions (Negation Rules; minimal token cost)
Add 2–3 hard negations to reduce interpretation variance:

1) DO NOT treat decision matrices as summaries; every line is a hard rule.

2) DO NOT translate book titles (even if multi-word); transliterate only (FULL ALA-LC when Arabic script).

3) DO NOT “switch state” based on semantic guesses; only apply special handling when exact lexical triggers appear; otherwise stay in default behavior.

---

## 5. Final Verdict
**AMEND**

Proceed with token compression, but only after:
- preserving explicit negations for book titles and rare-but-critical exceptions (e.g., month handling if it exists in the current master)
- replacing semantic trigger categories with short lexical trigger lists
- making override semantics directional: “Add-ons may narrow scope; they do not weaken diacritics or locked anchors.”

