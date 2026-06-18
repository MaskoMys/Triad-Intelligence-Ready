import { useEffect, useRef, useState, type FormEvent } from "react";
import type { AssessmentResult, BetaFeedback } from "@/domain/assessment";
import { getBetaEventSummary, trackBetaEvent } from "@/lib/telemetry";
import { Modal } from "@/components/common/Modal";
import { TurnstileWidget } from "@/components/common/TurnstileWidget";

interface BetaFeedbackModalProps {
  readonly open: boolean;
  readonly result: AssessmentResult;
  readonly feedback: BetaFeedback;
  readonly onClose: () => void;
}

export function BetaFeedbackModal({ open, result, feedback, onClose }: BetaFeedbackModalProps) {
  const [inviteCode, setInviteCode] = useState("");
  const [website, setWebsite] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [resetSignal, setResetSignal] = useState(0);
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState("");
  const [requestId, setRequestId] = useState("");
  const formStartedAtRef = useRef(Date.now());
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() ?? "";

  useEffect(() => {
    if (!open) return;
    formStartedAtRef.current = Date.now();
    setInviteCode("");
    setWebsite("");
    setTurnstileToken("");
    setStatus("idle");
    setError("");
    setRequestId("");
  }, [open]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (siteKey && !turnstileToken) {
      setError("Complete the security verification before submitting.");
      return;
    }

    setStatus("submitting");
    try {
      const response = await fetch("/api/beta-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileCode: result.profileCode,
          normalizedScores: result.normalizedScores,
          feedback,
          betaEvents: getBetaEventSummary(),
          inviteCode,
          turnstileToken: turnstileToken || undefined,
          formStartedAt: formStartedAtRef.current,
          website,
        }),
      });

      const body = (await response.json().catch(() => null)) as {
        readonly ok?: boolean;
        readonly requestId?: string;
      } | null;
      if (!response.ok || body?.ok !== true) {
        throw new Error(body?.requestId ?? "");
      }

      setRequestId(body.requestId ?? "");
      setStatus("success");
      trackBetaEvent("feedback_submitted");
    } catch (caught: unknown) {
      const supportId = caught instanceof Error ? caught.message : "";
      setRequestId(supportId);
      setError(
        `Unable to send feedback. Check the invite code and security verification, then try again.${supportId ? ` Support ID: ${supportId}` : ""}`,
      );
      setStatus("idle");
      setResetSignal((value) => value + 1);
    }
  };

  return (
    <Modal
      open={open}
      title="Send feedback to the beta team"
      description="This sends your selected feedback, profile scores, and local aggregate event counts. It does not request or send your name or email."
      onClose={onClose}
    >
      {status === "success" ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
          <h3 className="font-display text-lg font-bold text-emerald-950">Feedback received</h3>
          <p className="mt-2 text-sm leading-relaxed text-emerald-800">
            Thank you. Your feedback will be used to improve the private beta.
          </p>
          {requestId ? (
            <p className="mt-2 font-mono text-xs text-emerald-700">Reference: {requestId}</p>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="mt-5 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-900"
          >
            Close
          </button>
        </div>
      ) : (
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <label className="block text-sm font-semibold text-slate-800">
            Private beta invite code
            <input
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value)}
              maxLength={128}
              autoComplete="off"
              required
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </label>

          <label className="absolute -left-[9999px]" aria-hidden="true">
            Website
            <input
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
            />
          </label>

          {siteKey ? (
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-800">Security verification</p>
              <TurnstileWidget
                siteKey={siteKey}
                action="beta-feedback"
                resetSignal={resetSignal}
                onTokenChange={setTurnstileToken}
                onError={setError}
              />
            </div>
          ) : (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
              Turnstile is not configured in this build. Production submissions will be rejected
              until the Cloudflare build variable is added.
            </p>
          )}

          {error ? (
            <p
              role="alert"
              className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700"
            >
              {error}
            </p>
          ) : null}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status === "submitting"}
              className="flex-1 rounded-xl bg-indigo-700 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-800 disabled:cursor-wait disabled:opacity-60"
            >
              {status === "submitting" ? "Sending…" : "Send feedback"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
