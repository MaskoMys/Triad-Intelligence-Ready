import { useState, type FormEvent } from "react";
import { ArrowRight, Database, Eye, LockKeyhole, Sparkles, Trash2 } from "lucide-react";
import { ASSESSMENT_DISCLAIMER, type AssessmentResult } from "@/domain/assessment";

interface LandingPageProps {
  readonly history: readonly AssessmentResult[];
  readonly tab: "assess" | "history";
  readonly onTabChange: (tab: "assess" | "history") => void;
  readonly onStart: (name: string, rememberResult: boolean) => void;
  readonly onSelectHistory: (result: AssessmentResult) => void;
  readonly onDeleteHistory: (id: string) => void;
  readonly onClearHistory: () => void;
  readonly onExportHistory: () => void;
}

export function LandingPage({
  history,
  tab,
  onTabChange,
  onStart,
  onSelectHistory,
  onDeleteHistory,
  onClearHistory,
  onExportHistory,
}: LandingPageProps) {
  const [name, setName] = useState("");
  const [rememberResult, setRememberResult] = useState(true);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedName = name.replace(/\s+/g, " ").trim();
    if (!normalizedName) return;
    onStart(normalizedName.slice(0, 50), rememberResult);
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 md:py-16">
      <div className="mb-8 flex gap-2 rounded-xl border border-slate-200 bg-white p-1 sm:w-fit">
        <button
          type="button"
          onClick={() => onTabChange("assess")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold sm:flex-none ${
            tab === "assess" ? "bg-indigo-700 text-white" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          New assessment
        </button>
        <button
          type="button"
          onClick={() => onTabChange("history")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold sm:flex-none ${
            tab === "history" ? "bg-indigo-700 text-white" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          Saved results ({history.length})
        </button>
      </div>

      {tab === "history" ? (
        <section aria-labelledby="saved-results-heading" className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">
                Local history
              </p>
              <h1
                id="saved-results-heading"
                className="mt-2 font-display text-3xl font-bold text-slate-950"
              >
                Saved results on this device
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                These records stay in this browser and do not include an email address. Clearing
                browser data also removes them.
              </p>
            </div>
            {history.length > 0 ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onExportHistory}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Export JSON
                </button>
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                >
                  Delete all
                </button>
              </div>
            ) : null}
          </div>

          {history.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <Database className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
              <h2 className="mt-3 font-display text-lg font-bold text-slate-900">
                No saved results yet
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Complete an assessment and choose to remember it locally.
              </p>
              <button
                type="button"
                onClick={() => onTabChange("assess")}
                className="mt-5 rounded-xl bg-indigo-700 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-800"
              >
                Start assessment
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {history.map((result) => (
                <article
                  key={result.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="rounded-lg bg-indigo-50 px-2.5 py-1 font-mono text-xs font-bold text-indigo-700">
                        {result.archetype.code}
                      </span>
                      <h2 className="mt-3 font-display text-lg font-bold text-slate-950">
                        {result.archetype.name}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">{result.userName}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(result.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteHistory(result.id)}
                      aria-label={`Delete result for ${result.userName}`}
                      className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-700"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectHistory(result)}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-700 hover:bg-indigo-100"
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" /> View result
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : (
        <div className="grid items-start gap-8 lg:grid-cols-[1.2fr_.8fr] lg:gap-12">
          <section>
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-indigo-700">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Private beta
            </span>
            <h1 className="mt-6 max-w-3xl font-display text-4xl font-bold leading-tight text-slate-950 md:text-6xl">
              Map the patterns behind how you imagine, interpret, and decide.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
              Tri-Ad is a 30-scenario reflective assessment that produces one of 18 symbolic
              cognitive archetypes, eight trait scores, and three broader dimensions.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                ["30 scenarios", "Choose the response closest to your natural first move."],
                [
                  "Local-first",
                  "Results remain on this device unless you explicitly submit a report request.",
                ],
                [
                  "Exploratory",
                  "Use the output as a prompt for reflection, not as a diagnosis or ranking.",
                ],
              ].map(([title, copy]) => (
                <div key={title} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <h2 className="text-sm font-bold text-slate-900">{title}</h2>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{copy}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
              <strong>Important:</strong> {ASSESSMENT_DISCLAIMER}
            </div>
          </section>

          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 md:p-8">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-white">
                <LockKeyhole className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Begin locally
                </p>
                <h2 className="font-display text-xl font-bold text-slate-950">
                  Start your mapping session
                </h2>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="display-name"
                  className="block text-sm font-semibold text-slate-800"
                >
                  Display name or nickname
                </label>
                <input
                  id="display-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={50}
                  autoComplete="nickname"
                  required
                  placeholder="Example: Sam"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  Use a nickname if you prefer. Email is not required for the assessment.
                </p>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <input
                  type="checkbox"
                  checked={rememberResult}
                  onChange={(event) => setRememberResult(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-700"
                />
                <span>
                  <span className="block text-sm font-semibold text-slate-800">
                    Remember my result on this device
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                    Stores the nickname and scores in browser storage. You can delete or export them
                    at any time.
                  </span>
                </span>
              </label>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-700 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-800"
              >
                Start assessment <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
          </aside>
        </div>
      )}
    </main>
  );
}
