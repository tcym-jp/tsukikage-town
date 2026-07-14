import {
  exportSave,
  importSave,
  loadSettings,
  saveSettings,
  SAVE_KEYS,
  type StorageLike,
} from '../game'

const LAST_DAY_SAVE_KEY = 'tsukikage-town:save:day-seven'

export function prepareLowQualityRetry(storage: StorageLike) {
  const lowSettings = {
    ...loadSettings(storage),
    quality: 'low' as const,
    reducedMotion: true,
  }
  const settingsResult = saveSettings(storage, lowSettings)
  if (!settingsResult.success) return settingsResult

  try {
    for (const key of [SAVE_KEYS.auto, SAVE_KEYS.manual, SAVE_KEYS.backup, LAST_DAY_SAVE_KEY]) {
      const raw = storage.getItem(key)
      if (raw === null) continue
      const parsed = importSave(raw)
      if (!parsed.success) continue
      storage.setItem(key, exportSave(parsed.save.game, lowSettings, new Date(parsed.save.savedAt)))
    }
    return { success: true } as const
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '低負荷設定を保存できませんでした。',
    } as const
  }
}
