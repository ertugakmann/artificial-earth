import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import type { Line2, LineMaterial } from 'three-stdlib'
import type { DataCenterInstance } from '../../types/game'
import { latLngToVector3 } from '../../utils/geo'
import { EARTH_RADIUS } from './Earth'

const SEGMENTS_PER_ARC = 32
/** How high the arc bulges above the surface at its midpoint, in Earth radii. */
const ARC_HEIGHT = 0.09

interface Edge {
  id: string
  points: THREE.Vector3[]
}

/** Great-circle arc between two surface points, bulging gently upward like a flight path/data link. */
function buildArc(a: { lat: number; lng: number }, b: { lat: number; lng: number }): THREE.Vector3[] {
  const dirA = latLngToVector3(a, 1).normalize()
  const dirB = latLngToVector3(b, 1).normalize()
  const angle = dirA.angleTo(dirB)
  const points: THREE.Vector3[] = []

  for (let i = 0; i <= SEGMENTS_PER_ARC; i++) {
    const t = i / SEGMENTS_PER_ARC
    let dir: THREE.Vector3
    if (angle < 1e-4) {
      dir = dirA.clone()
    } else {
      // Spherical linear interpolation between the two directions.
      const s0 = Math.sin((1 - t) * angle) / Math.sin(angle)
      const s1 = Math.sin(t * angle) / Math.sin(angle)
      dir = dirA.clone().multiplyScalar(s0).add(dirB.clone().multiplyScalar(s1)).normalize()
    }
    const bulge = 1 + ARC_HEIGHT * Math.sin(Math.PI * t)
    points.push(dir.multiplyScalar(EARTH_RADIUS * bulge))
  }
  return points
}

/**
 * Thin glowing "network" links between built data centres — each building
 * connects to its single nearest neighbour, which is enough edges to read
 * as a connected infrastructure grid without cluttering the globe with
 * every possible pair. Purely decorative: it never affects placement or
 * game logic, and stays hidden until there are at least two data centres.
 */
export function DataCenterNetwork({ dataCenters }: { dataCenters: DataCenterInstance[] }) {
  const edges = useMemo<Edge[]>(() => {
    if (dataCenters.length < 2) return []

    const seen = new Set<string>()
    const result: Edge[] = []

    for (const dc of dataCenters) {
      let nearest: DataCenterInstance | null = null
      let nearestDist = Infinity
      for (const other of dataCenters) {
        if (other.id === dc.id) continue
        const d = latLngToVector3(dc, 1).distanceTo(latLngToVector3(other, 1))
        if (d < nearestDist) {
          nearestDist = d
          nearest = other
        }
      }
      if (!nearest) continue
      const key = [dc.id, nearest.id].sort().join('|')
      if (seen.has(key)) continue
      seen.add(key)
      result.push({ id: key, points: buildArc(dc, nearest) })
    }

    return result
  }, [dataCenters])

  if (edges.length === 0) return null

  return (
    <>
      {edges.map((edge, i) => (
        <NetworkLink key={edge.id} points={edge.points} index={i} />
      ))}
    </>
  )
}

/** Total length of `points`, used to place the travelling packet at a constant speed. */
function arcLength(points: THREE.Vector3[]): number {
  let total = 0
  for (let i = 1; i < points.length; i++) total += points[i].distanceTo(points[i - 1])
  return total
}

/** Point at arc-length fraction `t` (0-1) along a polyline. */
function pointAtFraction(points: THREE.Vector3[], totalLength: number, t: number, out: THREE.Vector3): void {
  const target = THREE.MathUtils.clamp(t, 0, 1) * totalLength
  let travelled = 0
  for (let i = 1; i < points.length; i++) {
    const segLength = points[i].distanceTo(points[i - 1])
    if (travelled + segLength >= target || i === points.length - 1) {
      const segT = segLength > 0 ? (target - travelled) / segLength : 0
      out.copy(points[i - 1]).lerp(points[i], THREE.MathUtils.clamp(segT, 0, 1))
      return
    }
    travelled += segLength
  }
}

function NetworkLink({ points, index }: { points: THREE.Vector3[]; index: number }) {
  const coreRef = useRef<Line2>(null)
  const glowRef = useRef<Line2>(null)
  const packetA = useRef<THREE.Mesh>(null)
  const packetB = useRef<THREE.Mesh>(null)
  const totalLength = useMemo(() => arcLength(points), [points])
  // Stagger each link's animation phase so a busy network doesn't pulse in lockstep.
  const phase = useMemo(() => index * 0.9, [index])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    const core = coreRef.current?.material as LineMaterial | undefined
    if (core) {
      core.dashOffset -= 0.02
      core.opacity = 0.65 + 0.25 * Math.sin(t * 1.8 + phase)
    }
    const glow = glowRef.current?.material as LineMaterial | undefined
    if (glow) glow.opacity = 0.28 + 0.12 * Math.sin(t * 1.8 + phase)

    // Two small "data packets" travelling in opposite directions along the
    // link, looping continuously — the clearest possible read of "network
    // traffic flowing between these two buildings".
    const speed = 0.22
    const loopA = (t * speed + phase) % 1
    const loopB = (1 - ((t * speed + phase) % 1) + 1) % 1
    if (packetA.current) pointAtFraction(points, totalLength, loopA, packetA.current.position)
    if (packetB.current) pointAtFraction(points, totalLength, loopB, packetB.current.position)
  })

  return (
    <group>
      {/* Soft wide glow underneath a crisp bright core — same double-line
          technique used for the continent coastlines, so the link reads
          clearly against both the ocean and lit land. */}
      <Line
        ref={glowRef}
        points={points}
        color="#8fe1ff"
        transparent
        opacity={0.3}
        lineWidth={6}
        depthWrite={false}
        toneMapped={false}
      />
      <Line
        ref={coreRef}
        points={points}
        color="#e4f9ff"
        transparent
        opacity={0.85}
        lineWidth={2.2}
        dashed
        dashSize={0.045}
        gapSize={0.03}
        depthWrite={false}
        toneMapped={false}
      />
      <mesh ref={packetA}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshBasicMaterial color="#e4f9ff" toneMapped={false} />
      </mesh>
      <mesh ref={packetB}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshBasicMaterial color="#8fe1ff" toneMapped={false} />
      </mesh>
    </group>
  )
}
