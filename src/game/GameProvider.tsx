import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ContinentId } from '../types/continent'
import type { DataCenterInstance, GameState, Opportunity } from '../types/game'
import { generateOpportunity, randomContinentId } from './investmentTemplates'
import { pickBuildSite } from './placement'

const STARTING_MONEY = 10000
const STARTING_WATER = 100
const STARTING_POLLUTION = 8

function initialState(): GameState {
  return {
    money: STARTING_MONEY,
    water: STARTING_WATER,
    pollution: STARTING_POLLUTION,
    dataCenters: [],
    pendingOpportunity: null,
    gameOver: false,
  }
}

interface GameContextValue extends GameState {
  acceptOpportunity: () => void
  declineOpportunity: () => void
  restart: () => void
}

const GameContext = createContext<GameContextValue | null>(null)

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within a GameProvider')
  return ctx
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(initialState)
  const opportunityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Money/water/pollution tick, once per second.
  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        if (prev.gameOver) return prev
        const count = prev.dataCenters.length
        const incomePerSecond = prev.dataCenters.reduce((sum, d) => sum + d.income, 0) / 60
        const passiveWaterDrain = count * 0.06
        const passivePollutionRise = count * 0.1

        const water = Math.max(0, Math.min(100, prev.water - passiveWaterDrain))
        const pollution = Math.max(0, Math.min(100, prev.pollution + passivePollutionRise))

        return {
          ...prev,
          money: prev.money + incomePerSecond,
          water,
          pollution,
          gameOver: water <= 0,
        }
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Random investment opportunities every 10-25s, while none is pending.
  useEffect(() => {
    function scheduleNext() {
      const delay = 10000 + Math.random() * 15000
      opportunityTimer.current = setTimeout(() => {
        setState((prev) => {
          if (prev.gameOver || prev.pendingOpportunity) return prev
          const continentId = randomContinentId()
          const opportunity = generateOpportunity(prev.money, continentId)
          if (!opportunity) return prev
          return { ...prev, pendingOpportunity: opportunity }
        })
        scheduleNext()
      }, delay)
    }
    scheduleNext()
    return () => {
      if (opportunityTimer.current) clearTimeout(opportunityTimer.current)
    }
  }, [])

  const acceptOpportunity = useCallback(() => {
    setState((prev) => {
      const opp = prev.pendingOpportunity
      if (!opp || opp.cost > prev.money) return { ...prev, pendingOpportunity: null }

      const site = pickBuildSite(opp.continentId, prev.dataCenters)
      const newCenter: DataCenterInstance = {
        id: `dc-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
        continentId: opp.continentId,
        lat: site.lat,
        lng: site.lng,
        income: opp.income,
        cost: opp.cost,
        waterImpact: opp.waterImpact,
        pollutionImpact: opp.pollutionImpact,
        builtAt: Date.now(),
      }

      const water = Math.max(0, prev.water - opp.waterImpact)
      const pollution = Math.min(100, prev.pollution + opp.pollutionImpact)

      return {
        ...prev,
        money: prev.money - opp.cost,
        water,
        pollution,
        dataCenters: [...prev.dataCenters, newCenter],
        pendingOpportunity: null,
        gameOver: water <= 0,
      }
    })
  }, [])

  const declineOpportunity = useCallback(() => {
    setState((prev) => ({ ...prev, pendingOpportunity: null }))
  }, [])

  const restart = useCallback(() => {
    setState(initialState())
  }, [])

  return (
    <GameContext.Provider value={{ ...state, acceptOpportunity, declineOpportunity, restart }}>
      {children}
    </GameContext.Provider>
  )
}

export type { ContinentId, Opportunity }
