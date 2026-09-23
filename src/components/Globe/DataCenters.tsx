import type { ContinentId } from '../../types/continent'
import type { DataCenterInstance } from '../../types/game'
import { DataCenter } from './DataCenter'

interface Props {
  dataCenters: DataCenterInstance[]
  /** The continent currently raised (selected), so its data centres lift with it. */
  elevatedContinentId: ContinentId | null
  /** Id of the data centre whose info panel is pinned open (tapped/clicked), if any. */
  pinnedId: string | null
  onTogglePin: (id: string | null) => void
}

/** Renders every constructed data centre, each fixed to its build site. */
export function DataCenters({ dataCenters, elevatedContinentId, pinnedId, onTogglePin }: Props) {
  return (
    <>
      {dataCenters.map((dc) => (
        <DataCenter
          key={dc.id}
          dataCenter={dc}
          elevatedContinentId={elevatedContinentId}
          pinned={pinnedId === dc.id}
          onTogglePin={onTogglePin}
        />
      ))}
    </>
  )
}
