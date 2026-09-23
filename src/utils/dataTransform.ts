import type { DataPoint, DisplayFact } from '../types/dataset'
import { dataPointsById } from '../data/datasets'

const numberFormat = new Intl.NumberFormat('en-IE', { maximumFractionDigits: 2 })

/** Turn a raw DataPoint into something a FactCard can render. */
export function toDisplayFact(point: DataPoint): DisplayFact {
  const headline = point.display
    ? point.display
    : point.unit === '%'
      ? `${numberFormat.format(point.value)}%`
      : `${numberFormat.format(point.value)} ${point.unit}`

  return {
    id: point.id,
    headline,
    label: point.label,
    year: point.year,
    source: `${point.publisher} · ${point.region}`,
    note: point.note,
  }
}

/** Resolve a list of fact ids into display facts, skipping unknown ids. */
export function factsForIds(ids: string[]): DisplayFact[] {
  return ids
    .map((id) => dataPointsById[id])
    .filter((p): p is DataPoint => Boolean(p))
    .map(toDisplayFact)
}
