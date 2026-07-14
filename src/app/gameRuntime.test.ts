import { applyEffects, createInitialGameState } from '../game'
import { evaluateAllAchievements, mergePersistentRecords, rewindToDaySeven } from './gameRuntime'

describe('game runtime persistence', () => {
  it('preserves ending records when starting another transfer', () => {
    const previous = { ...createInitialGameState('一周目'), reachedEndings: ['A', 'B'] }
    const next = mergePersistentRecords(createInitialGameState('二周目'), previous)
    expect(next.reachedEndings).toEqual(['A', 'B'])
  })

  it('rewinds final-day actions while retaining reached endings', () => {
    const snapshot = {
      ...createInitialGameState('月野'),
      clock: { day: 7 as const, period: 'morning' as const },
    }
    const completed = applyEffects(snapshot, [
      { kind: 'setFlag', flagId: 'story_action:d7_recording', value: true },
      { kind: 'setFinalChoice', value: 'return_name' },
    ])
    const current = { ...completed, currentEndingId: 'A', reachedEndings: ['A'] }
    const rewound = rewindToDaySeven(snapshot, current)
    expect(rewound.clock).toEqual({ day: 7, period: 'morning' })
    expect(rewound.finalChoice).toBeNull()
    expect(rewound.reachedEndings).toContain('A')
    expect(rewound.flags['story_action:d7_recording']).not.toBe(true)
  })

  it('evaluates authored achievements without duplicating IDs', () => {
    const state = applyEffects(createInitialGameState('月野'), [
      { kind: 'setFlag', flagId: 'registered', value: true },
    ])
    const once = evaluateAllAchievements(state)
    const twice = evaluateAllAchievements(once)
    expect(once.unlockedAchievements).toContain('new_resident')
    expect(twice.unlockedAchievements).toEqual(once.unlockedAchievements)
  })
})
