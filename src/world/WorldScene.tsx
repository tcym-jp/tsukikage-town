import { Canvas, useFrame } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { MathUtils, Vector3 } from 'three'
import type { Group } from 'three'
import { WorldEnvironment } from './WorldEnvironment'
import { findNearbyInteraction } from './interaction'
import { advancePlayer, clampInputVector, positionsEqual } from './movement'
import { resolveWorldQuality } from './quality'
import type { WorldQualityEnvironment } from './quality'
import type { WorldInputVector, WorldInteraction, WorldPosition, WorldSceneProps } from './types'
import { supportsWebGL } from './webgl'

const STILL: WorldInputVector = { x: 0, z: 0 }

const visuallyHiddenStyle = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const

export function WorldScene({
  timeOfDay,
  quality = 'auto',
  reducedMotion = false,
  playerPosition,
  onPlayerMove,
  interactionEnabled = true,
  onInteract,
  activeObjective = null,
  currentLocation,
  inputController,
  onNearbyAreaChange,
  className,
  style,
  ariaLabel = '月影町の3D探索画面',
  forceWebGLSupport,
}: WorldSceneProps) {
  const cameraZOffset = getCameraZOffset(currentLocation)
  const [webGLSupported] = useState(() => forceWebGLSupport ?? supportsWebGL())
  const qualityConfig = useResolvedQuality(quality)
  const pageVisible = usePageVisibility()
  const runtimePositionRef = useRef<WorldPosition>(playerPosition)
  const keyboardInputRef = useRef<WorldInputVector>(STILL)
  const controllerInputRef = useRef<WorldInputVector>(
    inputController?.getSnapshot().movement ?? STILL,
  )
  const [nearbyInteraction, setNearbyInteraction] = useState<WorldInteraction | null>(() =>
    findNearbyInteraction(playerPosition, activeObjective),
  )

  const performInteraction = useCallback(() => {
    if (!interactionEnabled) return
    const interaction = findNearbyInteraction(runtimePositionRef.current, activeObjective)
    if (interaction !== null) {
      onInteract(interaction)
    }
  }, [activeObjective, interactionEnabled, onInteract])

  useKeyboardInput(keyboardInputRef, interactionEnabled, performInteraction)

  useEffect(() => {
    if (inputController === undefined) {
      controllerInputRef.current = STILL
      return
    }

    let previousInteractionSequence = inputController.getSnapshot().interactionSequence
    controllerInputRef.current = inputController.getSnapshot().movement
    return inputController.subscribe((snapshot) => {
      controllerInputRef.current = interactionEnabled ? snapshot.movement : STILL
      if (interactionEnabled && snapshot.interactionSequence !== previousInteractionSequence) {
        previousInteractionSequence = snapshot.interactionSequence
        performInteraction()
      }
    })
  }, [inputController, interactionEnabled, performInteraction])

  useEffect(() => {
    if (!interactionEnabled) {
      keyboardInputRef.current = STILL
      controllerInputRef.current = STILL
    }
  }, [interactionEnabled])

  const handleNearbyInteractionChange = useCallback(
    (interaction: WorldInteraction | null) => {
      setNearbyInteraction(interaction)
      onNearbyAreaChange?.(interaction?.area ?? null)
    },
    [onNearbyAreaChange],
  )

  const rootStyle = {
    position: 'relative',
    width: '100%',
    height: '100%',
    minHeight: 320,
    overflow: 'hidden',
    background: timeOfDay === 'night' ? '#101a35' : '#76566d',
    outline: 'none',
    ...style,
  } as const

  if (!webGLSupported) {
    return (
      <div className={className} style={rootStyle}>
        <WebGLFallback />
      </div>
    )
  }

  return (
    <div
      className={className}
      style={rootStyle}
      role="application"
      aria-label={ariaLabel}
      tabIndex={0}
      data-world-quality={qualityConfig.level}
      data-world-location={currentLocation ?? 'outside'}
    >
      <p style={visuallyHiddenStyle} aria-live="polite">
        {nearbyInteraction === null
          ? '近くに調べられる場所はありません。'
          : `${nearbyInteraction.area.label}の近くです。Eキー、Enterキー、Spaceキー、または調べるボタンで調べられます。`}
      </p>
      <Canvas
        camera={{
          position: [playerPosition.x + 11, 20, playerPosition.z + cameraZOffset],
          fov: 42,
          near: 0.1,
          far: 100,
        }}
        dpr={qualityConfig.dpr}
        shadows={qualityConfig.shadows ? 'basic' : false}
        frameloop={pageVisible ? 'always' : 'never'}
        gl={{
          antialias: qualityConfig.antialias,
          alpha: false,
          powerPreference: qualityConfig.level === 'low' ? 'default' : 'high-performance',
        }}
        fallback={<WebGLFallback />}
      >
        <SceneRuntime
          timeOfDay={timeOfDay}
          quality={qualityConfig}
          reducedMotion={reducedMotion}
          playerPosition={playerPosition}
          runtimePositionRef={runtimePositionRef}
          keyboardInputRef={keyboardInputRef}
          controllerInputRef={controllerInputRef}
          interactionEnabled={interactionEnabled}
          activeObjective={activeObjective}
          cameraZOffset={cameraZOffset}
          onPlayerMove={onPlayerMove}
          onNearbyInteractionChange={handleNearbyInteractionChange}
          {...(currentLocation === undefined ? {} : { currentLocation })}
        />
      </Canvas>
      {nearbyInteraction !== null ? (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 'max(18px, env(safe-area-inset-bottom))',
            transform: 'translateX(-50%)',
            maxWidth: 'min(82%, 440px)',
            padding: '9px 13px',
            color: '#fff6db',
            background: 'rgba(18, 25, 42, .86)',
            border: '1px solid rgba(240, 205, 139, .56)',
            borderRadius: 4,
            font: '600 14px/1.5 system-ui, sans-serif',
            textAlign: 'center',
            pointerEvents: 'none',
            boxShadow: '0 6px 22px rgba(0,0,0,.28)',
          }}
          data-testid="world-interaction-prompt"
        >
          <span aria-hidden="true">調べる ・ </span>
          {nearbyInteraction.area.label}
          {nearbyInteraction.isObjective ? ' ・ ◆ 現在の目的' : ''}
        </div>
      ) : null}
    </div>
  )
}

interface SceneRuntimeProps {
  readonly timeOfDay: WorldSceneProps['timeOfDay']
  readonly quality: ReturnType<typeof resolveWorldQuality>
  readonly reducedMotion: boolean
  readonly playerPosition: WorldPosition
  readonly runtimePositionRef: RefObject<WorldPosition>
  readonly keyboardInputRef: RefObject<WorldInputVector>
  readonly controllerInputRef: RefObject<WorldInputVector>
  readonly interactionEnabled: boolean
  readonly activeObjective: WorldSceneProps['activeObjective']
  readonly cameraZOffset: number
  readonly currentLocation?: WorldSceneProps['currentLocation']
  readonly onPlayerMove: (position: WorldPosition) => void
  readonly onNearbyInteractionChange: (interaction: WorldInteraction | null) => void
}

function SceneRuntime({
  timeOfDay,
  quality,
  reducedMotion,
  playerPosition,
  runtimePositionRef,
  keyboardInputRef,
  controllerInputRef,
  interactionEnabled,
  activeObjective,
  cameraZOffset,
  currentLocation,
  onPlayerMove,
  onNearbyInteractionChange,
}: SceneRuntimeProps) {
  const playerRef = useRef<Group>(null)
  const nearbyKeyRef = useRef<string>('')
  const desiredCamera = useMemo(() => new Vector3(), [])
  const cameraTarget = useMemo(() => new Vector3(), [])

  useEffect(() => {
    runtimePositionRef.current = playerPosition
    playerRef.current?.position.set(playerPosition.x, 0, playerPosition.z)
  }, [playerPosition, runtimePositionRef])

  useFrame((state, frameDelta) => {
    const camera = state.camera
    const keyboard = keyboardInputRef.current
    const controller = controllerInputRef.current
    const input = interactionEnabled
      ? clampInputVector({ x: keyboard.x + controller.x, z: keyboard.z + controller.z })
      : STILL
    const delta = Math.min(frameDelta, 0.05)
    const nextPosition = advancePlayer(runtimePositionRef.current, input, delta)

    if (!positionsEqual(nextPosition, runtimePositionRef.current)) {
      runtimePositionRef.current = nextPosition
      onPlayerMove(nextPosition)
    }

    if (playerRef.current !== null) {
      playerRef.current.position.set(nextPosition.x, 0, nextPosition.z)
      if (Math.hypot(input.x, input.z) > 0.01) {
        const desiredRotation = Math.atan2(input.x, input.z)
        playerRef.current.rotation.y = MathUtils.damp(
          playerRef.current.rotation.y,
          desiredRotation,
          reducedMotion ? 16 : 10,
          delta,
        )
      }
    }

    // A high, distant 2.5D angle keeps nearby roofs from hiding the player and
    // lets a dense block of the town remain legible on narrow screens.
    desiredCamera.set(nextPosition.x + 11, 20, nextPosition.z + cameraZOffset)
    const cameraDamping = reducedMotion ? 12 : 5.5
    camera.position.x = MathUtils.damp(camera.position.x, desiredCamera.x, cameraDamping, delta)
    camera.position.y = MathUtils.damp(camera.position.y, desiredCamera.y, cameraDamping, delta)
    camera.position.z = MathUtils.damp(camera.position.z, desiredCamera.z, cameraDamping, delta)
    cameraTarget.set(nextPosition.x, 0.75, nextPosition.z)
    camera.lookAt(cameraTarget)

    const nearby = findNearbyInteraction(nextPosition, activeObjective ?? null)
    const nearbyKey = nearby === null ? '' : `${nearby.area.id}:${String(nearby.isObjective)}`
    if (nearbyKey !== nearbyKeyRef.current) {
      nearbyKeyRef.current = nearbyKey
      onNearbyInteractionChange(nearby)
    }

    if (state.clock.elapsedTime < delta * 1.5) {
      camera.position.copy(desiredCamera)
      camera.lookAt(cameraTarget)
    }
  })

  return (
    <>
      <WorldEnvironment
        timeOfDay={timeOfDay}
        quality={quality}
        reducedMotion={reducedMotion}
        activeObjective={activeObjective ?? null}
        {...(currentLocation === undefined ? {} : { currentLocation })}
      />
      <PlayerAvatar playerRef={playerRef} />
    </>
  )
}

function getCameraZOffset(currentLocation: WorldSceneProps['currentLocation']): number {
  return currentLocation === 'station' ||
    currentLocation === 'bulletin-board' ||
    currentLocation === 'tsukikage-apartments' ||
    currentLocation === 'room-203'
    ? -16
    : 16
}

function PlayerAvatar({ playerRef }: { readonly playerRef: RefObject<Group | null> }) {
  return (
    <group ref={playerRef}>
      <mesh castShadow position={[0, 0.82, 0]}>
        <capsuleGeometry args={[0.3, 0.72, 5, 8]} />
        <meshStandardMaterial color="#263447" roughness={0.82} />
      </mesh>
      <mesh castShadow position={[0, 1.48, 0]}>
        <sphereGeometry args={[0.28, 10, 8]} />
        <meshStandardMaterial color="#d6c3aa" roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.9, 0.27]}>
        <boxGeometry args={[0.42, 0.5, 0.12]} />
        <meshStandardMaterial color="#788190" roughness={0.78} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]} receiveShadow>
        <circleGeometry args={[0.48, 16]} />
        <meshBasicMaterial color="#10151f" transparent opacity={0.28} />
      </mesh>
    </group>
  )
}

function useKeyboardInput(
  inputRef: RefObject<WorldInputVector>,
  enabled: boolean,
  performInteraction: () => void,
): void {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      inputRef.current = STILL
      return
    }

    const pressed = new Set<string>()
    const updateMovement = (): void => {
      inputRef.current = clampInputVector({
        x:
          Number(pressed.has('d') || pressed.has('arrowright')) -
          Number(pressed.has('a') || pressed.has('arrowleft')),
        z:
          Number(pressed.has('s') || pressed.has('arrowdown')) -
          Number(pressed.has('w') || pressed.has('arrowup')),
      })
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (isInteractiveTarget(event.target)) return
      const key = event.key.toLowerCase()
      if (isMovementKey(key)) {
        event.preventDefault()
        pressed.add(key)
        updateMovement()
        return
      }
      if (!event.repeat && (key === 'e' || key === 'enter' || key === ' ')) {
        event.preventDefault()
        performInteraction()
      }
    }
    const onKeyUp = (event: KeyboardEvent): void => {
      const key = event.key.toLowerCase()
      if (!isMovementKey(key)) return
      pressed.delete(key)
      updateMovement()
    }
    const reset = (): void => {
      pressed.clear()
      inputRef.current = STILL
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', reset)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', reset)
      reset()
    }
  }, [enabled, inputRef, performInteraction])
}

function isMovementKey(key: string): boolean {
  return (
    key === 'w' ||
    key === 'a' ||
    key === 's' ||
    key === 'd' ||
    key === 'arrowup' ||
    key === 'arrowleft' ||
    key === 'arrowdown' ||
    key === 'arrowright'
  )
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT' ||
    target.tagName === 'BUTTON' ||
    target.tagName === 'A' ||
    target.closest('[role="button"], [role="menuitem"], [role="dialog"]') !== null
  )
}

function useResolvedQuality(quality: WorldSceneProps['quality']) {
  const [environment, setEnvironment] = useState<WorldQualityEnvironment>(readQualityEnvironment)

  useEffect(() => {
    const update = (): void => setEnvironment(readQualityEnvironment())
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return useMemo(() => resolveWorldQuality(quality ?? 'auto', environment), [environment, quality])
}

function readQualityEnvironment(): WorldQualityEnvironment {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      viewportWidth: 1024,
      devicePixelRatio: 1,
      hardwareConcurrency: 4,
    }
  }
  const memoryNavigator = navigator as Navigator & { readonly deviceMemory?: number }
  const base = {
    viewportWidth: window.innerWidth,
    devicePixelRatio: window.devicePixelRatio || 1,
    hardwareConcurrency: navigator.hardwareConcurrency || 4,
  }
  return memoryNavigator.deviceMemory === undefined
    ? base
    : { ...base, deviceMemory: memoryNavigator.deviceMemory }
}

function usePageVisibility(): boolean {
  const [visible, setVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState !== 'hidden',
  )

  useEffect(() => {
    const update = (): void => setVisible(document.visibilityState !== 'hidden')
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  return visible
}

function WebGLFallback() {
  return (
    <section
      role="alert"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeContent: 'center',
        gap: 12,
        padding: 28,
        color: '#fff2d0',
        background: 'linear-gradient(#17233d, #2f3548)',
        textAlign: 'center',
        font: '16px/1.7 system-ui, sans-serif',
      }}
    >
      <strong style={{ fontSize: 20 }}>町の立体地図を開けませんでした</strong>
      <span>
        このブラウザではWebGLを利用できないか、描画機能が無効です。
        ブラウザのハードウェアアクセラレーションを有効にして、もう一度お試しください。
      </span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        style={{
          justifySelf: 'center',
          minWidth: 144,
          minHeight: 44,
          border: '1px solid #efd49b',
          borderRadius: 4,
          color: '#17233d',
          background: '#f4dfad',
          font: '700 15px system-ui, sans-serif',
          cursor: 'pointer',
        }}
      >
        再読み込み
      </button>
    </section>
  )
}
