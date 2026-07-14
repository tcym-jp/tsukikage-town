import type { WorldBounds, WorldCollider, WorldInputVector, WorldPosition } from './types'
import { WORLD_BOUNDS, WORLD_COLLIDERS } from './worldData'

export const PLAYER_RADIUS = 0.42
export const PLAYER_SPEED = 4.35

const MAX_SUBSTEP_DISTANCE = 0.18
const POSITION_EPSILON = 0.000_001

export interface MovePlayerOptions {
  readonly speed?: number
  readonly radius?: number
  readonly bounds?: WorldBounds
  readonly colliders?: readonly WorldCollider[]
}

export function clampInputVector(input: WorldInputVector): WorldInputVector {
  const length = Math.hypot(input.x, input.z)
  if (length <= 1 || length === 0) {
    return input
  }

  return { x: input.x / length, z: input.z / length }
}

export function circleIntersectsCollider(
  position: WorldPosition,
  radius: number,
  collider: WorldCollider,
): boolean {
  const closestX = Math.max(collider.minX, Math.min(position.x, collider.maxX))
  const closestZ = Math.max(collider.minZ, Math.min(position.z, collider.maxZ))
  const deltaX = position.x - closestX
  const deltaZ = position.z - closestZ
  return deltaX * deltaX + deltaZ * deltaZ < radius * radius - POSITION_EPSILON
}

export function isPositionWalkable(
  position: WorldPosition,
  radius = PLAYER_RADIUS,
  bounds: WorldBounds = WORLD_BOUNDS,
  colliders: readonly WorldCollider[] = WORLD_COLLIDERS,
): boolean {
  if (
    position.x - radius < bounds.minX ||
    position.x + radius > bounds.maxX ||
    position.z - radius < bounds.minZ ||
    position.z + radius > bounds.maxZ
  ) {
    return false
  }

  return !colliders.some((collider) => circleIntersectsCollider(position, radius, collider))
}

export function moveWithCollisions(
  start: WorldPosition,
  displacement: WorldInputVector,
  options: MovePlayerOptions = {},
): WorldPosition {
  const speedIndependentDistance = Math.hypot(displacement.x, displacement.z)
  if (speedIndependentDistance <= POSITION_EPSILON) {
    return start
  }

  const radius = options.radius ?? PLAYER_RADIUS
  const bounds = options.bounds ?? WORLD_BOUNDS
  const colliders = options.colliders ?? WORLD_COLLIDERS
  const stepCount = Math.max(1, Math.ceil(speedIndependentDistance / MAX_SUBSTEP_DISTANCE))
  const stepX = displacement.x / stepCount
  const stepZ = displacement.z / stepCount
  let result = start

  for (let index = 0; index < stepCount; index += 1) {
    const xCandidate = clampToBounds({ x: result.x + stepX, z: result.z }, radius, bounds)
    if (isPositionWalkable(xCandidate, radius, bounds, colliders)) {
      result = xCandidate
    }

    const zCandidate = clampToBounds({ x: result.x, z: result.z + stepZ }, radius, bounds)
    if (isPositionWalkable(zCandidate, radius, bounds, colliders)) {
      result = zCandidate
    }
  }

  return result
}

export function advancePlayer(
  start: WorldPosition,
  input: WorldInputVector,
  deltaSeconds: number,
  options: MovePlayerOptions = {},
): WorldPosition {
  const direction = clampInputVector(input)
  const speed = options.speed ?? PLAYER_SPEED
  const safeDelta = Math.max(0, Math.min(deltaSeconds, 0.25))

  return moveWithCollisions(
    start,
    { x: direction.x * speed * safeDelta, z: direction.z * speed * safeDelta },
    options,
  )
}

export function positionsEqual(
  first: WorldPosition,
  second: WorldPosition,
  epsilon = 0.0001,
): boolean {
  return Math.abs(first.x - second.x) <= epsilon && Math.abs(first.z - second.z) <= epsilon
}

function clampToBounds(
  position: WorldPosition,
  radius: number,
  bounds: WorldBounds,
): WorldPosition {
  return {
    x: Math.max(bounds.minX + radius, Math.min(position.x, bounds.maxX - radius)),
    z: Math.max(bounds.minZ + radius, Math.min(position.z, bounds.maxZ - radius)),
  }
}
