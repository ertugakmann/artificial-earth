import { useMemo } from 'react'

interface Star {
  x: number
  y: number
  size: number
  delay: number
  duration: number
}

/**
 * DOM-level space backdrop: dark navy gradient, soft nebula glows and a
 * scattering of twinkling stars. Sits behind the WebGL canvas.
 */
export function SpaceBackground({ count = 110 }: { count?: number }) {
  const stars = useMemo<Star[]>(() => {
    // Deterministic pseudo-random so the sky is the same on every render.
    let seed = 42
    const rand = () => {
      seed = (seed * 16807) % 2147483647
      return seed / 2147483647
    }
    return Array.from({ length: count }, () => ({
      x: rand() * 100,
      y: rand() * 100,
      size: 1 + rand() * 2,
      delay: rand() * 6,
      duration: 3 + rand() * 4,
    }))
  }, [count])

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at 50% 55%, #1a2a6c 0%, #0d1445 35%, #070b28 65%, #04061a 100%)',
      }}
    >
      {/* Nebula glows */}
      <div
        className="absolute -left-40 top-10 h-[520px] w-[520px] rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, #3b5bdb55, transparent 65%)' }}
      />
      <div
        className="absolute -right-32 bottom-0 h-[560px] w-[560px] rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, #2dd4bf33, transparent 65%)' }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: 'radial-gradient(circle, #5ab8ff22, transparent 60%)' }}
      />

      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            opacity: 0.7,
            animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.25; transform: scale(0.8); }
          50% { opacity: 0.95; transform: scale(1.25); }
        }
      `}</style>
    </div>
  )
}
