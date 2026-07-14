import { applyEffects, evaluateCondition, type Condition, type Effect } from '../engine'
import type { GameState } from '../state'

export interface DialogueChoiceLike {
  readonly id: string
  readonly condition: Condition
  readonly effects: readonly Effect[]
  readonly nextNodeId: string
}

export const getAvailableDialogueChoices = <Choice extends DialogueChoiceLike>(
  state: GameState,
  choices: readonly Choice[],
): readonly Choice[] => choices.filter((choice) => evaluateCondition(state, choice.condition))

export type DialogueSelectionResult =
  | {
      readonly selected: true
      readonly state: GameState
      readonly choiceId: string
      readonly nextNodeId: string
    }
  | {
      readonly selected: false
      readonly state: GameState
      readonly reason: 'unknown-choice' | 'unavailable-choice'
    }

export const selectDialogueChoice = (
  state: GameState,
  dialogueId: string,
  choices: readonly DialogueChoiceLike[],
  choiceId: string,
): DialogueSelectionResult => {
  const choice = choices.find((candidate) => candidate.id === choiceId)
  if (choice === undefined) return { selected: false, state, reason: 'unknown-choice' }
  if (!evaluateCondition(state, choice.condition)) {
    return { selected: false, state, reason: 'unavailable-choice' }
  }
  const selectionKey = `${dialogueId}:${choice.id}`
  const next = applyEffects(state, [
    { kind: 'markDialogueSeen', dialogueId },
    { kind: 'recordDialogueChoice', choiceId: selectionKey },
    ...choice.effects,
  ])
  return {
    selected: true,
    state: next,
    choiceId: choice.id,
    nextNodeId: choice.nextNodeId,
  }
}
