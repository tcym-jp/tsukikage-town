import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { DoubleSide, MathUtils } from 'three'
import type { Group, Mesh } from 'three'
import type { ResolvedWorldQuality } from './quality'
import type { WorldAreaId, WorldTimeOfDay } from './types'
import { WORLD_AREAS } from './worldData'

interface WorldEnvironmentProps {
  readonly timeOfDay: WorldTimeOfDay
  readonly quality: ResolvedWorldQuality
  readonly reducedMotion: boolean
  readonly activeObjective: WorldAreaId | null
  readonly currentLocation?: WorldAreaId
}

interface Palette {
  readonly sky: string
  readonly fog: string
  readonly ground: string
  readonly road: string
  readonly ambient: number
  readonly sun: string
  readonly sunIntensity: number
  readonly lampIntensity: number
  readonly windowIntensity: number
}

const PALETTES: Record<WorldTimeOfDay, Palette> = {
  morning: {
    sky: '#a9c2c7',
    fog: '#b8c5bd',
    ground: '#617466',
    road: '#4d5960',
    ambient: 1.65,
    sun: '#ffe4b4',
    sunIntensity: 2.1,
    lampIntensity: 0.15,
    windowIntensity: 0.08,
  },
  evening: {
    sky: '#76566d',
    fog: '#77636b',
    ground: '#465a50',
    road: '#3b4650',
    ambient: 1.15,
    sun: '#ffb16c',
    sunIntensity: 1.7,
    lampIntensity: 1.05,
    windowIntensity: 0.75,
  },
  night: {
    sky: '#101a35',
    fog: '#1d2940',
    ground: '#263a38',
    road: '#242d3b',
    ambient: 0.6,
    sun: '#a9c9ff',
    sunIntensity: 0.7,
    lampIntensity: 1.75,
    windowIntensity: 1.35,
  },
}

const labelStyle = {
  color: '#fff8df',
  background: 'rgba(21, 28, 45, .82)',
  border: '1px solid rgba(242, 212, 153, .52)',
  borderRadius: '3px',
  padding: '3px 7px',
  whiteSpace: 'nowrap',
  font: '700 11px/1.35 system-ui, sans-serif',
  letterSpacing: '.04em',
  textShadow: '0 1px 1px rgba(0,0,0,.7)',
  boxShadow: '0 3px 8px rgba(0,0,0,.18)',
  pointerEvents: 'none',
} as const

export function WorldEnvironment({
  timeOfDay,
  quality,
  reducedMotion,
  activeObjective,
  currentLocation,
}: WorldEnvironmentProps) {
  const palette = PALETTES[timeOfDay]

  return (
    <>
      <color attach="background" args={[palette.sky]} />
      <fog attach="fog" args={[palette.fog, 19, 48]} />
      <hemisphereLight args={[palette.sky, palette.ground, palette.ambient]} />
      <directionalLight
        castShadow={quality.shadows}
        color={palette.sun}
        intensity={palette.sunIntensity}
        position={[-11, 17, 9]}
        shadow-mapSize-width={Math.max(256, quality.shadowMapSize)}
        shadow-mapSize-height={Math.max(256, quality.shadowMapSize)}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
      />

      <Ground palette={palette} detailed={quality.level !== 'low'} />
      <Station palette={palette} />
      <TownHall palette={palette} />
      <Shops palette={palette} />
      <Apartments palette={palette} />
      <BulletinBoard reducedMotion={reducedMotion} />
      <BroadcastTower reducedMotion={reducedMotion} timeOfDay={timeOfDay} />
      <StreetFurniture palette={palette} quality={quality} />
      <BackgroundHomes palette={palette} />
      <Trees />
      <Cat reducedMotion={reducedMotion} />
      <DistantTrain reducedMotion={reducedMotion} />
      <WindParticles count={quality.particleCount} reducedMotion={reducedMotion} />

      {WORLD_AREAS.map((area) => {
        const isObjective = area.id === activeObjective
        const isCurrent = area.id === currentLocation
        return (
          <group key={area.id} position={[area.position.x, 0, area.position.z]}>
            <AreaLabel
              label={area.shortLabel}
              emphasized={isObjective || isCurrent}
              objective={isObjective}
            />
            {isObjective ? <ObjectiveBeacon reducedMotion={reducedMotion} /> : null}
          </group>
        )
      })}
    </>
  )
}

function Ground({ palette, detailed }: { readonly palette: Palette; readonly detailed: boolean }) {
  return (
    <group>
      <mesh receiveShadow position={[0, -0.18, 0]}>
        <boxGeometry args={[38, 0.35, 28]} />
        <meshStandardMaterial color={palette.ground} roughness={0.94} />
      </mesh>
      <mesh receiveShadow position={[0, 0.015, 0]}>
        <boxGeometry args={[35, 0.05, 3.9]} />
        <meshStandardMaterial color={palette.road} roughness={0.68} metalness={0.08} />
      </mesh>
      <mesh receiveShadow position={[-11.6, 0.02, -3.7]} rotation={[0, -0.34, 0]}>
        <boxGeometry args={[3.3, 0.055, 15.5]} />
        <meshStandardMaterial color={palette.road} roughness={0.72} />
      </mesh>
      <mesh receiveShadow position={[10.8, 0.02, 2.8]} rotation={[0, 0.22, 0]}>
        <boxGeometry args={[3, 0.055, 8.2]} />
        <meshStandardMaterial color={palette.road} roughness={0.72} />
      </mesh>
      {[-9.5, -3.5, 2.5, 8.5, 14.5].map((x) => (
        <mesh key={x} position={[x, 0.055, 0]}>
          <boxGeometry args={[2.1, 0.012, 0.06]} />
          <meshBasicMaterial color="#b2a98e" transparent opacity={0.42} />
        </mesh>
      ))}
      {detailed ? (
        <>
          <Puddle position={[-5.2, 0.06, -0.72]} scale={[1.1, 0.42, 1]} />
          <Puddle position={[5.2, 0.06, 0.85]} scale={[0.7, 0.3, 1]} />
          <Puddle position={[12.2, 0.06, -0.55]} scale={[0.95, 0.36, 1]} />
        </>
      ) : null}
    </group>
  )
}

function Puddle({
  position,
  scale,
}: {
  readonly position: [number, number, number]
  readonly scale: [number, number, number]
}) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} scale={scale}>
      <circleGeometry args={[1, 12]} />
      <meshStandardMaterial
        color="#718ba2"
        roughness={0.18}
        metalness={0.22}
        transparent
        opacity={0.38}
      />
    </mesh>
  )
}

function Station({ palette }: { readonly palette: Palette }) {
  return (
    <group>
      <Building
        position={[-13.2, 1.45, 7.1]}
        size={[7.6, 2.9, 4.2]}
        wall="#7d6857"
        trim="#d4c49a"
        roof="#3a3f4a"
        front="south"
        palette={palette}
        windowCount={4}
      />
      <mesh receiveShadow position={[-13.2, 0.15, 3.75]}>
        <boxGeometry args={[8.5, 0.28, 1.2]} />
        <meshStandardMaterial color="#918678" roughness={0.86} />
      </mesh>
      <mesh position={[-13.2, 2.38, 4.94]}>
        <boxGeometry args={[2.8, 0.55, 0.12]} />
        <meshStandardMaterial color="#eee5c9" roughness={0.8} />
      </mesh>
      <Clock position={[-10.55, 2.45, 4.9]} />
      <Rail lineZ={10.6} />
      <Rail lineZ={11.45} />
      {[-17, -14.5, -12, -9.5].map((x) => (
        <mesh key={x} position={[x, 0.08, 11.02]}>
          <boxGeometry args={[0.16, 0.12, 2.2]} />
          <meshStandardMaterial color="#4b3c34" />
        </mesh>
      ))}
    </group>
  )
}

function Rail({ lineZ }: { readonly lineZ: number }) {
  return (
    <mesh position={[-10, 0.19, lineZ]}>
      <boxGeometry args={[18, 0.09, 0.1]} />
      <meshStandardMaterial color="#5c6469" metalness={0.72} roughness={0.35} />
    </mesh>
  )
}

function Clock({ position }: { readonly position: [number, number, number] }) {
  return (
    <group position={position} rotation={[Math.PI / 2, 0, 0]}>
      <mesh>
        <cylinderGeometry args={[0.36, 0.36, 0.1, 16]} />
        <meshStandardMaterial color="#ece6cf" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.06, 0.07]} rotation={[0, 0, -0.68]}>
        <boxGeometry args={[0.035, 0.28, 0.025]} />
        <meshBasicMaterial color="#243040" />
      </mesh>
      <mesh position={[0.1, 0.07, -0.01]} rotation={[0, 0, 1.28]}>
        <boxGeometry args={[0.028, 0.2, 0.025]} />
        <meshBasicMaterial color="#243040" />
      </mesh>
    </group>
  )
}

function TownHall({ palette }: { readonly palette: Palette }) {
  return (
    <group>
      <Building
        position={[-7, 1.6, -7.1]}
        size={[6, 3.2, 4]}
        wall="#8a8374"
        trim="#d9d0b6"
        roof="#4e5361"
        front="north"
        palette={palette}
        windowCount={4}
      />
      <mesh position={[-7, 1.15, -4.98]}>
        <boxGeometry args={[1.2, 2.1, 0.12]} />
        <meshStandardMaterial color="#425568" roughness={0.72} />
      </mesh>
      <mesh receiveShadow position={[-7, 0.16, -4.25]}>
        <boxGeometry args={[2.2, 0.3, 1.4]} />
        <meshStandardMaterial color="#8f8c80" />
      </mesh>
      <Flag position={[-4.4, 3.2, -5.2]} />
    </group>
  )
}

function Shops({ palette }: { readonly palette: Palette }) {
  return (
    <group>
      <Building
        position={[0.95, 1.45, -6.65]}
        size={[4.2, 2.9, 3.8]}
        wall="#725a49"
        trim="#c89a57"
        roof="#393742"
        front="north"
        palette={palette}
        windowCount={2}
      />
      <Awning position={[0.95, 1.9, -4.68]} color="#8e6d45" />
      <Crates position={[-0.7, 0.35, -4.15]} />
      <Building
        position={[7, 1.45, -6.65]}
        size={[4.2, 2.9, 3.8]}
        wall="#6f6670"
        trim="#d9c0a8"
        roof="#42414e"
        front="north"
        palette={palette}
        windowCount={3}
      />
      <Awning position={[7, 1.9, -4.68]} color="#7d4750" />
      <mesh position={[8.65, 0.65, -4.3]}>
        <cylinderGeometry args={[0.32, 0.25, 1.2, 8]} />
        <meshStandardMaterial color="#606d59" roughness={0.9} />
      </mesh>
    </group>
  )
}

function Apartments({ palette }: { readonly palette: Palette }) {
  return (
    <group>
      <Building
        position={[11.4, 2.25, 7.2]}
        size={[7.4, 4.5, 4.6]}
        wall="#756b64"
        trim="#c8b69a"
        roof="#363c49"
        front="south"
        palette={palette}
        windowCount={5}
      />
      <mesh position={[11.35, 1.05, 4.82]}>
        <boxGeometry args={[1.2, 2.05, 0.12]} />
        <meshStandardMaterial color="#51463e" roughness={0.82} />
      </mesh>
      <mesh castShadow receiveShadow position={[9.15, 0.68, 4.18]}>
        <boxGeometry args={[1.7, 1.25, 0.45]} />
        <meshStandardMaterial color="#3d4650" roughness={0.72} />
      </mesh>
      {[8.65, 9.15, 9.65].map((x) => (
        <mesh key={x} position={[x, 0.7, 3.94]}>
          <boxGeometry args={[0.35, 0.72, 0.03]} />
          <meshStandardMaterial color="#d6c9aa" roughness={0.94} />
        </mesh>
      ))}
      <ExternalStairs />
      <mesh position={[13.05, 2.72, 4.82]}>
        <boxGeometry args={[0.95, 1.82, 0.12]} />
        <meshStandardMaterial color="#5b4e45" />
      </mesh>
      <mesh position={[13.05, 3.52, 4.72]}>
        <boxGeometry args={[0.52, 0.2, 0.08]} />
        <meshStandardMaterial color="#e1d4b5" />
      </mesh>
    </group>
  )
}

function BulletinBoard({ reducedMotion }: { readonly reducedMotion: boolean }) {
  const papers = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (papers.current !== null) {
      papers.current.rotation.y = reducedMotion ? 0 : Math.sin(clock.elapsedTime * 1.15) * 0.018
    }
  })

  return (
    <group position={[-1.5, 0, 3.12]}>
      <mesh castShadow position={[0, 1.55, 0]}>
        <boxGeometry args={[2.05, 1.55, 0.24]} />
        <meshStandardMaterial color="#51402f" roughness={0.94} />
      </mesh>
      <mesh position={[0, 1.55, -0.14]}>
        <boxGeometry args={[1.72, 1.22, 0.025]} />
        <meshStandardMaterial color="#79644d" roughness={1} />
      </mesh>
      {[-0.78, 0.78].map((x) => (
        <mesh key={x} castShadow position={[x, 0.68, 0]}>
          <cylinderGeometry args={[0.07, 0.08, 1.35, 8]} />
          <meshStandardMaterial color="#433327" roughness={1} />
        </mesh>
      ))}
      <group ref={papers} position={[0, 0, -0.17]}>
        {Array.from({ length: 12 }, (_, index) => {
          const column = index % 4
          const row = Math.floor(index / 4)
          return (
            <mesh
              key={index}
              position={[-0.6 + column * 0.4, 1.94 - row * 0.4, -0.01 - (index % 2) * 0.004]}
              rotation={[0, 0, ((index % 3) - 1) * 0.035]}
            >
              <planeGeometry args={[0.31, 0.32]} />
              <meshStandardMaterial
                color={index % 4 === 0 ? '#d7d5c2' : '#eee3c7'}
                roughness={0.95}
                side={DoubleSide}
              />
            </mesh>
          )
        })}
      </group>
    </group>
  )
}

function BroadcastTower({
  reducedMotion,
  timeOfDay,
}: {
  readonly reducedMotion: boolean
  readonly timeOfDay: WorldTimeOfDay
}) {
  const light = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    if (light.current !== null) {
      const pulse = reducedMotion ? 0.82 : 0.38 + Math.sin(clock.elapsedTime * 1.35) * 0.3
      light.current.scale.setScalar(Math.max(0.25, pulse))
    }
  })

  return (
    <group>
      <mesh receiveShadow position={[-13.4, 0, -9.85]}>
        <cylinderGeometry args={[4.3, 4.7, 0.45, 12]} />
        <meshStandardMaterial color="#526052" roughness={0.96} />
      </mesh>
      <group position={[-13.55, 0.3, -9.65]}>
        {[-0.62, 0.62].flatMap((x) =>
          [-0.62, 0.62].map((z) => (
            <mesh key={`${String(x)}-${String(z)}`} castShadow position={[x, 3.5, z]}>
              <cylinderGeometry args={[0.07, 0.12, 7, 6]} />
              <meshStandardMaterial color="#626a6d" metalness={0.62} roughness={0.45} />
            </mesh>
          )),
        )}
        {[1.2, 2.5, 3.8, 5.1, 6.4].map((y) => (
          <group key={y} position={[0, y, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.035, 0.035, 1.5, 5]} />
              <meshStandardMaterial color="#777d7e" metalness={0.7} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.035, 0.035, 1.5, 5]} />
              <meshStandardMaterial color="#777d7e" metalness={0.7} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 7.2, 0]}>
          <cylinderGeometry args={[0.06, 0.08, 1.2, 6]} />
          <meshStandardMaterial color="#737a7d" metalness={0.7} />
        </mesh>
        <mesh ref={light} position={[0, 7.85, 0]}>
          <sphereGeometry args={[0.14, 8, 6]} />
          <meshBasicMaterial color={timeOfDay === 'morning' ? '#96594f' : '#ff655b'} />
        </mesh>
      </group>
      <mesh castShadow position={[-12.15, 0.58, -8.35]} rotation={[0, -0.3, 0]}>
        <boxGeometry args={[1.5, 1.05, 0.1]} />
        <meshStandardMaterial color="#baad8c" roughness={0.9} />
      </mesh>
    </group>
  )
}

function StreetFurniture({
  palette,
  quality,
}: {
  readonly palette: Palette
  readonly quality: ResolvedWorldQuality
}) {
  const lamps: readonly [number, number][] = [
    [-8.7, 1.7],
    [-4.2, -1.7],
    [0.3, 1.65],
    [4.6, -1.65],
    [9, 1.65],
    [13.4, -1.6],
  ]
  const poles: readonly [number, number][] = [
    [-16.4, 2.4],
    [-6.5, 2.7],
    [3.8, 2.8],
    [14.5, 2.8],
  ]

  return (
    <group>
      {lamps.map(([x, z]) => (
        <LampPost
          key={x}
          position={[x, 0, z]}
          intensity={palette.lampIntensity}
          castLight={quality.level !== 'low'}
        />
      ))}
      {poles.map(([x, z]) => (
        <UtilityPole key={x} position={[x, 0, z]} />
      ))}
      <Bench position={[-5.8, 0.35, 2.15]} />
      <Bench position={[3.4, 0.35, -2.15]} />
      <mesh castShadow position={[15.7, 0.62, 3.2]}>
        <boxGeometry args={[0.6, 1.2, 0.55]} />
        <meshStandardMaterial color="#8a3f38" roughness={0.72} />
      </mesh>
    </group>
  )
}

function BackgroundHomes({ palette }: { readonly palette: Palette }) {
  return (
    <group>
      <Building
        position={[-5.5, 1.15, 8.3]}
        size={[3.4, 2.3, 3.3]}
        wall="#6f776f"
        trim="#c8c1a8"
        roof="#45434b"
        front="south"
        palette={palette}
        windowCount={2}
      />
      <Building
        position={[16.7, 1.25, 0]}
        size={[2.1, 2.5, 4.5]}
        wall="#76675b"
        trim="#cbbfa4"
        roof="#3f4047"
        front="south"
        palette={palette}
        windowCount={2}
      />
    </group>
  )
}

function Building({
  position,
  size,
  wall,
  trim,
  roof,
  front,
  palette,
  windowCount,
}: {
  readonly position: [number, number, number]
  readonly size: [number, number, number]
  readonly wall: string
  readonly trim: string
  readonly roof: string
  readonly front: 'north' | 'south'
  readonly palette: Palette
  readonly windowCount: number
}) {
  const frontZ = position[2] + (front === 'north' ? size[2] / 2 + 0.015 : -size[2] / 2 - 0.015)
  const windows = Array.from({ length: windowCount }, (_, index) => {
    const fraction = (index + 1) / (windowCount + 1)
    return position[0] - size[0] / 2 + fraction * size[0]
  })

  return (
    <group>
      <mesh castShadow receiveShadow position={position}>
        <boxGeometry args={size} />
        <meshStandardMaterial color={wall} roughness={0.9} />
      </mesh>
      <mesh
        castShadow
        position={[position[0], position[1] + size[1] / 2 + 0.55, position[2]]}
        rotation={[0, Math.PI / 4, 0]}
        scale={[size[0] * 0.76, 0.85, size[2] * 0.76]}
      >
        <coneGeometry args={[1, 1.25, 4]} />
        <meshStandardMaterial color={roof} roughness={0.82} />
      </mesh>
      {windows.map((x, index) => (
        <mesh key={x} position={[x, position[1] + (index % 2) * 0.06, frontZ]}>
          <boxGeometry args={[0.54, 0.72, 0.035]} />
          <meshStandardMaterial
            color="#ffe3a0"
            emissive="#e8a95a"
            emissiveIntensity={palette.windowIntensity * (index % 3 === 0 ? 0.35 : 1)}
            roughness={0.62}
          />
        </mesh>
      ))}
      <mesh position={[position[0], position[1] - size[1] / 2 + 0.38, frontZ]}>
        <boxGeometry args={[size[0] * 0.86, 0.12, 0.055]} />
        <meshStandardMaterial color={trim} roughness={0.8} />
      </mesh>
    </group>
  )
}

function Awning({
  position,
  color,
}: {
  readonly position: [number, number, number]
  readonly color: string
}) {
  return (
    <mesh castShadow position={position} rotation={[0.32, 0, 0]}>
      <boxGeometry args={[2.9, 0.12, 0.75]} />
      <meshStandardMaterial color={color} roughness={0.84} />
    </mesh>
  )
}

function Crates({ position }: { readonly position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[0.65, 0.65, 0.55]} />
        <meshStandardMaterial color="#765936" roughness={0.95} />
      </mesh>
      <mesh castShadow position={[0.54, -0.08, 0.05]}>
        <boxGeometry args={[0.48, 0.48, 0.48]} />
        <meshStandardMaterial color="#80623c" roughness={0.95} />
      </mesh>
    </group>
  )
}

function ExternalStairs() {
  return (
    <group position={[14.4, 0, 4.1]} rotation={[0, -0.15, 0]}>
      {Array.from({ length: 7 }, (_, index) => (
        <mesh key={index} castShadow position={[0, 0.18 + index * 0.27, index * 0.28]}>
          <boxGeometry args={[1.05, 0.18, 0.4]} />
          <meshStandardMaterial color="#62676b" metalness={0.38} roughness={0.56} />
        </mesh>
      ))}
    </group>
  )
}

function Flag({ position }: { readonly position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, -1.35, 0]}>
        <cylinderGeometry args={[0.035, 0.045, 3.2, 7]} />
        <meshStandardMaterial color="#73777c" metalness={0.55} />
      </mesh>
      <mesh position={[0.42, 0, 0]}>
        <planeGeometry args={[0.8, 0.45]} />
        <meshStandardMaterial color="#d8d1bb" side={DoubleSide} roughness={0.92} />
      </mesh>
    </group>
  )
}

function LampPost({
  position,
  intensity,
  castLight,
}: {
  readonly position: [number, number, number]
  readonly intensity: number
  readonly castLight: boolean
}) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 1.45, 0]}>
        <cylinderGeometry args={[0.055, 0.085, 2.9, 7]} />
        <meshStandardMaterial color="#343c42" roughness={0.55} metalness={0.42} />
      </mesh>
      <mesh position={[0, 2.88, 0]}>
        <sphereGeometry args={[0.2, 8, 6]} />
        <meshStandardMaterial
          color="#ffdf95"
          emissive="#ffb85f"
          emissiveIntensity={intensity * 1.8}
        />
      </mesh>
      {castLight && intensity > 0.2 ? (
        <pointLight position={[0, 2.65, 0]} color="#ffc977" intensity={intensity} distance={5.2} />
      ) : null}
    </group>
  )
}

function UtilityPole({ position }: { readonly position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 2.2, 0]}>
        <cylinderGeometry args={[0.07, 0.11, 4.4, 7]} />
        <meshStandardMaterial color="#51463d" roughness={0.94} />
      </mesh>
      <mesh position={[0, 3.75, 0]}>
        <boxGeometry args={[1.1, 0.08, 0.08]} />
        <meshStandardMaterial color="#4b433e" />
      </mesh>
    </group>
  )
}

function Bench({ position }: { readonly position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[1.6, 0.15, 0.48]} />
        <meshStandardMaterial color="#6f5135" roughness={0.94} />
      </mesh>
      {[-0.58, 0.58].map((x) => (
        <mesh key={x} position={[x, -0.26, 0]}>
          <boxGeometry args={[0.1, 0.5, 0.38]} />
          <meshStandardMaterial color="#3f4243" metalness={0.3} />
        </mesh>
      ))}
    </group>
  )
}

function Trees() {
  const positions: readonly [number, number, number][] = [
    [-17, 0, -5],
    [-16, 0, -10.8],
    [-8.6, 0, 11.2],
    [-2.2, 0, 10.5],
    [4.5, 0, 8.3],
    [17, 0, 10.7],
    [16.3, 0, -7.4],
    [11.5, 0, -10.3],
  ]
  return (
    <group>
      {positions.map((position, index) => (
        <group key={index} position={position}>
          <mesh castShadow position={[0, 1, 0]}>
            <cylinderGeometry args={[0.14, 0.2, 2, 7]} />
            <meshStandardMaterial color="#5b4635" roughness={1} />
          </mesh>
          <mesh castShadow position={[0, 2.25, 0]} rotation={[0, index * 0.7, 0]}>
            <coneGeometry args={[1.05 + (index % 3) * 0.12, 2.4, 7]} />
            <meshStandardMaterial color={index % 2 === 0 ? '#365448' : '#3f5e4c'} roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Cat({ reducedMotion }: { readonly reducedMotion: boolean }) {
  const cat = useRef<Group>(null)
  useFrame(({ clock }, delta) => {
    if (cat.current === null || reducedMotion) return
    const time = clock.elapsedTime * 0.18
    const targetX = Math.sin(time) * 4.3 + 1.4
    const targetZ = Math.sin(time * 1.7) * 1.05 + 1.3
    cat.current.position.x = MathUtils.damp(cat.current.position.x, targetX, 3, delta)
    cat.current.position.z = MathUtils.damp(cat.current.position.z, targetZ, 3, delta)
    cat.current.rotation.y = Math.atan2(
      targetX - cat.current.position.x,
      targetZ - cat.current.position.z,
    )
  })

  return (
    <group ref={cat} position={[1.4, 0.24, 1.3]} scale={0.72}>
      <mesh castShadow position={[0, 0.28, 0]}>
        <sphereGeometry args={[0.32, 8, 6]} />
        <meshStandardMaterial color="#e8e1d1" roughness={0.92} />
      </mesh>
      <mesh castShadow position={[0, 0.48, -0.29]}>
        <sphereGeometry args={[0.23, 8, 6]} />
        <meshStandardMaterial color="#d8d5cb" roughness={0.92} />
      </mesh>
      {[-0.12, 0.12].map((x) => (
        <mesh key={x} position={[x, 0.7, -0.3]} rotation={[0.15, 0, x * 2]}>
          <coneGeometry args={[0.1, 0.24, 4]} />
          <meshStandardMaterial color="#777b7d" roughness={0.96} />
        </mesh>
      ))}
      <mesh position={[0.24, 0.25, 0.25]} rotation={[0.9, 0, -0.5]}>
        <cylinderGeometry args={[0.045, 0.06, 0.65, 6]} />
        <meshStandardMaterial color="#7d8080" roughness={0.9} />
      </mesh>
    </group>
  )
}

function DistantTrain({ reducedMotion }: { readonly reducedMotion: boolean }) {
  const train = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (train.current === null) return
    train.current.position.x = reducedMotion ? -5 : ((clock.elapsedTime * 1.3 + 8) % 42) - 21
  })
  return (
    <group ref={train} position={[-5, 0.75, 11.02]}>
      {[0, 3.05, 6.1].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[2.8, 1.35, 1.15]} />
            <meshStandardMaterial color="#667984" metalness={0.25} roughness={0.62} />
          </mesh>
          {[-0.75, 0, 0.75].map((windowX) => (
            <mesh key={windowX} position={[windowX, 0.17, -0.59]}>
              <boxGeometry args={[0.45, 0.45, 0.025]} />
              <meshStandardMaterial color="#e7c67e" emissive="#bf7d38" emissiveIntensity={0.5} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

function WindParticles({
  count,
  reducedMotion,
}: {
  readonly count: number
  readonly reducedMotion: boolean
}) {
  const group = useRef<Group>(null)
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        x: ((index * 7.7) % 32) - 16,
        y: 0.35 + ((index * 1.37) % 3.4),
        z: ((index * 11.3) % 20) - 10,
        rotation: index * 0.61,
      })),
    [count],
  )
  useFrame(({ clock }) => {
    if (group.current !== null && !reducedMotion) {
      group.current.position.x = Math.sin(clock.elapsedTime * 0.12) * 1.3
      group.current.rotation.y = Math.sin(clock.elapsedTime * 0.07) * 0.04
    }
  })
  return (
    <group ref={group}>
      {particles.map((particle, index) => (
        <mesh
          key={index}
          position={[particle.x, particle.y, particle.z]}
          rotation={[particle.rotation, particle.rotation * 0.4, particle.rotation * 0.7]}
        >
          <planeGeometry args={[0.08, 0.16]} />
          <meshBasicMaterial color={index % 2 === 0 ? '#a88a55' : '#d1bd8a'} side={DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

function AreaLabel({
  label,
  emphasized,
  objective,
}: {
  readonly label: string
  readonly emphasized: boolean
  readonly objective: boolean
}) {
  return (
    <Html
      center
      position={[0, emphasized ? 1.72 : 1.28, 0]}
      distanceFactor={16}
      zIndexRange={[2, 0]}
    >
      <span
        style={{
          ...labelStyle,
          opacity: emphasized ? 1 : 0.78,
          borderColor: objective ? '#ffe09b' : labelStyle.border,
          transform: emphasized ? 'scale(1.08)' : undefined,
        }}
      >
        {objective ? '◆ ' : ''}
        {label}
      </span>
    </Html>
  )
}

function ObjectiveBeacon({ reducedMotion }: { readonly reducedMotion: boolean }) {
  const beacon = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    if (beacon.current !== null) {
      const scale = reducedMotion ? 1 : 1 + Math.sin(clock.elapsedTime * 2.2) * 0.14
      beacon.current.scale.set(scale, scale, scale)
      beacon.current.rotation.z = reducedMotion ? 0 : clock.elapsedTime * 0.3
    }
  })
  return (
    <mesh ref={beacon} position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.62, 0.76, 20]} />
      <meshBasicMaterial color="#ffe19a" transparent opacity={0.82} side={DoubleSide} />
    </mesh>
  )
}
