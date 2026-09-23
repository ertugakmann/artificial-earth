import { motion, AnimatePresence } from 'motion/react'
import { Droplets } from 'lucide-react'

interface Props {
  visible: boolean
  dataCenterCount: number
  onRestart: () => void
}

/** Friendly, educational game-over screen shown when water reaches 0%. */
export function GameOverModal({ visible, dataCenterCount, onRestart }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="mx-4 flex max-w-sm flex-col items-center rounded-3xl border border-white/15 bg-space-900/95 p-6 text-center text-white shadow-2xl"
          >
            <Droplets className="h-10 w-10 text-amber-300" />
            <h2 className="mt-3 font-display text-xl font-extrabold">🌍 Earth Has Dried Up</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-white/80">
              You built {dataCenterCount} data centre{dataCenterCount === 1 ? '' : 's'}, but they used up all of
              Earth's water for cooling. Data centres earn money, but they need water and clean air too — try
              balancing growth with the planet next time!
            </p>
            <button
              onClick={onRestart}
              className="mt-5 rounded-2xl bg-[#90ee90] px-6 py-2.5 text-[13px] font-extrabold text-space-950 transition hover:brightness-105"
            >
              Start Again
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
