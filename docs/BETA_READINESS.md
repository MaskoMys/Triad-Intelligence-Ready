# Private beta readiness and PMF loop

## Release status

**Code status:** ready for a controlled private beta after a real Cloudflare Preview deployment passes the deployment smoke test.  
**Product status:** experimental; the assessment has implementation-balance diagnostics but no external psychometric or intelligence validation.

A successful automated check is necessary but not sufficient. The operator must still verify Resend, Turnstile, Cloudflare environment separation, mobile behavior, and inbox delivery on the actual hostname.

## Launch gate

Do not invite testers until every item is complete:

```text
[ ] npm ci succeeds from a clean checkout
[ ] npm run check succeeds
[ ] npm run smoke:pages succeeds
[ ] Cloudflare Preview deployment succeeds
[ ] Production secrets and build variables are configured
[ ] Wrong invite code is rejected
[ ] Missing Turnstile is rejected
[ ] Correct premium request sends exactly one email
[ ] Correct beta feedback sends exactly one identity-free email
[ ] PDF works on desktop and at least one mobile device
[ ] Local deletion removes history and event counters
[ ] CSP and API response headers are present
[ ] Rollback procedure and operator owner are known
```

## Recommended 20-person cohort

Recruit four groups of approximately five:

1. personality-system enthusiasts;
2. Jungian, symbolic, or esoteric-framework enthusiasts;
3. strategy, forecasting, or rationality-oriented users;
4. skeptical analytical users who will challenge vague statements.

Avoid recruiting only close friends or people already enthusiastic about the concept. Diversity of skepticism is valuable at this stage.

## Tester instructions

Give each tester:

- the protected beta URL;
- the invite code, preferably through a separate channel;
- an explanation that results are experimental and saved locally only when they choose;
- a request to complete the experience once before discussing it with other testers;
- a simple bug-report channel;
- an optional 15-minute interview invitation.

Do not ask testers to use results for school, employment, health, finance, or relationship decisions.

## Instrumented beta events

The browser counts these locally:

```text
landing_viewed
assessment_started
assessment_completed
results_viewed
pdf_downloaded
share_clicked
result_exported
history_exported
feedback_saved
feedback_submitted
premium_modal_opened
premium_order_submitted
```

Counts are not sent automatically. They are included only when the participant explicitly submits beta feedback or an expanded-report request. This makes analytics incomplete by design; interpret conversion rates only for participants who submit them, unless a separately consented analytics system is added.

## Feedback questions

The built-in feedback captures:

- perceived accuracy from 1–5;
- most accurate portion;
- least accurate portion;
- willingness to share;
- willingness to pay for a deeper report;
- the PMF question: how the user would feel if Tri-Ad disappeared;
- who the user thinks benefits most.

Follow-up interviews should ask:

1. What did you expect before starting?
2. Which exact sentence felt most personally useful?
3. Which exact sentence felt generic, wrong, or uncomfortable?
4. What did you do immediately after reading the result?
5. Who would you send this to, and why?
6. What would make an expanded report worth paying for?
7. What alternative product or habit does Tri-Ad replace?

Ask for concrete examples rather than defending the result.

## Directional success criteria

With only 20 testers, these are learning thresholds, not statistical proof:

| Metric                           |                                  Directional target |
| -------------------------------- | --------------------------------------------------: |
| Assessment completion            |                                                80%+ |
| Average perceived accuracy       |                                            4.0 / 5+ |
| PDF download                     |                                                40%+ |
| Would share                      |                                                40%+ |
| Would pay for deeper report      |                                             20–30%+ |
| “Very disappointed” PMF response |    promising near 40%, but highly uncertain at n=20 |
| Critical security/data-loss bugs |                                                   0 |
| Single profile share             | investigate if repeatedly above ~35% across cohorts |

Do not calculate precise market conclusions from 20 users. Combine behavior, wording patterns, interviews, and repeat use.

## Weekly beta review

After each five-person batch:

1. export and aggregate only consented feedback;
2. list every critical bug and confusion point;
3. group quotes by benefit, objection, trust, and willingness to share/pay;
4. compare profile distribution with `docs/SCORING_ANALYSIS.md`;
5. choose one product hypothesis and one reliability fix for the next batch;
6. avoid changing question weights mid-cohort without versioning the assessment.

## PMF decision framework

### Strong resonance, high trust

Users describe specific insights, save/share the report, and ask for a deeper version. Improve result depth, comparison features, and a concierge paid report before automating payments.

### Strong aesthetics, weak trust

Users like the interface but call results vague or arbitrary. Prioritize question clarity, explanations of score derivation, test–retest observation, and less grandiose archetype copy.

### Useful result, weak payment intent

Interview users about the desired job-to-be-done. The free result may already satisfy the need, or the paid offer may be too vague. Test a manually produced, clearly scoped report before building checkout.

### Low completion

Review time-to-value, question repetition, mobile friction, and the landing promise. Do not assume the concept lacks demand until usability is separated from positioning.

## Recommended path after beta

1. fix critical defects and misleading copy;
2. choose the narrowest segment showing repeated enthusiasm;
3. produce 3–5 concierge expanded reports manually;
4. measure whether users return, share, or refer others without prompting;
5. version scoring before any material question changes;
6. add payment only after the deliverable and price are clear;
7. add accounts/database only after cross-device persistence becomes a demonstrated need.
