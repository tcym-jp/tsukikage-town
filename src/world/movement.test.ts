import { describe, expect, it } from 'vitest'
import {
  advancePlayer,
  circleIntersectsCollider,
  clampInputVector,
  isPositionWalkable,
  moveWithCollisions,
  PLAYER_RADIUS,
} from './movement'
import type { WorldBounds, WorldCollider } from './types'
import { WORLD_AREAS } from './worldData'

const OPEN_BOUNDS: WorldBounds = {
  minX: -20,
  maxX: 20,
  minZ: -20,
  maxZ: 20,
}

describe('world movement', () => {
  it('normalizes diagonal input so it is not faster than cardinal input', () => {
    const normalized = clampInputVector({ x: 1, z: 1 })

    expect(Math.hypot(normalized.x, normalized.z)).toBeCloseTo(1)
    expect(normalized.x).toBeCloseTo(Math.SQRT1_2)
    expect(normalized.z).toBeCloseTo(Math.SQRT1_2)
  })

  it('advances at a stable configured speed', () => {
    const result = advancePlayer({ x: 0, z: 0 }, { x: 1, z: 0 }, 0.1, {
      speed: 4,
      bounds: OPEN_BOUNDS,
      colliders: [],
    })

    expect(result).toEqual({ x: 0.4, z: 0 })
  })

  it('clamps the player circle inside the world boundary', () => {
    const bounds: WorldBounds = { minX: -2, maxX: 2, minZ: -2, maxZ: 2 }
    const result = moveWithCollisions({ x: 0, z: 0 }, { x: 10, z: -10 }, { bounds, colliders: [] })

    expect(result.x).toBeCloseTo(2 - PLAYER_RADIUS)
    expect(result.z).toBeCloseTo(-2 + PLAYER_RADIUS)
  })

  it('cannot tunnel through a building even with a large displacement', () => {
    const building: WorldCollider = {
      id: 'test-building',
      minX: 1,
      maxX: 3,
      minZ: -1,
      maxZ: 1,
    }
    const result = moveWithCollisions(
      { x: 0, z: 0 },
      { x: 5, z: 0 },
      { bounds: OPEN_BOUNDS, colliders: [building] },
    )

    expect(result.x).toBeLessThanOrEqual(1 - PLAYER_RADIUS)
    expect(circleIntersectsCollider(result, PLAYER_RADIUS, building)).toBe(false)
  })

  it('slides along a wall rather than locking both axes', () => {
    const wall: WorldCollider = {
      id: 'wall',
      minX: 0.8,
      maxX: 3,
      minZ: -1,
      maxZ: 3,
    }
    const result = moveWithCollisions(
      { x: 0, z: 0 },
      { x: 2, z: 2 },
      { bounds: OPEN_BOUNDS, colliders: [wall] },
    )

    expect(result.x).toBeLessThan(0.8)
    expect(result.z).toBeCloseTo(2)
  })

  it('keeps every required area entrance in walkable space', () => {
    for (const area of WORLD_AREAS) {
      expect(isPositionWalkable(area.position), area.label).toBe(true)
    }
  })
})
