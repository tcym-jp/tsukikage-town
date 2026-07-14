import { ACHIEVEMENT_IDS, ENDING_IDS } from '../ids'
import { applyEffect, evaluateCondition, type Condition } from '../engine'
import type { GameState } from '../state'

export interface AchievementRule {
  readonly id: string
  readonly condition: Condition
}

export const DEFAULT_ACHIEVEMENT_RULES: readonly AchievementRule[] = [
  {
    id: ACHIEVEMENT_IDS.FIRST_CLUE,
    condition: { kind: 'clueCount', comparison: 'gte', value: 1 },
  },
  {
    id: ACHIEVEMENT_IDS.TEN_CLUES,
    condition: { kind: 'clueCount', comparison: 'gte', value: 10 },
  },
  {
    id: ACHIEVEMENT_IDS.TRUSTED_NEIGHBOR,
    condition: { kind: 'totalTrust', comparison: 'gte', value: 15 },
  },
  {
    id: ACHIEVEMENT_IDS.TOWN_HELPER,
    condition: { kind: 'stat', statId: 'completedSubEvents', comparison: 'gte', value: 3 },
  },
  {
    id: ACHIEVEMENT_IDS.CAT_FRIEND,
    condition: { kind: 'stat', statId: 'catPetCount', comparison: 'gte', value: 5 },
  },
  {
    id: ACHIEVEMENT_IDS.THREE_ENDINGS,
    condition: {
      kind: 'all',
      conditions: [
        { kind: 'endingReached', endingId: ENDING_IDS.A },
        { kind: 'endingReached', endingId: ENDING_IDS.B },
        { kind: 'endingReached', endingId: ENDING_IDS.C },
      ],
    },
  },
]

export interface AchievementEvaluationResult {
  readonly state: GameState
  readonly newlyUnlocked: readonly string[]
}

export const evaluateAchievements = (
  state: GameState,
  rules: readonly AchievementRule[] = DEFAULT_ACHIEVEMENT_RULES,
): AchievementEvaluationResult => {
  let current = state
  const newlyUnlocked: string[] = []
  for (const rule of rules) {
    if (
      !current.unlockedAchievements.includes(rule.id) &&
      evaluateCondition(current, rule.condition)
    ) {
      current = applyEffect(current, { kind: 'unlockAchievement', achievementId: rule.id })
      newlyUnlocked.push(rule.id)
    }
  }
  return { state: current, newlyUnlocked }
}
