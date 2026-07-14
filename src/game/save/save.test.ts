import { applyEffect } from '../engine'
import { createInitialGameState, DEFAULT_SETTINGS } from '../state'
import {
  autoSave,
  exportSave,
  importSave,
  loadSave,
  loadSettings,
  manualSave,
  MemoryStorage,
  RESET_CONFIRMATION_PHRASE,
  resetGameData,
  restoreBackup,
  SAVE_KEYS,
  saveSettings,
} from '.'

const T1 = new Date('2026-07-15T09:00:00.000Z')
const T2 = new Date('2026-07-15T10:00:00.000Z')

describe('versioned save system', () => {
  it('round-trips saves and chooses the newest valid slot', () => {
    const storage = new MemoryStorage()
    const initial = createInitialGameState('月', T1)
    expect(autoSave(storage, initial, DEFAULT_SETTINGS, T1).success).toBe(true)
    const changed = applyEffect(initial, { kind: 'discoverClue', clueId: 'envelope_204' })
    expect(manualSave(storage, changed, DEFAULT_SETTINGS, T2).success).toBe(true)

    const loaded = loadSave(storage, 'latest', T2)
    expect(loaded.success).toBe(true)
    if (!loaded.success) throw new Error('save should load')
    expect(loaded.source).toBe('manual')
    expect(loaded.save.schemaVersion).toBe(1)
    expect(loaded.save.game.discoveredClues).toContain('envelope_204')
  })

  it('recovers the previous valid auto-save when the primary is corrupt', () => {
    const storage = new MemoryStorage()
    const initial = createInitialGameState('湊', T1)
    autoSave(storage, initial, DEFAULT_SETTINGS, T1)
    autoSave(
      storage,
      applyEffect(initial, { kind: 'discoverClue', clueId: 'clock_1113' }),
      DEFAULT_SETTINGS,
      T2,
    )
    storage.setItem(SAVE_KEYS.auto, '{broken')

    const loaded = loadSave(storage, 'auto', T2)
    expect(loaded.success).toBe(true)
    if (!loaded.success) throw new Error('backup should load')
    expect(loaded.source).toBe('backup')
    expect(loaded.recovered).toBe(true)
    expect(loaded.save.game.discoveredClues).not.toContain('clock_1113')
  })

  it('restores a manual-slot backup into an auto slot', () => {
    const storage = new MemoryStorage()
    const initial = createInitialGameState('灯', T1)
    manualSave(storage, initial, DEFAULT_SETTINGS, T1)
    manualSave(
      storage,
      applyEffect(initial, { kind: 'setFlag', flagId: 'later', value: true }),
      DEFAULT_SETTINGS,
      T2,
    )

    expect(restoreBackup(storage, 'auto', T2).success).toBe(true)
    const loaded = loadSave(storage, 'auto', T2)
    expect(loaded.success).toBe(true)
    if (!loaded.success) throw new Error('restored save should load')
    expect(loaded.save.game.flags.later).not.toBe(true)
  })

  it('migrates a validated v0 save into schema version 1', () => {
    const legacy = JSON.stringify({
      version: 0,
      savedAt: T1.toISOString(),
      playerName: '旧住民',
      day: 4,
      timeOfDay: 'night',
      locationId: 'room_203',
      flags: { found_mailbox_bottom: true },
      trust: { koyomi: 5 },
      clues: ['double_bottom'],
      settings: { muted: true },
    })

    const imported = importSave(legacy, T2)
    expect(imported.success).toBe(true)
    if (!imported.success) throw new Error('legacy save should migrate')
    expect(imported.migrated).toBe(true)
    expect(imported.save.schemaVersion).toBe(1)
    expect(imported.save.game.clock).toEqual({ day: 4, period: 'night' })
    expect(imported.save.game.player.name).toBe('旧住民')
    expect(imported.save.settings.muted).toBe(true)
  })

  it('exports validated JSON and rejects malformed or structurally invalid imports', () => {
    const text = exportSave(createInitialGameState('書出', T1), DEFAULT_SETTINGS, T1)
    const roundTrip = importSave(text, T2)
    expect(roundTrip.success).toBe(true)
    expect(importSave('{oops', T2)).toMatchObject({ success: false })
    expect(importSave(JSON.stringify({ schemaVersion: 1 }), T2)).toMatchObject({ success: false })
  })

  it('persists settings and requires the exact second-stage reset phrase', () => {
    const storage = new MemoryStorage()
    const settings = { ...DEFAULT_SETTINGS, muted: true, quality: 'low' as const }
    expect(saveSettings(storage, settings).success).toBe(true)
    expect(loadSettings(storage)).toEqual(settings)
    autoSave(storage, createInitialGameState('初期化', T1), settings, T1)

    expect(resetGameData(storage, '初期化')).toBe(false)
    expect(storage.getItem(SAVE_KEYS.auto)).not.toBeNull()
    expect(resetGameData(storage, RESET_CONFIRMATION_PHRASE)).toBe(true)
    expect(storage.length).toBe(0)
  })
})
