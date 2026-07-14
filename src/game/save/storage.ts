import {
  DEFAULT_SETTINGS,
  GameSettingsSchema,
  GameStateSchema,
  type GameSettings,
  type GameState,
} from '../state'
import { parseSaveJson } from './migration'
import {
  CURRENT_SAVE_SCHEMA_VERSION,
  SaveEnvelopeV1Schema,
  type SaveEnvelopeV1,
  type SaveKind,
} from './schema'

export interface StorageLike {
  readonly length: number
  clear(): void
  getItem(key: string): string | null
  key(index: number): string | null
  removeItem(key: string): void
  setItem(key: string, value: string): void
}

export type SaveSlot = 'auto' | 'manual'

export const SAVE_KEYS = {
  auto: 'tsukikage-town:save:auto',
  manual: 'tsukikage-town:save:manual',
  backup: 'tsukikage-town:save:backup',
  settings: 'tsukikage-town:settings',
} as const

export const RESET_CONFIRMATION_PHRASE = '月影町の記録を初期化' as const
export const MAX_SAVE_IMPORT_BYTES = 2 * 1024 * 1024

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : '保存領域へのアクセスに失敗しました。'

export const createSaveEnvelope = (
  game: GameState,
  settings: GameSettings,
  kind: SaveKind,
  now: Date = new Date(),
): SaveEnvelopeV1 =>
  SaveEnvelopeV1Schema.parse({
    schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
    savedAt: now.toISOString(),
    kind,
    game: GameStateSchema.parse(game),
    settings: GameSettingsSchema.parse(settings),
  })

export const serializeSaveEnvelope = (save: SaveEnvelopeV1): string =>
  JSON.stringify(SaveEnvelopeV1Schema.parse(save), null, 2)

export const exportSave = (
  game: GameState,
  settings: GameSettings,
  now: Date = new Date(),
): string => serializeSaveEnvelope(createSaveEnvelope(game, settings, 'manual', now))

export const importSave = (text: string, now: Date = new Date()) => parseSaveJson(text, now)

export type SaveWriteResult =
  | { readonly success: true; readonly save: SaveEnvelopeV1 }
  | { readonly success: false; readonly error: string }

const saveToSlot = (
  storage: StorageLike,
  slot: SaveSlot,
  game: GameState,
  settings: GameSettings,
  now: Date,
): SaveWriteResult => {
  try {
    const kind: SaveKind = slot
    const save = createSaveEnvelope(game, settings, kind, now)
    const key = SAVE_KEYS[slot]
    const existing = storage.getItem(key)
    if (existing !== null && parseSaveJson(existing, now).success) {
      storage.setItem(SAVE_KEYS.backup, existing)
    }
    storage.setItem(key, serializeSaveEnvelope(save))
    storage.setItem(SAVE_KEYS.settings, JSON.stringify(save.settings))
    return { success: true, save }
  } catch (error) {
    return { success: false, error: errorMessage(error) }
  }
}

export const autoSave = (
  storage: StorageLike,
  game: GameState,
  settings: GameSettings,
  now: Date = new Date(),
): SaveWriteResult => saveToSlot(storage, 'auto', game, settings, now)

export const manualSave = (
  storage: StorageLike,
  game: GameState,
  settings: GameSettings,
  now: Date = new Date(),
): SaveWriteResult => saveToSlot(storage, 'manual', game, settings, now)

interface ValidCandidate {
  readonly source: SaveSlot | 'backup'
  readonly key: string
  readonly save: SaveEnvelopeV1
  readonly migrated: boolean
}

const readCandidate = (
  storage: StorageLike,
  source: SaveSlot | 'backup',
  now: Date,
): { readonly candidate: ValidCandidate | null; readonly issues: readonly string[] } => {
  const key = SAVE_KEYS[source]
  const raw = storage.getItem(key)
  if (raw === null) return { candidate: null, issues: [] }
  const parsed = parseSaveJson(raw, now)
  if (!parsed.success) return { candidate: null, issues: parsed.issues }
  return {
    candidate: { source, key, save: parsed.save, migrated: parsed.migrated },
    issues: [],
  }
}

export type SaveLoadResult =
  | {
      readonly success: true
      readonly save: SaveEnvelopeV1
      readonly source: SaveSlot | 'backup'
      readonly recovered: boolean
      readonly migrated: boolean
      readonly warnings: readonly string[]
    }
  | {
      readonly success: false
      readonly reason: 'not-found' | 'corrupt' | 'storage-error'
      readonly issues: readonly string[]
    }

export const loadSave = (
  storage: StorageLike,
  preferred: SaveSlot | 'latest' = 'latest',
  now: Date = new Date(),
): SaveLoadResult => {
  try {
    const sources: readonly (SaveSlot | 'backup')[] =
      preferred === 'latest'
        ? ['auto', 'manual', 'backup']
        : [preferred, 'backup', preferred === 'auto' ? 'manual' : 'auto']
    const candidates: ValidCandidate[] = []
    const issues: string[] = []
    for (const source of sources) {
      const result = readCandidate(storage, source, now)
      if (result.candidate !== null) candidates.push(result.candidate)
      issues.push(...result.issues)
    }
    if (candidates.length === 0) {
      return {
        success: false,
        reason: issues.length > 0 ? 'corrupt' : 'not-found',
        issues,
      }
    }
    const selected =
      preferred === 'latest'
        ? [...candidates].sort(
            (left, right) => Date.parse(right.save.savedAt) - Date.parse(left.save.savedAt),
          )[0]
        : candidates[0]
    if (selected === undefined) {
      return { success: false, reason: 'not-found', issues: [] }
    }
    const warnings: string[] = []
    if (selected.migrated) {
      try {
        storage.setItem(selected.key, serializeSaveEnvelope(selected.save))
      } catch (error) {
        warnings.push(`移行済みデータを保存できませんでした: ${errorMessage(error)}`)
      }
    }
    return {
      success: true,
      save: selected.save,
      source: selected.source,
      recovered:
        selected.source === 'backup' || (preferred !== 'latest' && selected.source !== preferred),
      migrated: selected.migrated,
      warnings,
    }
  } catch (error) {
    return { success: false, reason: 'storage-error', issues: [errorMessage(error)] }
  }
}

export const restoreBackup = (
  storage: StorageLike,
  target: SaveSlot = 'auto',
  now: Date = new Date(),
): SaveWriteResult => {
  try {
    const raw = storage.getItem(SAVE_KEYS.backup)
    if (raw === null) return { success: false, error: 'バックアップがありません。' }
    const parsed = parseSaveJson(raw, now)
    if (!parsed.success) {
      return { success: false, error: parsed.issues.join('\n') }
    }
    storage.setItem(SAVE_KEYS[target], serializeSaveEnvelope(parsed.save))
    return { success: true, save: parsed.save }
  } catch (error) {
    return { success: false, error: errorMessage(error) }
  }
}

export const importSaveToStorage = (
  storage: StorageLike,
  text: string,
  target: SaveSlot = 'manual',
  now: Date = new Date(),
): SaveWriteResult => {
  const parsed = importSave(text, now)
  if (!parsed.success) return { success: false, error: parsed.issues.join('\n') }
  return saveToSlot(storage, target, parsed.save.game, parsed.save.settings, now)
}

export const saveSettings = (
  storage: StorageLike,
  settings: GameSettings,
): { readonly success: true } | { readonly success: false; readonly error: string } => {
  try {
    storage.setItem(SAVE_KEYS.settings, JSON.stringify(GameSettingsSchema.parse(settings)))
    return { success: true }
  } catch (error) {
    return { success: false, error: errorMessage(error) }
  }
}

export const loadSettings = (storage: StorageLike): GameSettings => {
  try {
    const raw = storage.getItem(SAVE_KEYS.settings)
    if (raw === null) return DEFAULT_SETTINGS
    const input = JSON.parse(raw) as unknown
    const parsed = GameSettingsSchema.safeParse(input)
    return parsed.success ? parsed.data : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

export const resetGameData = (storage: StorageLike, confirmation: string): boolean => {
  if (confirmation !== RESET_CONFIRMATION_PHRASE) return false
  for (const key of Object.values(SAVE_KEYS)) storage.removeItem(key)
  return true
}

/** Small standards-compatible adapter for headless tests and story simulations. */
export class MemoryStorage implements StorageLike {
  readonly #values = new Map<string, string>()

  constructor(seed: Readonly<Record<string, string>> = {}) {
    for (const [key, value] of Object.entries(seed)) this.#values.set(key, value)
  }

  get length(): number {
    return this.#values.size
  }

  clear(): void {
    this.#values.clear()
  }

  getItem(key: string): string | null {
    return this.#values.get(key) ?? null
  }

  key(index: number): string | null {
    return [...this.#values.keys()][index] ?? null
  }

  removeItem(key: string): void {
    this.#values.delete(key)
  }

  setItem(key: string, value: string): void {
    this.#values.set(key, value)
  }
}
