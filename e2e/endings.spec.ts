import { expect, test } from '@playwright/test'
import { simulateCompleteStory } from '../src/app/simulator'
import { DEFAULT_SETTINGS, exportSave } from '../src/game'
import { catalog } from '../src/content'
import {
  AUTO_SAVE_KEY,
  BACKUP_SAVE_KEY,
  MANUAL_SAVE_KEY,
  SETTINGS_KEY,
  completeDialogue,
  openMapLocation,
  openTitleEnvelope,
} from './helpers'

test.describe('三種類の結末表示', () => {
  const simulation = simulateCompleteStory()
  const settings = {
    ...DEFAULT_SETTINGS,
    muted: true,
    textSpeed: 'instant' as const,
    reducedMotion: true,
    quality: 'low' as const,
  }
  const choices = {
    A: '町へ名前を返す',
    B: '記録を外へ持ち出す',
    C: '十三番目の役目を引き継ぐ',
  } as const

  for (const endingCode of ['A', 'B', 'C'] as const) {
    test(`Day 7の最終選択からENDING ${endingCode}へ到達して記録される`, async ({
      page,
    }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop-chrome', '分岐表示はデスクトップで検証する')
      const preEndingState = {
        ...simulation.preEndingState,
        currentLocationId: 'broadcast_hill',
        unlockedLocations: [
          ...new Set([...simulation.preEndingState.unlockedLocations, 'broadcast_hill']),
        ],
        visitedLocations: [
          ...new Set([...simulation.preEndingState.visitedLocations, 'broadcast_hill']),
        ],
      }
      const saveText = exportSave(
        preEndingState,
        settings,
        new Date(
          `2026-07-15T11:1${endingCode === 'A' ? '1' : endingCode === 'B' ? '2' : '3'}:00.000Z`,
        ),
      )
      await page.addInitScript(
        ({ manualKey, autoKey, backupKey, settingsKey, save, savedSettings }) => {
          const storage = (
            globalThis as unknown as {
              readonly localStorage: {
                removeItem(name: string): void
                setItem(name: string, content: string): void
              }
            }
          ).localStorage
          storage.setItem(autoKey, save)
          storage.removeItem(backupKey)
          storage.removeItem(manualKey)
          storage.setItem(settingsKey, JSON.stringify(savedSettings))
        },
        {
          manualKey: MANUAL_SAVE_KEY,
          autoKey: AUTO_SAVE_KEY,
          backupKey: BACKUP_SAVE_KEY,
          settingsKey: SETTINGS_KEY,
          save: saveText,
          savedSettings: settings,
        },
      )

      await page.goto('/')
      await openTitleEnvelope(page)
      await page.getByRole('button', { name: /つづきから/ }).click()
      await expect(page.getByTestId('game-screen')).toBeVisible()
      await openMapLocation(page, '放送塔の丘')
      await page.getByRole('button', { name: /十三番目の放送を行う/u }).click()
      await completeDialogue(page, choices[endingCode])

      const ending = catalog.endings.find((candidate) => candidate.code === endingCode)
      if (ending === undefined) throw new Error(`ENDING ${endingCode} のコンテンツがありません。`)
      await expect(page.getByTestId(`ending-${endingCode}`)).toBeVisible()
      await expect(page.getByRole('heading', { name: ending.title })).toBeVisible()
      await expect(page.getByText(`ENDING ${endingCode}`, { exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: '最終日前から' })).toBeEnabled()
      await expect(page.getByRole('button', { name: '記録を見る' })).toBeEnabled()

      const persisted = await page.evaluate((key) => {
        const raw = globalThis.localStorage.getItem(key)
        if (raw === null) return null
        const save = JSON.parse(raw) as {
          game?: { currentEndingId?: string | null; reachedEndings?: readonly string[] }
        }
        return save.game ?? null
      }, AUTO_SAVE_KEY)
      expect(persisted?.currentEndingId).toBe(ending.id)
      expect(persisted?.reachedEndings).toContain(ending.id)

      await page.getByRole('button', { name: '記録を見る' }).click()
      const records = page.getByRole('dialog', { name: '町の記録' })
      await expect(records).toBeVisible()
      await expect(records).toContainText(ending.title)
    })
  }
})
