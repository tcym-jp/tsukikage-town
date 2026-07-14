declare const contentIdBrand: unique symbol

export type BrandedId<Name extends string> = string & {
  readonly [contentIdBrand]: Name
}

export type CharacterId = BrandedId<'character'>
export type LocationId = BrandedId<'location'>
export type ChapterId = BrandedId<'chapter'>
export type ObjectiveId = BrandedId<'objective'>
export type SceneId = BrandedId<'scene'>
export type DialogueId = BrandedId<'dialogue'>
export type DialogueNodeId = BrandedId<'dialogue-node'>
export type LetterId = BrandedId<'letter'>
export type BulletinId = BrandedId<'bulletin'>
export type ClueId = BrandedId<'clue'>
export type SubEventId = BrandedId<'sub-event'>
export type SubEventStageId = BrandedId<'sub-event-stage'>
export type InvestigationId = BrandedId<'investigation'>
export type EndingId = BrandedId<'ending'>
export type AchievementId = BrandedId<'achievement'>
export type NarrativeFlagId = BrandedId<'narrative-flag'>

/** Central constructors keep serialized IDs readable while retaining compile-time separation. */
export const ids = {
  character: (value: string): CharacterId => value as CharacterId,
  location: (value: string): LocationId => value as LocationId,
  chapter: (value: string): ChapterId => value as ChapterId,
  objective: (value: string): ObjectiveId => value as ObjectiveId,
  scene: (value: string): SceneId => value as SceneId,
  dialogue: (value: string): DialogueId => value as DialogueId,
  dialogueNode: (value: string): DialogueNodeId => value as DialogueNodeId,
  letter: (value: string): LetterId => value as LetterId,
  bulletin: (value: string): BulletinId => value as BulletinId,
  clue: (value: string): ClueId => value as ClueId,
  subEvent: (value: string): SubEventId => value as SubEventId,
  subEventStage: (value: string): SubEventStageId => value as SubEventStageId,
  investigation: (value: string): InvestigationId => value as InvestigationId,
  ending: (value: string): EndingId => value as EndingId,
  achievement: (value: string): AchievementId => value as AchievementId,
  flag: (value: string): NarrativeFlagId => value as NarrativeFlagId,
} as const

export type Day = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
export type TimeOfDay = 'morning' | 'evening' | 'night'
export type Comparison = 'eq' | 'gte' | 'lte'
export type FinalChoice = 'return_name' | 'take_outside' | 'inherit_role'
export type ValueTone = 'accept' | 'verify' | 'distance'
export type StatId =
  | 'catPetCount'
  | 'spokenCharacters'
  | 'testimoniesHeard'
  | 'anonymousLettersRead'
  | 'completedSubEvents'
  | 'officialBulletinsRead'

export type Condition =
  | { readonly kind: 'always' }
  | {
      readonly kind: 'day'
      readonly comparison: Comparison
      readonly value: Day
    }
  | { readonly kind: 'time'; readonly value: TimeOfDay }
  | {
      readonly kind: 'flag'
      readonly flagId: NarrativeFlagId
      readonly value: boolean
    }
  | {
      readonly kind: 'trust'
      readonly characterId: CharacterId
      readonly comparison: Comparison
      readonly value: number
    }
  | {
      readonly kind: 'totalTrust'
      readonly comparison: Comparison
      readonly value: number
    }
  | { readonly kind: 'clue'; readonly clueId: ClueId }
  | {
      readonly kind: 'clueCount'
      readonly comparison: Comparison
      readonly value: number
    }
  | { readonly kind: 'letterRead'; readonly letterId: LetterId }
  | { readonly kind: 'bulletinRead'; readonly bulletinId: BulletinId }
  | { readonly kind: 'dialogueSeen'; readonly dialogueId: DialogueId }
  | { readonly kind: 'locationVisited'; readonly locationId: LocationId }
  | {
      readonly kind: 'subEvent'
      readonly subEventId: SubEventId
      readonly state: 'started' | 'completed'
    }
  | { readonly kind: 'objectiveComplete'; readonly objectiveId: ObjectiveId }
  | {
      readonly kind: 'stat'
      readonly statId: StatId
      readonly comparison: Comparison
      readonly value: number
    }
  | { readonly kind: 'finalChoice'; readonly value: FinalChoice }
  | { readonly kind: 'endingReached'; readonly endingId: EndingId }
  | { readonly kind: 'all'; readonly conditions: readonly Condition[] }
  | { readonly kind: 'any'; readonly conditions: readonly Condition[] }
  | { readonly kind: 'not'; readonly condition: Condition }

export type Effect =
  | {
      readonly kind: 'setFlag'
      readonly flagId: NarrativeFlagId
      readonly value: boolean
    }
  | {
      readonly kind: 'addTrust'
      readonly characterId: CharacterId
      readonly amount: number
    }
  | { readonly kind: 'discoverClue'; readonly clueId: ClueId }
  | { readonly kind: 'deliverLetter'; readonly letterId: LetterId }
  | { readonly kind: 'startSubEvent'; readonly subEventId: SubEventId }
  | {
      readonly kind: 'advanceSubEvent'
      readonly subEventId: SubEventId
      readonly stageId: SubEventStageId
    }
  | { readonly kind: 'completeSubEvent'; readonly subEventId: SubEventId }
  | { readonly kind: 'completeObjective'; readonly objectiveId: ObjectiveId }
  | { readonly kind: 'unlockLocation'; readonly locationId: LocationId }
  | { readonly kind: 'setFinalChoice'; readonly value: FinalChoice }
  | {
      readonly kind: 'incrementStat'
      readonly statId: StatId
      readonly amount: number
    }

export interface MapPosition {
  readonly x: number
  readonly z: number
}

export interface Location {
  readonly id: LocationId
  readonly name: string
  readonly shortName: string
  readonly kind: 'outdoor' | 'indoor' | 'threshold'
  readonly description: string
  readonly atmosphere: string
  readonly landmarks: readonly string[]
  readonly mapPosition: MapPosition
  readonly availableFromDay: Day
  readonly accessCondition: Condition
  readonly unlockHint: string
}

export interface CharacterScheduleEntry {
  readonly days: readonly Day[] | 'all'
  readonly time: TimeOfDay
  readonly locationId: LocationId
  readonly note: string
}

export interface CharacterProfile {
  readonly id: CharacterId
  readonly name: string
  readonly reading: string
  readonly ageLabel: string
  readonly kind: 'person' | 'echo' | 'cat'
  readonly namedCharacter: boolean
  readonly role: string
  readonly publicBio: string
  readonly privateTruth: string
  readonly voiceGuide: string
  readonly symbols: readonly string[]
  readonly homeLocationId: LocationId
  readonly trustTrack: boolean
  readonly trustGuide: string
  readonly schedule: readonly CharacterScheduleEntry[]
}

export interface HintStage {
  readonly threshold: 0 | 1 | 2
  readonly text: string
}

export interface Objective {
  readonly id: ObjectiveId
  readonly title: string
  readonly description: string
  readonly required: boolean
  readonly completionCondition: Condition
  readonly onComplete: readonly Effect[]
  readonly hints: readonly HintStage[]
}

export interface StoryScene {
  readonly id: SceneId
  readonly title: string
  readonly locationId: LocationId
  readonly time: TimeOfDay
  readonly summary: string
  readonly required: boolean
  readonly entryCondition: Condition
  readonly completionCondition: Condition
  readonly investigationIds: readonly InvestigationId[]
  readonly dialogueIds: readonly DialogueId[]
}

export interface Chapter {
  readonly id: ChapterId
  readonly day: Day
  readonly title: string
  readonly theme: string
  readonly opening: string
  readonly objectives: readonly Objective[]
  readonly scenes: readonly StoryScene[]
  readonly availableLetterIds: readonly LetterId[]
  readonly featuredBulletinIds: readonly BulletinId[]
  readonly advanceCondition: Condition
  readonly blockedMessage: string
  readonly closing: string
}

interface DialogueNodeBase {
  readonly id: DialogueNodeId
  readonly speakerId: CharacterId | 'narrator'
  readonly text: string
  readonly mood: 'neutral' | 'warm' | 'guarded' | 'uneasy' | 'resolute'
}

export interface DialogueLineNode extends DialogueNodeBase {
  readonly kind: 'line'
  readonly nextNodeId: DialogueNodeId | 'end'
  readonly effects: readonly Effect[]
}

export interface DialogueChoice {
  readonly id: string
  readonly text: string
  readonly tone: ValueTone
  readonly condition: Condition
  readonly nextNodeId: DialogueNodeId | 'end'
  readonly effects: readonly Effect[]
}

export interface DialogueChoiceNode extends DialogueNodeBase {
  readonly kind: 'choice'
  readonly choices: readonly DialogueChoice[]
}

export type DialogueNode = DialogueLineNode | DialogueChoiceNode

export interface Dialogue {
  readonly id: DialogueId
  readonly title: string
  readonly characterId: CharacterId
  readonly day: Day | 'repeatable'
  readonly locationId: LocationId
  readonly priority: number
  readonly conditions: Condition
  readonly entryNodeId: DialogueNodeId
  readonly nodes: readonly DialogueNode[]
  readonly journalSummary: string
}

export type LetterSender =
  | { readonly kind: 'character'; readonly characterId: CharacterId }
  | { readonly kind: 'organization'; readonly name: string }
  | { readonly kind: 'unknown'; readonly label: string }

export interface LetterAction {
  readonly id: string
  readonly label: string
  readonly condition: Condition
  readonly effects: readonly Effect[]
  readonly responseBlocks: readonly string[]
}

export interface Letter {
  readonly id: LetterId
  readonly day: Day
  readonly sender: LetterSender
  readonly recipient: string
  readonly subject: string
  readonly paperStyle: 'official' | 'plain' | 'blue-ink' | 'aged' | 'notebook'
  readonly bodyBlocks: readonly string[]
  readonly arrivalCondition: Condition
  readonly anonymous: boolean
  readonly actions: readonly LetterAction[]
  readonly attachments: readonly ClueId[]
  readonly endingVariant: EndingId | null
}

export type BulletinStatus = 'posted' | 'amended' | 'removed'

export interface BulletinRevision {
  readonly day: Day
  readonly status: BulletinStatus
  readonly title: string
  readonly body: string
  readonly changeNote: string
}

export interface BulletinVariant {
  readonly id: string
  readonly condition: Condition
  readonly title: string
  readonly body: string
}

export interface Bulletin {
  readonly id: BulletinId
  readonly officialNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13
  readonly category: string
  readonly official: boolean
  readonly visibilityCondition: Condition
  readonly revisions: readonly BulletinRevision[]
  readonly variants: readonly BulletinVariant[]
}

export type EvidenceSource =
  | { readonly kind: 'dialogue'; readonly dialogueId: DialogueId }
  | { readonly kind: 'investigation'; readonly investigationId: InvestigationId }
  | { readonly kind: 'letter'; readonly letterId: LetterId }
  | { readonly kind: 'bulletin'; readonly bulletinId: BulletinId }
  | { readonly kind: 'subEvent'; readonly subEventId: SubEventId }

export interface Clue {
  readonly id: ClueId
  readonly title: string
  readonly shortFact: string
  readonly interpretation: string
  readonly dayAvailable: Day
  readonly locationIds: readonly LocationId[]
  readonly sourceRefs: readonly EvidenceSource[]
  readonly tags: readonly ('record' | 'room-204' | 'broadcast' | 'family' | 'disaster')[]
}

export interface SubEventStage {
  readonly id: SubEventStageId
  readonly title: string
  readonly objective: string
  readonly completionCondition: Condition
  readonly effects: readonly Effect[]
}

export interface SubEvent {
  readonly id: SubEventId
  readonly title: string
  readonly summary: string
  readonly ownerCharacterId: CharacterId
  readonly startCondition: Condition
  readonly stages: readonly SubEventStage[]
  readonly completionEffects: readonly Effect[]
  readonly endingRelevance: string
}

export interface InvestigationVariant {
  readonly id: string
  readonly condition: Condition
  readonly textBlocks: readonly string[]
  readonly effects: readonly Effect[]
}

export interface Investigation {
  readonly id: InvestigationId
  readonly locationId: LocationId
  readonly label: string
  readonly nearbyLabel: string
  readonly variants: readonly InvestigationVariant[]
  readonly fallbackText: readonly string[]
}

export interface EndingScene {
  readonly id: string
  readonly locationId: LocationId
  readonly time: TimeOfDay
  readonly textBlocks: readonly string[]
}

export interface Ending {
  readonly id: EndingId
  readonly code: 'A' | 'B' | 'C' | 'D'
  readonly title: string
  readonly selectionLabel: string
  readonly conditions: Condition
  readonly priority: number
  readonly summary: string
  readonly affirmation: string
  readonly cost: string
  readonly scenes: readonly EndingScene[]
  readonly townChanges: readonly string[]
  readonly finalLetterId: LetterId
  readonly residentRecordNote: string
}

export interface Achievement {
  readonly id: AchievementId
  readonly title: string
  readonly description: string
  readonly hidden: boolean
  readonly condition: Condition
  readonly iconHint: string
}

export interface NarrativeFlagDefinition {
  readonly id: NarrativeFlagId
  readonly description: string
  readonly defaultValue: boolean
}

export interface ContentCatalog {
  readonly metadata: {
    readonly schemaVersion: number
    readonly title: string
    readonly locale: 'ja-JP'
  }
  readonly locations: readonly Location[]
  readonly characters: readonly CharacterProfile[]
  readonly chapters: readonly Chapter[]
  readonly dialogues: readonly Dialogue[]
  readonly letters: readonly Letter[]
  readonly bulletins: readonly Bulletin[]
  readonly clues: readonly Clue[]
  readonly subEvents: readonly SubEvent[]
  readonly investigations: readonly Investigation[]
  readonly endings: readonly Ending[]
  readonly achievements: readonly Achievement[]
  readonly narrativeFlags: readonly NarrativeFlagDefinition[]
}

export interface CatalogValidationResult {
  readonly valid: boolean
  readonly errors: readonly string[]
  readonly warnings: readonly string[]
  readonly counts: {
    readonly locations: number
    readonly namedCharacters: number
    readonly chapters: number
    readonly dialogues: number
    readonly letters: number
    readonly officialBulletins: number
    readonly clues: number
    readonly subEvents: number
    readonly endings: number
    readonly achievements: number
  }
}
