import { z } from 'zod'

const unicodeLength = (value: string): number => Array.from(value).length

export const PlayerNameSchema = z
  .string()
  .transform((value) => value.trim())
  .pipe(
    z
      .string()
      .min(1, '名前を入力してください。')
      .refine((value) => unicodeLength(value) <= 12, '名前は12文字以内で入力してください。')
      .refine(
        (value) =>
          Array.from(value).every((character) => {
            const codePoint = character.codePointAt(0) ?? 0
            return codePoint >= 32 && codePoint !== 127
          }),
        '名前に制御文字は使用できません。',
      ),
  )

export const DaySchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
])

export const TimeOfDaySchema = z.enum(['morning', 'evening', 'night'])
export const FinalChoiceSchema = z.enum(['return_name', 'take_outside', 'inherit_role'])

export const PlayerIdentitySchema = z.object({
  name: PlayerNameSchema,
  address: z.string().min(1),
  residentNumber: z.string().min(1),
  moveInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u),
})

export const GameClockSchema = z.object({
  day: DaySchema,
  period: TimeOfDaySchema,
})

export const QuestProgressSchema = z.object({
  status: z.enum(['active', 'completed', 'failed']),
  step: z.number().int().nonnegative(),
  startedAt: z.iso.datetime(),
  completedAt: z.iso.datetime().nullable(),
})

export const SubEventProgressSchema = z.object({
  status: z.enum(['started', 'completed']),
  stageId: z.string().min(1).nullable(),
})

const BooleanRecordSchema = z.record(z.string(), z.boolean())
const NumberRecordSchema = z.record(z.string(), z.number())

/**
 * Persisted story state. Rendering coordinates, open panels, focus and other
 * short-lived UI details intentionally do not exist in this schema.
 */
export const GameStateSchema = z.object({
  player: PlayerIdentitySchema,
  clock: GameClockSchema,
  currentLocationId: z.string().min(1),
  flags: BooleanRecordSchema,
  stats: NumberRecordSchema,
  trust: NumberRecordSchema,
  quests: z.record(z.string(), QuestProgressSchema),
  subEvents: z.record(z.string(), SubEventProgressSchema),
  completedObjectives: z.array(z.string().min(1)),
  discoveredClues: z.array(z.string().min(1)),
  deliveredLetters: z.array(z.string().min(1)),
  readLetters: z.array(z.string().min(1)),
  readBulletins: z.array(z.string().min(1)),
  seenDialogues: z.array(z.string().min(1)),
  selectedDialogueChoices: z.array(z.string().min(1)),
  unlockedLocations: z.array(z.string().min(1)),
  visitedLocations: z.array(z.string().min(1)),
  journalEntries: z.array(z.string().min(1)),
  inventory: z.array(z.string().min(1)),
  triggeredEvents: z.array(z.string().min(1)),
  unlockedAchievements: z.array(z.string().min(1)),
  reachedEndings: z.array(z.string().min(1)),
  finalChoice: FinalChoiceSchema.nullable(),
  currentEndingId: z.string().min(1).nullable(),
  playTimeSeconds: z.number().nonnegative(),
  revision: z.number().int().nonnegative(),
  startedAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export const QualityLevelSchema = z.enum(['auto', 'low', 'medium', 'high'])

export const GameSettingsSchema = z.object({
  bgmVolume: z.number().min(0).max(1),
  sfxVolume: z.number().min(0).max(1),
  muted: z.boolean(),
  textSpeed: z.enum(['slow', 'normal', 'fast', 'instant']),
  autoAdvance: z.boolean(),
  reducedMotion: z.boolean(),
  quality: QualityLevelSchema,
  showControlGuide: z.boolean(),
  fontScale: z.number().min(0.8).max(1.5),
})

export type Day = z.infer<typeof DaySchema>
export type TimeOfDay = z.infer<typeof TimeOfDaySchema>
export type FinalChoice = z.infer<typeof FinalChoiceSchema>
export type GameClock = z.infer<typeof GameClockSchema>
export type GameState = z.infer<typeof GameStateSchema>
export type GameSettings = z.infer<typeof GameSettingsSchema>
export type QuestProgress = z.infer<typeof QuestProgressSchema>
export type SubEventProgress = z.infer<typeof SubEventProgressSchema>
export type QualityLevel = z.infer<typeof QualityLevelSchema>
