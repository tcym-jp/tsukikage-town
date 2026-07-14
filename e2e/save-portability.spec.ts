import { expect, test } from '@playwright/test'
import { simulateCompleteStory } from '../src/app/simulator'
import { DEFAULT_SETTINGS, exportSave } from '../src/game'
import {
  AUTO_SAVE_KEY,
  BACKUP_SAVE_KEY,
  MANUAL_SAVE_KEY,
  beginNewGame,
  closeDialog,
  openTitleEnvelope,
  seedFastSettings,
} from './helpers'

const LAST_DAY_SAVE_KEY = 'tsukikage-town:save:day-seven'

test.describe('保存記録の可搬性', () => {
  test.setTimeout(60_000)

  test('E2E 10: 有効JSONをUIで書き出し、空の端末状態へ読み戻せる', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'JSON往復はデスクトップで検証する')
    await seedFastSettings(page)
    await page.goto('/')
    await beginNewGame(page, '可搬記録住民')
    await closeDialog(page, '住民票')
    await page.getByRole('button', { name: /設定/u }).click()
    const settings = page.getByRole('dialog', { name: '設定と記録' })
    const downloadPromise = page.waitForEvent('download')
    await settings.getByRole('button', { name: 'JSONを書き出す' }).click()
    const download = await downloadPromise
    expect(await download.failure()).toBeNull()
    const exportedPath = testInfo.outputPath('valid-save.json')
    await download.saveAs(exportedPath)

    await page.evaluate(
      (keys) => {
        const storage = (
          globalThis as unknown as {
            readonly localStorage: { removeItem(name: string): void }
          }
        ).localStorage
        for (const key of keys) storage.removeItem(key)
      },
      [AUTO_SAVE_KEY, MANUAL_SAVE_KEY, BACKUP_SAVE_KEY],
    )
    await page.reload()
    await openTitleEnvelope(page)
    await expect(page.getByRole('button', { name: /つづきから/u })).toBeDisabled()
    await page.getByRole('button', { name: '設定', exact: true }).click()
    const titleSettings = page.getByRole('dialog', { name: '設定' })
    const chooserPromise = page.waitForEvent('filechooser')
    await titleSettings.getByRole('button', { name: 'JSONを読み込む', exact: true }).click()
    const chooser = await chooserPromise
    await chooser.setFiles(exportedPath)

    await expect(
      page.getByRole('status').filter({ hasText: '記録JSONを読み込みました' }),
    ).toBeVisible()
    await expect(page.getByTestId('game-screen')).toBeVisible()
    const importedName = await page.evaluate((key) => {
      const storage = (
        globalThis as unknown as {
          readonly localStorage: { getItem(name: string): string | null }
        }
      ).localStorage
      const raw = storage.getItem(key)
      if (raw === null) return null
      const save = JSON.parse(raw) as { game?: { player?: { name?: string } } }
      return save.game?.player?.name ?? null
    }, MANUAL_SAVE_KEY)
    expect(importedName).toBe('可搬記録住民')
  })

  test('最終記録だけを読み込んでも最終日前から再開できる', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', '最終記録の復旧はデスクトップで検証する')
    const simulation = simulateCompleteStory()
    const saveText = exportSave(simulation.endingStates.A, {
      ...DEFAULT_SETTINGS,
      muted: true,
      textSpeed: 'instant',
      reducedMotion: true,
      quality: 'low',
    })

    await seedFastSettings(page, true)
    await page.goto('/')
    await openTitleEnvelope(page)
    expect(await page.evaluate((key) => localStorage.getItem(key), LAST_DAY_SAVE_KEY)).toBeNull()

    await page.getByRole('button', { name: '設定', exact: true }).click()
    const titleSettings = page.getByRole('dialog', { name: '設定' })
    const chooserPromise = page.waitForEvent('filechooser')
    await titleSettings.getByRole('button', { name: 'JSONを読み込む', exact: true }).click()
    const chooser = await chooserPromise
    await chooser.setFiles({
      name: 'ending-a-without-local-checkpoint.json',
      mimeType: 'application/json',
      buffer: Buffer.from(saveText),
    })

    await expect(page.getByTestId('ending-A')).toBeVisible()
    await expect(
      page.getByRole('status').filter({ hasText: '記録JSONを読み込みました' }),
    ).toBeVisible()
    expect(
      await page.evaluate((key) => localStorage.getItem(key), LAST_DAY_SAVE_KEY),
    ).not.toBeNull()

    await page.getByRole('button', { name: '最終日前から' }).click()
    await expect(page.getByTestId('game-screen')).toBeVisible()
    await expect(page.getByText('第7日・朝', { exact: true })).toBeVisible()
    const restored = await page.evaluate((key) => {
      const raw = localStorage.getItem(key)
      if (raw === null) return null
      const save = JSON.parse(raw) as {
        game?: {
          currentEndingId?: string | null
          reachedEndings?: readonly string[]
          clock?: { day?: number; period?: string }
        }
      }
      return save.game ?? null
    }, AUTO_SAVE_KEY)
    expect(restored?.clock).toEqual({ day: 7, period: 'morning' })
    expect(restored?.currentEndingId).toBeNull()
    expect(restored?.reachedEndings).toContain('A')
  })
})
