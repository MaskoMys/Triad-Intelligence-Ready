import { writeFile } from "node:fs/promises";
import { format } from "prettier";
import {
  PROFILE_CODES,
  TRAIT_KEYS,
  computeTraitBounds,
  computeTraitExpectations,
  questions,
  scoreAssessment,
  type ProfileCode,
  type ResponseMap,
  type TraitKey,
} from "../src/domain/assessment/index";

const SAMPLE_SIZE = 100_000;

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

const random = createSeededRandom(0x7a1ad2026);
const bounds = computeTraitBounds(questions);
const expectations = computeTraitExpectations(questions);
const distribution = Object.fromEntries(
  PROFILE_CODES.map((code) => [code, 0]),
) as Record<ProfileCode, number>;

const weightStats = Object.fromEntries(
  TRAIT_KEYS.map((trait) => [
    trait,
    { positive: 0, negative: 0, zero: 0, totalMagnitude: 0 },
  ]),
) as Record<
  TraitKey,
  { positive: number; negative: number; zero: number; totalMagnitude: number }
>;

for (const question of questions) {
  for (const option of question.options) {
    for (const trait of TRAIT_KEYS) {
      const weight = option.weights[trait] ?? 0;
      if (weight > 0) weightStats[trait].positive += 1;
      else if (weight < 0) weightStats[trait].negative += 1;
      else weightStats[trait].zero += 1;
      weightStats[trait].totalMagnitude += Math.abs(weight);
    }
  }
}

for (let sample = 0; sample < SAMPLE_SIZE; sample += 1) {
  const responses: ResponseMap = {};
  for (const question of questions) {
    responses[question.id] = Math.floor(random() * question.options.length);
  }
  distribution[scoreAssessment(responses).profileCode] += 1;
}

const distributionRows = PROFILE_CODES.map((code) => {
  const count = distribution[code];
  return `| ${code} | ${count.toLocaleString()} | ${((count / SAMPLE_SIZE) * 100).toFixed(2)}% |`;
}).join("\n");

const traitRows = TRAIT_KEYS.map((trait) => {
  const stats = weightStats[trait];
  return `| ${trait} | ${stats.positive} | ${stats.negative} | ${stats.zero} | ${stats.totalMagnitude} | ${bounds[trait].min.toFixed(1)} | ${expectations[trait].toFixed(2)} | ${bounds[trait].max.toFixed(1)} |`;
}).join("\n");

const percentages = PROFILE_CODES.map(
  (code) => distribution[code] / SAMPLE_SIZE,
);
const maximumShare = Math.max(...percentages);
const minimumShare = Math.min(...percentages);
const unreachable = PROFILE_CODES.filter((code) => distribution[code] === 0);
const nearUnreachable = PROFILE_CODES.filter(
  (code) => distribution[code] / SAMPLE_SIZE < 0.005,
);

const report = `# Tri-Ad scoring diagnostics

Generated: ${new Date().toISOString()}  
Seeded random samples: ${SAMPLE_SIZE.toLocaleString()}  
Questions: ${questions.length}  
Profile codes: ${PROFILE_CODES.length}

## Interpretation limits

This report measures implementation balance and reachability only. It does not demonstrate psychometric validity, reliability, clinical usefulness, or intelligence measurement.

## Trait weight coverage

| Trait | Positive | Negative | Zero | Total magnitude | Theoretical min | Random expectation | Theoretical max |
|---|---:|---:|---:|---:|---:|---:|---:|
${traitRows}

## Seeded random-response distribution

| Profile | Count | Share |
|---|---:|---:|
${distributionRows}

## Automated checks

- All profiles reachable: ${unreachable.length === 0 ? "PASS" : `FAIL (${unreachable.join(", ")})`}
- Profiles below 0.5%: ${nearUnreachable.length === 0 ? "None" : nearUnreachable.join(", ")}
- Largest random share: ${(maximumShare * 100).toFixed(2)}%
- Smallest random share: ${(minimumShare * 100).toFixed(2)}%
- Largest-to-smallest ratio: ${(maximumShare / minimumShare).toFixed(2)}×

## Beta monitoring recommendation

Review the observed distribution after each beta cohort. With only 20 participants, treat profile frequency as qualitative evidence. Investigate question wording and weights if one profile repeatedly exceeds roughly 35% across multiple cohorts.
`;

await writeFile(
  "docs/SCORING_ANALYSIS.md",
  await format(report, { parser: "markdown" }),
  "utf8",
);
console.log(
  `Wrote docs/SCORING_ANALYSIS.md from ${SAMPLE_SIZE.toLocaleString()} seeded samples.`,
);
if (unreachable.length > 0) process.exitCode = 1;
