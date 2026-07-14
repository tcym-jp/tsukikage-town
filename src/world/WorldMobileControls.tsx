import { useCallback, useEffect, useRef } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import type { WorldInputController } from './types'

export interface WorldMobileControlsProps {
  readonly controller: WorldInputController
  readonly disabled?: boolean
  readonly className?: string
  readonly style?: CSSProperties
  readonly interactionLabel?: string
}

const rootStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 4,
  pointerEvents: 'none',
  touchAction: 'none',
  userSelect: 'none',
}

const padStyle: CSSProperties = {
  position: 'absolute',
  left: 'max(18px, env(safe-area-inset-left))',
  bottom: 'max(18px, env(safe-area-inset-bottom))',
  width: 116,
  height: 116,
  borderRadius: '50%',
  border: '1px solid rgba(255, 244, 211, .55)',
  background: 'rgba(17, 27, 49, .58)',
  boxShadow: 'inset 0 0 0 10px rgba(255,255,255,.035), 0 8px 24px rgba(0,0,0,.24)',
  backdropFilter: 'blur(4px)',
  pointerEvents: 'auto',
  touchAction: 'none',
}

const knobBaseStyle: CSSProperties = {
  position: 'absolute',
  left: '50%',
  top: '50%',
  width: 48,
  height: 48,
  marginLeft: -24,
  marginTop: -24,
  borderRadius: '50%',
  background: 'rgba(246, 224, 171, .88)',
  border: '2px solid rgba(38, 46, 66, .62)',
  boxShadow: '0 3px 10px rgba(0,0,0,.24)',
  pointerEvents: 'none',
}

const actionStyle: CSSProperties = {
  position: 'absolute',
  right: 'max(18px, env(safe-area-inset-right))',
  bottom: 'max(28px, env(safe-area-inset-bottom))',
  width: 76,
  minHeight: 76,
  borderRadius: '50%',
  border: '1px solid rgba(255, 244, 211, .7)',
  color: '#fff4d3',
  background: 'rgba(80, 60, 73, .86)',
  boxShadow: '0 8px 24px rgba(0,0,0,.28)',
  font: '700 15px/1.2 system-ui, sans-serif',
  letterSpacing: '.08em',
  pointerEvents: 'auto',
  touchAction: 'manipulation',
}

export function WorldMobileControls({
  controller,
  disabled = false,
  className,
  style,
  interactionLabel = '調べる',
}: WorldMobileControlsProps) {
  const padRef = useRef<HTMLDivElement>(null)
  const knobRef = useRef<HTMLSpanElement>(null)
  const activePointerRef = useRef<number | null>(null)

  const updateFromPointer = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const pad = padRef.current
      if (pad === null || disabled) {
        return
      }
      const bounds = pad.getBoundingClientRect()
      const radius = bounds.width * 0.36
      const offsetX = event.clientX - (bounds.left + bounds.width / 2)
      const offsetY = event.clientY - (bounds.top + bounds.height / 2)
      const length = Math.hypot(offsetX, offsetY)
      const scale = length > radius ? radius / length : 1
      const visual = { x: offsetX * scale, z: offsetY * scale }
      const movement = { x: visual.x / radius, z: visual.z / radius }
      if (knobRef.current !== null) {
        knobRef.current.style.transform = `translate(${String(visual.x)}px, ${String(visual.z)}px)`
      }
      controller.setMovement(movement)
    },
    [controller, disabled],
  )

  const release = useCallback(
    (event?: ReactPointerEvent<HTMLDivElement>) => {
      if (event !== undefined && activePointerRef.current !== event.pointerId) {
        return
      }
      activePointerRef.current = null
      if (knobRef.current !== null) {
        knobRef.current.style.transform = 'translate(0, 0)'
      }
      controller.reset()
    },
    [controller],
  )

  useEffect(() => {
    if (disabled) {
      controller.reset()
      if (knobRef.current !== null) {
        knobRef.current.style.transform = 'translate(0, 0)'
      }
    }
  }, [controller, disabled])

  return (
    <div className={className} style={{ ...rootStyle, ...style }} aria-label="町のタッチ操作">
      <div
        ref={padRef}
        style={{ ...padStyle, opacity: disabled ? 0.45 : 1 }}
        role="group"
        aria-label="移動スティック"
        onContextMenu={(event) => event.preventDefault()}
        onPointerDown={(event) => {
          if (disabled) return
          activePointerRef.current = event.pointerId
          event.currentTarget.setPointerCapture(event.pointerId)
          updateFromPointer(event)
        }}
        onPointerMove={(event) => {
          if (activePointerRef.current === event.pointerId) updateFromPointer(event)
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onLostPointerCapture={release}
      >
        <span
          ref={knobRef}
          aria-hidden="true"
          style={{ ...knobBaseStyle, transform: 'translate(0, 0)' }}
        />
      </div>
      <button
        type="button"
        style={{ ...actionStyle, opacity: disabled ? 0.45 : 1 }}
        disabled={disabled}
        onClick={() => controller.requestInteraction()}
      >
        {interactionLabel}
      </button>
    </div>
  )
}
