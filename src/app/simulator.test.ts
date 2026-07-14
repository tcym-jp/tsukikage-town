import { ACHIEVEMENT_IDS, FLAG_IDS } from '../game'
import { STORY_ACTIONS } from './storyActions'
import { simulateCompleteStory } from './simulator'

describe('full story reachability simulator', () => {
  const simulation = simulateCompleteStory()

  it('passes every playable period gate from Day 0 evening through Day 7 night', () => {
    expect(simulation.periods).toHaveLength(23)
    expect(simulation.periods[0]).toMatchObject({ day: 0, period: 'evening' })
    expect(simulation.periods.at(-1)).toMatchObject({ day: 7, period: 'night' })
    expect(simulation.verifiedGateCount).toBe(23)

    const nonFinalActionIds = STORY_ACTIONS.filter(
      (action) => action.id !== 'd7_final_decision',
    ).map((action) => action.id)
    expect(new Set(simulation.completedActionIds)).toEqual(new Set(nonFinalActionIds))
  })

  it('collects all fifteen clues and the evidence required by the three main endings', () => {
    const state = simulation.preEndingState
    expect(state.discoveredClues).toHaveLength(15)
    expect(state.flags[FLAG_IDS.MINATO_WISH_UNDERSTOOD]).toBe(true)
    expect(state.flags[FLAG_IDS.ROOM_204_RECORD_RECOVERED]).toBe(true)
    expect(state.flags[FLAG_IDS.ALL_ANONYMOUS_LETTERS_READ]).toBe(true)
    expect(
      Object.values(state.trust).reduce((sum, trust) => sum + trust, 0),
    ).toBeGreaterThanOrEqual(12)
  })

  it.each(['A', 'B', 'C'] as const)('reaches Ending %s from the final checkpoint', (ending) => {
    expect(simulation.endingStates[ending].currentEndingId).toBe(ending)
    expect(simulation.endingStates[ending].reachedEndings).toContain(ending)
  })

  it('retains all ending records and their achievement through save export/import', () => {
    expect(simulation.retainedRecordState.reachedEndings).toEqual(
      expect.arrayContaining(['A', 'B', 'C']),
    )
    expect(simulation.restoredRecordState.reachedEndings).toEqual(
      expect.arrayContaining(['A', 'B', 'C']),
    )
    expect(simulation.restoredRecordState.unlockedAchievements).toContain(
      ACHIEVEMENT_IDS.THREE_ENDINGS,
    )
  })
})
