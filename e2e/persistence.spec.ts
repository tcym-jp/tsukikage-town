import { expect, test } from '@playwright/test'
import {
  AUTO_SAVE_KEY,
  BACKUP_SAVE_KEY,
  beginNewGame,
  closeDialog,
  openMapLocation,
  openTitleEnvelope,
  seedFastSettings,
} from './helpers'

test.describe('端末内セーブと復旧', () => {
  test('再読み込み後につづきから再開し、壊れた自動保存はバックアップへ戻る', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', '永続化はデスクトップで検証する')
    await seedFastSettings(page)
    await page.goto('/')
    await beginNewGame(page, '保存検証者')
    await closeDialog(page, '住民票')

    // A location visit writes a second auto save, which atomically retains the
    // prior valid envelope in the backup slot.
    await openMapLocation(page, '月影町駅')
    await closeDialog(page, '月影町駅')
    await expect
      .poll(() =>
        page.evaluate((key) => {
          const storage = (
            globalThis as unknown as {
              readonly localStorage: { getItem(name: string): string | null }
            }
          ).localStorage
          return storage.getItem(key) !== null
        }, BACKUP_SAVE_KEY),
      )
      .toBe(true)

    await page.reload()
    await openTitleEnvelope(page)
    await page.getByRole('button', { name: /つづきから/ }).click()
    await expect(page.getByTestId('game-screen')).toBeVisible()
    await expect(page.getByText('第0日・夕方', { exact: true })).toBeVisible()

    await page.evaluate(
      ({ autoKey }) => {
        const storage = (
          globalThis as unknown as {
            readonly localStorage: { setItem(name: string, content: string): void }
          }
        ).localStorage
        storage.setItem(autoKey, '{"schemaVersion":1,"broken":')
      },
      { autoKey: AUTO_SAVE_KEY },
    )
    await page.reload()
    await openTitleEnvelope(page)
    await expect(page.getByRole('button', { name: /つづきから/ })).toBeEnabled()
    await page.getByRole('button', { name: /つづきから/ }).click()

    await expect(page.getByTestId('game-screen')).toBeVisible()
    await expect(page.getByRole('status').filter({ hasText: '直前のバックアップ' })).toBeVisible()
    await expect(page.getByText('第0日・夕方', { exact: true })).toBeVisible()
  })

  test('不正なJSONインポートを拒否し現在の記録を保持する', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', '永続化はデスクトップで検証する')
    await seedFastSettings(page)
    await page.goto('/')
    await beginNewGame(page, '読込検証者')
    await closeDialog(page, '住民票')

    const before = await page.evaluate((key) => {
      const storage = (
        globalThis as unknown as {
          readonly localStorage: { getItem(name: string): string | null }
        }
      ).localStorage
      return storage.getItem(key)
    }, AUTO_SAVE_KEY)
    await page.getByRole('button', { name: /設定/u }).click()
    await expect(page.getByRole('dialog', { name: '設定と記録' })).toBeVisible()
    await page.locator('input[type="file"]').setInputFiles({
      name: 'broken-save.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"schemaVersion": 1, "game":'),
    })
    await expect(page.getByRole('status').filter({ hasText: '読み込めませんでした' })).toBeVisible()
    const after = await page.evaluate((key) => {
      const storage = (
        globalThis as unknown as {
          readonly localStorage: { getItem(name: string): string | null }
        }
      ).localStorage
      return storage.getItem(key)
    }, AUTO_SAVE_KEY)
    expect(after).toBe(before)
    await expect(page.getByRole('dialog', { name: '設定と記録' })).toBeVisible()
  })
})
