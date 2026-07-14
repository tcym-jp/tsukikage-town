declare const gameIdBrand: unique symbol

/**
 * IDs stay human-readable in JSON, while the phantom brand prevents accidental
 * cross-domain assignment inside the game engine.
 */
export type GameId<Domain extends string> = string & {
  readonly [gameIdBrand]: Domain
}

export type CharacterId = GameId<'character'>
export type LocationId = GameId<'location'>
export type QuestId = GameId<'quest'>
export type ObjectiveId = GameId<'objective'>
export type DialogueId = GameId<'dialogue'>
export type DialogueNodeId = GameId<'dialogue-node'>
export type DialogueChoiceId = GameId<'dialogue-choice'>
export type ClueId = GameId<'clue'>
export type LetterId = GameId<'letter'>
export type BulletinId = GameId<'bulletin'>
export type SubEventId = GameId<'sub-event'>
export type SubEventStageId = GameId<'sub-event-stage'>
export type NarrativeEventId = GameId<'narrative-event'>
export type NarrativeFlagId = GameId<'narrative-flag'>
export type AchievementId = GameId<'achievement'>
export type EndingId = GameId<'ending'>
export type JournalEntryId = GameId<'journal-entry'>
export type ItemId = GameId<'item'>

const createId = (value: string): string => {
  const normalized = value.trim()
  if (normalized.length === 0) {
    throw new Error('ID must not be empty')
  }
  return normalized
}

/** Central constructors for IDs that can also be authored by content files. */
export const ids = {
  character: (value: string): CharacterId => createId(value) as CharacterId,
  location: (value: string): LocationId => createId(value) as LocationId,
  quest: (value: string): QuestId => createId(value) as QuestId,
  objective: (value: string): ObjectiveId => createId(value) as ObjectiveId,
  dialogue: (value: string): DialogueId => createId(value) as DialogueId,
  dialogueNode: (value: string): DialogueNodeId => createId(value) as DialogueNodeId,
  dialogueChoice: (value: string): DialogueChoiceId => createId(value) as DialogueChoiceId,
  clue: (value: string): ClueId => createId(value) as ClueId,
  letter: (value: string): LetterId => createId(value) as LetterId,
  bulletin: (value: string): BulletinId => createId(value) as BulletinId,
  subEvent: (value: string): SubEventId => createId(value) as SubEventId,
  subEventStage: (value: string): SubEventStageId => createId(value) as SubEventStageId,
  event: (value: string): NarrativeEventId => createId(value) as NarrativeEventId,
  flag: (value: string): NarrativeFlagId => createId(value) as NarrativeFlagId,
  achievement: (value: string): AchievementId => createId(value) as AchievementId,
  ending: (value: string): EndingId => createId(value) as EndingId,
  journalEntry: (value: string): JournalEntryId => createId(value) as JournalEntryId,
  item: (value: string): ItemId => createId(value) as ItemId,
} as const

export const CHARACTER_IDS = {
  SUMI: ids.character('sumi'),
  AKARI: ids.character('akari'),
  KANADE: ids.character('kanade'),
  REN: ids.character('ren'),
  KOYOMI: ids.character('koyomi'),
  MINATO: ids.character('minato'),
  TSUKI: ids.character('tsuki'),
} as const

export const LOCATION_IDS = {
  STATION: ids.location('station'),
  TOWN_HALL: ids.location('town_hall'),
  MAIN_STREET: ids.location('main_street'),
  BULLETIN_BOARD: ids.location('bulletin_board'),
  TOUKA_BOOKS: ids.location('touka_books'),
  YOI_MACHI: ids.location('yoi_machi'),
  TSUKIKAGE_HEIGHTS: ids.location('tsukikage_heights'),
  ROOM_203: ids.location('room_203'),
  BROADCAST_HILL: ids.location('broadcast_hill'),
} as const

export const ENDING_IDS = {
  A: ids.ending('A'),
  B: ids.ending('B'),
  C: ids.ending('C'),
  D: ids.ending('D'),
} as const

export const FLAG_IDS = {
  MINATO_WISH_UNDERSTOOD: ids.flag('minato_wish_understood'),
  ROOM_204_RECORD_RECOVERED: ids.flag('room_204_record_recovered'),
  ALL_ANONYMOUS_LETTERS_READ: ids.flag('all_anonymous_letters_read'),
  THIRTEENTH_NOTICE_VISIBLE: ids.flag('thirteenth_notice_visible'),
} as const

export const ACHIEVEMENT_IDS = {
  FIRST_CLUE: ids.achievement('first_clue'),
  TEN_CLUES: ids.achievement('ten_clues'),
  TRUSTED_NEIGHBOR: ids.achievement('trusted_neighbor'),
  TOWN_HELPER: ids.achievement('town_helper'),
  CAT_FRIEND: ids.achievement('cat_friend'),
  THREE_ENDINGS: ids.achievement('three_endings'),
} as const
