import * as THREE from 'three'
import { allRings } from './continentShapes'
import { continents } from '../data/continents'
import { lngLatToXY } from './geo'

const WIDTH = 2048
const HEIGHT = 1024

/** Hex colour → slightly darker/lighter variant for strokes and depth. */
function shade(hex: string, amount: number): string {
  const c = new THREE.Color(hex)
  const hsl = { h: 0, s: 0, l: 0 }
  c.getHSL(hsl)
  c.setHSL(hsl.h, Math.min(1, hsl.s * 0.9), Math.max(0, Math.min(1, hsl.l + amount)))
  return `#${c.getHexString()}`
}

let cached: THREE.CanvasTexture | null = null

/**
 * Draw a stylised equirectangular Earth onto a canvas.
 * Continents are filled with the same colour as their navigation card, so the
 * globe and the UI read as one system. No image assets are needed, so the
 * project runs fully offline.
 */
export function createEarthTexture(): THREE.CanvasTexture {
  if (cached) return cached

  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')!

  // Ocean: deep blue with a lighter band near the equator.
  const ocean = ctx.createLinearGradient(0, 0, 0, HEIGHT)
  ocean.addColorStop(0, '#173a7a')
  ocean.addColorStop(0.5, '#2f6fd1')
  ocean.addColorStop(1, '#173a7a')
  ctx.fillStyle = ocean
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  // Faint graticule so rotation is easy to read.
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'
  ctx.lineWidth = 1.5
  for (let lng = -180; lng <= 180; lng += 30) {
    const { x } = lngLatToXY(lng, 0, WIDTH, HEIGHT)
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, HEIGHT)
    ctx.stroke()
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const { y } = lngLatToXY(0, lat, WIDTH, HEIGHT)
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(WIDTH, y)
    ctx.stroke()
  }

  const colourByContinent = new Map<string, string>()
  for (const c of continents) colourByContinent.set(c.naturalEarthName, c.color)

  ctx.lineJoin = 'round'
  for (const { continent, ring } of allRings()) {
    const base = colourByContinent.get(continent) ?? '#9aa7c2'
    ctx.beginPath()
    ring.forEach(([lng, lat], i) => {
      const { x, y } = lngLatToXY(lng, lat, WIDTH, HEIGHT)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.closePath()
    ctx.fillStyle = shade(base, -0.06)
    ctx.fill()
    ctx.strokeStyle = shade(base, -0.22)
    ctx.lineWidth = 2
    ctx.stroke()
  }

  // Soft polar caps so the top and bottom of the sphere look finished.
  const capTop = ctx.createLinearGradient(0, 0, 0, 40)
  capTop.addColorStop(0, 'rgba(230,240,255,0.7)')
  capTop.addColorStop(1, 'rgba(230,240,255,0)')
  ctx.fillStyle = capTop
  ctx.fillRect(0, 0, WIDTH, 40)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  cached = texture
  return texture
}
