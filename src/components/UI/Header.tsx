import { Sparkles } from 'lucide-react'
import { motion } from 'motion/react'

export function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="pointer-events-none absolute left-4 top-4 z-20 md:left-8 md:top-7"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-mint-400/15 ring-1 ring-mint-400/40 shadow-glow-mint md:h-12 md:w-12">
          <img src="/favicon.svg" alt="" className="h-8 w-8" />
        </div>
        <div>
          <h1 className="font-display text-[26px] font-extrabold leading-none tracking-tight text-white md:text-4xl">
            Artificial <span className="text-mint-400">Earth</span>
          </h1>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/60 md:text-[13px]">
            <Sparkles className="h-3.5 w-3.5 text-mint-400" />
            Explore how AI is changing our world
          </p>
        </div>
      </div>
    </motion.header>
  )
}
