import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { AnimatePresence } from 'motion/react'
import * as THREE from 'three'
import { continents, continentsById } from './data/continents'
import type { ContinentId } from './types/continent'
import { latLngToVector3 } from './utils/geo'
import { SpaceBackground } from './components/Background/SpaceBackground'
import { Earth } from './components/Globe/Earth'
import { ContinentMarker } from './components/Globe/ContinentMarker'
import { GlobeControls } from './components/Globe/GlobeControls'
import { Header } from './components/UI/Header'
import { InstructionCard } from './components/UI/InstructionCard'
import { ContinentPanel } from './components/UI/ContinentPanel'
import { ContinentNavigation } from './components/UI/ContinentNavigation'

/** True below the `lg` breakpoint, where the panel becomes a bottom sheet. */
function useCompactLayout() {
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 1023px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const onChange = (e: MediaQueryListEvent) => setCompact(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return compact
}

export default function App() {
  const [selectedId, setSelectedId] = useState<ContinentId | null>(null)
  const [hoveredId, setHoveredId] = useState<ContinentId | null>(null)

  const selected = selectedId ? continentsById[selectedId] : null
  const compact = useCompactLayout()

  // Direction the camera should fly to when a continent is chosen.
  const focusDirection = useMemo<THREE.Vector3 | null>(() => {
    if (!selected) return null
    return latLngToVector3(selected.marker, 1)
  }, [selected])

  const handleSelect = useCallback((id: ContinentId) => {
    setSelectedId((current) => (current === id ? null : id))
  }, [])

  // Escape closes the panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="relative h-full w-full overflow-hidden font-body">
      <SpaceBackground />

      {/* On compact screens the info panel is a bottom sheet, so the canvas
          shrinks to keep the focused continent visible above it. */}
      <Canvas
        className="absolute! inset-x-0 top-0 transition-[height] duration-300"
        style={{
          // R3F sets height:100% inline, so height (not bottom) must be overridden.
          height: compact ? (selected ? 'calc(48vh - 128px)' : 'calc(100% - 112px)') : 'calc(100% - 124px)',
        }}
        camera={{ position: [0, 0.5, 3.55], fov: 42, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={1.1} />
          <directionalLight position={[5, 3, 5]} intensity={1.6} />
          <directionalLight position={[-4, -2, -3]} intensity={0.35} color="#8fb8ff" />
          <Stars radius={60} depth={40} count={2200} factor={3} saturation={0} fade speed={0.4} />

          <Earth>
            {continents.map((c) => (
              <ContinentMarker
                key={c.id}
                continent={c}
                selected={c.id === selectedId}
                onSelect={handleSelect}
                onHover={setHoveredId}
              />
            ))}
          </Earth>

          <GlobeControls focusDirection={focusDirection} autoRotate={!selected && !hoveredId} />
        </Suspense>
      </Canvas>

      <Header />

      <AnimatePresence>{!selected && <InstructionCard key="hint" />}</AnimatePresence>

      <ContinentPanel continent={selected} onClose={() => setSelectedId(null)} />

      <ContinentNavigation continents={continents} selectedId={selectedId} onSelect={handleSelect} />
    </div>
  )
}
