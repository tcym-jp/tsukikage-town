import { advanceQuest, completeQuest, failQuest, startQuest } from '../quests'
import type { GameState } from '../state'
import { evaluateCondition } from './conditions'
import type { Effect, NarrativeEvent } from './model'
import { appendUnique, removeValue, updateIfChanged } from './stateHelpers'

const clampTrust = (value: number): number => Math.max(-100, Math.min(100, value))

export const discoverClue = (state: GameState, clueId: string): GameState => {
  if (state.discoveredClues.includes(clueId)) return state
  return updateIfChanged(state, {
    ...state,
    discoveredClues: [...state.discoveredClues, clueId],
  })
}

export const addTrust = (state: GameState, characterId: string, amount: number): GameState => {
  const current = state.trust[characterId] ?? 0
  const next = clampTrust(current + amount)
  if (current === next) return state
  return updateIfChanged(state, {
    ...state,
    trust: { ...state.trust, [characterId]: next },
  })
}

export const markLetterRead = (
  state: GameState,
  letterId: string,
  anonymous = false,
): GameState => {
  if (state.readLetters.includes(letterId)) return state
  const nextStats = anonymous
    ? {
        ...state.stats,
        anonymousLettersRead: (state.stats.anonymousLettersRead ?? 0) + 1,
      }
    : state.stats
  return updateIfChanged(state, {
    ...state,
    deliveredLetters: appendUnique(state.deliveredLetters, letterId),
    readLetters: [...state.readLetters, letterId],
    stats: nextStats,
  })
}

export const markBulletinRead = (
  state: GameState,
  bulletinId: string,
  official = true,
): GameState => {
  if (state.readBulletins.includes(bulletinId)) return state
  const nextStats = official
    ? {
        ...state.stats,
        officialBulletinsRead: (state.stats.officialBulletinsRead ?? 0) + 1,
      }
    : state.stats
  return updateIfChanged(state, {
    ...state,
    readBulletins: [...state.readBulletins, bulletinId],
    stats: nextStats,
  })
}

export const completeSubEvent = (state: GameState, subEventId: string): GameState => {
  const current = state.subEvents[subEventId]
  if (current?.status === 'completed') return state
  return updateIfChanged(state, {
    ...state,
    subEvents: {
      ...state.subEvents,
      [subEventId]: { status: 'completed', stageId: current?.stageId ?? null },
    },
    stats: {
      ...state.stats,
      completedSubEvents: (state.stats.completedSubEvents ?? 0) + 1,
    },
  })
}

export const applyEffect = (state: GameState, effect: Effect): GameState => {
  switch (effect.kind) {
    case 'setFlag': {
      if ((state.flags[effect.flagId] ?? false) === effect.value) return state
      return updateIfChanged(state, {
        ...state,
        flags: { ...state.flags, [effect.flagId]: effect.value },
      })
    }
    case 'addTrust':
      return addTrust(state, effect.characterId, effect.amount)
    case 'discoverClue':
      return discoverClue(state, effect.clueId)
    case 'deliverLetter': {
      if (state.deliveredLetters.includes(effect.letterId)) return state
      return updateIfChanged(state, {
        ...state,
        deliveredLetters: [...state.deliveredLetters, effect.letterId],
      })
    }
    case 'readLetter':
      return markLetterRead(state, effect.letterId, effect.anonymous === true)
    case 'readBulletin':
      return markBulletinRead(state, effect.bulletinId, effect.official !== false)
    case 'markDialogueSeen': {
      if (state.seenDialogues.includes(effect.dialogueId)) return state
      return updateIfChanged(state, {
        ...state,
        seenDialogues: [...state.seenDialogues, effect.dialogueId],
      })
    }
    case 'recordDialogueChoice': {
      if (state.selectedDialogueChoices.includes(effect.choiceId)) return state
      return updateIfChanged(state, {
        ...state,
        selectedDialogueChoices: [...state.selectedDialogueChoices, effect.choiceId],
      })
    }
    case 'startSubEvent': {
      if (state.subEvents[effect.subEventId] !== undefined) return state
      return updateIfChanged(state, {
        ...state,
        subEvents: {
          ...state.subEvents,
          [effect.subEventId]: { status: 'started', stageId: null },
        },
      })
    }
    case 'advanceSubEvent': {
      const current = state.subEvents[effect.subEventId]
      if (current?.status === 'completed' || current?.stageId === effect.stageId) return state
      return updateIfChanged(state, {
        ...state,
        subEvents: {
          ...state.subEvents,
          [effect.subEventId]: { status: 'started', stageId: effect.stageId },
        },
      })
    }
    case 'completeSubEvent':
      return completeSubEvent(state, effect.subEventId)
    case 'completeObjective': {
      if (state.completedObjectives.includes(effect.objectiveId)) return state
      return updateIfChanged(state, {
        ...state,
        completedObjectives: [...state.completedObjectives, effect.objectiveId],
      })
    }
    case 'unlockLocation': {
      if (state.unlockedLocations.includes(effect.locationId)) return state
      return updateIfChanged(state, {
        ...state,
        unlockedLocations: [...state.unlockedLocations, effect.locationId],
      })
    }
    case 'visitLocation': {
      const nextVisited = appendUnique(state.visitedLocations, effect.locationId)
      const nextUnlocked = appendUnique(state.unlockedLocations, effect.locationId)
      if (
        state.currentLocationId === effect.locationId &&
        nextVisited.length === state.visitedLocations.length &&
        nextUnlocked.length === state.unlockedLocations.length
      ) {
        return state
      }
      return updateIfChanged(state, {
        ...state,
        currentLocationId: effect.locationId,
        visitedLocations: nextVisited,
        unlockedLocations: nextUnlocked,
      })
    }
    case 'setFinalChoice': {
      if (state.finalChoice === effect.value) return state
      return updateIfChanged(state, { ...state, finalChoice: effect.value })
    }
    case 'incrementStat': {
      const current = state.stats[effect.statId] ?? 0
      const next = Math.max(0, current + effect.amount)
      if (current === next) return state
      return updateIfChanged(state, {
        ...state,
        stats: { ...state.stats, [effect.statId]: next },
      })
    }
    case 'addJournalEntry': {
      if (state.journalEntries.includes(effect.entryId)) return state
      return updateIfChanged(state, {
        ...state,
        journalEntries: [...state.journalEntries, effect.entryId],
      })
    }
    case 'addItem': {
      if (state.inventory.includes(effect.itemId)) return state
      return updateIfChanged(state, { ...state, inventory: [...state.inventory, effect.itemId] })
    }
    case 'removeItem': {
      if (!state.inventory.includes(effect.itemId)) return state
      return updateIfChanged(state, {
        ...state,
        inventory: removeValue(state.inventory, effect.itemId),
      })
    }
    case 'unlockAchievement': {
      if (state.unlockedAchievements.includes(effect.achievementId)) return state
      return updateIfChanged(state, {
        ...state,
        unlockedAchievements: [...state.unlockedAchievements, effect.achievementId],
      })
    }
    case 'startQuest':
      return startQuest(state, effect.questId, effect.at)
    case 'advanceQuest':
      return advanceQuest(state, effect.questId, effect.step)
    case 'completeQuest':
      return completeQuest(state, effect.questId, effect.at)
    case 'failQuest':
      return failQuest(state, effect.questId, effect.at)
  }
}

export const applyEffects = (state: GameState, effects: readonly Effect[]): GameState =>
  effects.reduce<GameState>((current, effect) => applyEffect(current, effect), state)

export type EventApplicationResult =
  | { readonly applied: true; readonly state: GameState }
  | {
      readonly applied: false
      readonly reason: 'condition' | 'already-triggered'
      readonly state: GameState
    }

export const applyNarrativeEvent = (
  state: GameState,
  event: NarrativeEvent,
): EventApplicationResult => {
  if (event.once !== false && state.triggeredEvents.includes(event.id)) {
    return { applied: false, reason: 'already-triggered', state }
  }
  if (!evaluateCondition(state, event.condition)) {
    return { applied: false, reason: 'condition', state }
  }
  const effected = applyEffects(state, event.effects)
  const withHistory = effected.triggeredEvents.includes(event.id)
    ? effected
    : updateIfChanged(effected, {
        ...effected,
        triggeredEvents: [...effected.triggeredEvents, event.id],
      })
  return { applied: true, state: withHistory }
}
