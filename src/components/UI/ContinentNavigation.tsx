import { motion } from 'motion/react'
import type { Continent, ContinentId } from '../../types/continent'
import { continentSilhouettes } from '../../utils/continentShapes'

interface Props {
  continents: Continent[]
  selectedId: ContinentId | null
  onSelect: (id: ContinentId) => void
}

/** Bottom row of colourful continent cards; a second way to explore. */
export function ContinentNavigation({ continents, selectedId, onSelect }: Props) {
  return (
    <motion.nav
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
      aria-label="Choose a continent"
      className="absolute inset-x-0 bottom-0 z-20 pb-4 md:pb-6"
    >
      <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1 pt-4 md:justify-center md:px-8">
        {continents.map((c) => {
          const selected = c.id === selectedId
          return (
            <motion.button
              key={c.id}
              onClick={() => onSelect(c.id)}
              whileHover={{ y: -6, scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              animate={{ y: selected ? -8 : 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 26 }}
              aria-pressed={selected}
              className="group flex w-[116px] shrink-0 flex-col items-center gap-2 rounded-2xl border px-3 py-3 text-center backdrop-blur-md transition-colors md:w-[128px]"
              style={{
                background: selected ? `${c.color}26` : 'rgba(10, 16, 48, 0.6)',
                borderColor: selected ? c.color : 'rgba(255,255,255,0.1)',
                boxShadow: selected ? `0 0 26px ${c.color}66` : '0 6px 20px rgba(0,0,0,0.35)',
              }}
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                style={{ background: `${c.color}1f` }}
              >
                <svg viewBox="0 0 100 100" className="h-10 w-10 drop-shadow">
                  <path d={continentSilhouettes[c.id]} fill={c.color} />
                </svg>
              </span>
              <span className="text-[12px] font-bold leading-tight text-white/90 md:text-[13px]">
                {c.name}
              </span>
            </motion.button>
          )
        })}
      </div>
    </motion.nav>
  )
}
