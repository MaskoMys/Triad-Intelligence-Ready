import { useState, type FormEvent } from "react";
import type { BetaFeedback, PmfResponse } from "@/domain/assessment";

interface FeedbackPanelProps {
  readonly initialFeedback?: BetaFeedback | undefined;
  readonly onSave: (feedback: BetaFeedback) => void;
  readonly onSend: (feedback: BetaFeedback) => void;
}

const pmfOptions: readonly { value: PmfResponse; label: string }[] = [
  { value: "very-disappointed", label: "Very disappointed" },
  { value: "somewhat-disappointed", label: "Somewhat disappointed" },
  { value: "not-disappointed", label: "Not disappointed" },
  { value: "would-not-use-again", label: "I would not use it again" },
];

function hasMeaningfulFeedback(feedback: BetaFeedback): boolean {
  return (
    feedback.accuracyRating !== undefined ||
    Boolean(feedback.mostTrue) ||
    Boolean(feedback.mostWrong) ||
    feedback.wouldShare !== undefined ||
    feedback.wouldPayDeeper !== undefined ||
    feedback.pmfResponse !== undefined ||
    Boolean(feedback.idealUser)
  );
}

export function FeedbackPanel({
  initialFeedback,
  onSave,
  onSend,
}: FeedbackPanelProps) {
  const [accuracyRating, setAccuracyRating] = useState<number | undefined>(
    initialFeedback?.accuracyRating,
  );
  const [mostTrue, setMostTrue] = useState(initialFeedback?.mostTrue ?? "");
  const [mostWrong, setMostWrong] = useState(initialFeedback?.mostWrong ?? "");
  const [wouldShare, setWouldShare] = useState<boolean | undefined>(
    initialFeedback?.wouldShare,
  );
  const [wouldPayDeeper, setWouldPayDeeper] = useState<boolean | undefined>(
    initialFeedback?.wouldPayDeeper,
  );
  const [pmfResponse, setPmfResponse] = useState<PmfResponse | undefined>(
    initialFeedback?.pmfResponse,
  );
  const [idealUser, setIdealUser] = useState(initialFeedback?.idealUser ?? "");
  const [message, setMessage] = useState("");

  const createFeedback = (): BetaFeedback => ({
    ...(accuracyRating ? { accuracyRating } : {}),
    ...(mostTrue.trim() ? { mostTrue: mostTrue.trim().slice(0, 1000) } : {}),
    ...(mostWrong.trim() ? { mostWrong: mostWrong.trim().slice(0, 1000) } : {}),
    ...(wouldShare === undefined ? {} : { wouldShare }),
    ...(wouldPayDeeper === undefined ? {} : { wouldPayDeeper }),
    ...(pmfResponse ? { pmfResponse } : {}),
    ...(idealUser.trim() ? { idealUser: idealUser.trim().slice(0, 500) } : {}),
  });

  const saveFeedback = (feedback: BetaFeedback) => {
    onSave(feedback);
    setMessage("Saved locally on this device.");
    window.setTimeout(() => setMessage(""), 2500);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveFeedback(createFeedback());
  };

  const handleSend = () => {
    const feedback = createFeedback();
    if (!hasMeaningfulFeedback(feedback)) {
      setMessage("Answer at least one question before sending feedback.");
      return;
    }
    onSave(feedback);
    onSend(feedback);
  };

  return (
    <section
      aria-labelledby="beta-feedback-heading"
      className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8"
    >
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">
        Private beta
      </p>
      <h2
        id="beta-feedback-heading"
        className="mt-2 font-display text-2xl font-bold text-slate-950"
      >
        Help improve the experience
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
        Save privately on this device, or explicitly send the selected answers
        to the beta team. The feedback submission does not request your name or
        email.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <fieldset>
          <legend className="text-sm font-semibold text-slate-800">
            How accurate did this result feel?
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => setAccuracyRating(rating)}
                aria-pressed={accuracyRating === rating}
                className={`h-10 w-10 rounded-xl border text-sm font-bold ${
                  accuracyRating === rating
                    ? "border-indigo-700 bg-indigo-700 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-indigo-400"
                }`}
              >
                {rating}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-semibold text-slate-800">
            How would you feel if you could no longer use Tri-Ad?
          </legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {pmfOptions.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm text-slate-700 hover:bg-slate-50"
              >
                <input
                  type="radio"
                  name="pmf-response"
                  value={option.value}
                  checked={pmfResponse === option.value}
                  onChange={() => setPmfResponse(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-800">
            What felt most accurate?
            <textarea
              value={mostTrue}
              onChange={(event) => setMostTrue(event.target.value)}
              maxLength={1000}
              rows={4}
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </label>
          <label className="text-sm font-semibold text-slate-800">
            What felt least accurate or too vague?
            <textarea
              value={mostWrong}
              onChange={(event) => setMostWrong(event.target.value)}
              maxLength={1000}
              rows={4}
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </label>
        </div>

        <label className="block text-sm font-semibold text-slate-800">
          What type of person would benefit most from this?
          <textarea
            value={idealUser}
            onChange={(event) => setIdealUser(event.target.value)}
            maxLength={500}
            rows={3}
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <BooleanChoice
            label="Would you share this result?"
            value={wouldShare}
            onChange={setWouldShare}
          />
          <BooleanChoice
            label="Would you consider a deeper paid report?"
            value={wouldPayDeeper}
            onChange={setWouldPayDeeper}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50"
          >
            Save locally
          </button>
          <button
            type="button"
            onClick={handleSend}
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
          >
            Send to beta team
          </button>
          {message ? (
            <span
              role="status"
              aria-live="polite"
              className="text-sm font-semibold text-indigo-700"
            >
              {message}
            </span>
          ) : null}
        </div>
      </form>
    </section>
  );
}

function BooleanChoice({
  label,
  value,
  onChange,
}: {
  readonly label: string;
  readonly value: boolean | undefined;
  readonly onChange: (value: boolean) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-slate-800">{label}</legend>
      <div className="mt-2 flex gap-2">
        {[true, false].map((option) => (
          <button
            key={String(option)}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={value === option}
            className={`flex-1 rounded-xl border px-4 py-2 text-sm font-semibold ${
              value === option
                ? "border-indigo-700 bg-indigo-50 text-indigo-800"
                : "border-slate-300 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {option ? "Yes" : "No"}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
