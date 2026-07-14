import { ENDING_IDS, FLAG_IDS } from '../ids'
import { evaluateCondition, type Condition } from '../engine'
import { appendUnique, updateIfChanged } from '../engine/stateHelpers'
import type { FinalChoice, GameState } from '../state'

export interface EndingRule {
  readonly id: string
  readonly condition: Condition
  readonly priority: number
}

export const DEFAULT_ENDING_RULES: readonly EndingRule[] = [
  {
    id: ENDING_IDS.A,
    priority: 40,
    condition: {
      kind: 'all',
      conditions: [
        { kind: 'finalChoice', value: 'return_name' },
        { kind: 'totalTrust', comparison: 'gte', value: 12 },
        { kind: 'flag', flagId: FLAG_IDS.MINATO_WISH_UNDERSTOOD, value: true },
      ],
    },
  },
  {
    id: ENDING_IDS.B,
    priority: 30,
    condition: {
      kind: 'all',
      conditions: [
        { kind: 'finalChoice', value: 'take_outside' },
        { kind: 'clueCount', comparison: 'gte', value: 10 },
      ],
    },
  },
  {
    id: ENDING_IDS.C,
    priority: 20,
    condition: {
      kind: 'all',
      conditions: [
        { kind: 'finalChoice', value: 'inherit_role' },
        { kind: 'flag', flagId: FLAG_IDS.ALL_ANONYMOUS_LETTERS_READ, value: true },
        { kind: 'flag', flagId: FLAG_IDS.ROOM_204_RECORD_RECOVERED, value: true },
      ],
    },
  },
  { id: ENDING_IDS.D, priority: 0, condition: { kind: 'always' } },
]

export const determineEndingFromRules = (
  state: GameState,
  rules: readonly EndingRule[],
  fallbackEndingId: string = ENDING_IDS.D,
): string => {
  const ordered = [...rules].sort((left, right) => right.priority - left.priority)
  return ordered.find((rule) => evaluateCondition(state, rule.condition))?.id ?? fallbackEndingId
}

export const determineEnding = (
  state: GameState,
  finalChoice: FinalChoice | null = state.finalChoice,
): string => {
  const stateAtDecision = state.finalChoice === finalChoice ? state : { ...state, finalChoice }
  return determineEndingFromRules(stateAtDecision, DEFAULT_ENDING_RULES)
}

export const completeEnding = (state: GameState, endingId: string): GameState => {
  if (state.currentEndingId === endingId && state.reachedEndings.includes(endingId)) {
    return state
  }
  return updateIfChanged(state, {
    ...state,
    currentEndingId: endingId,
    reachedEndings: appendUnique(state.reachedEndings, endingId),
  })
}

export const resolveEnding = (
  state: GameState,
  finalChoice: FinalChoice,
): { readonly endingId: string; readonly state: GameState } => {
  const decided =
    state.finalChoice === finalChoice ? state : updateIfChanged(state, { ...state, finalChoice })
  const endingId = determineEnding(decided)
  return { endingId, state: completeEnding(decided, endingId) }
}
