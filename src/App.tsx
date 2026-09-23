import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import * as THREE from 'three'
import { continents, continentsById } from './data/continents'
import type { ContinentId } from './types/continent'
import { latLngToVector3 } from './utils/geo'
import { SpaceBackground } from './components/Background/SpaceBackground'
import { Earth } from './components/Globe/Earth'
import { ContinentLand } from './components/Globe/ContinentLand'
import { ContinentMarker } from './components/Globe/ContinentMarker'
import { GlobeControls } from './components/Globe/GlobeControls'
import { Header } from './components/UI/Header'
import { ContinentPanel } from './components/UI/ContinentPanel'
import { ContinentNavigation } from './components/UI/ContinentNavigation'
import { GameProvider, useGame } from './game/GameProvider'
import { DataCenters } from './components/Globe/DataCenters'
import { DataCenterNetwork } from './components/Globe/DataCenterNetwork'
import { Landmark } from './components/Globe/Landmark'
import { landmarks } from './data/landmarks'
import { GameHUD } from './components/UI/GameHUD'
import { InvestmentButton } from './components/UI/InvestmentButton'
import { InvestmentTablet } from './components/UI/InvestmentTablet'
import { GameOverModal } from './components/UI/GameOverModal'

/** Shown by default, before the user picks a different continent. */
const DEFAULT_CONTINENT: ContinentId = 'europe'

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
  return (
    <GameProvider>
      <AppShell />
    </GameProvider>
  )
}

function AppShell() {
  // A continent is always selected so the information panel stays
  // permanently visible; picking a different continent just swaps its content.
  const [selectedId, setSelectedId] = useState<ContinentId>(DEFAULT_CONTINENT)
  const [hoveredId, setHoveredId] = useState<ContinentId | null>(null)
  const [tabletOpen, setTabletOpen] = useState(false)
  const [pinnedDataCenterId, setPinnedDataCenterId] = useState<string | null>(null)

  const selected = continentsById[selectedId]
  const compact = useCompactLayout()
  const game = useGame()

  // Direction the camera should fly to when a continent is chosen.
  const focusDirection = useMemo<THREE.Vector3>(
    () => latLngToVector3(selected.marker, 1),
    [selected],
  )

  const handleSelect = useCallback((id: ContinentId) => {
    setSelectedId(id)
  }, [])

  const handleAccept = useCallback(() => {
    if (game.pendingOpportunity) {
      handleSelect(game.pendingOpportunity.continentId)
    }
    game.acceptOpportunity()
    setTabletOpen(false)
  }, [game, handleSelect])

  const handleDecline = useCallback(() => {
    game.declineOpportunity()
    setTabletOpen(false)
  }, [game])

  // How visually "dead" the planet should look: a smooth blend of how far
  // water has fallen and how high pollution has climbed, driving a gradual
  // colour shift on every continent (see `ContinentLand`'s `decline` prop).
  const environmentalDecline = Math.max(
    0,
    Math.min(1, ((100 - game.water) / 100) * 0.5 + (game.pollution / 100) * 0.5),
  )

  return (
    <div className="relative h-full w-full overflow-hidden font-body">
      <SpaceBackground />

      {/* The info panel is always visible: a bottom sheet on compact screens,
          a side card on wide ones. The canvas leaves room for it either way. */}
      <Canvas
        className="absolute! inset-x-0 top-0 transition-[height] duration-300"
        style={{
          // R3F sets height:100% inline, so height (not bottom) must be overridden.
          height: compact ? 'calc(48vh - 172px)' : 'calc(100% - 124px)',
        }}
        camera={{ position: [0, 0.5, 3.55], fov: 42, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        onPointerMissed={() => setPinnedDataCenterId(null)}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={1.1} />
          <directionalLight position={[5, 3, 5]} intensity={1.6} />
          <directionalLight position={[-4, -2, -3]} intensity={0.35} color="#8fb8ff" />
          <Stars radius={60} depth={40} count={2200} factor={3} saturation={0} fade speed={0.4} />

          <Earth water={game.water} pollution={game.pollution}>
            {continents.map((c) => (
              <ContinentLand
                key={c.id}
                continent={c}
                elevated={c.id === selectedId}
                decline={environmentalDecline}
              />
            ))}
            {landmarks.map((l) => (
              <Landmark key={l.id} landmark={l} elevatedContinentId={selectedId} />
            ))}
            <DataCenterNetwork dataCenters={game.dataCenters} />
            <DataCenters
              dataCenters={game.dataCenters}
              elevatedContinentId={selectedId}
              pinnedId={pinnedDataCenterId}
              onTogglePin={setPinnedDataCenterId}
            />
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

          <GlobeControls focusDirection={focusDirection} autoRotate={!hoveredId} />
        </Suspense>
      </Canvas>

      <Header />

      {/* Shared middle-left column: the HUD and the investment button stack
          with a natural gap, so a pulsing invest button never collides with
          the stats card above it regardless of exact sizes. */}
      <div className="absolute left-3 top-1/2 z-30 flex -translate-y-1/2 flex-col items-start gap-4 sm:left-4">
        <GameHUD
          money={game.money}
          water={game.water}
          pollution={game.pollution}
          dataCenterCount={game.dataCenters.length}
        />

        <InvestmentButton
          visible={!!game.pendingOpportunity && !tabletOpen && !game.gameOver}
          onClick={() => setTabletOpen(true)}
        />
      </div>

      <ContinentPanel continent={selected} />

      <ContinentNavigation continents={continents} selectedId={selectedId} onSelect={handleSelect} />

      <InvestmentTablet
        opportunity={tabletOpen ? game.pendingOpportunity : null}
        canAfford={!!game.pendingOpportunity && game.pendingOpportunity.cost <= game.money}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />

      <GameOverModal visible={game.gameOver} dataCenterCount={game.dataCenters.length} onRestart={game.restart} />
    </div>
  )
}
