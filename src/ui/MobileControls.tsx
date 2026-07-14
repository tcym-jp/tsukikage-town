import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

export interface MovementVector {
  x: number
  z: number
}

interface MobileControlsProps {
  disabled: boolean
  interactionLabel?: string
  onMove: (vector: MovementVector) => void
  onInteract: () => void
}

export function MobileControls({
  disabled,
  interactionLabel,
  onMove,
  onInteract,
}: MobileControlsProps) {
  const baseRef = useRef<HTMLDivElement>(null)
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const pointerId = useRef<number | undefined>(undefined)

  useEffect(() => () => onMove({ x: 0, z: 0 }), [onMove])

  const update = (event: ReactPointerEvent<HTMLDivElement>) => {
    const base = baseRef.current
    if (!base) return
    const rect = base.getBoundingClientRect()
    const radius = rect.width / 2
    const dx = event.clientX - (rect.left + radius)
    const dy = event.clientY - (rect.top + radius)
    const length = Math.hypot(dx, dy)
    const scale = length > radius ? radius / length : 1
    const x = dx * scale
    const y = dy * scale
    setKnob({ x, y })
    onMove({ x: x / radius, z: y / radius })
  }

  const start = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled) return
    pointerId.current = event.pointerId
    event.currentTarget.setPointerCapture(event.pointerId)
    update(event)
  }

  const stop = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== event.pointerId) return
    pointerId.current = undefined
    setKnob({ x: 0, y: 0 })
    onMove({ x: 0, z: 0 })
  }

  return (
    <div
      className={`mobile-controls ${disabled ? 'mobile-controls--disabled' : ''}`}
      aria-hidden={disabled}
    >
      <div
        ref={baseRef}
        className="joystick"
        onPointerDown={start}
        onPointerMove={(event) => {
          if (pointerId.current === event.pointerId) update(event)
        }}
        onPointerUp={stop}
        onPointerCancel={stop}
        role="application"
        aria-label="移動スティック"
        data-testid="mobile-joystick"
      >
        <span className="joystick__arrows" aria-hidden="true">
          ‹　›
        </span>
        <i style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
      </div>
      <button
        type="button"
        className="mobile-interact"
        disabled={disabled || !interactionLabel}
        onClick={onInteract}
        aria-label={
          interactionLabel ? `${interactionLabel}を調べる` : '近くに調べられるものはありません'
        }
      >
        <span aria-hidden="true">調</span>
        <small>{interactionLabel ?? '調べる'}</small>
      </button>
    </div>
  )
}
