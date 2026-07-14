import { z } from 'zod'
import { createInitialGameState, DEFAULT_SETTINGS } from '../state'
import {
  DaySchema,
  FinalChoiceSchema,
  GameSettingsSchema,
  GameStateSchema,
  PlayerNameSchema,
  TimeOfDaySchema,
} from '../state/schema'
import { SaveEnvelopeV1Schema, type SaveEnvelopeV1 } from './schema'

const LegacyV0Schema = z
  .object({
    schemaVersion: z.literal(0).optional(),
    version: z.literal(0).optional(),
    savedAt: z.iso.datetime().optional(),
    playerName: PlayerNameSchema.optional(),
    player: z.object({ name: PlayerNameSchema }).optional(),
    day: DaySchema.optional(),
    timeOfDay: TimeOfDaySchema.optional(),
    locationId: z.string().min(1).optional(),
    flags: z.record(z.string(), z.boolean()).optional(),
    stats: z.record(z.string(), z.number()).optional(),
    trust: z.record(z.string(), z.number()).optional(),
    clues: z.array(z.string().min(1)).optional(),
    deliveredLetters: z.array(z.string().min(1)).optional(),
    readLetters: z.array(z.string().min(1)).optional(),
    readBulletins: z.array(z.string().min(1)).optional(),
    visitedLocations: z.array(z.string().min(1)).optional(),
    completedObjectives: z.array(z.string().min(1)).optional(),
    reachedEndings: z.array(z.string().min(1)).optional(),
    achievements: z.array(z.string().min(1)).optional(),
    finalChoice: FinalChoiceSchema.nullable().optional(),
    playTimeSeconds: z.number().nonnegative().optional(),
    settings: GameSettingsSchema.partial().optional(),
  })
  .refine(
    (value) => value.schemaVersion === 0 || value.version === 0,
    '旧形式のバージョン情報がありません。',
  )
  .refine(
    (value) => value.playerName !== undefined || value.player !== undefined,
    '旧形式のプレイヤー名がありません。',
  )

export type SaveParseResult =
  | { readonly success: true; readonly save: SaveEnvelopeV1; readonly migrated: boolean }
  | { readonly success: false; readonly issues: readonly string[] }

const formatIssues = (error: z.ZodError): readonly string[] =>
  error.issues.map((issue) => {
    const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : ''
    return `${path}${issue.message}`
  })

export const migrateV0ToV1 = (input: unknown, now: Date = new Date()): SaveEnvelopeV1 => {
  const legacy = LegacyV0Schema.parse(input)
  const savedAt = legacy.savedAt ?? now.toISOString()
  const name = legacy.playerName ?? legacy.player?.name
  if (name === undefined) throw new Error('旧形式のプレイヤー名がありません。')
  const initial = createInitialGameState(name, new Date(savedAt))
  const currentLocationId = legacy.locationId ?? initial.currentLocationId
  const migratedGame = GameStateSchema.parse({
    ...initial,
    clock: {
      day: legacy.day ?? initial.clock.day,
      period: legacy.timeOfDay ?? initial.clock.period,
    },
    currentLocationId,
    flags: { ...initial.flags, ...legacy.flags },
    stats: { ...initial.stats, ...legacy.stats },
    trust: { ...initial.trust, ...legacy.trust },
    discoveredClues: legacy.clues ?? initial.discoveredClues,
    deliveredLetters: legacy.deliveredLetters ?? initial.deliveredLetters,
    readLetters: legacy.readLetters ?? initial.readLetters,
    readBulletins: legacy.readBulletins ?? initial.readBulletins,
    completedObjectives: legacy.completedObjectives ?? initial.completedObjectives,
    unlockedLocations: Array.from(
      new Set([
        ...initial.unlockedLocations,
        ...(legacy.visitedLocations ?? []),
        currentLocationId,
      ]),
    ),
    visitedLocations: Array.from(
      new Set([...initial.visitedLocations, ...(legacy.visitedLocations ?? []), currentLocationId]),
    ),
    reachedEndings: legacy.reachedEndings ?? initial.reachedEndings,
    unlockedAchievements: legacy.achievements ?? initial.unlockedAchievements,
    finalChoice: legacy.finalChoice ?? null,
    playTimeSeconds: legacy.playTimeSeconds ?? initial.playTimeSeconds,
    updatedAt: savedAt,
  })
  const settings = GameSettingsSchema.parse({ ...DEFAULT_SETTINGS, ...legacy.settings })
  return SaveEnvelopeV1Schema.parse({
    schemaVersion: 1,
    savedAt,
    kind: 'import',
    game: migratedGame,
    settings,
  })
}

export const parseAndMigrateSave = (input: unknown, now: Date = new Date()): SaveParseResult => {
  const current = SaveEnvelopeV1Schema.safeParse(input)
  if (current.success) return { success: true, save: current.data, migrated: false }

  const legacy = LegacyV0Schema.safeParse(input)
  if (legacy.success) {
    return { success: true, save: migrateV0ToV1(legacy.data, now), migrated: true }
  }

  return {
    success: false,
    issues: [
      '保存データの形式を確認できませんでした。',
      ...formatIssues(current.error),
      ...formatIssues(legacy.error),
    ],
  }
}

export const parseSaveJson = (text: string, now: Date = new Date()): SaveParseResult => {
  try {
    const input = JSON.parse(text) as unknown
    return parseAndMigrateSave(input, now)
  } catch {
    return { success: false, issues: ['JSONの構文が正しくありません。'] }
  }
}
