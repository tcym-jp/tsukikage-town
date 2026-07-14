import { CHARACTER_IDS, LOCATION_IDS } from '../ids'
import {
  GameSettingsSchema,
  GameStateSchema,
  PlayerNameSchema,
  type GameSettings,
  type GameState,
} from './schema'
import type { TransientUiState } from './types'

export const DEFAULT_SETTINGS: GameSettings = GameSettingsSchema.parse({
  bgmVolume: 0.55,
  sfxVolume: 0.7,
  muted: false,
  textSpeed: 'normal',
  autoAdvance: false,
  reducedMotion: false,
  quality: 'auto',
  showControlGuide: true,
  fontScale: 1,
})

export const DEFAULT_TRANSIENT_UI_STATE: TransientUiState = {
  screen: 'title',
  activePanel: null,
  activeDialogueId: null,
  activeDialogueNodeId: null,
  interactionLabel: null,
  interactionLocked: false,
  saveIndicator: 'idle',
  toast: null,
  pendingLocationId: null,
}

const hashName = (value: string): number => {
  let hash = 2166136261
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export const createResidentNumber = (name: string, moveInDate: string): string => {
  const suffix = String(hashName(`${name}:${moveInDate}`) % 10_000).padStart(4, '0')
  return `TK-${moveInDate.replaceAll('-', '').slice(2)}-${suffix}`
}

export const normalizePlayerName = (name: string): string => PlayerNameSchema.parse(name)

export const createInitialGameState = (playerName: string, now: Date = new Date()): GameState => {
  const name = normalizePlayerName(playerName)
  const timestamp = now.toISOString()
  const moveInDate = timestamp.slice(0, 10)

  return GameStateSchema.parse({
    player: {
      name,
      address: '月影町 月影荘203号室',
      residentNumber: createResidentNumber(name, moveInDate),
      moveInDate,
    },
    // The story begins with an evening arrival. The clock engine still supports
    // every Day 0 morning/evening/night slot for authored scenes and tests.
    clock: { day: 0, period: 'evening' },
    currentLocationId: LOCATION_IDS.STATION,
    flags: {},
    stats: {
      catPetCount: 0,
      spokenCharacters: 0,
      anonymousLettersRead: 0,
      completedSubEvents: 0,
      officialBulletinsRead: 0,
    },
    trust: {
      [CHARACTER_IDS.SUMI]: 0,
      [CHARACTER_IDS.AKARI]: 0,
      [CHARACTER_IDS.KANADE]: 0,
      [CHARACTER_IDS.REN]: 0,
      [CHARACTER_IDS.KOYOMI]: 0,
    },
    quests: {},
    subEvents: {},
    completedObjectives: [],
    discoveredClues: [],
    deliveredLetters: [],
    readLetters: [],
    readBulletins: [],
    seenDialogues: [],
    selectedDialogueChoices: [],
    unlockedLocations: [LOCATION_IDS.STATION],
    visitedLocations: [LOCATION_IDS.STATION],
    journalEntries: [],
    inventory: [],
    triggeredEvents: [],
    unlockedAchievements: [],
    reachedEndings: [],
    finalChoice: null,
    currentEndingId: null,
    playTimeSeconds: 0,
    revision: 0,
    startedAt: timestamp,
    updatedAt: timestamp,
  })
}
