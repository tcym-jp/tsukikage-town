import type { WorldArea, WorldAreaId, WorldInteraction, WorldPosition } from './types'
import { WORLD_AREAS } from './worldData'

export function distanceBetween(first: WorldPosition, second: WorldPosition): number {
  return Math.hypot(first.x - second.x, first.z - second.z)
}

export function getAreaById(id: WorldAreaId): WorldArea {
  const area = WORLD_AREAS.find((candidate) => candidate.id === id)
  if (area === undefined) {
    throw new Error(`Unknown world area: ${id}`)
  }
  return area
}

export function findNearbyInteraction(
  position: WorldPosition,
  activeObjective: WorldAreaId | null = null,
  areas: readonly WorldArea[] = WORLD_AREAS,
): WorldInteraction | null {
  const candidates = areas
    .map((area) => ({
      area,
      distance: distanceBetween(position, area.position),
      isObjective: area.id === activeObjective,
    }))
    .filter((candidate) => candidate.distance <= candidate.area.interactionRadius)
    .sort((first, second) => {
      const objectiveDifference = Number(second.isObjective) - Number(first.isObjective)
      return objectiveDifference !== 0 ? objectiveDifference : first.distance - second.distance
    })

  return candidates[0] ?? null
}

export function findNearestArea(
  position: WorldPosition,
  areas: readonly WorldArea[] = WORLD_AREAS,
): WorldArea {
  const firstArea = areas[0]
  if (firstArea === undefined) {
    throw new Error('World area list must not be empty')
  }

  return areas.reduce((nearest, area) =>
    distanceBetween(position, area.position) < distanceBetween(position, nearest.position)
      ? area
      : nearest,
  )
}
