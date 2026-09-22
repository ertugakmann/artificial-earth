import { AlertTriangle, Lightbulb, Sparkles, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import type { Continent } from '../../types/continent'
import { factsForIds } from '../../utils/dataTransform'
import { continentSilhouettes } from '../../utils/continentShapes'
import { FactCard } from './FactCard'

interface Props {
  continent: Continent | null
  onClose: () => void
}

/**
 * Floating information panel. Right-hand card on desktop, bottom sheet on
 * small screens. One reusable component driven entirely by continent data.
 */
export function ContinentPanel({ continent, onClose }: Props) {
  return (
    <AnimatePresence mode="wait">
      {continent && (
        <motion.aside
          key={continent.id}
          initial={{ opacity: 0, scale: 0.94, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-x-3 bottom-[128px] z-30 max-h-[52vh] rounded-3xl border border-white/12 bg-space-900/85 shadow-2xl backdrop-blur-xl lg:inset-x-auto lg:bottom-auto lg:right-8 lg:top-28 lg:max-h-[calc(100vh-17.5rem)] lg:w-[400px]"
          style={{ boxShadow: `0 20px 60px rgba(0,0,0,0.45), 0 0 0 1px ${continent.color}22` }}
          aria-label={`${continent.name} information`}
        >
          {/* Colour bar */}
          <div
            className="h-1.5 w-full rounded-t-3xl"
            style={{ background: `linear-gradient(90deg, ${continent.color}, ${continent.color}55)` }}
          />

          <div className="panel-scroll max-h-[calc(52vh-6px)] overflow-y-auto p-5 lg:max-h-[calc(100vh-17.5rem-6px)]">
            {/* Title row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                  style={{ background: `${continent.color}22`, boxShadow: `0 0 20px ${continent.color}44` }}
                >
                  <svg viewBox="0 0 100 100" className="h-9 w-9">
                    <path d={continentSilhouettes[continent.id]} fill={continent.color} />
                  </svg>
                </div>
                <h2 className="font-display text-2xl font-extrabold leading-tight text-white">
                  {continent.name}
                </h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/8 text-white/70 transition hover:bg-white/15 hover:text-white"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <p className="mt-4 text-[15px] leading-relaxed text-white/85">{continent.description}</p>

            <Section icon={Sparkles} title="The Good" color="#90ee90" items={continent.good} />
            <Section icon={AlertTriangle} title="The Challenges" color="#ffb340" items={continent.challenges} />

            <div className="mt-5">
              <h3 className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.18em]" style={{ color: continent.color }}>
                <Lightbulb className="h-4 w-4" />
                Did you know?
              </h3>
              {continent.factIds.length > 0 ? (
                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  {factsForIds(continent.factIds).map((fact) => (
                    <FactCard key={fact.id} fact={fact} accent={continent.color} />
                  ))}
                </div>
              ) : (
                <p className="mt-2 rounded-2xl border border-dashed border-white/15 p-3 text-[13px] leading-snug text-white/55">
                  {continent.dataNote ?? 'No numbers for this continent yet.'}
                </p>
              )}
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

function Section({
  icon: Icon,
  title,
  color,
  items,
}: {
  icon: typeof Sparkles
  title: string
  color: string
  items: string[]
}) {
  return (
    <div className="mt-5">
      <h3 className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.18em]" style={{ color }}>
        <Icon className="h-4 w-4" />
        {title}
      </h3>
      <ul className="mt-2.5 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-[14px] leading-snug text-white/85">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
