import { catalog } from '../content'
import { applyEffect, evaluateAchievements, evaluateCondition, type GameState } from '../game'

/** Apply deterministic day/condition deliveries before the UI renders a period. */
export function synchronizeGameContent(state: GameState): GameState {
  let next = state
  for (const location of catalog.locations) {
    if (
      location.availableFromDay <= next.clock.day &&
      evaluateCondition(next, location.accessCondition)
    ) {
      next = applyEffect(next, { kind: 'unlockLocation', locationId: location.id })
    }
  }
  for (const letter of catalog.letters) {
    const endingReached =
      letter.endingVariant === null || next.reachedEndings.includes(letter.endingVariant)
    if (
      endingReached &&
      letter.day <= next.clock.day &&
      evaluateCondition(next, letter.arrivalCondition)
    ) {
      next = applyEffect(next, { kind: 'deliverLetter', letterId: letter.id })
    }
  }
  return evaluateAllAchievements(next)
}

/** Core achievements and authored achievements share the same persisted list. */
export function evaluateAllAchievements(state: GameState): GameState {
  let next = evaluateAchievements(state).state
  for (const achievement of catalog.achievements) {
    if (
      !next.unlockedAchievements.includes(achievement.id) &&
      evaluateCondition(next, achievement.condition)
    ) {
      next = applyEffect(next, {
        kind: 'unlockAchievement',
        achievementId: achievement.id,
      })
    }
  }
  return next
}

export function mergePersistentRecords(base: GameState, current: GameState | null): GameState {
  if (current === null) return base
  return {
    ...base,
    reachedEndings: [...new Set([...base.reachedEndings, ...current.reachedEndings])],
    unlockedAchievements: [
      ...new Set([...base.unlockedAchievements, ...current.unlockedAchievements]),
    ],
    playTimeSeconds: Math.max(base.playTimeSeconds, current.playTimeSeconds),
  }
}

export function rewindToDaySeven(snapshot: GameState, current: GameState): GameState {
  const flags = Object.fromEntries(
    Object.entries(snapshot.flags).filter(
      ([id]) => !id.startsWith('story_action:d7_') && id !== 'final_decision_made',
    ),
  )
  return {
    ...snapshot,
    clock: { day: 7, period: 'morning' },
    flags,
    completedObjectives: snapshot.completedObjectives.filter(
      (id) => id !== 'd7_hear_final_recording' && id !== 'd7_make_final_choice',
    ),
    finalChoice: null,
    currentEndingId: null,
    reachedEndings: [...new Set([...snapshot.reachedEndings, ...current.reachedEndings])],
    unlockedAchievements: [
      ...new Set([...snapshot.unlockedAchievements, ...current.unlockedAchievements]),
    ],
    playTimeSeconds: Math.max(snapshot.playTimeSeconds, current.playTimeSeconds),
    revision: Math.max(snapshot.revision, current.revision) + 1,
    updatedAt: new Date().toISOString(),
  }
}
