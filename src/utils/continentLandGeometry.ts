import * as THREE from 'three'
import polygonClipping from 'polygon-clipping'
import type { MultiPolygon as PCMultiPolygon } from 'polygon-clipping'
import world from '../data/world110m.json'
import { continents, naturalEarthContinentOverrides } from '../data/continents'
import type { Continent, ContinentId } from '../types/continent'
import { latLngToVector3 } from './geo'

/**
 * Must match `EARTH_RADIUS` in `components/Globe/Earth.tsx`. Duplicated here
 * (rather than imported) so this utils module doesn't reach into components.
 */
const EARTH_RADIUS = 1

/** Radius the continent surface sits at when not elevated — just proud of the base sphere to avoid z-fighting. */
export const CONTINENT_BASE_RADIUS = EARTH_RADIUS * 1.002

/**
 * How far a selected continent rises above the surface, in Earth-radius
 * units. Kept deliberately small — a gentle, controlled lift rather than a
 * dramatic one — so a raised continent still reads as "part of the globe
 * being highlighted" rather than a thick slab or floating platform. The
 * solid side walls built from `perimeterRings` keep even this modest lift
 * readable as one clean piece rather than a flat cap floating disconnected
 * from the surface.
 */
export const CONTINENT_ELEVATION = EARTH_RADIUS * 0.045

/**
 * Amplitude of the gentle per-vertex surface noise applied to every
 * continent (see `terrainNoise` below), as a fraction of `EARTH_RADIUS`.
 * Small enough to read as subtle terrain variation under lighting rather
 * than visible bumps, and small enough that the tiny mismatch it creates at
 * the coastline (where the skirt and outline are built from un-perturbed
 * unit directions) stays imperceptible.
 */
const TERRAIN_NOISE_AMPLITUDE = EARTH_RADIUS * 0.0022

/**
 * Cheap, deterministic, continuous "fake noise" over a unit direction —
 * a handful of layered sine waves rather than a proper gradient-noise
 * implementation. It has no discontinuities (unlike hash-based noise), so it
 * displaces neighbouring vertices smoothly, which is all that's needed for a
 * gentle rolling-terrain look rather than actual geological accuracy.
 */
function terrainNoise(dir: THREE.Vector3): number {
  const a = Math.sin(dir.x * 12.9 + dir.y * 7.3 + dir.z * 4.1)
  const b = Math.cos(dir.y * 10.7 - dir.z * 15.3 + dir.x * 2.6)
  const c = Math.sin(dir.z * 18.4 + dir.x * 6.2 - dir.y * 9.8)
  return (a * 0.5 + b * 0.35 + c * 0.35) / 1.2
}

// GeoJSON coordinates as read from the dataset: loose `number[]` pairs, not
// the strict `[number, number]` tuples `polygon-clipping` types its API
// with. Cast to `PCMultiPolygon` at the boundary below, since the data is
// trusted to already be well-formed [lng, lat] pairs.
type RawRing = number[][]

interface Feature {
  properties: { name: string; continent: string }
  geometry:
    | { type: 'Polygon'; coordinates: RawRing[] }
    | { type: 'MultiPolygon'; coordinates: RawRing[][] }
}

const features = (world as { features: Feature[] }).features

function continentOf(f: Feature): string {
  return naturalEarthContinentOverrides[f.properties.name] ?? f.properties.continent
}

/** A single polygon (outer ring + holes), tagged with which feature it came from. */
interface CandidatePolygon {
  featureName: string
  polygon: RawRing[]
  /** Centroid of the outer ring, for isolation testing. */
  centroid: { lng: number; lat: number }
}

function ringCentroid(ring: RawRing) {
  let lng = 0
  let lat = 0
  for (const [x, y] of ring) {
    lng += x
    lat += y
  }
  return { lng: lng / ring.length, lat: lat / ring.length }
}

/** Great-circle distance in kilometres (haversine). */
function haversineKm(a: { lng: number; lat: number }, b: { lng: number; lat: number }): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/**
 * Natural Earth's per-country `CONTINENT` field classifies a whole country
 * by where its government sits, not by where each piece of its territory
 * actually is — so a country with overseas territory on another continent
 * (e.g. France, whose single feature includes French Guiana in South
 * America) carries that distant land along as part of "Europe". Left in,
 * it dissolves into Europe's landmass and — especially once raised — reads
 * as an obvious, disconnected error rather than a real place.
 *
 * This excludes any polygon that sits far away from every other polygon
 * assigned to the same continent. A 3500 km cutoff was chosen empirically:
 * every genuine outlying territory in this dataset (Svalbard, Russia's
 * Arctic islands, Hawaii, mainland Australia, etc.) sits within ~2300 km of
 * some other piece of its own continent, while French Guiana sits over
 * 6000 km from the nearest other part of Europe — a wide, unambiguous gap.
 */
const ISOLATION_THRESHOLD_KM = 3500

function excludeIsolatedPolygons(candidates: CandidatePolygon[]): CandidatePolygon[] {
  if (candidates.length <= 2) return candidates // nothing to compare against

  return candidates.filter((candidate) => {
    let nearest = Infinity
    for (const other of candidates) {
      if (other === candidate) continue
      const d = haversineKm(candidate.centroid, other.centroid)
      if (d < nearest) nearest = d
    }
    return nearest <= ISOLATION_THRESHOLD_KM
  })
}

/**
 * `polygon-clipping`'s union doesn't guarantee every resulting ring winds
 * the same way (an outer coastline and a hole are conventionally wound
 * opposite each other, and the union's own output isn't consistently one or
 * the other across different polygons). That's harmless for the flat fill
 * (handled by rendering it double-sided), but the side-wall quads built
 * from these rings need a single, predictable winding to always face
 * outward — otherwise some small islands end up with inward-facing walls
 * that read as flat dark shapes instead of lit, raised blocks.
 *
 * This reorients a ring (of unit direction vectors) so it's consistently
 * counter-clockwise as seen from outside the sphere, using the sum of
 * consecutive edge cross-products (the spherical analogue of the 2D
 * shoelace test) compared against the ring's own outward direction.
 */
function orientRingOutward(ring: THREE.Vector3[]): THREE.Vector3[] {
  const n = ring.length
  if (n < 3) return ring

  const centroid = new THREE.Vector3()
  for (const p of ring) centroid.add(p)
  centroid.normalize()

  const sum = new THREE.Vector3()
  for (let i = 0; i < n; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % n]
    sum.add(new THREE.Vector3().crossVectors(a, b))
  }

  return sum.dot(centroid) < 0 ? [...ring].reverse() : ring
}

/**
 * Flat-triangulating a polygon in (lng, lat) space and then projecting its
 * vertices onto the sphere is fast and simple, but a handful of ear-clipped
 * triangles end up spanning a wide angular distance (earcut can produce a
 * long, thin "bridging" triangle across a deeply concave coastline, e.g.
 * around the Gulf of California). The straight chord between two far-apart
 * points on a sphere sags noticeably below the sphere's surface, which can
 * dip a triangle's interior below the base globe — creating a visible gap
 * where the ocean sphere shows through.
 *
 * This recursively splits any triangle whose longest edge subtends more
 * than `maxAngleDeg` at the globe's centre, using a shared-midpoint cache
 * keyed by vertex-index pairs so neighbouring triangles that split the same
 * edge reuse the identical new vertex — the standard geodesic-sphere
 * subdivision technique, which keeps the mesh crack-free.
 */
function subdivideForSphere(positions: number[], indices: number[], radius: number, maxAngleDeg = 3): number[] {
  const maxAngle = THREE.MathUtils.degToRad(maxAngleDeg)
  const midpointCache = new Map<string, number>()

  const vertexAt = (i: number) => new THREE.Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2])

  const angleBetween = (i: number, j: number) => {
    const a = vertexAt(i).normalize()
    const b = vertexAt(j).normalize()
    return Math.acos(THREE.MathUtils.clamp(a.dot(b), -1, 1))
  }

  const midpointIndex = (i: number, j: number): number => {
    const key = i < j ? `${i}_${j}` : `${j}_${i}`
    const cached = midpointCache.get(key)
    if (cached !== undefined) return cached
    const mid = vertexAt(i).add(vertexAt(j)).normalize().multiplyScalar(radius)
    const newIndex = positions.length / 3
    positions.push(mid.x, mid.y, mid.z)
    midpointCache.set(key, newIndex)
    return newIndex
  }

  const out: number[] = []

  const emit = (a: number, b: number, c: number, depth: number) => {
    const longest = Math.max(angleBetween(a, b), angleBetween(b, c), angleBetween(c, a))
    if (longest <= maxAngle || depth > 8) {
      out.push(a, b, c)
      return
    }
    const ab = midpointIndex(a, b)
    const bc = midpointIndex(b, c)
    const ca = midpointIndex(c, a)
    emit(a, ab, ca, depth + 1)
    emit(ab, b, bc, depth + 1)
    emit(ca, bc, c, depth + 1)
    emit(ab, bc, ca, depth + 1)
  }

  for (let k = 0; k < indices.length; k += 3) {
    emit(indices[k], indices[k + 1], indices[k + 2], 0)
  }

  return out
}

export interface ContinentLandData {
  /** One unified mesh per continent — country borders dissolved, only the external silhouette remains. */
  geometry: THREE.BufferGeometry
  /** Flat point-pair list (for a `segments` Line) tracing every coastal/hole boundary. */
  outlineSegments: THREE.Vector3[]
  /**
   * Every coastal/hole boundary as ordered, closed rings of *unit* direction
   * vectors (radius 1) — used to build the side walls that make a raised
   * continent read as a solid block rather than a floating cap. Kept as unit
   * directions (not fixed positions) so the walls can be rebuilt at any
   * radius cheaply, every frame, while a continent is rising or settling.
   */
  perimeterRings: THREE.Vector3[][]
  /**
   * The dissolved landmass in (lng, lat) space, kept for point-in-polygon
   * hit-testing (see `isPointOnLand`) — data-centre placement needs to know
   * whether a candidate site is actually on this continent's land.
   */
  polygonRings: { outer: { lng: number; lat: number }[]; holes: { lng: number; lat: number }[][] }[]
}

/**
 * Dissolve a continent's country polygons into one landmass, triangulate it,
 * and project the result onto the globe's surface.
 *
 * Country borders are removed geometrically (via polygon union), not just
 * visually hidden — the rendered mesh and outline only ever contain each
 * continent's true external boundary (coastline, islands, and any enclosed
 * seas such as the Caspian).
 */
function buildContinentLand(c: Continent): ContinentLandData | null {
  const feats = features.filter((f) => continentOf(f) === c.naturalEarthName)
  if (feats.length === 0) return null

  const candidates: CandidatePolygon[] = feats.flatMap((f) => {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
    return polys.map((polygon) => ({
      featureName: f.properties.name,
      polygon,
      centroid: ringCentroid(polygon[0]),
    }))
  })

  const kept = excludeIsolatedPolygons(candidates)
  for (const dropped of candidates) {
    if (!kept.includes(dropped)) {
      console.warn(
        `[continentLandGeometry] excluded an isolated part of "${dropped.featureName}" from ${c.name} ` +
          `(likely an overseas territory on another continent, per Natural Earth's per-country classification).`,
      )
    }
  }
  if (kept.length === 0) return null

  const geoms = kept.map((k) => [k.polygon] as unknown as PCMultiPolygon)

  let dissolved: PCMultiPolygon
  try {
    dissolved = polygonClipping.union(geoms[0], ...geoms.slice(1))
  } catch (err) {
    console.warn(`[continentLandGeometry] union failed for ${c.name}:`, err)
    return null
  }

  const positions: number[] = []
  const indices: number[] = []
  const outlineSegments: THREE.Vector3[] = []
  const perimeterRings: THREE.Vector3[][] = []
  const polygonRings: ContinentLandData['polygonRings'] = []

  for (const polygon of dissolved) {
    const [outer, ...holes] = polygon
    if (!outer || outer.length < 3) continue

    polygonRings.push({
      outer: outer.map(([lng, lat]) => ({ lng, lat })),
      holes: holes.map((h) => h.map(([lng, lat]) => ({ lng, lat }))),
    })

    const contour = outer.map(([lng, lat]) => new THREE.Vector2(lng, lat))
    const holeContours = holes.map((h) => h.map(([lng, lat]) => new THREE.Vector2(lng, lat)))

    let triangles: number[][]
    try {
      // NOTE: triangulateShape mutates `contour`/`holeContours` in place,
      // dropping a closing point that exactly duplicates each ring's start —
      // so the position buffer below is built from these same (now deduped)
      // arrays rather than the original rings, to keep indices in sync.
      triangles = THREE.ShapeUtils.triangulateShape(contour, holeContours)
    } catch (err) {
      console.warn(`[continentLandGeometry] triangulation failed for ${c.name}:`, err)
      continue
    }

    const rings = [contour, ...holeContours]
    const baseIndex = positions.length / 3
    for (const ring of rings) {
      for (const { x: lng, y: lat } of ring) {
        const v = latLngToVector3({ lat, lng }, CONTINENT_BASE_RADIUS)
        positions.push(v.x, v.y, v.z)
      }
    }
    for (const [a, b, cIdx] of triangles) {
      indices.push(baseIndex + a, baseIndex + b, baseIndex + cIdx)
    }

    // Every ring here is a genuine external boundary of the unified
    // landmass — the outer coastline, plus any inland sea (e.g. the
    // Caspian) left as a hole by the union — so all of them get an outline
    // (and, below, a side wall).
    for (const ring of rings) {
      const n = ring.length
      if (n < 2) continue
      for (let i = 0; i < n; i++) {
        const a = ring[i]
        const b = ring[(i + 1) % n]
        outlineSegments.push(
          latLngToVector3({ lat: a.y, lng: a.x }, CONTINENT_BASE_RADIUS),
          latLngToVector3({ lat: b.y, lng: b.x }, CONTINENT_BASE_RADIUS),
        )
      }
      const directionRing = ring.map(({ x: lng, y: lat }) => latLngToVector3({ lat, lng }, 1))
      perimeterRings.push(orientRingOutward(directionRing))
    }
  }

  if (positions.length === 0) return null

  // `positions` is extended in place with any new midpoint vertices.
  const subdividedIndices = subdivideForSphere(positions, indices, CONTINENT_BASE_RADIUS)

  // Gentle terrain variation: nudge each vertex's radius a tiny amount along
  // its own direction from the globe's centre, so the top surface catches
  // light unevenly instead of reading as a perfectly flat cap. Applied after
  // subdivision so the extra interior vertices get variation too.
  const dir = new THREE.Vector3()
  for (let i = 0; i < positions.length; i += 3) {
    dir.set(positions[i], positions[i + 1], positions[i + 2]).normalize()
    const offset = terrainNoise(dir) * TERRAIN_NOISE_AMPLITUDE
    positions[i] += dir.x * offset
    positions[i + 1] += dir.y * offset
    positions[i + 2] += dir.z * offset
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(subdividedIndices)
  geometry.computeVertexNormals()

  return { geometry, outlineSegments, perimeterRings, polygonRings }
}

/**
 * Continent-level landmass geometry, computed once at module load and
 * cached for the app's lifetime. Every fill mesh and outline on the globe is
 * driven by this data, so there is exactly one source of truth for each
 * continent's shape — no separate "hide the country lines" step involved.
 */
export const continentLandGeometries: Partial<Record<ContinentId, ContinentLandData>> =
  Object.fromEntries(
    continents
      .map((c) => [c.id, buildContinentLand(c)] as const)
      .filter((entry): entry is [ContinentId, ContinentLandData] => entry[1] !== null),
  )

/** Even-odd ray-casting point-in-polygon test in (lng, lat) space. */
function pointInRing(lng: number, lat: number, ring: { lng: number; lat: number }[]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]
    const b = ring[j]
    const intersects =
      a.lat > lat !== b.lat > lat &&
      lng < ((b.lng - a.lng) * (lat - a.lat)) / (b.lat - a.lat) + a.lng
    if (intersects) inside = !inside
  }
  return inside
}

/**
 * Whether the given lat/lng sits on this continent's actual landmass —
 * used to keep data-centre placement out of the ocean.
 */
export function isPointOnLand(continentId: ContinentId, lat: number, lng: number): boolean {
  const data = continentLandGeometries[continentId]
  if (!data) return false
  for (const { outer, holes } of data.polygonRings) {
    if (!pointInRing(lng, lat, outer)) continue
    if (holes.some((hole) => pointInRing(lng, lat, hole))) continue
    return true
  }
  return false
}

/** Great-circle distance in kilometres — exported for placement safety-radius checks. */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  return haversineKm(a, b)
}
