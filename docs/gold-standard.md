# Gold Standard Translations

The "Gold Standard" dataset consists of high-fidelity, human-verified translations of complex Islamic texts. These serve as the "ground truth" for the `wobble-bibble` validation engine and prompt benchmarking.

## Purpose
1. **Benchmarking**: Measuring how close model outputs are to a scholarly standard.
2. **Constraint Verification**: Ensuring that prompt rules (like ALA-LC transliteration) are actually achievable and produce readable results.
3. **Dataset Export**: Providing a fine-tuning dataset for smaller models to "learn" the specific academic style required by this library.

## Structure
Located in `data/gold/`, each sub-folder represents a specific genre or work:

- `data/gold/encyclopedia-mixed/`: Reference for polymath works (e.g., Al-Albani).
  - `input.txt`: The raw Arabic segments with IDs.
  - `expected.txt`: The gold-standard English translation.

## Expectations
A "Gold" translation must:
- Follow **Full ALA-LC** with all diacritics.
- Adhere to the `translit (English)` pair rule for all technical terms.
- Use `ﷺ` for the Prophet's name.
- Use `b.` for mid-chain narrator names.
- Maintain perfect Segment ID alignment.
