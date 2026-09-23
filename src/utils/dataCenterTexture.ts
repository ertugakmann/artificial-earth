import * as THREE from 'three'

let cachedTexture: THREE.CanvasTexture | null = null
let cachedMaterial: THREE.MeshStandardMaterial | null = null

/**
 * Small tileable canvas texture of a data-centre wall panel: a grid of
 * windows, some lit, some dark, on a dark panel background. Drawn once and
 * cached — every data centre in the game shares this single texture/material
 * pair (cloned only where a different tiling density is needed), rather than
 * building real per-window geometry or a unique texture per building. This
 * keeps window detail cheap no matter how many data centres get built.
 */
function createWindowCanvas(): HTMLCanvasElement {
  const cols = 6
  const rows = 8
  const cell = 24
  const canvas = document.createElement('canvas')
  canvas.width = cols * cell
  canvas.height = rows * cell
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#232f42'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Deterministic pseudo-random lit/unlit pattern so it looks organic but
  // never changes between renders (no Math.random flicker on re-mount).
  let seed = 1337
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return (seed % 1000) / 1000
  }

  const margin = 5
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cell + margin
      const y = r * cell + margin
      const w = cell - margin * 2
      const h = cell - margin * 2
      const lit = rand() > 0.4
      ctx.fillStyle = lit ? '#bfeeff' : '#141b28'
      ctx.fillRect(x, y, w, h)
      if (lit) {
        ctx.fillStyle = 'rgba(191,238,255,0.35)'
        ctx.fillRect(x - 2, y - 2, w + 4, h + 4)
      }
    }
  }

  return canvas
}

export function createWindowTexture(): THREE.CanvasTexture {
  if (cachedTexture) return cachedTexture
  const canvas = createWindowCanvas()
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(2, 3)
  texture.colorSpace = THREE.SRGBColorSpace
  cachedTexture = texture
  return texture
}

/** Shared material for every data-centre's windowed walls — one instance, reused everywhere. */
export function getWindowMaterial(): THREE.MeshStandardMaterial {
  if (cachedMaterial) return cachedMaterial
  const texture = createWindowTexture()
  cachedMaterial = new THREE.MeshStandardMaterial({
    map: texture,
    emissiveMap: texture,
    emissive: new THREE.Color('#8fe1ff'),
    emissiveIntensity: 0.55,
    roughness: 0.55,
    metalness: 0.25,
  })
  return cachedMaterial
}
