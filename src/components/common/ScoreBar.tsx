interface ScoreBarProps {
  readonly label: string;
  readonly value: number;
  readonly description?: string;
}

export function ScoreBar({ label, value, description }: ScoreBarProps) {
  const rounded = Math.round(value);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-4">
        <span className="text-sm font-semibold text-slate-800">{label}</span>
        <span className="font-mono text-sm font-bold text-indigo-700">
          {rounded}
        </span>
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={rounded}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
          style={{ width: `${Math.min(100, Math.max(0, rounded))}%` }}
        />
      </div>
      {description ? (
        <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
          {description}
        </p>
      ) : null}
    </div>
  );
}
