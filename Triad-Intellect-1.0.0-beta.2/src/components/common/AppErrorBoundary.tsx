import { Component, type ErrorInfo, type ReactNode } from "react";

interface AppErrorBoundaryProps {
  readonly children: ReactNode;
}

interface AppErrorBoundaryState {
  readonly hasError: boolean;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  public override state: AppErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  public override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("application: unexpected render failure", {
      message: error.message,
      componentStack: info.componentStack,
    });
  }

  public override render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="grid min-h-screen place-items-center bg-stone-50 px-4">
        <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-700">
            Unexpected error
          </p>
          <h1 className="mt-3 font-display text-2xl font-bold text-slate-950">
            Tri-Ad could not finish rendering this screen.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Refresh the page. Locally saved assessment history should remain available in this
            browser.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-indigo-700 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-800"
          >
            Reload application
          </button>
        </section>
      </main>
    );
  }
}
