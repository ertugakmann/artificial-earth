import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { Building2, CloudFog, Droplets, Wallet } from 'lucide-react'
import * as THREE from 'three'
import type { ContinentId } from '../../types/continent'
import type { DataCenterInstance } from '../../types/game'
import { continentsById } from '../../data/continents'
import { latLngToVector3 } from '../../utils/geo'
import { getWindowMaterial } from '../../utils/dataCenterTexture'
import { EARTH_RADIUS } from './Earth'
import { CONTINENT_ELEVATION } from '../../utils/continentLandGeometry'
import { distanceToScale } from '../../utils/zoomScale'

interface Props {
  dataCenter: DataCenterInstance
  /** The continent currently raised (selected), so this building can rise with it. */
  elevatedContinentId: ContinentId | null
  /** Whether this building's info panel is pinned open (tapped/clicked, not just hovered). */
  pinned: boolean
  /** Tap/click toggles this building's pinned info panel; pass `null` to clear it. */
  onTogglePin: (id: string | null) => void
}

const BUILD_DURATION_MS = 1400
const SURFACE_CLEARANCE = EARTH_RADIUS * 0.006
/** Overall size when the camera is pulled back — large enough to spot immediately on the whole globe. */
const SIZE_FAR = 2.7
/** Overall size when the camera is right up close — shrunk so the building never overwhelms the view. */
const SIZE_NEAR = 1.35

/** Ease-out-back: overshoots slightly then settles, for a satisfying "pop into place". */
function easeOutBack(t: number): number {
  const c1 = 1.4
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

/**
 * A stylised modern AI data-centre building fixed at its build site: a
 * windowed main tower plus a smaller annex, rooftop cooling/venting
 * equipment, and an entrance canopy — detailed enough to read as "a large
 * building full of computers" from a normal view and to hold up on closer
 * zoom, while staying cheap (one shared window material/texture reused by
 * every data centre in the game, no per-window geometry).
 *
 * Rises out of the globe's surface and scales into place over ~1.4s when
 * first constructed. Also tracks `elevatedContinentId` so a data centre on
 * the currently-selected (raised) continent lifts together with its land
 * instead of appearing to sink into it.
 */
export function DataCenter({ dataCenter, elevatedContinentId, pinned, onTogglePin }: Props) {
  const outer = useRef<THREE.Group>(null)
  const sizeGroup = useRef<THREE.Group>(null)
  const currentSize = useRef(SIZE_FAR)
  const buildGroup = useRef<THREE.Group>(null)
  const highlightGroup = useRef<THREE.Group>(null)
  const glowRing = useRef<THREE.Mesh>(null)
  const glowMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const hoverRing = useRef<THREE.Mesh>(null)
  const hoverMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const settled = useRef(false)
  const lift = useRef(0)
  const hoverAmount = useRef(0)
  const [hovered, setHovered] = useState(false)

  const active = hovered || pinned

  const windowMaterial = useMemo(() => getWindowMaterial(), [])

  const { direction, quaternion } = useMemo(() => {
    const dir = latLngToVector3({ lat: dataCenter.lat, lng: dataCenter.lng }, 1).normalize()
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
    return { direction: dir, quaternion: q }
  }, [dataCenter.lat, dataCenter.lng])

  const isElevated = elevatedContinentId === dataCenter.continentId

  useFrame((state, delta) => {
    if (!outer.current) return

    // Follow the continent's own rise/settle so the building never appears
    // to float above or sink below a selected, lifted continent.
    const alpha = 1 - Math.pow(0.0006, delta)
    lift.current = THREE.MathUtils.lerp(lift.current, isElevated ? CONTINENT_ELEVATION : 0, alpha)
    const r = EARTH_RADIUS + SURFACE_CLEARANCE + lift.current
    outer.current.position.set(direction.x * r, direction.y * r, direction.z * r)

    // Zoom-responsive scale: large and easy to spot from the default view,
    // smoothly shrinking as the camera approaches so a close-up look never
    // gets overwhelmed by the building. Eased gently (a slower alpha than
    // most of this file's other animations) so even a fast zoom scroll
    // never pops or jumps — it just glides to the new size.
    if (sizeGroup.current) {
      const distance = state.camera.position.distanceTo(outer.current.position)
      const targetSize = distanceToScale(distance, SIZE_NEAR, SIZE_FAR)
      currentSize.current = THREE.MathUtils.lerp(currentSize.current, targetSize, 1 - Math.pow(0.0012, delta))
      sizeGroup.current.scale.setScalar(currentSize.current)
    }

    // Gentle hover/selected highlight: a small scale bump plus a glowing
    // ring underneath, independent of the (one-shot) construction animation
    // above — never leaves a permanent mark on the building's size/position.
    hoverAmount.current = THREE.MathUtils.lerp(hoverAmount.current, active ? 1 : 0, 1 - Math.pow(0.001, delta))
    if (highlightGroup.current) {
      const s = 1 + hoverAmount.current * 0.08
      highlightGroup.current.scale.setScalar(s)
    }
    if (hoverRing.current && hoverMaterial.current) {
      hoverRing.current.scale.setScalar(0.05 + hoverAmount.current * 0.008)
      hoverMaterial.current.opacity = hoverAmount.current * 0.55
    }

    if (settled.current || !buildGroup.current) return
    const elapsed = Date.now() - dataCenter.builtAt
    const t = THREE.MathUtils.clamp(elapsed / BUILD_DURATION_MS, 0, 1)
    const eased = easeOutBack(t)

    buildGroup.current.position.y = THREE.MathUtils.lerp(-0.05, 0, Math.min(1, t * 1.3))
    buildGroup.current.scale.setScalar(Math.max(0.001, eased))

    if (glowRing.current && glowMaterial.current) {
      glowRing.current.scale.setScalar(0.03 + t * 0.2)
      glowMaterial.current.opacity = (1 - t) * 0.8
    }

    if (t >= 1) settled.current = true
  })

  return (
    <group ref={outer} quaternion={quaternion}>
      {/* Static size multiplier — makes the whole building (and its hit area,
          hover ring, construction ring and info panel, all nested inside)
          bigger at once without touching any of their individual numbers. */}
      <group ref={sizeGroup} scale={SIZE_FAR}>
      <group ref={buildGroup} scale={0.001}>
        <group
          ref={highlightGroup}
          onPointerOver={(e) => {
            e.stopPropagation()
            setHovered(true)
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            setHovered(false)
            document.body.style.cursor = 'auto'
          }}
          onClick={(e) => {
            e.stopPropagation()
            onTogglePin(pinned ? null : dataCenter.id)
          }}
        >
          {/* Generously sized invisible hit area — easier to hover/tap than the
              thin real geometry, on both desktop and touch. */}
          <mesh position={[0, 0.035, 0]} visible={false}>
            <boxGeometry args={[0.13, 0.11, 0.13]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>

          {/* Foundation pad — grounds the building and hides the join with the terrain. */}
        <mesh position={[0, 0.004, 0]}>
          <boxGeometry args={[0.075, 0.008, 0.06]} />
          <meshStandardMaterial color="#5b6472" roughness={0.9} />
        </mesh>

        {/* Main tower: windowed sides. */}
        <mesh position={[-0.008, 0.032, 0]} material={windowMaterial}>
          <boxGeometry args={[0.042, 0.056, 0.042]} />
        </mesh>
        {/* Plain roof cap so the window texture doesn't tile across the top face. */}
        <mesh position={[-0.008, 0.061, 0]}>
          <boxGeometry args={[0.044, 0.004, 0.044]} />
          <meshStandardMaterial color="#3a4356" roughness={0.7} metalness={0.2} />
        </mesh>

        {/* Annex: smaller secondary block beside the tower. */}
        <mesh position={[0.024, 0.017, 0.006]} material={windowMaterial}>
          <boxGeometry args={[0.026, 0.03, 0.032]} />
        </mesh>
        <mesh position={[0.024, 0.033, 0.006]}>
          <boxGeometry args={[0.028, 0.003, 0.034]} />
          <meshStandardMaterial color="#3a4356" roughness={0.7} metalness={0.2} />
        </mesh>

        {/* Entrance canopy on the tower's front face. */}
        <mesh position={[-0.008, 0.01, 0.022]}>
          <boxGeometry args={[0.018, 0.012, 0.004]} />
          <meshStandardMaterial color="#171d29" roughness={0.6} />
        </mesh>
        <mesh position={[-0.008, 0.017, 0.024]}>
          <boxGeometry args={[0.022, 0.002, 0.008]} />
          <meshStandardMaterial color="#8fa0b8" roughness={0.5} metalness={0.4} />
        </mesh>

        {/* Rooftop cooling/venting equipment. */}
        <mesh position={[-0.018, 0.067, -0.01]}>
          <boxGeometry args={[0.014, 0.008, 0.014]} />
          <meshStandardMaterial color="#7c8899" roughness={0.6} metalness={0.3} />
        </mesh>
        <mesh position={[0.002, 0.066, -0.01]}>
          <cylinderGeometry args={[0.006, 0.006, 0.006, 10]} />
          <meshStandardMaterial color="#8fa0b8" roughness={0.55} metalness={0.35} />
        </mesh>
        <mesh position={[-0.008, 0.075, 0.012]}>
          <cylinderGeometry args={[0.003, 0.004, 0.01, 8]} />
          <meshStandardMaterial color="#5b6472" roughness={0.7} />
        </mesh>
        {/* Antenna / comms mast. */}
        <mesh position={[0.006, 0.078, 0.014]}>
          <cylinderGeometry args={[0.0012, 0.0012, 0.022, 6]} />
          <meshStandardMaterial color="#c3ccd8" roughness={0.4} metalness={0.5} />
        </mesh>
        <mesh position={[0.006, 0.089, 0.014]}>
          <sphereGeometry args={[0.0025, 8, 8]} />
          <meshStandardMaterial color="#ff8a65" emissive="#ff8a65" emissiveIntensity={0.9} toneMapped={false} />
        </mesh>

        {/* Vertical service pipe running down the tower's side. */}
        <mesh position={[-0.029, 0.04, 0.015]}>
          <cylinderGeometry args={[0.0018, 0.0018, 0.05, 6]} />
          <meshStandardMaterial color="#6b7889" roughness={0.6} metalness={0.3} />
        </mesh>

        {/* Small beacon lights along the roofline — cheap emissive accents, no real lights. */}
        <mesh position={[0.011, 0.061, -0.018]}>
          <sphereGeometry args={[0.0016, 6, 6]} />
          <meshStandardMaterial color="#8fe1ff" emissive="#8fe1ff" emissiveIntensity={1.2} toneMapped={false} />
        </mesh>
        <mesh position={[-0.026, 0.061, 0.017]}>
          <sphereGeometry args={[0.0016, 6, 6]} />
          <meshStandardMaterial color="#8fe1ff" emissive="#8fe1ff" emissiveIntensity={1.2} toneMapped={false} />
        </mesh>
        </group>
      </group>

      {/* Soft white ring that fades in on hover/tap — makes it obvious which
          building the info panel belongs to, without altering its position. */}
      <mesh ref={hoverRing} position={[0, 0.0012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.85, 1, 32]} />
        <meshBasicMaterial ref={hoverMaterial} color="#ffffff" transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* Construction glow ring, expands and fades as the building settles. */}
      <mesh ref={glowRing} position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.7, 1, 32]} />
        <meshBasicMaterial ref={glowMaterial} color="#8fe1ff" transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>

      {active && (
        <Html
          position={[0, 0.095, 0]}
          center
          distanceFactor={1.8}
          style={{ pointerEvents: pinned ? 'auto' : 'none' }}
          zIndexRange={[30, 0]}
        >
          <DataCenterInfoCard dataCenter={dataCenter} pinned={pinned} onClose={() => onTogglePin(null)} />
        </Html>
      )}
      </group>
    </group>
  )
}

/**
 * Small floating stat card shown on hover/tap of a data centre, using the
 * exact cost/income/water/pollution values recorded on this building when
 * it was constructed — not shared or generic placeholder numbers.
 */
function DataCenterInfoCard({
  dataCenter,
  pinned,
  onClose,
}: {
  dataCenter: DataCenterInstance
  pinned: boolean
  onClose: () => void
}) {
  const continent = continentsById[dataCenter.continentId]
  return (
    <div
      className="w-[190px] select-none rounded-2xl border border-white/15 bg-space-900/92 p-3 text-white shadow-2xl backdrop-blur-xl"
      style={{ boxShadow: `0 10px 30px rgba(0,0,0,0.5), 0 0 0 1px ${continent.color}33` }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-white/90">
          <Building2 className="h-3.5 w-3.5" style={{ color: continent.color }} />
          AI Data Centre
        </div>
        {pinned && (
          <button
            onClick={onClose}
            className="rounded-full px-1.5 text-[13px] leading-none text-white/50 hover:text-white"
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>

      <div className="mt-1 text-[11px] font-semibold" style={{ color: continent.color }}>
        {continent.name}
      </div>

      <div className="mt-2 space-y-1.5 text-[12px] font-semibold">
        <div className="flex items-center gap-1.5">
          <Wallet className="h-3.5 w-3.5 shrink-0 text-[#ffc857]" />
          <span className="text-white/90">Income: +${Math.round(dataCenter.income)}/min</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Droplets className="h-3.5 w-3.5 shrink-0 text-[#5ab8ff]" />
          <span className="text-white/90">Water Usage: -{dataCenter.waterImpact}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CloudFog className="h-3.5 w-3.5 shrink-0 text-[#b8a25a]" />
          <span className="text-white/90">Pollution: +{dataCenter.pollutionImpact}%</span>
        </div>
      </div>

      <div className="mt-2 border-t border-white/10 pt-1.5 text-[10.5px] font-medium text-white/55">
        Construction Cost: ${dataCenter.cost.toLocaleString()}
      </div>
    </div>
  )
}
