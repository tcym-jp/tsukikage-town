import { describe, expect, it } from 'vitest'
import { findNearbyInteraction, findNearestArea, getAreaById } from './interaction'
import type { WorldArea } from './types'
import { WORLD_AREAS } from './worldData'

describe('world interactions', () => {
  it('defines each of the nine required destinations exactly once', () => {
    expect(WORLD_AREAS).toHaveLength(9)
    expect(new Set(WORLD_AREAS.map((area) => area.id)).size).toBe(9)
    expect(WORLD_AREAS.map((area) => area.id)).toEqual([
      'station',
      'town-hall',
      'moon-street',
      'bulletin-board',
      'toka-books',
      'yoimachi-cafe',
      'tsukikage-apartments',
      'room-203',
      'broadcast-tower',
    ])
  })

  it('returns the nearest target in range', () => {
    const interaction = findNearbyInteraction({ x: -13, z: 3 })

    expect(interaction?.area.id).toBe('station')
    expect(interaction?.distance).toBeLessThan(0.2)
  })

  it('prefers an active objective when interaction ranges overlap', () => {
    const overlappingAreas: readonly WorldArea[] = [
      {
        id: 'station',
        label: 'near',
        shortLabel: 'near',
        description: 'near',
        position: { x: 0.1, z: 0 },
        interactionRadius: 2,
        mapOrder: 1,
      },
      {
        id: 'town-hall',
        label: 'objective',
        shortLabel: 'objective',
        description: 'objective',
        position: { x: 0.8, z: 0 },
        interactionRadius: 2,
        mapOrder: 2,
      },
    ]

    expect(findNearbyInteraction({ x: 0, z: 0 }, 'town-hall', overlappingAreas)?.area.id).toBe(
      'town-hall',
    )
  })

  it('finds the closest location and resolves IDs', () => {
    expect(findNearestArea({ x: 7, z: -3.4 }).id).toBe('yoimachi-cafe')
    expect(getAreaById('room-203').label).toContain('203')
  })
})
