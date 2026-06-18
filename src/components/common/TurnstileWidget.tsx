import { useEffect, useRef } from "react";

interface TurnstileApi {
  render: (
    container: HTMLElement,
    options: {
      readonly sitekey: string;
      readonly action: string;
      readonly theme: "light";
      readonly callback: (token: string) => void;
      readonly "expired-callback": () => void;
      readonly "error-callback": () => void;
    },
  ) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

interface TurnstileWidgetProps {
  readonly siteKey: string;
  readonly action: "premium-order" | "beta-feedback";
  readonly resetSignal: number;
  readonly onTokenChange: (token: string) => void;
  readonly onError: (message: string) => void;
}

const SCRIPT_ID = "triad-turnstile-script";
const SCRIPT_SOURCE = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let scriptPromise: Promise<void> | undefined;

function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const script = existing ?? document.createElement("script");

    const handleLoad = () => resolve();
    const handleError = () => {
      scriptPromise = undefined;
      reject(new Error("Turnstile script failed to load."));
    };

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });

    if (!existing) {
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SOURCE;
      script.async = true;
      script.defer = true;
      document.head.append(script);
    }
  });

  return scriptPromise;
}

export function TurnstileWidget({
  siteKey,
  action,
  resetSignal,
  onTokenChange,
  onError,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);
  const tokenCallbackRef = useRef(onTokenChange);
  const errorCallbackRef = useRef(onError);

  useEffect(() => {
    tokenCallbackRef.current = onTokenChange;
  }, [onTokenChange]);

  useEffect(() => {
    errorCallbackRef.current = onError;
  }, [onError]);

  useEffect(() => {
    let cancelled = false;

    void loadTurnstile()
      .then(() => {
        if (cancelled || !window.turnstile || !containerRef.current) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          theme: "light",
          callback: (token) => tokenCallbackRef.current(token),
          "expired-callback": () => tokenCallbackRef.current(""),
          "error-callback": () => {
            tokenCallbackRef.current("");
            errorCallbackRef.current(
              "Security verification could not complete. Refresh and try again.",
            );
          },
        });
      })
      .catch(() => {
        if (!cancelled) {
          errorCallbackRef.current("Security verification could not load. Refresh and try again.");
        }
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = undefined;
      tokenCallbackRef.current("");
    };
  }, [action, siteKey]);

  useEffect(() => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      tokenCallbackRef.current("");
    }
  }, [resetSignal]);

  return (
    <div
      ref={containerRef}
      aria-label="Security verification"
      className="min-h-16 rounded-xl border border-slate-200 bg-slate-50 p-2"
    />
  );
}
