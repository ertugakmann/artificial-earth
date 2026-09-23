import * as THREE from 'three'
import { lngLatToXY } from './geo'

const WIDTH = 2048
const HEIGHT = 1024

let cached: THREE.CanvasTexture | null = null
let cachedCtx: CanvasRenderingContext2D | null = null
let lastWaterLevel = 100

/** Interpolate between two hex colours. */
function lerpHex(a: string, b: string, t: number): string {
  const ca = new THREE.Color(a)
  const cb = new THREE.Color(b)
  return `#${ca.lerp(cb, t).getHexString()}`
}

function paintOcean(ctx: CanvasRenderingContext2D, waterLevel: number) {
  const dryness = 1 - THREE.MathUtils.clamp(waterLevel, 0, 100) / 100

  const topColor = lerpHex('#173a7a', '#8a6a3f', dryness)
  const midColor = lerpHex('#2f6fd1', '#c9a86a', dryness)

  ctx.clearRect(0, 0, WIDTH, HEIGHT)

  const ocean = ctx.createLinearGradient(0, 0, 0, HEIGHT)
  ocean.addColorStop(0, topColor)
  ocean.addColorStop(0.5, midColor)
  ocean.addColorStop(1, topColor)
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

  // Soft polar cap so the top of the sphere looks finished.
  const capTop = ctx.createLinearGradient(0, 0, 0, 40)
  capTop.addColorStop(0, 'rgba(230,240,255,0.7)')
  capTop.addColorStop(1, 'rgba(230,240,255,0)')
  ctx.fillStyle = capTop
  ctx.fillRect(0, 0, WIDTH, 40)
}

/**
 * Redraws the ocean texture to reflect the current global water level,
 * shifting its colour from healthy blue toward a dry sandy tan as water
 * drops toward 0. Cheap: repaints the same cached canvas/texture in place.
 */
export function setWaterLevel(waterLevel: number) {
  if (Math.abs(waterLevel - lastWaterLevel) < 0.15) return
  lastWaterLevel = waterLevel
  if (!cachedCtx || !cached) return
  paintOcean(cachedCtx, waterLevel)
  cached.needsUpdate = true
}

/**
 * Draw the base ocean surface (with a faint graticule) onto a canvas.
 *
 * Land is no longer part of this texture: every continent is rendered as
 * its own unified 3D mesh (see `continentLandGeometry.ts` /
 * `ContinentLand.tsx`) so it can rise off the surface when selected and so
 * its coastline can be traced without ever drawing internal country
 * borders. This texture only needs to supply the ocean underneath.
 */
export function createEarthTexture(): THREE.CanvasTexture {
  if (cached) return cached

  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')!
  cachedCtx = ctx

  paintOcean(ctx, lastWaterLevel)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  cached = texture
  return texture
}
