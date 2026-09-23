import { Building2, CloudFog, Droplets, Wallet } from 'lucide-react'

interface Props {
  money: number
  water: number
  pollution: number
  dataCenterCount: number
}

/**
 * Polished, tablet-style stat readout for the tycoon layer. Sits in a
 * shared middle-left column with `InvestmentButton` (see `App.tsx`) so the
 * two never overlap regardless of exact sizes — the flex layout spaces them
 * automatically instead of relying on fixed pixel offsets.
 */
export function GameHUD({ money, water, pollution, dataCenterCount }: Props) {
  return (
    <div className="w-[196px] rounded-3xl border border-white/15 bg-space-900/85 p-3.5 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center gap-1.5 border-b border-white/10 pb-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/50">
        <span className="h-1.5 w-1.5 rounded-full bg-[#90ee90] shadow-[0_0_8px_#90ee90]" />
        Mission Status
      </div>

      <div className="mt-2.5 space-y-2.5">
        <Row icon={Wallet} label="Money" value={`$${Math.floor(money).toLocaleString()}`} color="#ffc857" />
        <Row icon={Droplets} label="Water" value={`${Math.round(water)}%`} color="#5ab8ff" percent={water} />
        <Row icon={CloudFog} label="Pollution" value={`${Math.round(pollution)}%`} color="#b8a25a" percent={pollution} />
        <Row icon={Building2} label="Data Centres" value={`${dataCenterCount}`} color="#90ee90" />
      </div>
    </div>
  )
}

function Row({
  icon: Icon,
  label,
  value,
  color,
  percent,
}: {
  icon: typeof Wallet
  label: string
  value: string
  color: string
  /** When given, renders a small progress bar under the label (0-100). */
  percent?: number
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-white/70">
          <Icon className="h-4 w-4 shrink-0" style={{ color }} />
          {label}
        </div>
        <div className="text-[13.5px] font-extrabold text-white">{value}</div>
      </div>
      {percent !== undefined && (
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-[width] duration-500 ease-out"
            style={{ width: `${Math.max(0, Math.min(100, percent))}%`, background: color, boxShadow: `0 0 8px ${color}88` }}
          />
        </div>
      )}
    </div>
  )
}
