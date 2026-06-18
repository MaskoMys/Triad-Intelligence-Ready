# Scoring model

## Purpose and limits

The scoring engine creates a symbolic cognitive-style profile for self-reflection. It is an experimental product model, not a measure of general intelligence and not a validated psychological instrument.

## Traits

The model contains eight traits:

| Macro dimension | Traits                                       |
| --------------- | -------------------------------------------- |
| Imagination     | creativity, innovation                       |
| Intuition       | physical, metaphysical/symbolic, discernment |
| Judgment        | logical, emotional, predictive               |

Each of the 30 questions has four answer options. An option can contribute positive, negative, or zero weight to one or more traits.

## Raw scores

For trait `t`, the raw score is the sum of all selected option weights:

```text
raw(t) = sum(selectedWeight(question, t))
```

## Bounds and expectation

For each trait, the engine calculates:

- `min(t)`: sum of the lowest available weight per question
- `max(t)`: sum of the highest available weight per question
- `expected(t)`: sum of each question's average option weight

The expectation is the score produced on average by uniformly random option selection. It maps to 50.

## Expectation-centered normalization

For raw values at or below expectation:

```text
normalized = ((raw - min) / (expected - min)) × 50
```

For raw values above expectation:

```text
normalized = 50 + ((raw - expected) / (max - expected)) × 50
```

The result is clamped to `[0, 100]` and rounded to one decimal place. Degenerate ranges map safely to 50.

This approach reduces a known implementation bias: traits with mostly positive option weights should not automatically appear elevated merely because their raw zero point differs from another trait. It does not prove that 50 is a population norm.

## Macro scores

Macro scores are simple means:

```text
imagination = mean(creativity, innovation)
intuition   = mean(physical, metaphysical, discernment)
judgment    = mean(logical, emotional, predictive)
```

## Profile code

- First letter: `C` when creativity is strictly higher than innovation; otherwise `I`.
- Second letter: strongest of discernment (`D`), physical (`P`), metaphysical (`M`).
- Third letter: strongest of logical (`L`), predictive (`R`), emotional (`E`).

Stable candidate ordering resolves exact ties deterministically. The 18 possible base codes are all represented in the archetype table.

A fluid/anchored extension is derived from trait spread and is descriptive rather than an additional validated scale.

## Quality controls

`npm run analyze:scoring` performs a seeded 100,000-response simulation and writes `docs/SCORING_ANALYSIS.md`. Automated tests verify bounds, response validation, normalization ranges, deterministic fixtures, profile-code validity, and complete archetype coverage.

The simulation checks implementation reachability and gross imbalance only. Real beta distributions, qualitative interviews, test–retest behavior, and external validation would be required before stronger claims could be considered.

## Versioning rule

Any change to questions, option weights, normalization, tie handling, or archetype selection should:

1. increment the assessment schema/scoring version;
2. regenerate scoring diagnostics;
3. add or update deterministic test fixtures;
4. document migration implications for previously saved results;
5. avoid comparing scores across versions without a stated calibration method.
