import { createInitialGameState } from '../game'
import { WORLD_AREAS } from '../world'
import {
  GAME_TO_WORLD_LOCATION,
  WORLD_TO_GAME_LOCATION,
  toGameLocationId,
  toWorldLocationId,
  personalizeText,
  validateGameCatalogReferences,
} from './adapters'

describe('location adapters', () => {
  it('maps every one of the nine world destinations to a canonical content ID and back', () => {
    expect(Object.keys(WORLD_TO_GAME_LOCATION)).toHaveLength(9)
    expect(Object.keys(GAME_TO_WORLD_LOCATION)).toHaveLength(9)
    for (const area of WORLD_AREAS) {
      const gameId = toGameLocationId(area.id)
      expect(toWorldLocationId(gameId)).toBe(area.id)
    }
  })

  it('rejects unknown catalog IDs from an otherwise structural save', () => {
    const game = createInitialGameState('テスト')
    expect(validateGameCatalogReferences(game)).toEqual([])
    expect(validateGameCatalogReferences({ ...game, currentLocationId: 'unknown-place' })).toEqual([
      'currentLocationId: 不明なID「unknown-place」',
    ])
  })

  it('personalizes authored text without interpreting it as markup', () => {
    expect(personalizeText('{{playerName}}様へ', '<img onerror=alert(1)>')).toBe(
      '<img onerror=alert(1)>様へ',
    )
  })
})
