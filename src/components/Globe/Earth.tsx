import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createEarthTexture, setWaterLevel } from '../../utils/earthTexture'

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

const hazeFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float intensity = pow(0.5 - dot(vNormal, vViewDir), 2.2);
    gl_FragColor = vec4(uColor, 1.0) * intensity * uOpacity;
  }
`

/**
 * The stylised Earth sphere plus its atmospheric glow.
 * Marker components are passed as children so they rotate with the globe.
 */
interface EarthProps {
  children?: React.ReactNode
  /** Global water level, 0-100. Recedes the ocean sphere and tints it drier as this falls. */
  water?: number
  /** Global pollution level, 0-100. Thickens a murky haze shell and dulls the surface as this rises. */
  pollution?: number
}

export function Earth({ children, water = 100, pollution = 0 }: EarthProps) {
  const texture = useMemo(() => createEarthTexture(), [])
  const oceanMesh = useRef<THREE.Mesh>(null)
  const oceanMaterial = useRef<THREE.MeshStandardMaterial>(null)
  const oceanRadius = useRef(EARTH_RADIUS)

  const glowUniforms = useMemo(() => ({ uColor: { value: new THREE.Color('#5ab8ff') } }), [])
  const rimUniforms = useMemo(() => ({ uColor: { value: new THREE.Color('#8fd4ff') } }), [])
  const hazeUniforms = useMemo(
    () => ({ uColor: { value: new THREE.Color('#b8a25a') }, uOpacity: { value: 0 } }),
    [],
  )

  useFrame((_, delta) => {
    setWaterLevel(water)

    // Ocean sphere recedes slightly below the continents' base radius as
    // water drops, so land visibly "grows" and the sea visibly disappears.
    const target = EARTH_RADIUS * (1 - ((100 - water) / 100) * 0.045)
    const alpha = 1 - Math.pow(0.001, delta)
    oceanRadius.current = THREE.MathUtils.lerp(oceanRadius.current, target, alpha)
    if (oceanMesh.current) oceanMesh.current.scale.setScalar(oceanRadius.current / EARTH_RADIUS)

    if (oceanMaterial.current) {
      const dryness = THREE.MathUtils.clamp((100 - water) / 100, 0, 1)
      oceanMaterial.current.roughness = THREE.MathUtils.lerp(0.85, 0.98, dryness)
    }

    const targetOpacity = THREE.MathUtils.clamp(pollution / 100, 0, 1) * 0.85
    hazeUniforms.uOpacity.value = THREE.MathUtils.lerp(hazeUniforms.uOpacity.value, targetOpacity, alpha)
  })

  return (
    <group>
      {/* Stop pointer events from reaching markers hidden on the far side. */}
      <mesh
        ref={oceanMesh}
        onPointerOver={(e) => e.stopPropagation()}
        onPointerMove={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <sphereGeometry args={[EARTH_RADIUS, 96, 96]} />
        <meshStandardMaterial ref={oceanMaterial} map={texture} roughness={0.85} metalness={0.05} />
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

      {/* Pollution haze: murky shell that thickens as pollution rises. */}
      <mesh scale={1.22}>
        <sphereGeometry args={[EARTH_RADIUS, 48, 48]} />
        <shaderMaterial
          vertexShader={atmosphereVertex}
          fragmentShader={hazeFragment}
          uniforms={hazeUniforms}
          blending={THREE.NormalBlending}
          side={THREE.BackSide}
          transparent
          depthWrite={false}
        />
      </mesh>

      {children}
    </group>
  )
}
