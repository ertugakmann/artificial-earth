import { useMemo } from 'react'
import * as THREE from 'three'
import { createEarthTexture } from '../../utils/earthTexture'

export const EARTH_RADIUS = 1

const atmosphereVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const outerGlowFragment = /* glsl */ `
  uniform vec3 uColor;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float intensity = pow(0.55 - dot(vNormal, vViewDir), 3.0);
    gl_FragColor = vec4(uColor, 1.0) * intensity;
  }
`

const rimFragment = /* glsl */ `
  uniform vec3 uColor;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float fresnel = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), 3.5);
    gl_FragColor = vec4(uColor, 1.0) * fresnel * 0.9;
  }
`

/**
 * The stylised Earth sphere plus its atmospheric glow.
 * Marker components are passed as children so they rotate with the globe.
 */
export function Earth({ children }: { children?: React.ReactNode }) {
  const texture = useMemo(() => createEarthTexture(), [])

  const glowUniforms = useMemo(() => ({ uColor: { value: new THREE.Color('#5ab8ff') } }), [])
  const rimUniforms = useMemo(() => ({ uColor: { value: new THREE.Color('#8fd4ff') } }), [])

  return (
    <group>
      {/* Stop pointer events from reaching markers hidden on the far side. */}
      <mesh
        onPointerOver={(e) => e.stopPropagation()}
        onPointerMove={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <sphereGeometry args={[EARTH_RADIUS, 96, 96]} />
        <meshStandardMaterial map={texture} roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Inner rim light on the Earth edge */}
      <mesh scale={1.005}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <shaderMaterial
          vertexShader={atmosphereVertex}
          fragmentShader={rimFragment}
          uniforms={rimUniforms}
          blending={THREE.AdditiveBlending}
          transparent
          depthWrite={false}
        />
      </mesh>

      {/* Outer atmosphere glow */}
      <mesh scale={1.16}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <shaderMaterial
          vertexShader={atmosphereVertex}
          fragmentShader={outerGlowFragment}
          uniforms={glowUniforms}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          transparent
          depthWrite={false}
        />
      </mesh>

      {children}
    </group>
  )
}
