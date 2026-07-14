import { evaluateCondition } from '../engine'
import type { Condition } from '../engine'
import type { Day, GameClock, GameState, TimeOfDay } from '../state'
import { updateIfChanged } from '../engine/stateHelpers'

const PERIOD_ORDER: readonly TimeOfDay[] = ['morning', 'evening', 'night']

export const nextClock = (clock: GameClock): GameClock | null => {
  const index = PERIOD_ORDER.indexOf(clock.period)
  const nextPeriod = PERIOD_ORDER[index + 1]
  if (nextPeriod !== undefined) return { day: clock.day, period: nextPeriod }
  if (clock.day === 7) return null
  return { day: (clock.day + 1) as Day, period: 'morning' }
}

export interface ProgressionGate {
  readonly id: string
  readonly day: Day
  readonly period: TimeOfDay
  readonly condition: Condition
  readonly blockedMessage: string
}

export type AdvanceTimeResult =
  | { readonly advanced: true; readonly state: GameState; readonly previousClock: GameClock }
  | {
      readonly advanced: false
      readonly state: GameState
      readonly reason: 'gate' | 'story-complete'
      readonly blockedMessage: string
      readonly failedGateIds: readonly string[]
    }

export const getFailedProgressionGates = (
  state: GameState,
  gates: readonly ProgressionGate[],
): readonly ProgressionGate[] =>
  gates.filter(
    (gate) =>
      gate.day === state.clock.day &&
      gate.period === state.clock.period &&
      !evaluateCondition(state, gate.condition),
  )

export const advanceTime = (
  state: GameState,
  gates: readonly ProgressionGate[] = [],
): AdvanceTimeResult => {
  const failed = getFailedProgressionGates(state, gates)
  if (failed.length > 0) {
    return {
      advanced: false,
      state,
      reason: 'gate',
      blockedMessage: failed.map((gate) => gate.blockedMessage).join('\n'),
      failedGateIds: failed.map((gate) => gate.id),
    }
  }
  const next = nextClock(state.clock)
  if (next === null) {
    return {
      advanced: false,
      state,
      reason: 'story-complete',
      blockedMessage: '七日間の物語は完了しています。',
      failedGateIds: [],
    }
  }
  return {
    advanced: true,
    previousClock: state.clock,
    state: updateIfChanged(state, { ...state, clock: next }),
  }
}

export const createNightGate = (
  id: string,
  day: Day,
  condition: Condition,
  blockedMessage: string,
): ProgressionGate => ({ id, day, period: 'night', condition, blockedMessage })
