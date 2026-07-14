import { applyEffects } from '../engine'
import { ENDING_IDS, FLAG_IDS } from '../ids'
import { createInitialGameState } from '../state'
import { resolveEnding } from '.'

const NOW = new Date('2026-07-15T09:00:00.000Z')

describe('ending resolution', () => {
  it('reaches Ending A with trust, understanding and returning the name', () => {
    const ready = applyEffects(createInitialGameState('澄', NOW), [
      { kind: 'addTrust', characterId: 'sumi', amount: 3 },
      { kind: 'addTrust', characterId: 'akari', amount: 3 },
      { kind: 'addTrust', characterId: 'kanade', amount: 3 },
      { kind: 'addTrust', characterId: 'ren', amount: 3 },
      { kind: 'setFlag', flagId: FLAG_IDS.MINATO_WISH_UNDERSTOOD, value: true },
    ])

    const result = resolveEnding(ready, 'return_name')
    expect(result.endingId).toBe(ENDING_IDS.A)
    expect(result.state.reachedEndings).toContain(ENDING_IDS.A)
  })

  it('reaches Ending B with ten pieces of evidence taken outside', () => {
    const effects = Array.from({ length: 10 }, (_, index) => ({
      kind: 'discoverClue' as const,
      clueId: `evidence_${index}`,
    }))
    const result = resolveEnding(
      applyEffects(createInitialGameState('灯', NOW), effects),
      'take_outside',
    )

    expect(result.endingId).toBe(ENDING_IDS.B)
  })

  it('reaches Ending C after reading the letters and recovering room 204', () => {
    const ready = applyEffects(createInitialGameState('こよみ', NOW), [
      { kind: 'setFlag', flagId: FLAG_IDS.ALL_ANONYMOUS_LETTERS_READ, value: true },
      { kind: 'setFlag', flagId: FLAG_IDS.ROOM_204_RECORD_RECOVERED, value: true },
    ])

    expect(resolveEnding(ready, 'inherit_role').endingId).toBe(ENDING_IDS.C)
  })

  it('falls back to Ending D when a chosen route lacks its evidence', () => {
    const result = resolveEnding(createInitialGameState('旅人', NOW), 'return_name')

    expect(result.endingId).toBe(ENDING_IDS.D)
  })
})
