import type { GameState, QuestProgress } from '../state'
import { updateIfChanged } from '../engine/stateHelpers'

const timestampFor = (state: GameState, at?: string): string => at ?? state.updatedAt

export const startQuest = (state: GameState, questId: string, at?: string): GameState => {
  if (state.quests[questId] !== undefined) return state
  const timestamp = timestampFor(state, at)
  const progress: QuestProgress = {
    status: 'active',
    step: 0,
    startedAt: timestamp,
    completedAt: null,
  }
  return updateIfChanged(
    state,
    { ...state, quests: { ...state.quests, [questId]: progress } },
    timestamp,
  )
}

export const advanceQuest = (state: GameState, questId: string, step?: number): GameState => {
  const current = state.quests[questId]
  if (current?.status !== 'active') return state
  const nextStep = step ?? current.step + 1
  if (nextStep <= current.step) return state
  return updateIfChanged(state, {
    ...state,
    quests: { ...state.quests, [questId]: { ...current, step: nextStep } },
  })
}

export const completeQuest = (state: GameState, questId: string, at?: string): GameState => {
  const current = state.quests[questId]
  if (current?.status !== 'active') return state
  const timestamp = timestampFor(state, at)
  return updateIfChanged(
    state,
    {
      ...state,
      quests: {
        ...state.quests,
        [questId]: { ...current, status: 'completed', completedAt: timestamp },
      },
    },
    timestamp,
  )
}

export const failQuest = (state: GameState, questId: string, at?: string): GameState => {
  const current = state.quests[questId]
  if (current?.status !== 'active') return state
  const timestamp = timestampFor(state, at)
  return updateIfChanged(
    state,
    {
      ...state,
      quests: {
        ...state.quests,
        [questId]: { ...current, status: 'failed', completedAt: timestamp },
      },
    },
    timestamp,
  )
}
