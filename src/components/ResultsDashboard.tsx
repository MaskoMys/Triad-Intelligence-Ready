import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clipboard,
  Download,
  FileJson,
  Mail,
  Share2,
} from "lucide-react";
import {
  ASSESSMENT_DISCLAIMER,
  TRAIT_DESCRIPTIONS,
  TRAIT_KEYS,
  TRAIT_LABELS,
  type AssessmentResult,
  type BetaFeedback,
} from "@/domain/assessment";
import { downloadTextFile, safeFilenamePart } from "@/lib/download";
import { trackBetaEvent } from "@/lib/telemetry";
import { generateReportPdf } from "@/pdf/generateReportPdf";
import { ScoreBar } from "@/components/common/ScoreBar";
import { BetaFeedbackModal } from "@/components/results/BetaFeedbackModal";
import { FeedbackPanel } from "@/components/results/FeedbackPanel";
import { PremiumOrderModal } from "@/components/results/PremiumOrderModal";

interface ResultsDashboardProps {
  readonly result: AssessmentResult;
  readonly savedLocally: boolean;
  readonly onRetake: () => void;
  readonly onViewHistory: () => void;
  readonly onUpdateFeedback: (feedback: BetaFeedback) => void;
}

export function ResultsDashboard({
  result,
  savedLocally,
  onRetake,
  onViewHistory,
  onUpdateFeedback,
}: ResultsDashboardProps) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackDraft, setFeedbackDraft] = useState<BetaFeedback>({});

  const showTemporaryMessage = (message: string) => {
    setActionMessage(message);
    setActionError("");
    window.setTimeout(() => setActionMessage(""), 2500);
  };

  const handlePdf = async () => {
    setPdfLoading(true);
    setActionError("");
    try {
      await generateReportPdf(result);
      trackBetaEvent("pdf_downloaded");
      showTemporaryMessage("PDF downloaded.");
    } catch {
      setActionError(
        "The PDF could not be generated. Refresh the page and try again.",
      );
    } finally {
      setPdfLoading(false);
    }
  };

  const summaryText = `My Tri-Ad archetype is ${result.archetype.code}: ${result.archetype.name}. ${result.archetype.tagline}`;

  const handleShare = async () => {
    setActionError("");
    try {
      if (navigator.share) {
        await navigator.share({ title: "My Tri-Ad result", text: summaryText });
        showTemporaryMessage("Share sheet opened.");
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(summaryText);
        showTemporaryMessage("Summary copied to clipboard.");
      } else {
        throw new Error("Sharing is unavailable.");
      }
      trackBetaEvent("share_clicked");
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setActionError(
        "Sharing is unavailable in this browser. Export the JSON or PDF instead.",
      );
    }
  };

  const handleExportResult = () => {
    downloadTextFile(
      `triad-${safeFilenamePart(result.userName)}-${result.profileCode}.json`,
      JSON.stringify(
        {
          ...result,
          disclaimer: ASSESSMENT_DISCLAIMER,
        },
        null,
        2,
      ),
      "application/json;charset=utf-8",
    );
    trackBetaEvent("result_exported");
    showTemporaryMessage("Result JSON downloaded.");
  };

  const openPremium = () => {
    setPremiumOpen(true);
    trackBetaEvent("premium_modal_opened");
  };

  const sendFeedback = (feedback: BetaFeedback) => {
    setFeedbackDraft(feedback);
    setFeedbackOpen(true);
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onRetake}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-white hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> New assessment
        </button>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handlePdf()}
            disabled={pdfLoading}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            {pdfLoading ? "Preparing…" : "PDF"}
          </button>
          <button
            type="button"
            onClick={() => void handleShare()}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" /> Share
          </button>
          <button
            type="button"
            onClick={handleExportResult}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <FileJson className="h-4 w-4" aria-hidden="true" /> JSON
          </button>
          <button
            type="button"
            onClick={openPremium}
            className="flex items-center gap-2 rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-800"
          >
            <Mail className="h-4 w-4" aria-hidden="true" /> Expanded report
          </button>
        </div>
      </div>

      {actionMessage ? (
        <p
          role="status"
          aria-live="polite"
          className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800"
        >
          <Clipboard className="h-4 w-4" aria-hidden="true" /> {actionMessage}
        </p>
      ) : null}
      {actionError ? (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800"
        >
          {actionError}
        </p>
      ) : null}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/40">
        <div className="grid gap-8 bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-800 p-7 text-white md:grid-cols-[.75fr_1.25fr] md:p-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">
              Your symbolic profile
            </p>
            <p className="mt-4 font-mono text-5xl font-black tracking-tight md:text-7xl">
              {result.archetype.code}
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-indigo-100">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {savedLocally
                ? "Saved locally on this device"
                : "Session only — not saved locally"}
            </div>
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold leading-tight md:text-4xl">
              {result.archetype.name}
            </h1>
            <p className="mt-3 text-base font-medium text-indigo-100">
              {result.archetype.tagline}
            </p>
            <p className="mt-5 text-sm leading-7 text-indigo-50/90">
              {result.archetype.description}
            </p>
          </div>
        </div>
        <div className="grid gap-4 p-6 sm:grid-cols-3 md:p-8">
          {[
            [
              "Imagination",
              result.macroScores.imagination,
              "Creative generation and practical innovation",
            ],
            [
              "Intuition",
              result.macroScores.intuition,
              "Sensory, symbolic, and analytical pattern reading",
            ],
            [
              "Judgment",
              result.macroScores.judgment,
              "Logical, relational, and future-oriented decisions",
            ],
          ].map(([label, value, description]) => (
            <div
              key={String(label)}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
            >
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                {label}
              </p>
              <p className="mt-2 font-display text-4xl font-bold text-slate-950">
                {Math.round(Number(value))}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section
          aria-labelledby="trait-heading"
          className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8"
        >
          <h2
            id="trait-heading"
            className="font-display text-2xl font-bold text-slate-950"
          >
            Eight trait scores
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            A score is a relative position within this experimental
            questionnaire, not a rank or ability measure.
          </p>
          <div className="mt-6 space-y-5">
            {TRAIT_KEYS.map((trait) => (
              <ScoreBar
                key={trait}
                label={TRAIT_LABELS[trait]}
                value={result.normalizedScores[trait]}
                description={TRAIT_DESCRIPTIONS[trait]}
              />
            ))}
          </div>
        </section>

        <div className="space-y-6">
          <ProfileList
            title="Potential strengths"
            items={result.archetype.strengths}
          />
          <ProfileList
            title="Useful watch-outs"
            items={result.archetype.challenges}
          />
          <section className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="font-display text-xl font-bold text-slate-950">
              Exploratory pathways
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Reflection prompts only; not career suitability recommendations.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {result.archetype.careerPaths.map((path) => (
                <span
                  key={path}
                  className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-800"
                >
                  {path}
                </span>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="mt-6">
        <FeedbackPanel
          key={result.id}
          initialFeedback={result.feedback}
          onSave={onUpdateFeedback}
          onSend={sendFeedback}
        />
      </div>

      <section className="mt-6 flex flex-col items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-950">
            Review other saved results
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Compare sessions or remove local records from the history page.
          </p>
        </div>
        <button
          type="button"
          onClick={onViewHistory}
          className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          Open saved results
        </button>
      </section>

      <p className="mx-auto mt-6 max-w-3xl text-center text-xs leading-relaxed text-slate-500">
        {ASSESSMENT_DISCLAIMER}
      </p>

      <PremiumOrderModal
        open={premiumOpen}
        result={result}
        onClose={() => setPremiumOpen(false)}
      />
      <BetaFeedbackModal
        open={feedbackOpen}
        result={result}
        feedback={feedbackDraft}
        onClose={() => setFeedbackOpen(false)}
      />
    </main>
  );
}

function ProfileList({
  title,
  items,
}: {
  readonly title: string;
  readonly items: readonly string[];
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6">
      <h2 className="font-display text-xl font-bold text-slate-950">{title}</h2>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li
            key={item}
            className="flex gap-3 text-sm leading-relaxed text-slate-600"
          >
            <span
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500"
              aria-hidden="true"
            />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
