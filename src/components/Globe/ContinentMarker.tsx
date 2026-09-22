import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { Continent } from '../../types/continent'
import { latLngToVector3 } from '../../utils/geo'
import { EARTH_RADIUS } from './Earth'

const MINT = '#90ee90'

interface Props {
  continent: Continent
  selected: boolean
  onSelect: (id: Continent['id']) => void
  onHover: (id: Continent['id'] | null) => void
}

/**
 * A glowing light-green marker sitting on the surface of the globe.
 * Shows the continent name on hover and highlights when selected.
 */
export function ContinentMarker({ continent, selected, onSelect, onHover }: Props) {
  const group = useRef<THREE.Group>(null)
  const ring = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const [facingCamera, setFacingCamera] = useState(true)

  const { position, quaternion } = useMemo(() => {
    const pos = latLngToVector3(continent.marker, EARTH_RADIUS * 1.012)
    const normal = pos.clone().normalize()
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal)
    return { position: pos, quaternion: q }
  }, [continent.marker])

  const accent = selected ? continent.color : MINT

  useFrame(({ clock, camera }, delta) => {
    if (!group.current || !ring.current) return

    // Hide the HTML label when the marker is on the far side of the globe.
    const worldPos = group.current.getWorldPosition(new THREE.Vector3())
    const normal = worldPos.clone().normalize()
    const toCamera = camera.position.clone().sub(worldPos).normalize()
    const facing = normal.dot(toCamera) > 0.12
    if (facing !== facingCamera) setFacingCamera(facing)
    const target = selected ? 1.35 : hovered ? 1.2 : 1
    group.current.scale.lerp(new THREE.Vector3(target, target, target), 1 - Math.pow(0.001, delta))

    // Gentle pulse on the halo ring so markers are easy to spot.
    const t = clock.getElapsedTime()
    const pulse = 1 + 0.18 * Math.sin(t * 2.2 + position.x * 3)
    ring.current.scale.setScalar(pulse)
    const mat = ring.current.material as THREE.MeshBasicMaterial
    mat.opacity = (selected ? 0.55 : 0.35) + 0.15 * Math.sin(t * 2.2 + position.x * 3)
  })

  return (
    <group position={position} quaternion={quaternion}>
      <group
        ref={group}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          onHover(continent.id)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          onHover(null)
          document.body.style.cursor = 'auto'
        }}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(continent.id)
        }}
      >
        {/* Core dot */}
        <mesh>
          <sphereGeometry args={[0.032, 24, 24]} />
          <meshBasicMaterial color={accent} toneMapped={false} />
        </mesh>

        {/* Soft glow */}
        <mesh>
          <sphereGeometry args={[0.06, 24, 24]} />
          <meshBasicMaterial
            color={accent}
            transparent
            opacity={0.28}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>

        {/* Pulsing halo ring, lying flat on the surface */}
        <mesh ref={ring} position={[0, 0, 0.002]}>
          <ringGeometry args={[0.07, 0.085, 48]} />
          <meshBasicMaterial
            color={accent}
            transparent
            side={THREE.DoubleSide}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>

        {/* Larger invisible hit area for easier clicking */}
        <mesh>
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>

      {(hovered || selected) && facingCamera && (
        <Html
          position={[0, 0.14, 0.04]}
          center
          distanceFactor={2.4}
          style={{ pointerEvents: 'none' }}
          zIndexRange={[10, 0]}
        >
          <div
            className="whitespace-nowrap rounded-full border px-4 py-1.5 text-[15px] font-bold tracking-wide text-white shadow-lg backdrop-blur-md"
            style={{
              background: 'rgba(10, 16, 48, 0.78)',
              borderColor: accent,
              boxShadow: `0 0 18px ${accent}66`,
            }}
          >
            {continent.name}
          </div>
        </Html>
      )}
    </group>
  )
}
