/**
 * Types for the data layer.
 *
 * Every figure shown in the UI must trace back to a sheet in
 * `resources/Artificial Earth Teams Data.xlsx`. The `sourceSheet` field
 * records which sheet the value came from so nothing is invented.
 */

/** A single measured value taken from one row of the spreadsheet. */
export interface DataPoint {
  /** Stable id used by continents to reference the point. */
  id: string
  /** Plain-language label shown under the number in a fact card. */
  label: string
  /** Numeric value exactly as it appears in the sheet (after unit choice). */
  value: number
  /** Unit as written in the sheet (or the unit implied by the sheet). */
  unit: string
  /** Year the value refers to, when the sheet provides one. */
  year?: number
  /** Geographic region the value describes. */
  region: string
  /** Exact sheet name in the workbook. */
  sourceSheet: string
  /** Publisher of the underlying report (e.g. CSO, KPMG, BitPower). */
  publisher: string
  /** Optional child-friendly sentence that puts the number in context. */
  note?: string
  /** Optional override for how the number is displayed (e.g. "2.13 million"). */
  display?: string
}

/** A year/value pair inside a time series. */
export interface SeriesPoint {
  year: number
  value: number
}

/** A time series copied from a sheet (kept for later charts/expansion). */
export interface DataSeries {
  id: string
  label: string
  unit: string
  region: string
  sourceSheet: string
  publisher: string
  points: SeriesPoint[]
}

/** A fact ready for display in a FactCard. */
export interface DisplayFact {
  id: string
  /** Big number/text shown first, e.g. "1,743 MW". */
  headline: string
  /** What the number means, in plain language. */
  label: string
  /** Year chip, if known. */
  year?: number
  /** Where the number came from. */
  source: string
  /** Optional context sentence. */
  note?: string
}
