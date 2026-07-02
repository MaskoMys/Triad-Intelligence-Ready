import { useEffect, useRef, useState, type FormEvent } from "react";
import type { AssessmentResult } from "@/domain/assessment";
import { getBetaEventSummary, trackBetaEvent } from "@/lib/telemetry";
import { Modal } from "@/components/common/Modal";
import { TurnstileWidget } from "@/components/common/TurnstileWidget";

interface PremiumOrderModalProps {
  readonly open: boolean;
  readonly result: AssessmentResult;
  readonly onClose: () => void;
}

export function PremiumOrderModal({
  open,
  result,
  onClose,
}: PremiumOrderModalProps) {
  const [name, setName] = useState(result.userName);
  const [email, setEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [website, setWebsite] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [resetSignal, setResetSignal] = useState(0);
  const [status, setStatus] = useState<"idle" | "submitting" | "success">(
    "idle",
  );
  const [error, setError] = useState("");
  const [requestId, setRequestId] = useState("");
  const formStartedAtRef = useRef(Date.now());
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() ?? "";

  useEffect(() => {
    if (!open) return;
    formStartedAtRef.current = Date.now();
    setName(result.userName);
    setEmail("");
    setInviteCode("");
    setWebsite("");
    setStatus("idle");
    setError("");
    setRequestId("");
    setTurnstileToken("");
  }, [open, result.userName]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (siteKey && !turnstileToken) {
      setError("Complete the security verification before submitting.");
      return;
    }

    setStatus("submitting");
    try {
      const response = await fetch("/api/premium-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          profileCode: result.profileCode,
          normalizedScores: result.normalizedScores,
          inviteCode,
          turnstileToken: turnstileToken || undefined,
          feedback: result.feedback,
          betaEvents: getBetaEventSummary(),
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
      trackBetaEvent("premium_order_submitted");
    } catch (caught: unknown) {
      const supportId = caught instanceof Error ? caught.message : "";
      setRequestId(supportId);
      setError(
        `Unable to submit this request. Check the invite code and security verification, then try again.${supportId ? ` Support ID: ${supportId}` : ""}`,
      );
      setStatus("idle");
      setResetSignal((value) => value + 1);
    }
  };

  return (
    <Modal
      open={open}
      title="Request an expanded beta report"
      description="This sends your name, email, profile scores, optional feedback, and local aggregate event counts to the beta operator. Email is not stored in browser history."
      onClose={onClose}
    >
      {status === "success" ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
          <h3 className="font-display text-lg font-bold text-emerald-950">
            Request received
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-emerald-800">
            The beta operator will review the request and contact you by email.
          </p>
          {requestId ? (
            <p className="mt-2 font-mono text-xs text-emerald-700">
              Reference: {requestId}
            </p>
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
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-4"
        >
          <label className="block text-sm font-semibold text-slate-800">
            Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={80}
              autoComplete="name"
              required
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-800">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              maxLength={254}
              autoComplete="email"
              required
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </label>
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
              <p className="mb-2 text-sm font-semibold text-slate-800">
                Security verification
              </p>
              <TurnstileWidget
                siteKey={siteKey}
                action="premium-order"
                resetSignal={resetSignal}
                onTokenChange={setTurnstileToken}
                onError={setError}
              />
            </div>
          ) : (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
              Turnstile is not configured in this build. Production submissions
              will be rejected until the Cloudflare build variable is added.
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
              {status === "submitting" ? "Submitting…" : "Submit request"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
