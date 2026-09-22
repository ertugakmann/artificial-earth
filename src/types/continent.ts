export type ContinentId =
  | 'north-america'
  | 'south-america'
  | 'europe'
  | 'africa'
  | 'asia'
  | 'oceania'
  | 'antarctica'

/** A latitude/longitude pair in degrees. */
export interface GeoPosition {
  lat: number
  lng: number
}

/** A longitude/latitude bounding box used to clip continent silhouettes. */
export interface GeoBounds {
  minLng: number
  maxLng: number
  minLat: number
  maxLat: number
}

export interface Continent {
  id: ContinentId
  /** Full name shown in the panel and cards. */
  name: string
  /** Name used in the Natural Earth `continent` property. */
  naturalEarthName: string
  /** Where the glowing marker sits on the globe. */
  marker: GeoPosition
  /** Accent colour for the card, marker highlight and globe fill. */
  color: string
  /** Optional bounds used to clip the silhouette icon and globe fill. */
  iconBounds?: GeoBounds
  /** Short, child-friendly introduction. */
  description: string
  /** Positive effects of AI. */
  good: string[]
  /** Negative effects or challenges. */
  challenges: string[]
  /** Ids of DataPoints in `datasets.ts` to show as facts. */
  factIds: string[]
  /** Shown when there are no facts, so children know why. */
  dataNote?: string
}
