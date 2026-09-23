import { AlertTriangle, Lightbulb, Sparkles } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import type { Continent } from '../../types/continent'
import { factsForIds } from '../../utils/dataTransform'
import { continentSilhouettes } from '../../utils/continentShapes'
import { FactCard } from './FactCard'

interface Props {
  continent: Continent
}

/**
 * Permanently visible information panel — a medium-sized side card on
 * desktop, a bottom sheet on compact screens. It never closes; picking a
 * different continent crossfades its content. One reusable component driven
 * entirely by continent data.
 */
export function ContinentPanel({ continent }: Props) {
  return (
    <AnimatePresence mode="wait">
      <motion.aside
        key={continent.id}
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 6 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-x-3 bottom-[172px] z-30 max-h-[44vh] rounded-3xl border border-white/12 bg-space-900/85 shadow-2xl backdrop-blur-xl sm:inset-x-4 lg:inset-x-auto lg:bottom-auto lg:right-8 lg:top-28 lg:max-h-[calc(100vh-17.5rem)] lg:w-[380px]"
        style={{ boxShadow: `0 20px 60px rgba(0,0,0,0.45), 0 0 0 1px ${continent.color}22` }}
        aria-label={`${continent.name} information`}
      >
        {/* Colour bar */}
        <div
          className="h-1.5 w-full rounded-t-3xl"
          style={{ background: `linear-gradient(90deg, ${continent.color}, ${continent.color}55)` }}
        />

        <div className="panel-scroll max-h-[calc(44vh-6px)] overflow-y-auto p-5 lg:max-h-[calc(100vh-17.5rem-6px)]">
          {/* Title row */}
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
              style={{ background: `${continent.color}22`, boxShadow: `0 0 20px ${continent.color}44` }}
            >
              <svg viewBox="0 0 100 100" className="h-8 w-8">
                <path d={continentSilhouettes[continent.id]} fill={continent.color} />
              </svg>
            </div>
            <h2 className="font-display text-xl font-extrabold leading-tight text-white md:text-2xl">
              {continent.name}
            </h2>
          </div>

          <p className="mt-3.5 text-[14px] leading-relaxed text-white/85 md:text-[15px]">
            {continent.description}
          </p>

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
