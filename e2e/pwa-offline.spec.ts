import { expect, test } from '@playwright/test'
import {
  AUTO_SAVE_KEY,
  beginNewGame,
  closeDialog,
  expectNoRuntimeProblems,
  openTitleEnvelope,
  seedFastSettings,
  watchRuntimeProblems,
} from './helpers'

test.describe('PWAオフライン再開', () => {
  test.setTimeout(60_000)

  test('オンライン初回読込後はオフライン再読込と保存記録の閲覧ができる', async ({
    page,
    context,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop-chrome',
      'Service Workerはデスクトップで一度検証する',
    )
    const problems = watchRuntimeProblems(page)
    await seedFastSettings(page)
    await page.goto('/')

    expect(await page.evaluate<boolean>("'serviceWorker' in navigator")).toBe(true)
    await page.evaluate<boolean>('navigator.serviceWorker.ready.then(() => true)')
    if (!(await page.evaluate<boolean>('navigator.serviceWorker.controller !== null'))) {
      await page.reload()
    }
    await expect
      .poll(() => page.evaluate<boolean>('navigator.serviceWorker.controller !== null'), {
        timeout: 20_000,
        message: 'Service Workerがページを制御していません',
      })
      .toBe(true)

    await beginNewGame(page, 'オフライン住民')
    await closeDialog(page, '住民票')
    await expect
      .poll(
        () =>
          page.evaluate((key) => {
            const storage = (
              globalThis as unknown as {
                readonly localStorage: { getItem(name: string): string | null }
              }
            ).localStorage
            return storage.getItem(key) !== null
          }, AUTO_SAVE_KEY),
        { message: '端末内セーブが作成されていません' },
      )
      .toBe(true)

    await context.setOffline(true)
    try {
      await page.reload({ waitUntil: 'domcontentloaded' })
      await expect(page.getByTestId('title-screen')).toBeVisible({ timeout: 15_000 })
      await openTitleEnvelope(page)
      await expect(page.getByRole('button', { name: /つづきから/u })).toBeEnabled()
      await page.getByRole('button', { name: /つづきから/u }).click()
      await expect(page.getByTestId('game-screen')).toBeVisible()
      await expect(page.getByText('第0日・夕方', { exact: true })).toBeVisible()
      await page.getByRole('button', { name: /日記/u }).click()
      await expect(page.getByRole('dialog', { name: '日記と手掛かり' })).toBeVisible()
    } finally {
      await context.setOffline(false)
    }

    expectNoRuntimeProblems(problems)
  })
})
