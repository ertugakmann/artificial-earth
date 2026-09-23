import type { ContinentId } from './continent'

export interface DataCenterInstance {
  id: string
  continentId: ContinentId
  lat: number
  lng: number
  /** Dollars earned per minute. */
  income: number
  /** What the player paid to build this specific data centre. */
  cost: number
  /** Percentage points of global water this data centre took on construction. */
  waterImpact: number
  /** Percentage points of global pollution this data centre added on construction. */
  pollutionImpact: number
  builtAt: number
}

export interface Opportunity {
  id: string
  continentId: ContinentId
  text: string
  cost: number
  /** Dollars per minute. */
  income: number
  /** Percentage points of water removed immediately on accept. */
  waterImpact: number
  /** Percentage points of pollution added immediately on accept. */
  pollutionImpact: number
}

export interface GameState {
  money: number
  water: number
  pollution: number
  dataCenters: DataCenterInstance[]
  pendingOpportunity: Opportunity | null
  gameOver: boolean
}
