import type { GameState } from '../state'
import type { Comparison, Condition } from './model'

const compare = (actual: number, comparison: Comparison, expected: number): boolean => {
  switch (comparison) {
    case 'eq':
      return actual === expected
    case 'gte':
      return actual >= expected
    case 'lte':
      return actual <= expected
  }
}

const totalTrust = (state: GameState): number =>
  Object.values(state.trust).reduce((total, value) => total + value, 0)

export const evaluateCondition = (state: GameState, condition: Condition): boolean => {
  switch (condition.kind) {
    case 'always':
      return true
    case 'never':
      return false
    case 'day':
      return compare(state.clock.day, condition.comparison, condition.value)
    case 'time':
      return state.clock.period === condition.value
    case 'flag':
      return (state.flags[condition.flagId] ?? false) === condition.value
    case 'trust':
      return compare(state.trust[condition.characterId] ?? 0, condition.comparison, condition.value)
    case 'totalTrust':
      return compare(totalTrust(state), condition.comparison, condition.value)
    case 'clue':
      return state.discoveredClues.includes(condition.clueId)
    case 'clueCount':
      return compare(state.discoveredClues.length, condition.comparison, condition.value)
    case 'letterRead':
      return state.readLetters.includes(condition.letterId)
    case 'bulletinRead':
      return state.readBulletins.includes(condition.bulletinId)
    case 'dialogueSeen':
      return state.seenDialogues.includes(condition.dialogueId)
    case 'locationVisited':
      return state.visitedLocations.includes(condition.locationId)
    case 'subEvent': {
      const progress = state.subEvents[condition.subEventId]
      return condition.state === 'completed'
        ? progress?.status === 'completed'
        : progress !== undefined
    }
    case 'objectiveComplete':
      return state.completedObjectives.includes(condition.objectiveId)
    case 'quest': {
      const progress = state.quests[condition.questId]
      if (progress?.status !== condition.status) return false
      return condition.minimumStep === undefined || progress.step >= condition.minimumStep
    }
    case 'stat':
      return compare(state.stats[condition.statId] ?? 0, condition.comparison, condition.value)
    case 'finalChoice':
      return state.finalChoice === condition.value
    case 'endingReached':
      return state.reachedEndings.includes(condition.endingId)
    case 'achievementUnlocked':
      return state.unlockedAchievements.includes(condition.achievementId)
    case 'all':
      return condition.conditions.every((child) => evaluateCondition(state, child))
    case 'any':
      return condition.conditions.some((child) => evaluateCondition(state, child))
    case 'not':
      return !evaluateCondition(state, condition.condition)
  }
}

export const evaluateConditions = (state: GameState, conditions: readonly Condition[]): boolean =>
  conditions.every((condition) => evaluateCondition(state, condition))
