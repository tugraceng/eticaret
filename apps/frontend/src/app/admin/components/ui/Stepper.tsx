"use client";

export function Stepper({
  steps,
  current,
  onStepClick,
}: {
  steps: readonly string[];
  current: number;
  onStepClick?: (step: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {steps.map((label, i) => {
        const n = i + 1;
        const active = current === n;
        const clickable = onStepClick && n < current;
        return (
          <button
            key={label}
            type="button"
            disabled={!clickable}
            onClick={() => clickable && onStepClick(n)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              active
                ? "border-sky-500 bg-sky-50 text-sky-900"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            } ${clickable ? "cursor-pointer" : ""} disabled:cursor-default disabled:opacity-100`}
          >
            <span
              className={`grid h-6 w-6 place-items-center rounded-full text-[11px] ${
                active ? "bg-sky-600 text-white" : "bg-slate-200 text-slate-700"
              }`}
            >
              {n}
            </span>
            {label}
          </button>
        );
      })}
    </div>
  );
}
