import type {
  WorldInputController,
  WorldInputListener,
  WorldInputSnapshot,
  WorldInputVector,
} from './types'
import { clampInputVector } from './movement'

const STILL: WorldInputVector = { x: 0, z: 0 }

export function createWorldInputController(): WorldInputController {
  const listeners = new Set<WorldInputListener>()
  let snapshot: WorldInputSnapshot = {
    movement: STILL,
    interactionSequence: 0,
  }

  const emit = (): void => {
    listeners.forEach((listener) => {
      listener(snapshot)
    })
  }

  return {
    getSnapshot: () => snapshot,
    setMovement: (movement) => {
      const nextMovement = clampInputVector(movement)
      if (nextMovement.x === snapshot.movement.x && nextMovement.z === snapshot.movement.z) {
        return
      }
      snapshot = { ...snapshot, movement: nextMovement }
      emit()
    },
    requestInteraction: () => {
      snapshot = {
        ...snapshot,
        interactionSequence: snapshot.interactionSequence + 1,
      }
      emit()
    },
    reset: () => {
      if (snapshot.movement.x === 0 && snapshot.movement.z === 0) {
        return
      }
      snapshot = { ...snapshot, movement: STILL }
      emit()
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
