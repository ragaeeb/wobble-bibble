# Hypothesis: Why IDs Are Repeated in Internal Q&A (e.g., P44, P50)

## 1. Observation
In segments that contain multiple speaker turns inside one Segment ID (e.g., Questioner/Shaykh/attendees), the model often outputs one line per turn and repeats the Segment ID on each line, e.g.:
```text
P44 - Questioner: ...
P44 - The Shaykh: ...
P44 - A man from the attendees: ...
```

## 2. Primary Hypothesis (Prompt-Driven; Not a Model Failure)
This behavior can be directly induced by the add-on rule in `prompts/encyclopedia_mixed.md`:
> INTERNAL Q&A: If segment has multiple turns, output one line per turn and REPEAT the Segment ID on each line.

The raw reasoning you provided matches that interpretation (the model explicitly states it should repeat the ID per line).

## 3. Secondary Hypothesis (Rule Collision Even When You Ask for “ID Only Once”)
Even if the add-on says “output Segment ID only once,” many models will still repeat IDs because of a local “satisfy constraints” strategy under conflict:

### A. Master prompt strongly implies “ID per output line”
The master contains:
- “Preserve Segment ID. … Preserve Segment ID as the first token.”
- “OUTPUT: SEGMENT_ID - English translation.”

When the add-on also demands “Start NEW LINE for speaker,” the model can reinterpret each speaker line as a separate “output line,” and then tries to satisfy the master rule by prefixing each line with the ID.

### B. Avoidance of “orphan lines”
Models (especially thinking models) are biased toward avoiding unlabeled lines because unlabeled lines can be mis-parsed or “lost” by downstream processing. So even when told “ID once,” they may choose the safer convention: repeat ID every line.

### C. “No restructuring” makes it worse
When told “do not restructure” plus “preserve Q&A turns,” the model may treat each turn as a required, atomic unit that must each independently satisfy the output schema.

## 4. Implication
If your requirement is strictly “one Segment ID per segment (once), with multiple speaker lines beneath it,” that formatting is inherently less robust with current constraints because it creates lines that do not match the explicit master schema (“SEGMENT_ID - …”).

## 5. What To Check Next (No Prompt Changes; Diagnostic Only)
- Confirm whether you are using the current `encyclopedia_mixed.md` text that explicitly requests ID repetition.
- If you are using an “ID only once” variant, check whether your master still says “SEGMENT_ID - …” as a per-line output schema; that alone will cause repeated IDs when the model emits multiple lines.
