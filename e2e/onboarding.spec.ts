import { expect, test } from '@playwright/test'
import {
  advanceTo,
  beginNewGame,
  closeDialog,
  completeDialogue,
  expectNoRuntimeProblems,
  openMapLocation,
  openTitleEnvelope,
  performLocationAction,
  seedFastSettings,
  watchRuntimeProblems,
} from './helpers'

test.describe('転入から最初の夜まで', () => {
  test.setTimeout(60_000)

  test('タイトル、入力検証、駅、役場、郵便受けを実UIだけで進める', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', '実進行はデスクトップで一度通す')
    const problems = watchRuntimeProblems(page)
    await seedFastSettings(page)
    await page.goto('/')

    await expect(page.getByTestId('title-screen')).toBeVisible()
    await openTitleEnvelope(page)
    await page.getByRole('button', { name: /はじめから/ }).click()
    await expect(page.getByRole('heading', { name: '転入届' })).toBeVisible()

    await page.getByRole('button', { name: 'この名前で転入する' }).click()
    await expect(page.getByRole('alert')).toContainText('一文字以上')
    await page.getByLabel('転入する方のお名前').fill('検証住民🌙')
    await page.getByRole('button', { name: 'この名前で転入する' }).click()

    const resident = page.getByRole('dialog', { name: '住民票' })
    await expect(resident).toContainText('検証住民🌙')
    await expect(resident).toContainText('月影荘203号室')
    await closeDialog(page, '住民票')

    await openMapLocation(page, '月影町駅')
    await performLocationAction(page, '駅時計と時刻表を確かめる')
    const completedSave = await page.evaluate(() =>
      localStorage.getItem('tsukikage-town:save:auto'),
    )
    const completedAction = page
      .getByRole('dialog', { name: '月影町駅' })
      .getByRole('button', { name: /駅時計と時刻表を確かめる/u })
    await expect(completedAction).toBeEnabled()
    await completedAction.click()
    await expect(page.getByRole('button', { name: '既読を送る' })).toBeVisible()
    await page.getByRole('button', { name: '既読を送る' }).click()
    await expect(page.getByTestId('dialogue-panel')).toBeHidden()
    expect(await page.evaluate(() => localStorage.getItem('tsukikage-town:save:auto'))).toBe(
      completedSave,
    )
    await closeDialog(page, '月影町駅')

    await openMapLocation(page, '月影町役場')
    await page.getByRole('button', { name: /転入手続きをする/u }).click()
    const townHallDialogue = page.getByRole('dialog', { name: '御影 澄' })
    await expect(townHallDialogue).toContainText('検証住民🌙さん')
    for (let tab = 0; tab < 4; tab += 1) {
      await page.keyboard.press('Tab')
      expect(
        await page.evaluate<boolean>(
          'document.querySelector(\'[data-testid="dialogue-panel"]\')?.contains(document.activeElement) === true',
        ),
      ).toBe(true)
    }
    await completeDialogue(page)
    await closeDialog(page, '月影町役場')

    await expect(page.getByRole('button', { name: '時間を進める' })).toBeEnabled()
    await advanceTo(page, '夜へ')
    await expect(page.getByText('第0日・夜', { exact: true })).toBeVisible()

    await openMapLocation(page, '月影荘')
    await performLocationAction(page, '203号室の郵便受けを開ける')
    const letterDialog = page.getByRole('dialog', { name: '自室の机・手紙' })
    await expect(letterDialog).toBeVisible()
    await letterDialog.getByRole('button', { name: /返事はいりません/u }).click()
    await expect(letterDialog.getByRole('article', { name: '返事はいりません' })).toContainText(
      '月影荘204号室',
    )
    await closeDialog(page, '自室の机・手紙')

    await expect(page.getByRole('button', { name: '時間を進める' })).toBeEnabled()
    await advanceTo(page, '第1日へ')
    await expect(page.getByText('第1日・朝', { exact: true })).toBeVisible()

    const savedClock = await page.evaluate(() => {
      const storage = (
        globalThis as unknown as {
          readonly localStorage: { getItem(name: string): string | null }
        }
      ).localStorage
      const raw = storage.getItem('tsukikage-town:save:auto')
      if (raw === null) return null
      const value = JSON.parse(raw) as { game?: { clock?: unknown } }
      return value.game?.clock ?? null
    })
    expect(savedClock).toEqual({ day: 1, period: 'morning' })
    expectNoRuntimeProblems(problems)
  })

  test('会話の履歴を開閉しても進行できる', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', '実進行はデスクトップで一度通す')
    await seedFastSettings(page)
    await page.goto('/')
    await beginNewGame(page)
    await closeDialog(page, '住民票')
    await openMapLocation(page, '月影町駅')
    await page.getByRole('button', { name: /駅時計と時刻表を確かめる/ }).click()

    const dialogue = page.getByTestId('dialogue-panel')
    await dialogue.getByRole('button', { name: '履歴' }).click()
    await expect(dialogue.getByRole('log', { name: '会話履歴' })).toContainText(
      'まだ履歴はありません',
    )
    await page.keyboard.press('Escape')
    await expect(dialogue.getByRole('log', { name: '会話履歴' })).toBeHidden()
    await expect(dialogue).toBeVisible()
    await completeDialogue(page)
    await expect(page.getByTestId('dialogue-panel')).toBeHidden()
  })
})
