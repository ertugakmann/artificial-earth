import * as THREE from 'three'

/**
 * Camera-to-object distance range over which landmarks/data centres blend
 * between their "near" and "far" scale. Tuned against `GlobeControls`'
 * `minDistance`/`maxDistance` (1.7-6, default 3.55): a camera distance of
 * ~1.7 (fully zoomed in) puts a facing surface point roughly `NEAR_DISTANCE`
 * away, while the default resting view already sits beyond `FAR_DISTANCE`.
 */
const NEAR_DISTANCE = 0.75
const FAR_DISTANCE = 2.3

function smoothstep(t: number): number {
  const c = THREE.MathUtils.clamp(t, 0, 1)
  return c * c * (3 - 2 * c)
}

/**
 * Maps a camera-to-object distance to a scale between `nearScale` (camera
 * close up — kept smaller so the model doesn't dominate the view) and
 * `farScale` (camera pulled back — kept large so it reads clearly on the
 * whole globe). The blend is smooth (via `smoothstep`) so scaling this
 * output toward every frame never pops or jumps as the user zooms.
 */
export function distanceToScale(distance: number, nearScale: number, farScale: number): number {
  const t = smoothstep((distance - NEAR_DISTANCE) / (FAR_DISTANCE - NEAR_DISTANCE))
  return THREE.MathUtils.lerp(nearScale, farScale, t)
}
