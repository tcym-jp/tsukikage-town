import { expect, test, type Locator, type Page } from '@playwright/test'
import { simulateCompleteStory } from '../src/app/simulator'
import { DEFAULT_SETTINGS, exportSave } from '../src/game'
import {
  AUTO_SAVE_KEY,
  BACKUP_SAVE_KEY,
  MANUAL_SAVE_KEY,
  SETTINGS_KEY,
  closeDialog,
  openTitleEnvelope,
  seedFastSettings,
} from './helpers'

const VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
] as const

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  await expect
    .poll(() => page.evaluate<number>('document.documentElement.scrollWidth - window.innerWidth'))
    .toBeLessThanOrEqual(0)
}

async function expectHorizontallyContained(
  locator: Locator,
  viewportWidth: number,
  label: string,
): Promise<void> {
  const box = await locator.boundingBox()
  if (box === null) throw new Error(`${label} has no bounding box.`)
  expect(box.x, `${label} left`).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width, `${label} right`).toBeLessThanOrEqual(viewportWidth + 1)
}

async function expectDialogContained(
  page: Page,
  title: string,
  viewport: { readonly width: number; readonly height: number },
): Promise<void> {
  const dialog = page.getByRole('dialog', { name: title })
  await expect(dialog).toBeVisible()
  const box = await dialog.boundingBox()
  if (box === null) throw new Error(`${String(viewport.width)}px ${title} has no box.`)
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.y).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1)
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1)
  await expect(dialog.getByRole('button', { name: '閉じる', exact: true })).toBeVisible()
  await expectNoHorizontalOverflow(page)
}

test.describe('レスポンシブ行列', () => {
  test.setTimeout(120_000)

  test('360/390/768/1366/1920幅でタイトル、転入届、HUD、大型手帳が収まる', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', '全幅は一つのブラウザ文脈で検証する')
    await seedFastSettings(page, true)
    await page.addInitScript((key) => {
      const storage = (
        globalThis as unknown as {
          readonly localStorage: {
            getItem(name: string): string | null
            setItem(name: string, content: string): void
          }
        }
      ).localStorage
      const current = JSON.parse(storage.getItem(key) ?? '{}') as Record<string, unknown>
      storage.setItem(key, JSON.stringify({ ...current, fontScale: 1.3 }))
    }, SETTINGS_KEY)
    let hasSave = false

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport)
      if (page.url() === 'about:blank') await page.goto('/')
      else await page.reload()
      await openTitleEnvelope(page)
      await expect(page.getByTestId('title-screen')).toBeVisible()
      await expectNoHorizontalOverflow(page)
      const titleBox = await page.getByTestId('title-screen').boundingBox()
      if (titleBox === null) throw new Error(`${String(viewport.width)}px title has no box.`)
      expect(titleBox.x).toBeGreaterThanOrEqual(0)
      expect(titleBox.x + titleBox.width).toBeLessThanOrEqual(viewport.width + 1)

      await page.getByRole('button', { name: /はじめから/u }).click()
      const transfer = page.getByTestId('transfer-screen')
      await expect(transfer).toBeVisible()
      await expectHorizontallyContained(
        transfer,
        viewport.width,
        `${String(viewport.width)}px transfer`,
      )
      await expectNoHorizontalOverflow(page)

      if (!hasSave) {
        await page.getByLabel('転入する方のお名前').fill('画面幅住民')
        await page.getByRole('button', { name: 'この名前で転入する' }).click()
        await expect(page.getByTestId('game-screen')).toBeVisible()
        await closeDialog(page, '住民票')
        hasSave = true
      } else {
        await page.getByRole('button', { name: '封筒へ戻る' }).click()
        await openTitleEnvelope(page)
        await page.getByRole('button', { name: /つづきから/u }).click()
        await expect(page.getByTestId('game-screen')).toBeVisible()
      }

      await expectNoHorizontalOverflow(page)
      const gameBox = await page.getByTestId('game-screen').boundingBox()
      if (gameBox === null) throw new Error(`${String(viewport.width)}px game has no box.`)
      expect(gameBox.x).toBeGreaterThanOrEqual(0)
      expect(gameBox.y).toBeGreaterThanOrEqual(0)
      expect(gameBox.x + gameBox.width).toBeLessThanOrEqual(viewport.width + 1)
      expect(gameBox.y + gameBox.height).toBeLessThanOrEqual(viewport.height + 1)

      const hud = page.getByRole('navigation', { name: '手帳メニュー' })
      await expectHorizontallyContained(hud, viewport.width, `${String(viewport.width)}px HUD`)
      await hud.getByRole('button', { name: /日記/u }).click()
      await expectDialogContained(page, '日記と手掛かり', viewport)
      await closeDialog(page, '日記と手掛かり')
    }
  })

  test('360/390/768/1366/1920幅で結末と記録ダイアログが収まる', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', '全幅は一つのブラウザ文脈で検証する')
    const simulation = simulateCompleteStory()
    const settings = {
      ...DEFAULT_SETTINGS,
      muted: true,
      textSpeed: 'instant' as const,
      reducedMotion: true,
      quality: 'low' as const,
    }
    const saveText = exportSave(simulation.endingStates.A, settings)
    await page.addInitScript(
      ({ autoKey, manualKey, backupKey, settingsKey, save, savedSettings }) => {
        const storage = (
          globalThis as unknown as {
            readonly localStorage: {
              removeItem(name: string): void
              setItem(name: string, content: string): void
            }
          }
        ).localStorage
        storage.setItem(autoKey, save)
        storage.removeItem(manualKey)
        storage.removeItem(backupKey)
        storage.setItem(settingsKey, JSON.stringify(savedSettings))
      },
      {
        autoKey: AUTO_SAVE_KEY,
        manualKey: MANUAL_SAVE_KEY,
        backupKey: BACKUP_SAVE_KEY,
        settingsKey: SETTINGS_KEY,
        save: saveText,
        savedSettings: settings,
      },
    )

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport)
      if (page.url() === 'about:blank') await page.goto('/')
      else await page.reload()
      await openTitleEnvelope(page)
      await page.getByRole('button', { name: /つづきから/u }).click()

      const ending = page.getByTestId('ending-A')
      await expect(ending).toBeVisible()
      await expectHorizontallyContained(
        ending,
        viewport.width,
        `${String(viewport.width)}px ending`,
      )
      await expectNoHorizontalOverflow(page)

      await page.getByRole('button', { name: '記録を見る' }).click()
      await expectDialogContained(page, '町の記録', viewport)
      await closeDialog(page, '町の記録')
    }
  })
})
