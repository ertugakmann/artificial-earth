import type { DisplayFact } from '../../types/dataset'

interface Props {
  fact: DisplayFact
  accent: string
}

/** One big number with a plain-language label, sourced from the dataset. */
export function FactCard({ fact, accent }: Props) {
  return (
    <div
      className="flex flex-col rounded-2xl border border-white/10 bg-white/6 p-3.5"
      title={fact.note}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className="font-display text-[20px] font-extrabold leading-tight tracking-tight"
          style={{ color: accent }}
        >
          {fact.headline}
        </span>
        {fact.year && (
          <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold text-white/70">
            {fact.year}
          </span>
        )}
      </div>
      <p className="mt-1.5 text-[13px] font-semibold leading-snug text-white/85">{fact.label}</p>
      {fact.note && <p className="mt-1.5 text-[12px] leading-snug text-white/55">{fact.note}</p>}
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-white/35">
        {fact.source}
      </p>
    </div>
  )
}
