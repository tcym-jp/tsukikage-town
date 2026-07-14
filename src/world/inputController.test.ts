import { describe, expect, it, vi } from 'vitest'
import { createWorldInputController } from './inputController'

describe('world input controller', () => {
  it('clamps virtual-stick movement and notifies subscribers', () => {
    const controller = createWorldInputController()
    const listener = vi.fn()
    controller.subscribe(listener)

    controller.setMovement({ x: 2, z: 2 })

    expect(
      Math.hypot(controller.getSnapshot().movement.x, controller.getSnapshot().movement.z),
    ).toBeCloseTo(1)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('emits a distinct interaction sequence and can reset movement', () => {
    const controller = createWorldInputController()
    controller.setMovement({ x: -1, z: 0 })
    controller.requestInteraction()
    controller.requestInteraction()

    expect(controller.getSnapshot().interactionSequence).toBe(2)
    controller.reset()
    expect(controller.getSnapshot().movement).toEqual({ x: 0, z: 0 })
  })

  it('unsubscribes without leaking notifications', () => {
    const controller = createWorldInputController()
    const listener = vi.fn()
    const unsubscribe = controller.subscribe(listener)
    unsubscribe()

    controller.requestInteraction()
    expect(listener).not.toHaveBeenCalled()
  })
})
