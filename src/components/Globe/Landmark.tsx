import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { ContinentId } from '../../types/continent'
import type { LandmarkDef } from '../../data/landmarks'
import { latLngToVector3 } from '../../utils/geo'
import { getWindowMaterial } from '../../utils/dataCenterTexture'
import { EARTH_RADIUS } from './Earth'
import { CONTINENT_ELEVATION } from '../../utils/continentLandGeometry'
import { distanceToScale } from '../../utils/zoomScale'

/** Landmark scale when the camera is pulled back — large enough to identify immediately on the whole globe. */
const DEFAULT_SCALE_FAR = 0.17
/** How much smaller a landmark shrinks to when the camera is right up close, as a fraction of its far scale. */
const NEAR_SHRINK_RATIO = 0.52
const SURFACE_CLEARANCE = EARTH_RADIUS * 0.012

interface Props {
  landmark: LandmarkDef
  /** The continent currently raised (selected), so a landmark on it rises with the land instead of sinking into it. */
  elevatedContinentId: ContinentId | null
}

/**
 * A small, hand-authored, low-poly 3D model fixed to a landmark's real-world
 * location. Positioned like `ContinentMarker`: projected onto the globe's
 * surface, then rotated so the model's local +Y axis points along the
 * surface normal ("up" for the landmark), so it rotates correctly with the
 * globe and always stands upright rather than floating or leaning.
 *
 * Tracks `elevatedContinentId` exactly like `DataCenter` does, so a landmark
 * on the currently-selected (raised) continent lifts together with its
 * land instead of appearing buried in it.
 */
export function Landmark({ landmark, elevatedContinentId }: Props) {
  const [hovered, setHovered] = useState(false)
  const outer = useRef<THREE.Group>(null)
  const sizeGroup = useRef<THREE.Group>(null)
  const lift = useRef(0)

  const farScale = landmark.scale ?? DEFAULT_SCALE_FAR
  const nearScale = farScale * NEAR_SHRINK_RATIO
  const currentSize = useRef(farScale)

  const { direction, quaternion } = useMemo(() => {
    const dir = latLngToVector3(landmark.position, 1).normalize()
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
    return { direction: dir, quaternion: q }
  }, [landmark.position])

  const isElevated = elevatedContinentId === landmark.continentId

  useFrame((state, delta) => {
    if (!outer.current) return
    const alpha = 1 - Math.pow(0.0006, delta)
    lift.current = THREE.MathUtils.lerp(lift.current, isElevated ? CONTINENT_ELEVATION : 0, alpha)
    const r = EARTH_RADIUS + SURFACE_CLEARANCE + lift.current
    outer.current.position.set(direction.x * r, direction.y * r, direction.z * r)

    // Zoom-responsive scale: big and unmistakable from the default view,
    // easing smoothly down to a more manageable size as the camera closes
    // in, so the landmark never overwhelms a close-up look. A slow, gentle
    // easing constant keeps the transition glide-smooth with no popping.
    if (sizeGroup.current) {
      const distance = state.camera.position.distanceTo(outer.current.position)
      const targetSize = distanceToScale(distance, nearScale, farScale)
      currentSize.current = THREE.MathUtils.lerp(currentSize.current, targetSize, 1 - Math.pow(0.0012, delta))
      sizeGroup.current.scale.setScalar(currentSize.current)
    }
  })

  return (
    <group ref={outer} quaternion={quaternion}>
      <group
        ref={sizeGroup}
        scale={farScale}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
      >
        <LandmarkModel kind={landmark.kind} />
      </group>

      {hovered && (
        <Html position={[0, 0.09, 0]} center distanceFactor={2.2} style={{ pointerEvents: 'none' }} zIndexRange={[10, 0]}>
          <div className="whitespace-nowrap rounded-full border border-white/30 bg-space-900/85 px-3 py-1 text-[13px] font-bold text-white shadow-lg backdrop-blur-md">
            {landmark.name}
          </div>
        </Html>
      )}
    </group>
  )
}

function LandmarkModel({ kind }: { kind: LandmarkDef['kind'] }) {
  switch (kind) {
    case 'eiffel-tower':
      return <EiffelTower />
    case 'big-ben':
      return <BigBen />
    case 'colosseum':
      return <Colosseum />
    case 'pyramids':
      return <Pyramids />
    case 'great-wall':
      return <GreatWall />
    case 'statue-of-liberty':
      return <StatueOfLiberty />
    case 'christ-redeemer':
      return <ChristRedeemer />
    case 'sydney-opera-house':
      return <SydneyOperaHouse />
    case 'polar-bear':
      return <PolarBear />
    default:
      return null
  }
}

function EiffelTower() {
  const legSpread = 0.19
  return (
    <group>
      {/* Four splayed legs rising to the first platform. */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i / 4) * Math.PI * 2 + Math.PI / 4
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * legSpread * 0.5, 0.14, Math.sin(angle) * legSpread * 0.5]}
            rotation={[Math.sin(angle) * 0.22, 0, -Math.cos(angle) * 0.22]}
          >
            <cylinderGeometry args={[0.012, 0.024, 0.3, 4]} />
            <meshStandardMaterial color="#8a5f38" roughness={0.55} metalness={0.45} />
          </mesh>
        )
      })}
      {/* First platform. */}
      <mesh position={[0, 0.29, 0]}>
        <boxGeometry args={[0.26, 0.02, 0.26]} />
        <meshStandardMaterial color="#7a5230" roughness={0.55} metalness={0.4} />
      </mesh>
      {/* Tapered mid section to the second platform. */}
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.045, 0.11, 0.32, 4]} />
        <meshStandardMaterial color="#7a5230" roughness={0.6} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <boxGeometry args={[0.13, 0.015, 0.13]} />
        <meshStandardMaterial color="#7a5230" roughness={0.55} metalness={0.4} />
      </mesh>
      {/* Long tapering spire to the top. */}
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.012, 0.045, 0.46, 4]} />
        <meshStandardMaterial color="#7a5230" roughness={0.6} metalness={0.4} />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.003, 0.012, 0.06, 4]} />
        <meshStandardMaterial color="#7a5230" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, 1.16, 0]}>
        <cylinderGeometry args={[0.0008, 0.003, 0.08, 4]} />
        <meshStandardMaterial color="#5f4227" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Small amber beacon lights, evenly spaced up the tower. */}
      {[0.29, 0.45, 0.62, 0.85].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <sphereGeometry args={[0.008, 6, 6]} />
          <meshStandardMaterial color="#ffcf7a" emissive="#ffcf7a" emissiveIntensity={1} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

function BigBen() {
  const windowMaterial = useMemo(() => getWindowMaterial(), [])
  return (
    <group>
      {/* Base plinth. */}
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[0.28, 0.06, 0.28]} />
        <meshStandardMaterial color="#8a7250" roughness={0.85} />
      </mesh>
      {/* Main tower shaft. */}
      <mesh position={[0, 0.38, 0]}>
        <boxGeometry args={[0.24, 0.7, 0.24]} />
        <meshStandardMaterial color="#c9a15a" roughness={0.75} />
      </mesh>
      {/* Narrow windows on all four faces, reusing the shared lit-window texture. */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i * Math.PI) / 2
        return (
          <mesh
            key={i}
            position={[Math.sin(angle) * 0.121, 0.5, Math.cos(angle) * 0.121]}
            rotation={[0, angle, 0]}
            material={windowMaterial}
          >
            <planeGeometry args={[0.1, 0.34]} />
          </mesh>
        )
      })}
      {/* Belfry stage with the four clock faces. */}
      <mesh position={[0, 0.79, 0]}>
        <boxGeometry args={[0.27, 0.14, 0.27]} />
        <meshStandardMaterial color="#a9885a" roughness={0.7} />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const angle = (i * Math.PI) / 2
        return (
          <mesh key={i} position={[Math.sin(angle) * 0.136, 0.79, Math.cos(angle) * 0.136]} rotation={[0, angle, 0]}>
            <circleGeometry args={[0.09, 20]} />
            <meshStandardMaterial color="#f4e6c1" emissive="#f4e6c1" emissiveIntensity={0.55} toneMapped={false} />
          </mesh>
        )
      })}
      {/* Spire roof. */}
      <mesh position={[0, 1.0, 0]}>
        <coneGeometry args={[0.19, 0.3, 4]} />
        <meshStandardMaterial color="#4d5b68" roughness={0.55} metalness={0.2} />
      </mesh>
      <mesh position={[0, 1.18, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.06, 6]} />
        <meshStandardMaterial color="#8a7250" roughness={0.5} metalness={0.4} />
      </mesh>
    </group>
  )
}

function Colosseum() {
  const arches = 12
  const tiers = [
    { y: 0.13, r: 0.32, h: 0.26, archH: 0.18 },
    { y: 0.34, r: 0.29, h: 0.14, archH: 0.09 },
  ]
  return (
    <group>
      {tiers.map((tier, tIdx) => (
        <group key={tIdx}>
          <mesh position={[0, tier.y, 0]}>
            <cylinderGeometry args={[tier.r - 0.02, tier.r, tier.h, 28, 1, true]} />
            <meshStandardMaterial color={tIdx === 0 ? '#d9b98a' : '#e0c299'} roughness={0.85} side={THREE.DoubleSide} />
          </mesh>
          {Array.from({ length: arches }).map((_, i) => {
            const angle = (i / arches) * Math.PI * 2
            return (
              <mesh
                key={i}
                position={[Math.cos(angle) * tier.r * 0.985, tier.y, Math.sin(angle) * tier.r * 0.985]}
                rotation={[0, -angle, 0]}
              >
                <boxGeometry args={[0.018, tier.archH, tier.r * 0.19]} />
                <meshStandardMaterial color="#7a5a3a" roughness={0.9} />
              </mesh>
            )
          })}
          <mesh position={[0, tier.y + tier.h / 2, 0]}>
            <cylinderGeometry args={[tier.r, tier.r, 0.014, 28]} />
            <meshStandardMaterial color="#c9a875" roughness={0.85} />
          </mesh>
        </group>
      ))}
      {/* Sandy arena floor visible through the open top. */}
      <mesh position={[0, 0.42, 0]}>
        <circleGeometry args={[0.26, 28]} />
        <meshStandardMaterial color="#c9ab7c" roughness={0.95} />
      </mesh>
    </group>
  )
}

function GreatPyramid({ radius, height, position }: { radius: number; height: number; position: [number, number, number] }) {
  // A handful of stacked, shrinking cone "steps" reads as a stepped pyramid
  // silhouette — cheap, and more convincing than a single smooth cone.
  const steps = 4
  return (
    <group position={position}>
      {Array.from({ length: steps }).map((_, i) => {
        const t = i / steps
        const r = radius * (1 - t * 0.82)
        const h = height / steps
        return (
          <mesh key={i} position={[0, h / 2 + i * h, 0]}>
            <coneGeometry args={[r, h * 1.6, 4]} />
            <meshStandardMaterial color={i % 2 === 0 ? '#e2c07a' : '#d8b56e'} roughness={0.92} />
          </mesh>
        )
      })}
      {/* Dark entrance notch on the base face. */}
      <mesh position={[0, height * 0.14, radius * 0.62]} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[0.05, 0.07, 0.02]} />
        <meshStandardMaterial color="#3a2f22" roughness={0.9} />
      </mesh>
    </group>
  )
}

function Pyramids() {
  return (
    <group>
      <GreatPyramid radius={0.32} height={0.32} position={[0, 0, 0]} />
      <GreatPyramid radius={0.19} height={0.19} position={[0.32, 0, 0.08]} />
      <GreatPyramid radius={0.12} height={0.12} position={[-0.28, 0, -0.14]} />
    </group>
  )
}

function GreatWall() {
  const segments = 7
  return (
    <group>
      {Array.from({ length: segments }).map((_, i) => {
        const x = (i - (segments - 1) / 2) * 0.13
        const z = Math.sin(i * 0.8) * 0.06
        const isTower = i === Math.floor(segments / 2)
        return (
          <group key={i} position={[x, 0.06, z]} rotation={[0, i * 0.32, 0]}>
            <mesh>
              <boxGeometry args={[0.15, 0.12, 0.09]} />
              <meshStandardMaterial color="#9a8563" roughness={0.9} />
            </mesh>
            {/* Crenellations along the top of the wall. */}
            {[-0.05, -0.017, 0.017, 0.05].map((cx, ci) => (
              <mesh key={ci} position={[cx, 0.075, 0]}>
                <boxGeometry args={[0.02, 0.025, 0.09]} />
                <meshStandardMaterial color="#7c6a4d" roughness={0.9} />
              </mesh>
            ))}
            {isTower && (
              <group position={[0, 0.09, 0]}>
                <mesh position={[0, 0.06, 0]}>
                  <boxGeometry args={[0.1, 0.12, 0.1]} />
                  <meshStandardMaterial color="#8a7455" roughness={0.9} />
                </mesh>
                <mesh position={[0, 0.14, 0]}>
                  <coneGeometry args={[0.08, 0.08, 4]} />
                  <meshStandardMaterial color="#6b5a3f" roughness={0.85} />
                </mesh>
              </group>
            )}
          </group>
        )
      })}
    </group>
  )
}

function StatueOfLiberty() {
  const windowMaterial = useMemo(() => getWindowMaterial(), [])
  const spikes = 7
  return (
    <group>
      {/* Stepped pedestal. */}
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[0.28, 0.06, 0.28]} />
        <meshStandardMaterial color="#7c8d80" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[0.22, 0.08, 0.22]} />
        <meshStandardMaterial color="#6b7d6f" roughness={0.85} />
      </mesh>
      {/* Small viewing windows in the pedestal, reusing the shared window texture. */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i * Math.PI) / 2
        return (
          <mesh key={i} position={[Math.sin(angle) * 0.111, 0.1, Math.cos(angle) * 0.111]} rotation={[0, angle, 0]} material={windowMaterial}>
            <planeGeometry args={[0.13, 0.06]} />
          </mesh>
        )
      })}
      {/* Robed body. */}
      <mesh position={[0, 0.46, 0]}>
        <coneGeometry args={[0.13, 0.58, 12]} />
        <meshStandardMaterial color="#5f9e86" roughness={0.75} />
      </mesh>
      {/* Raised torch arm. */}
      <mesh position={[0.16, 0.68, 0]} rotation={[0, 0, -0.6]}>
        <cylinderGeometry args={[0.012, 0.014, 0.24, 8]} />
        <meshStandardMaterial color="#5f9e86" roughness={0.75} />
      </mesh>
      <mesh position={[0.25, 0.81, 0]}>
        <cylinderGeometry args={[0.022, 0.03, 0.05, 8]} />
        <meshStandardMaterial color="#5f9e86" roughness={0.75} />
      </mesh>
      <mesh position={[0.25, 0.86, 0]}>
        <sphereGeometry args={[0.032, 10, 10]} />
        <meshStandardMaterial color="#ffdf80" emissive="#ffdf80" emissiveIntensity={0.8} toneMapped={false} />
      </mesh>
      {/* Head with crown spikes. */}
      <mesh position={[0, 0.78, 0]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color="#6ba894" roughness={0.7} />
      </mesh>
      {Array.from({ length: spikes }).map((_, i) => {
        const angle = (i / spikes) * Math.PI - Math.PI / 2
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 0.045, 0.82, Math.sin(angle) * 0.045]}
            rotation={[0, -angle, Math.PI / 2.6]}
          >
            <coneGeometry args={[0.01, 0.05, 6]} />
            <meshStandardMaterial color="#6ba894" roughness={0.65} />
          </mesh>
        )
      })}
      {/* Tablet held at the chest. */}
      <mesh position={[-0.06, 0.58, 0.07]} rotation={[0, 0.5, 0]}>
        <boxGeometry args={[0.06, 0.12, 0.015]} />
        <meshStandardMaterial color="#7bab98" roughness={0.8} />
      </mesh>
    </group>
  )
}

function ChristRedeemer() {
  return (
    <group>
      {/* Stepped pedestal/base. */}
      <mesh position={[0, 0.025, 0]}>
        <boxGeometry args={[0.2, 0.05, 0.2]} />
        <meshStandardMaterial color="#9a958c" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[0.15, 0.08, 0.15]} />
        <meshStandardMaterial color="#8a8580" roughness={0.9} />
      </mesh>
      {/* Robed body, tapering slightly toward the shoulders. */}
      <mesh position={[0, 0.34, 0]}>
        <cylinderGeometry args={[0.045, 0.055, 0.32, 10]} />
        <meshStandardMaterial color="#d8d3c8" roughness={0.85} />
      </mesh>
      {/* Shoulders. */}
      <mesh position={[0, 0.48, 0]}>
        <boxGeometry args={[0.14, 0.05, 0.08]} />
        <meshStandardMaterial color="#d8d3c8" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.05, 14, 14]} />
        <meshStandardMaterial color="#d8d3c8" roughness={0.85} />
      </mesh>
      {/* Outstretched arms. */}
      <mesh position={[0, 0.47, 0]}>
        <boxGeometry args={[0.46, 0.05, 0.045]} />
        <meshStandardMaterial color="#d8d3c8" roughness={0.85} />
      </mesh>
      {/* Slight drape under each arm for a robed silhouette. */}
      <mesh position={[0.16, 0.4, 0]}>
        <boxGeometry args={[0.1, 0.14, 0.035]} />
        <meshStandardMaterial color="#cfcac0" roughness={0.85} />
      </mesh>
      <mesh position={[-0.16, 0.4, 0]}>
        <boxGeometry args={[0.1, 0.14, 0.035]} />
        <meshStandardMaterial color="#cfcac0" roughness={0.85} />
      </mesh>
    </group>
  )
}

function SydneyOperaHouse() {
  const windowMaterial = useMemo(() => getWindowMaterial(), [])
  const shells = [
    { x: -0.22, z: 0.02, s: 0.16, r: -0.42 },
    { x: -0.09, z: -0.02, s: 0.22, r: -0.18 },
    { x: 0.06, z: 0.01, s: 0.28, r: 0.05 },
    { x: 0.2, z: -0.02, s: 0.23, r: 0.3 },
    { x: 0.32, z: 0.02, s: 0.15, r: 0.5 },
  ]
  return (
    <group>
      {/* Stepped podium platform. */}
      <mesh position={[0, 0.015, 0]}>
        <boxGeometry args={[0.66, 0.03, 0.36]} />
        <meshStandardMaterial color="#b9b9c2" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.045, 0]}>
        <boxGeometry args={[0.58, 0.03, 0.3]} />
        <meshStandardMaterial color="#c9c9cf" roughness={0.85} />
      </mesh>
      {/* Glazed concourse wall between the podium and the shells. */}
      <mesh position={[0, 0.075, 0.13]} material={windowMaterial}>
        <planeGeometry args={[0.5, 0.05]} />
      </mesh>
      {shells.map((shell, i) => (
        <mesh key={i} position={[shell.x, 0.09, shell.z]} rotation={[0, 0, shell.r]} scale={[0.48, 1, 0.55]}>
          <coneGeometry args={[shell.s, shell.s * 1.35, 4, 1, true]} />
          <meshStandardMaterial color="#f5f4ef" roughness={0.55} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

function PolarBear() {
  return (
    <group>
      <mesh position={[0, 0.05, 0]} scale={[1, 0.75, 1.15]}>
        <sphereGeometry args={[0.09, 14, 14]} />
        <meshStandardMaterial color="#f5f6f2" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.075, 0.11]} scale={[0.85, 0.85, 0.95]}>
        <sphereGeometry args={[0.06, 14, 14]} />
        <meshStandardMaterial color="#f5f6f2" roughness={0.8} />
      </mesh>
      <mesh position={[-0.035, 0.12, 0.15]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color="#f5f6f2" roughness={0.8} />
      </mesh>
      <mesh position={[0.035, 0.12, 0.15]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color="#f5f6f2" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.07, 0.19]}>
        <sphereGeometry args={[0.014, 8, 8]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      {[
        [-0.05, -0.01, 0.06],
        [0.05, -0.01, 0.06],
        [-0.05, -0.01, -0.06],
        [0.05, -0.01, -0.06],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <cylinderGeometry args={[0.018, 0.018, 0.05, 8]} />
          <meshStandardMaterial color="#f5f6f2" roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}
