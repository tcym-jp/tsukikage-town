import type { Day, FinalChoice, TimeOfDay } from '../state'

export type Comparison = 'eq' | 'gte' | 'lte'

/**
 * Runtime IDs are strings on purpose: branded IDs from independently authored
 * content remain structurally compatible, while engine-owned APIs expose their
 * stricter brands from `game/ids`.
 */
export type Condition =
  | { readonly kind: 'always' }
  | { readonly kind: 'never' }
  | { readonly kind: 'day'; readonly comparison: Comparison; readonly value: Day }
  | { readonly kind: 'time'; readonly value: TimeOfDay }
  | { readonly kind: 'flag'; readonly flagId: string; readonly value: boolean }
  | {
      readonly kind: 'trust'
      readonly characterId: string
      readonly comparison: Comparison
      readonly value: number
    }
  | { readonly kind: 'totalTrust'; readonly comparison: Comparison; readonly value: number }
  | { readonly kind: 'clue'; readonly clueId: string }
  | { readonly kind: 'clueCount'; readonly comparison: Comparison; readonly value: number }
  | { readonly kind: 'letterRead'; readonly letterId: string }
  | { readonly kind: 'bulletinRead'; readonly bulletinId: string }
  | { readonly kind: 'dialogueSeen'; readonly dialogueId: string }
  | { readonly kind: 'locationVisited'; readonly locationId: string }
  | {
      readonly kind: 'subEvent'
      readonly subEventId: string
      readonly state: 'started' | 'completed'
    }
  | { readonly kind: 'objectiveComplete'; readonly objectiveId: string }
  | {
      readonly kind: 'quest'
      readonly questId: string
      readonly status: 'active' | 'completed' | 'failed'
      readonly minimumStep?: number
    }
  | {
      readonly kind: 'stat'
      readonly statId: string
      readonly comparison: Comparison
      readonly value: number
    }
  | { readonly kind: 'finalChoice'; readonly value: FinalChoice }
  | { readonly kind: 'endingReached'; readonly endingId: string }
  | { readonly kind: 'achievementUnlocked'; readonly achievementId: string }
  | { readonly kind: 'all'; readonly conditions: readonly Condition[] }
  | { readonly kind: 'any'; readonly conditions: readonly Condition[] }
  | { readonly kind: 'not'; readonly condition: Condition }

export type Effect =
  | { readonly kind: 'setFlag'; readonly flagId: string; readonly value: boolean }
  | { readonly kind: 'addTrust'; readonly characterId: string; readonly amount: number }
  | { readonly kind: 'discoverClue'; readonly clueId: string }
  | { readonly kind: 'deliverLetter'; readonly letterId: string }
  | { readonly kind: 'readLetter'; readonly letterId: string; readonly anonymous?: boolean }
  | { readonly kind: 'readBulletin'; readonly bulletinId: string; readonly official?: boolean }
  | { readonly kind: 'markDialogueSeen'; readonly dialogueId: string }
  | { readonly kind: 'recordDialogueChoice'; readonly choiceId: string }
  | { readonly kind: 'startSubEvent'; readonly subEventId: string }
  | {
      readonly kind: 'advanceSubEvent'
      readonly subEventId: string
      readonly stageId: string
    }
  | { readonly kind: 'completeSubEvent'; readonly subEventId: string }
  | { readonly kind: 'completeObjective'; readonly objectiveId: string }
  | { readonly kind: 'unlockLocation'; readonly locationId: string }
  | { readonly kind: 'visitLocation'; readonly locationId: string }
  | { readonly kind: 'setFinalChoice'; readonly value: FinalChoice }
  | { readonly kind: 'incrementStat'; readonly statId: string; readonly amount: number }
  | { readonly kind: 'addJournalEntry'; readonly entryId: string }
  | { readonly kind: 'addItem'; readonly itemId: string }
  | { readonly kind: 'removeItem'; readonly itemId: string }
  | { readonly kind: 'unlockAchievement'; readonly achievementId: string }
  | { readonly kind: 'startQuest'; readonly questId: string; readonly at?: string }
  | { readonly kind: 'advanceQuest'; readonly questId: string; readonly step?: number }
  | { readonly kind: 'completeQuest'; readonly questId: string; readonly at?: string }
  | { readonly kind: 'failQuest'; readonly questId: string; readonly at?: string }

export interface NarrativeEvent {
  readonly id: string
  readonly condition: Condition
  readonly effects: readonly Effect[]
  readonly once?: boolean
}
