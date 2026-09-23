import { AnimatePresence, motion } from 'motion/react'
import { CloudFog, Droplets, TrendingUp, Wallet } from 'lucide-react'
import type { Opportunity } from '../../types/game'
import { continentsById } from '../../data/continents'

interface Props {
  opportunity: Opportunity | null
  canAfford: boolean
  onAccept: () => void
  onDecline: () => void
}

/** Modal card presenting a random investment opportunity, Accept/Decline. */
export function InvestmentTablet({ opportunity, canAfford, onAccept, onDecline }: Props) {
  return (
    <AnimatePresence>
      {opportunity && (
        <motion.div
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 10 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mx-4 w-full max-w-sm rounded-3xl border border-white/15 bg-space-900/95 p-5 text-white shadow-2xl"
            style={{ boxShadow: `0 0 0 1px ${continentsById[opportunity.continentId].color}33, 0 20px 60px rgba(0,0,0,0.5)` }}
          >
            <div className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.18em]" style={{ color: continentsById[opportunity.continentId].color }}>
              New Investment Opportunity — {continentsById[opportunity.continentId].name}
            </div>
            <p className="mt-3 text-[14px] leading-relaxed text-white/90">{opportunity.text}</p>

            <div className="mt-4 grid grid-cols-2 gap-2 text-[13px] font-semibold">
              <StatLine icon={Wallet} color="#ffc857" label="Investment" value={`$${opportunity.cost.toLocaleString()}`} />
              <StatLine icon={TrendingUp} color="#90ee90" label="Income" value={`+$${opportunity.income}/min`} />
              <StatLine icon={Droplets} color="#5ab8ff" label="Water impact" value={`-${opportunity.waterImpact}%`} />
              <StatLine icon={CloudFog} color="#b8a25a" label="Pollution" value={`+${opportunity.pollutionImpact}%`} />
            </div>

            {!canAfford && (
              <p className="mt-3 text-[12px] font-semibold text-red-300">Not enough money for this one.</p>
            )}

            <div className="mt-5 flex gap-3">
              <button
                onClick={onDecline}
                className="flex-1 rounded-2xl border border-white/15 bg-white/5 py-2.5 text-[13px] font-bold text-white/80 transition hover:bg-white/10"
              >
                Decline
              </button>
              <button
                onClick={onAccept}
                disabled={!canAfford}
                className="flex-1 rounded-2xl bg-mint-500 py-2.5 text-[13px] font-extrabold text-space-950 transition disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: canAfford ? '#90ee90' : undefined }}
              >
                Accept
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function StatLine({
  icon: Icon,
  color,
  label,
  value,
}: {
  icon: typeof Wallet
  color: string
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-2">
      <Icon className="h-4 w-4 shrink-0" style={{ color }} />
      <div className="leading-tight">
        <div className="text-[10px] uppercase tracking-wide text-white/50">{label}</div>
        <div className="text-white">{value}</div>
      </div>
    </div>
  )
}
