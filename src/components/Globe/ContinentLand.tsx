import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import type { Continent } from '../../types/continent'
import {
  continentLandGeometries,
  CONTINENT_BASE_RADIUS,
  CONTINENT_ELEVATION,
} from '../../utils/continentLandGeometry'
import { latLngToVector3 } from '../../utils/geo'

interface Props {
  continent: Continent
  /** Whether this is the currently selected continent, so it should rise. */
  elevated: boolean
  /**
   * 0-1: how visually "dead" the planet currently is, driven by falling
   * water and rising pollution. Smoothly desaturates this continent's
   * healthy colour toward a dry, muted brown-grey as it climbs, so
   * environmental decline reads as a gradual shift rather than a sudden
   * change of state.
   */
  decline: number
}

/** What every continent fades toward at maximum environmental decline. */
const DEAD_COLOR = new THREE.Color('#7d7263')

/**
 * Hex colour → darker variant, used to shade the raised continent's side
 * walls. Scales RGB channels directly (a "multiply" darken) rather than
 * reducing HSL lightness: lightness-only darkening leaves saturation
 * untouched, which turns a light, high-saturation pastel (e.g. Antarctica's
 * lavender) into a jarring, disproportionately vivid colour instead of a
 * gently shaded one. Multiplying keeps every continent's side walls reading
 * as a muted version of the same colour.
 */
function darken(hex: string, factor: number): string {
  const c = new THREE.Color(hex)
  c.r *= factor
  c.g *= factor
  c.b *= factor
  return `#${c.getHexString()}`
}

interface SkirtRing {
  /** Buffer-vertex index of this ring's first *top* vertex. */
  topStart: number
  /** Unit direction for each point around the ring, in buffer order. */
  dirs: THREE.Vector3[]
}

/** Still animating, or already at rest? Avoids paying per-frame update cost once settled. */
const SETTLE_EPSILON = 1e-6

/**
 * A continent rendered as one unified landmass — country borders dissolved,
 * only the external coastline remains — with a soft white glow along that
 * boundary. When `elevated`, it rises a large, confident amount above the
 * globe and grows solid side walls along its entire perimeter (coastline,
 * islands, and any inland sea left as a hole), so it reads as one clean
 * block lifted out of the sphere — like a puzzle piece pulled from the
 * board — rather than a flat cap floating disconnected from the surface.
 *
 * The top surface + outline rise via a cheap uniform scale of a group
 * centred on the globe's origin (every vertex already sits on a sphere
 * around that origin, so scaling pushes the whole shape radially outward
 * with no per-vertex work). The side walls can't use that same trick —
 * their bottom edge must stay pinned to the globe's surface while their top
 * edge rises — so they're a separate mesh whose top-ring vertices are
 * rewritten each frame from cached unit directions, but only while the
 * elevation is actually changing.
 */
export function ContinentLand({ continent, elevated, decline }: Props) {
  const data = continentLandGeometries[continent.id]
  const group = useRef<THREE.Group>(null)
  const radius = useRef(CONTINENT_BASE_RADIUS)
  const centerDirection = useMemo(() => latLngToVector3(continent.marker, 1), [continent.marker])
  const landMaterial = useRef<THREE.MeshStandardMaterial>(null)
  const sideMaterial = useRef<THREE.MeshStandardMaterial>(null)
  const healthyLand = useMemo(() => new THREE.Color(continent.color), [continent.color])
  const healthySide = useMemo(() => new THREE.Color(darken(continent.color, 0.72)), [continent.color])
  const deadSide = useMemo(() => DEAD_COLOR.clone().multiplyScalar(0.72), [])

  const skirt = useMemo(() => {
    if (!data) return null

    const positions: number[] = []
    const indices: number[] = []
    const rings: SkirtRing[] = []

    for (const ring of data.perimeterRings) {
      const n = ring.length
      if (n < 2) continue

      const bottomStart = positions.length / 3
      for (const dir of ring) {
        positions.push(
          dir.x * CONTINENT_BASE_RADIUS,
          dir.y * CONTINENT_BASE_RADIUS,
          dir.z * CONTINENT_BASE_RADIUS,
        )
      }
      // Top ring starts flush with the bottom (zero-height wall) so the
      // continent sits perfectly flat when nothing is elevated.
      const topStart = positions.length / 3
      for (const dir of ring) {
        positions.push(
          dir.x * CONTINENT_BASE_RADIUS,
          dir.y * CONTINENT_BASE_RADIUS,
          dir.z * CONTINENT_BASE_RADIUS,
        )
      }
      rings.push({ topStart, dirs: ring })

      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n
        const b0 = bottomStart + i
        const b1 = bottomStart + j
        const t0 = topStart + i
        const t1 = topStart + j
        indices.push(b0, b1, t0, t0, b1, t1)
      }
    }

    if (positions.length === 0) return null

    const geometry = new THREE.BufferGeometry()
    const positionAttr = new THREE.Float32BufferAttribute(positions, 3)
    positionAttr.setUsage(THREE.DynamicDrawUsage)
    geometry.setAttribute('position', positionAttr)
    geometry.setIndex(indices)
    geometry.computeVertexNormals()

    return { geometry, rings }
  }, [data])

  useFrame((_, delta) => {
    if (landMaterial.current) landMaterial.current.color.copy(healthyLand).lerp(DEAD_COLOR, decline)
    if (sideMaterial.current) sideMaterial.current.color.copy(healthySide).lerp(deadSide, decline)

    if (!group.current) return
    const target = CONTINENT_BASE_RADIUS + (elevated ? CONTINENT_ELEVATION : 0)
    const alpha = 1 - Math.pow(0.0006, delta) // frame-rate independent easing
    const previous = radius.current
    const next = THREE.MathUtils.lerp(previous, target, alpha)
    radius.current = next

    group.current.scale.setScalar(next / CONTINENT_BASE_RADIUS)

    if (skirt && Math.abs(next - previous) > SETTLE_EPSILON) {
      const positionAttr = skirt.geometry.getAttribute('position') as THREE.BufferAttribute
      const array = positionAttr.array as Float32Array
      for (const { topStart, dirs } of skirt.rings) {
        for (let i = 0; i < dirs.length; i++) {
          const o = (topStart + i) * 3
          const dir = dirs[i]
          array[o] = dir.x * next
          array[o + 1] = dir.y * next
          array[o + 2] = dir.z * next
        }
      }
      positionAttr.needsUpdate = true
      skirt.geometry.computeVertexNormals()
    }
  })

  if (!data) return null

  const sideColor = darken(continent.color, 0.72)

  return (
    <>
      {/* Soft dark footprint left on the globe's surface beneath a raised
          continent — grounds the lift instead of leaving a bare gap. */}
      {elevated && (
        <mesh geometry={data.geometry} scale={1.001}>
          <meshBasicMaterial color="#000000" transparent opacity={0.2} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      )}

      <group ref={group}>
        {/* Same pointer-event containment as the base sphere, so a raised
            continent doesn't let clicks/hovers leak through to the far side. */}
        <mesh
          geometry={data.geometry}
          onPointerOver={(e) => e.stopPropagation()}
          onPointerMove={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* A small fraction of triangles end up wound backwards after the
              flat polygon is projected onto the sphere (sharp, thin coastal
              features like a narrow gulf can flip orientation during that
              projection). Rendering both sides avoids a visible gap there
              without needing to special-case those triangles. */}
          <meshStandardMaterial ref={landMaterial} color={continent.color} roughness={0.85} metalness={0.04} side={THREE.DoubleSide} />
        </mesh>

        {/* Soft, atmospheric glow behind the coastline — a touch brighter once raised. */}
        <Line
          points={data.outlineSegments}
          segments
          color="#ffffff"
          transparent
          opacity={elevated ? 0.38 : 0.25}
          lineWidth={elevated ? 6.5 : 5}
          depthWrite={false}
        />
        {/* Crisp white coastline on top of the glow. */}
        <Line points={data.outlineSegments} segments color="#ffffff" transparent opacity={0.85} lineWidth={1.5} />
      </group>

      {/* Extra highlight light on a raised continent, so the lift reads clearly
          without washing out the rest of the globe. */}
      {elevated && (
        <pointLight
          position={centerDirection.clone().multiplyScalar(1.18)}
          intensity={0.4}
          color={continent.color}
          distance={1.1}
        />
      )}

      {/* Side walls: bottom edge pinned to the globe's surface, top edge
          rising with the group above — giving the raised continent real
          thickness, like a puzzle piece lifted off the board. Sits outside
          the scaled group since its bottom edge must NOT scale with it. */}
      {skirt && (
        <mesh
          geometry={skirt.geometry}
          onPointerOver={(e) => e.stopPropagation()}
          onPointerMove={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <meshStandardMaterial ref={sideMaterial} color={sideColor} roughness={0.92} metalness={0.02} side={THREE.DoubleSide} />
        </mesh>
      )}
    </>
  )
}
