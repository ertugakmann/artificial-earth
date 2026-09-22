import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'

interface Props {
  /** Direction (unit vector) the camera should swing round to face, if any. */
  focusDirection: THREE.Vector3 | null
  /** Slowly spin the globe when the user is not interacting. */
  autoRotate: boolean
}

const DESKTOP_DISTANCE = 3.55
const PORTRAIT_DISTANCE = 4.6

/**
 * Orbit controls (drag to rotate, scroll/pinch to zoom) plus a smooth
 * "fly to continent" animation that keeps the current zoom distance.
 */
export function GlobeControls({ focusDirection, autoRotate }: Props) {
  const controls = useRef<OrbitControlsImpl>(null)
  const { camera, size } = useThree()
  const animating = useRef(false)
  const target = useRef(new THREE.Vector3())

  // Start the camera further away on narrow (portrait) screens so the whole
  // Earth stays visible.
  useEffect(() => {
    const portrait = size.width < size.height
    const distance = portrait ? PORTRAIT_DISTANCE : DESKTOP_DISTANCE
    camera.position.setLength(distance)
    camera.updateProjectionMatrix()
  }, [camera, size.width, size.height])

  useEffect(() => {
    if (!focusDirection) {
      animating.current = false
      return
    }
    target.current.copy(focusDirection).normalize()
    animating.current = true
  }, [focusDirection])

  useFrame((_, delta) => {
    const c = controls.current
    if (!c) return
    if (animating.current) {
      const distance = camera.position.length()
      const desired = target.current.clone().multiplyScalar(distance)
      const alpha = 1 - Math.pow(0.0005, delta) // frame-rate independent easing
      camera.position.lerp(desired, alpha).setLength(distance)
      if (camera.position.distanceTo(desired) < 0.003) animating.current = false
    }
    c.update()
  })

  return (
    <OrbitControls
      ref={controls}
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.55}
      zoomSpeed={0.7}
      minDistance={1.7}
      maxDistance={6}
      autoRotate={autoRotate && !animating.current}
      autoRotateSpeed={0.45}
      onStart={() => {
        animating.current = false
      }}
    />
  )
}
