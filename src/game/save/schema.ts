import { z } from 'zod'
import { GameSettingsSchema, GameStateSchema } from '../state'

export const CURRENT_SAVE_SCHEMA_VERSION = 1 as const

export const SaveKindSchema = z.enum(['auto', 'manual', 'import'])

export const SaveEnvelopeV1Schema = z.object({
  schemaVersion: z.literal(CURRENT_SAVE_SCHEMA_VERSION),
  savedAt: z.iso.datetime(),
  kind: SaveKindSchema,
  game: GameStateSchema,
  settings: GameSettingsSchema,
})

export type SaveKind = z.infer<typeof SaveKindSchema>
export type SaveEnvelopeV1 = z.infer<typeof SaveEnvelopeV1Schema>
