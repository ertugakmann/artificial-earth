import type { ContinentId, GeoPosition } from '../types/continent'

export type LandmarkKind =
  | 'big-ben'
  | 'colosseum'
  | 'eiffel-tower'
  | 'pyramids'
  | 'great-wall'
  | 'statue-of-liberty'
  | 'christ-redeemer'
  | 'sydney-opera-house'
  | 'polar-bear'

export interface LandmarkDef {
  id: string
  continentId: ContinentId
  name: string
  kind: LandmarkKind
  position: GeoPosition
  /** Base scale relative to the globe radius; tuned per-model in Landmark.tsx. */
  scale?: number
}

/**
 * Famous landmarks shown fixed on the globe, one hand-picked spot per
 * continent (three for Europe). Coordinates are each landmark's real-world
 * location, nudged only where needed to land squarely on the dissolved
 * continent mesh rather than a thin coastal sliver.
 */
export const landmarks: LandmarkDef[] = [
  { id: 'big-ben', continentId: 'europe', name: 'Big Ben', kind: 'big-ben', position: { lat: 51.5, lng: -0.12 } },
  { id: 'colosseum', continentId: 'europe', name: 'Colosseum', kind: 'colosseum', position: { lat: 41.89, lng: 12.49 } },
  { id: 'eiffel-tower', continentId: 'europe', name: 'Eiffel Tower', kind: 'eiffel-tower', position: { lat: 48.86, lng: 2.29 } },
  { id: 'pyramids', continentId: 'africa', name: 'Pyramids of Giza', kind: 'pyramids', position: { lat: 29.98, lng: 31.13 } },
  { id: 'great-wall', continentId: 'asia', name: 'Great Wall of China', kind: 'great-wall', position: { lat: 40.43, lng: 116.57 } },
  {
    id: 'statue-of-liberty',
    continentId: 'north-america',
    name: 'Statue of Liberty',
    kind: 'statue-of-liberty',
    position: { lat: 40.69, lng: -74.04 },
  },
  {
    id: 'christ-redeemer',
    continentId: 'south-america',
    name: 'Christ the Redeemer',
    kind: 'christ-redeemer',
    position: { lat: -22.95, lng: -43.21 },
  },
  {
    id: 'sydney-opera-house',
    continentId: 'oceania',
    name: 'Sydney Opera House',
    kind: 'sydney-opera-house',
    position: { lat: -33.86, lng: 151.21 },
  },
  {
    id: 'polar-bear',
    continentId: 'antarctica',
    name: 'Polar Bear',
    kind: 'polar-bear',
    position: { lat: -80, lng: 20 },
  },
]
