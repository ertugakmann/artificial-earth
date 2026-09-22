import world from '../data/world110m.json'
import { continents, naturalEarthContinentOverrides } from '../data/continents'
import type { Continent, GeoBounds } from '../types/continent'
import { lngLatToXY } from './geo'

type Ring = number[][]

interface Feature {
  properties: { name: string; continent: string }
  geometry:
    | { type: 'Polygon'; coordinates: Ring[] }
    | { type: 'MultiPolygon'; coordinates: Ring[][] }
}

const features = (world as { features: Feature[] }).features

/** Continent name for a feature, after visual overrides. */
function continentOf(f: Feature): string {
  return naturalEarthContinentOverrides[f.properties.name] ?? f.properties.continent
}

/** Every outer+inner ring of a feature, flattened. */
function ringsOf(f: Feature): Ring[] {
  if (f.geometry.type === 'Polygon') return f.geometry.coordinates
  return f.geometry.coordinates.flat()
}

function ringCentroid(ring: Ring) {
  let x = 0
  let y = 0
  for (const [lng, lat] of ring) {
    x += lng
    y += lat
  }
  return { lng: x / ring.length, lat: y / ring.length }
}

function inBounds(ring: Ring, b?: GeoBounds) {
  if (!b) return true
  const c = ringCentroid(ring)
  return c.lng >= b.minLng && c.lng <= b.maxLng && c.lat >= b.minLat && c.lat <= b.maxLat
}

/** All polygon rings that belong to a continent (optionally clipped by bounds). */
export function ringsForContinent(c: Continent, clip = false): Ring[] {
  const rings: Ring[] = []
  for (const f of features) {
    if (continentOf(f) !== c.naturalEarthName) continue
    for (const ring of ringsOf(f)) {
      if (!clip || inBounds(ring, c.iconBounds)) rings.push(ring)
    }
  }
  return rings
}

/** Rings for every feature, with the continent they were assigned to. */
export function allRings(): { continent: string; ring: Ring }[] {
  const out: { continent: string; ring: Ring }[] = []
  for (const f of features) {
    const continent = continentOf(f)
    for (const ring of ringsOf(f)) out.push({ continent, ring })
  }
  return out
}

/**
 * Build an SVG path (in a 0–100 square view box) of a continent's silhouette.
 * Computed once at module load; cheap because the 110 m dataset is small.
 */
function buildSilhouette(c: Continent): string {
  const rings = ringsForContinent(c, true)
  if (rings.length === 0) return ''

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  // Antarctica is a thin strip in an equirectangular map, so draw it from
  // above the South Pole instead (polar azimuthal projection).
  const project = (lng: number, lat: number) => {
    if (c.id !== 'antarctica') return lngLatToXY(lng, lat, 360, 180)
    const r = 90 + lat
    const a = (lng * Math.PI) / 180
    return { x: 90 + r * Math.cos(a), y: 90 + r * Math.sin(a) }
  }
  const projected = rings.map((ring) =>
    ring.map(([lng, lat]) => {
      const p = project(lng, lat)
      minX = Math.min(minX, p.x)
      minY = Math.min(minY, p.y)
      maxX = Math.max(maxX, p.x)
      maxY = Math.max(maxY, p.y)
      return p
    }),
  )

  const span = Math.max(maxX - minX, maxY - minY) || 1
  const pad = 6
  const scale = (100 - pad * 2) / span
  const offsetX = pad + ((100 - pad * 2) - (maxX - minX) * scale) / 2
  const offsetY = pad + ((100 - pad * 2) - (maxY - minY) * scale) / 2

  return projected
    .map((ring) =>
      ring
        .map((p, i) => {
          const x = ((p.x - minX) * scale + offsetX).toFixed(1)
          const y = ((p.y - minY) * scale + offsetY).toFixed(1)
          return `${i === 0 ? 'M' : 'L'}${x} ${y}`
        })
        .join('') + 'Z',
    )
    .join('')
}

export const continentSilhouettes: Record<string, string> = Object.fromEntries(
  continents.map((c) => [c.id, buildSilhouette(c)]),
)
