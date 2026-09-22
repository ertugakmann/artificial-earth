import { Hand, MousePointerClick, ZoomIn } from 'lucide-react'
import { motion } from 'motion/react'

const tips = [
  { icon: Hand, text: 'Drag to spin the Earth' },
  { icon: ZoomIn, text: 'Scroll or pinch to zoom' },
  { icon: MousePointerClick, text: 'Click a glowing marker' },
]

/** Small floating hint shown while nothing is selected. */
export function InstructionCard() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="pointer-events-none absolute right-4 top-24 z-20 hidden rounded-3xl border border-white/10 bg-space-900/70 p-4 backdrop-blur-md md:right-8 md:top-8 md:block"
    >
      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-mint-400">
        How to explore
      </p>
      <ul className="space-y-2.5">
        {tips.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-3 text-sm font-semibold text-white/85">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/8 ring-1 ring-white/10">
              <Icon className="h-4 w-4 text-mint-300" />
            </span>
            {text}
          </li>
        ))}
      </ul>
    </motion.div>
  )
}
