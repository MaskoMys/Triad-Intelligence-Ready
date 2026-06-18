import { Layers3 } from "lucide-react";

interface AppHeaderProps {
  readonly activeView: "landing" | "assessment" | "results";
  readonly hasResult: boolean;
  readonly onHome: () => void;
  readonly onHistory: () => void;
  readonly onResult: () => void;
  readonly onDemo: () => void;
}

export function AppHeader({
  activeView,
  hasResult,
  onHome,
  onHistory,
  onResult,
  onDemo,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-stone-50/90 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <button type="button" onClick={onHome} className="flex items-center gap-2.5 text-left">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-700 text-white shadow-sm">
            <Layers3 className="h-4 w-4" aria-hidden="true" />
          </span>
          <span>
            <span className="block font-display text-sm font-bold tracking-tight text-slate-950">
              TRI-AD
            </span>
            <span className="block text-[10px] uppercase tracking-[0.14em] text-slate-500">
              Cognitive archetype mapper
            </span>
          </span>
        </button>

        <nav aria-label="Primary navigation" className="flex items-center gap-1">
          <button
            type="button"
            onClick={onHome}
            aria-current={activeView === "landing" ? "page" : undefined}
            className="hidden rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-white hover:text-slate-950 sm:block"
          >
            Assessment
          </button>
          <button
            type="button"
            onClick={onHistory}
            className="hidden rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-white hover:text-slate-950 md:block"
          >
            Saved results
          </button>
          {hasResult ? (
            <button
              type="button"
              onClick={onResult}
              aria-current={activeView === "results" ? "page" : undefined}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
            >
              Active result
            </button>
          ) : null}
          <button
            type="button"
            onClick={onDemo}
            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100"
          >
            Demo
          </button>
        </nav>
      </div>
    </header>
  );
}
