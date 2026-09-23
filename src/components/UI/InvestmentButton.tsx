import { Tablet } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

interface Props {
  visible: boolean
  onClick: () => void
}

/**
 * Floating tablet-shaped button that appears on the left side when a random
 * investment opportunity is ready. Pulses with a soft white glow so it reads
 * as "a new opportunity has arrived" without being obnoxious.
 */
export function InvestmentButton({ visible, onClick }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, x: -30, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -30, scale: 0.8 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          onClick={onClick}
          className="animate-pulse flex flex-col items-center gap-1.5 self-start rounded-2xl border border-white/40 bg-space-900/90 px-4 py-4 text-white shadow-2xl backdrop-blur-xl"
          style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.25), 0 0 30px rgba(255,255,255,0.35)' }}
        >
          <Tablet className="h-7 w-7" />
          <span className="text-[11px] font-extrabold uppercase tracking-wide">Invest</span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
