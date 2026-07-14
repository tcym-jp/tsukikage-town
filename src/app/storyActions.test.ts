import { createInitialGameState } from '../game'
import { locationIds } from '../content/contentIds'
import {
  STORY_ACTIONS,
  canAdvanceStory,
  completeStoryAction,
  getAvailableStoryActions,
  getStoryBeat,
} from './storyActions'
import { personalizeText } from './adapters'

describe('story actions', () => {
  it('starts at Day 0 evening with station and registration requirements', () => {
    const state = createInitialGameState('テスト')
    expect(getStoryBeat(state).requiredActionIds).toEqual(['d0_station_arrival', 'd0_register'])
    expect(
      getAvailableStoryActions(state, locationIds.station).map((action) => action.id),
    ).toContain('d0_station_arrival')
    expect(canAdvanceStory(state)).toBe(false)
  })

  it('marks actions idempotently and opens time progression', () => {
    let state = createInitialGameState('テスト')
    for (const id of ['d0_station_arrival', 'd0_register']) {
      const action = STORY_ACTIONS.find((candidate) => candidate.id === id)
      expect(action).toBeDefined()
      if (action === undefined) throw new Error(`Action not found: ${id}`)
      state = completeStoryAction(state, action)
    }
    expect(canAdvanceStory(state)).toBe(true)
    expect(state.discoveredClues).toContain('clock_1113')
    expect(state.unlockedLocations).toContain(locationIds.tsukikageHeights)
  })

  it('authors at least one required beat for every playable clock slot', () => {
    const playable = new Set(
      STORY_ACTIONS.map((action) => `${action.day}:${action.periods.join(',')}`),
    )
    expect(playable.size).toBeGreaterThanOrEqual(22)
    expect(STORY_ACTIONS.some((action) => action.kind === 'final')).toBe(true)
  })

  it('personalizes the registration conversation with the submitted name', () => {
    const registration = STORY_ACTIONS.find((action) => action.id === 'd0_register')
    expect(registration).toBeDefined()
    expect(personalizeText(registration?.lines[0] ?? '', '月野🌙')).toContain('月野🌙さん')
  })
})
