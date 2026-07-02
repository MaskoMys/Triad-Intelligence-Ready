import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import {
  ASSESSMENT_DISCLAIMER,
  questions,
  type ResponseMap,
} from "@/domain/assessment";

interface AssessmentWizardProps {
  readonly userName: string;
  readonly onComplete: (responses: ResponseMap) => void;
  readonly onAbort: () => void;
}

export function AssessmentWizard({
  userName,
  onComplete,
  onAbort,
}: AssessmentWizardProps) {
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState<ResponseMap>({});
  const [error, setError] = useState("");
  const question = questions[index]!;
  const selected = responses[question.id];
  const progress = Math.round(((index + 1) / questions.length) * 100);

  const answeredCount = useMemo(
    () => Object.keys(responses).length,
    [responses],
  );

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const chooseOption = (optionIndex: number) => {
    setResponses((current) => ({ ...current, [question.id]: optionIndex }));
    setError("");
  };

  const goNext = () => {
    if (selected === undefined) {
      setError("Choose the response closest to your natural first move.");
      return;
    }
    if (index === questions.length - 1) {
      onComplete(responses);
      return;
    }
    setIndex((current) => current + 1);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 md:py-12">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">
            Mapping session
          </p>
          <p className="mt-1 text-sm text-slate-500">Participant: {userName}</p>
        </div>
        <button
          type="button"
          onClick={onAbort}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-white hover:text-slate-900"
        >
          <X className="h-4 w-4" aria-hidden="true" /> Exit
        </button>
      </div>

      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>
            Question {index + 1} of {questions.length}
          </span>
          <span>{progress}% complete</span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-slate-200"
          aria-hidden="true"
        >
          <div
            className="h-full rounded-full bg-indigo-700 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40 md:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
          Scenario
        </p>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          {question.scenario}
        </p>
        <h1 className="mt-5 font-display text-2xl font-bold leading-tight text-slate-950 md:text-3xl">
          {question.text}
        </h1>

        <fieldset className="mt-7 space-y-3">
          <legend className="sr-only">Choose one response</legend>
          {question.options.map((option, optionIndex) => {
            const active = selected === optionIndex;
            return (
              <button
                key={option.text}
                type="button"
                onClick={() => chooseOption(optionIndex)}
                aria-pressed={active}
                className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition md:p-5 ${
                  active
                    ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100"
                    : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40"
                }`}
              >
                <span
                  className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full font-mono text-xs font-bold ${
                    active
                      ? "bg-indigo-700 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {String.fromCharCode(65 + optionIndex)}
                </span>
                <span className="text-sm font-medium leading-6 text-slate-800">
                  {option.text}
                </span>
              </button>
            );
          })}
        </fieldset>

        {error ? (
          <p role="alert" className="mt-4 text-sm font-semibold text-rose-700">
            {error}
          </p>
        ) : null}

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-6">
          <button
            type="button"
            onClick={() => setIndex((current) => Math.max(0, current - 1))}
            disabled={index === 0}
            className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
          </button>
          <span className="hidden text-xs text-slate-400 sm:block">
            {answeredCount} answered
          </span>
          <button
            type="button"
            onClick={goNext}
            className="flex items-center gap-2 rounded-xl bg-indigo-700 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-800"
          >
            {index === questions.length - 1 ? "Generate result" : "Continue"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </section>

      <p className="mx-auto mt-5 max-w-2xl text-center text-xs leading-relaxed text-slate-500">
        {ASSESSMENT_DISCLAIMER}
      </p>
    </main>
  );
}
