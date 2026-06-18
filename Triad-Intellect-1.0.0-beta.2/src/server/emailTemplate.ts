import type { ArchetypeDetails, BetaFeedback, MacroScores, ProfileCode } from "@/domain/assessment";
import type { BetaEventSummary } from "@/lib/telemetry";
import { cleanSingleLine } from "@/lib/text";
import { escapeHtml, sanitizeSubjectPart } from "./safeText";

interface CommonSubmissionEmailData {
  readonly requestId: string;
  readonly timestamp: string;
  readonly profileCode: ProfileCode;
  readonly macroScores: MacroScores;
  readonly archetype: ArchetypeDetails;
  readonly feedback?: BetaFeedback;
  readonly betaEvents?: BetaEventSummary;
}

export interface PremiumOrderEmailData extends CommonSubmissionEmailData {
  readonly name: string;
  readonly email: string;
}

export interface BetaFeedbackEmailData extends CommonSubmissionEmailData {
  readonly feedback: BetaFeedback;
}

function yesNo(value: boolean | undefined): string {
  return value === undefined ? "Not answered" : value ? "Yes" : "No";
}

function feedbackText(feedback: BetaFeedback | undefined): string {
  if (!feedback) return "No optional beta feedback supplied.";
  return [
    `Accuracy rating: ${feedback.accuracyRating ?? "Not answered"}/5`,
    `PMF response: ${feedback.pmfResponse ?? "Not answered"}`,
    `Would share: ${yesNo(feedback.wouldShare)}`,
    `Would pay for a deeper report: ${yesNo(feedback.wouldPayDeeper)}`,
    `Most accurate: ${feedback.mostTrue || "Not answered"}`,
    `Least accurate: ${feedback.mostWrong || "Not answered"}`,
    `Ideal user: ${feedback.idealUser || "Not answered"}`,
  ].join("\n");
}

function feedbackHtml(feedback: BetaFeedback | undefined): string {
  if (!feedback) return "<p>No optional beta feedback supplied.</p>";
  const rows: readonly [string, string][] = [
    ["Accuracy rating", `${feedback.accuracyRating ?? "Not answered"}/5`],
    ["PMF response", feedback.pmfResponse ?? "Not answered"],
    ["Would share", yesNo(feedback.wouldShare)],
    ["Would pay for a deeper report", yesNo(feedback.wouldPayDeeper)],
    ["Most accurate", feedback.mostTrue || "Not answered"],
    ["Least accurate", feedback.mostWrong || "Not answered"],
    ["Ideal user", feedback.idealUser || "Not answered"],
  ];

  return `<table style="width:100%;border-collapse:collapse">${rows
    .map(
      ([label, value]) =>
        `<tr><th style="padding:8px;text-align:left;vertical-align:top;color:#475569;border-bottom:1px solid #e2e8f0">${escapeHtml(label)}</th><td style="padding:8px;color:#0f172a;border-bottom:1px solid #e2e8f0;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`,
    )
    .join("")}</table>`;
}

function eventSummaryText(events: BetaEventSummary | undefined): string {
  return events
    ? Object.entries(events)
        .map(([eventName, count]) => `${eventName}: ${count}`)
        .join("\n")
    : "No local event summary supplied.";
}

function eventSummaryHtml(events: BetaEventSummary | undefined): string {
  if (!events) return "<li>No local event summary supplied.</li>";
  return Object.entries(events)
    .map(
      ([eventName, count]) =>
        `<li><strong>${escapeHtml(eventName)}:</strong> ${escapeHtml(count)}</li>`,
    )
    .join("");
}

function scoreSummaryText(data: CommonSubmissionEmailData): string {
  return `Profile: ${data.profileCode} — ${data.archetype.name}
Tagline: ${data.archetype.tagline}

MACRO SCORES
Imagination: ${data.macroScores.imagination}%
Intuition: ${data.macroScores.intuition}%
Judgment: ${data.macroScores.judgment}%`;
}

function scoreSummaryHtml(data: CommonSubmissionEmailData): string {
  return `<p><strong>Profile:</strong> ${escapeHtml(data.profileCode)} — ${escapeHtml(data.archetype.name)}</p>
<p><em>${escapeHtml(data.archetype.tagline)}</em></p>
<h2 style="margin-top:28px;font-size:18px">Macro scores</h2>
<ul>
  <li>Imagination: ${escapeHtml(data.macroScores.imagination)}%</li>
  <li>Intuition: ${escapeHtml(data.macroScores.intuition)}%</li>
  <li>Judgment: ${escapeHtml(data.macroScores.judgment)}%</li>
</ul>`;
}

function emailShell(title: string, eyebrow: string, content: string): string {
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f8fafc;color:#0f172a;font-family:Arial,sans-serif">
    <main style="max-width:680px;margin:24px auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden">
      <header style="padding:24px;background:#312e81;color:#ffffff">
        <p style="margin:0 0 6px;font-size:12px;letter-spacing:.12em;text-transform:uppercase">${escapeHtml(eyebrow)}</p>
        <h1 style="margin:0;font-size:24px">${escapeHtml(title)}</h1>
      </header>
      <section style="padding:24px">
        ${content}
        <p style="margin-top:28px;padding:14px;background:#f1f5f9;border-radius:10px;color:#475569;font-size:12px;line-height:1.5">
          Tri-Ad is an experimental self-reflection tool. This submission is not a clinical, educational, employment, financial, medical, or psychological record.
        </p>
      </section>
    </main>
  </body>
</html>`;
}

export function buildOrderSubject(data: PremiumOrderEmailData): string {
  return `Tri-Ad beta report request — ${sanitizeSubjectPart(data.name, 50)} [${data.profileCode}]`;
}

export function buildOrderPlainText(data: PremiumOrderEmailData): string {
  return `TRI-AD BETA REPORT REQUEST

Request ID: ${data.requestId}
Received: ${data.timestamp}
Name: ${cleanSingleLine(data.name)}
Email: ${cleanSingleLine(data.email)}
${scoreSummaryText(data)}

OPTIONAL BETA FEEDBACK
${feedbackText(data.feedback)}

LOCAL, AGGREGATED BETA EVENTS
${eventSummaryText(data.betaEvents)}

Suggested exploratory pathways:
${data.archetype.careerPaths.map((path) => `- ${path}`).join("\n")}

Tri-Ad is an experimental self-reflection tool. This request is not a clinical, educational, employment, financial, medical, or psychological record.`;
}

export function buildOrderHtml(data: PremiumOrderEmailData): string {
  const content = `<p><strong>Request ID:</strong> ${escapeHtml(data.requestId)}</p>
<p><strong>Received:</strong> ${escapeHtml(data.timestamp)}</p>
<p><strong>Name:</strong> ${escapeHtml(cleanSingleLine(data.name))}</p>
<p><strong>Email:</strong> ${escapeHtml(cleanSingleLine(data.email))}</p>
${scoreSummaryHtml(data)}
<h2 style="margin-top:28px;font-size:18px">Optional beta feedback</h2>
${feedbackHtml(data.feedback)}
<h2 style="margin-top:28px;font-size:18px">Local, aggregated beta events</h2>
<ul>${eventSummaryHtml(data.betaEvents)}</ul>
<h2 style="margin-top:28px;font-size:18px">Suggested exploratory pathways</h2>
<ul>${data.archetype.careerPaths.map((path) => `<li>${escapeHtml(path)}</li>`).join("")}</ul>`;

  return emailShell("Expanded report request", "Tri-Ad private beta", content);
}

export function buildFeedbackSubject(data: BetaFeedbackEmailData): string {
  return `Tri-Ad beta feedback — ${data.profileCode} — ${sanitizeSubjectPart(data.requestId, 32)}`;
}

export function buildFeedbackPlainText(data: BetaFeedbackEmailData): string {
  return `TRI-AD PRIVATE BETA FEEDBACK

Request ID: ${data.requestId}
Received: ${data.timestamp}
${scoreSummaryText(data)}

FEEDBACK
${feedbackText(data.feedback)}

LOCAL, AGGREGATED BETA EVENTS
${eventSummaryText(data.betaEvents)}

No participant name or email was requested by this feedback endpoint.

Tri-Ad is an experimental self-reflection tool. This submission is not a clinical, educational, employment, financial, medical, or psychological record.`;
}

export function buildFeedbackHtml(data: BetaFeedbackEmailData): string {
  const content = `<p><strong>Request ID:</strong> ${escapeHtml(data.requestId)}</p>
<p><strong>Received:</strong> ${escapeHtml(data.timestamp)}</p>
${scoreSummaryHtml(data)}
<h2 style="margin-top:28px;font-size:18px">Feedback</h2>
${feedbackHtml(data.feedback)}
<h2 style="margin-top:28px;font-size:18px">Local, aggregated beta events</h2>
<ul>${eventSummaryHtml(data.betaEvents)}</ul>
<p style="margin-top:20px;color:#475569;font-size:13px">No participant name or email was requested by this feedback endpoint.</p>`;

  return emailShell("Private beta feedback", "Tri-Ad research loop", content);
}
