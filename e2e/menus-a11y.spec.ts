import { expect, test } from '@playwright/test'
import {
  beginNewGame,
  closeDialog,
  expectNoRuntimeProblems,
  expectNoSeriousA11yViolations,
  openMapLocation,
  openTitleEnvelope,
  seedFastSettings,
  watchRuntimeProblems,
} from './helpers'

test.describe('主要メニューとアクセシビリティ', () => {
  test('@a11y title, transfer, town, dialog have no serious axe violations', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop-chrome',
      'axe と主要メニューはデスクトップで検証する',
    )
    const problems = watchRuntimeProblems(page)
    await seedFastSettings(page)
    await page.goto('/')

    await expectNoSeriousA11yViolations(page, '封筒を開く前のタイトル')
    await openTitleEnvelope(page)
    await expectNoSeriousA11yViolations(page, 'タイトルメニュー')

    await page.getByRole('button', { name: /はじめから/ }).click()
    await expect(page.getByRole('heading', { name: '転入届' })).toBeVisible()
    await expectNoSeriousA11yViolations(page, '転入届')

    await page.getByLabel('転入する方のお名前').fill('斧検証住民')
    await page.getByRole('button', { name: 'この名前で転入する' }).click()
    await expect(page.getByRole('dialog', { name: '住民票' })).toBeVisible()
    await expectNoSeriousA11yViolations(page, '住民票ダイアログ')
    await closeDialog(page, '住民票')

    await expect(page.getByRole('application', { name: '月影町の3D探索画面' })).toBeVisible()
    await expectNoSeriousA11yViolations(page, '3D町探索画面')
    await openMapLocation(page, '月影町駅')
    await expectNoSeriousA11yViolations(page, '場所ダイアログ')
    expectNoRuntimeProblems(problems)
  })

  test('地図、日記、手紙、設定を往復でき、手動保存できる', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop-chrome',
      'axe と主要メニューはデスクトップで検証する',
    )
    const problems = watchRuntimeProblems(page)
    await seedFastSettings(page)
    await page.goto('/')
    await beginNewGame(page, '手帳検証者')
    await closeDialog(page, '住民票')

    await page.getByRole('button', { name: /地図/u }).click()
    const map = page.getByRole('dialog', { name: '月影町案内図' })
    await expect(map).toBeVisible()
    await expect(map.locator('.town-map__paper')).toBeVisible()
    await closeDialog(page, '月影町案内図')

    await page.getByRole('button', { name: /日記/u }).click()
    await expect(page.getByRole('dialog', { name: '日記と手掛かり' })).toContainText(
      '駅を調べ、役場で転入手続きをする',
    )
    await closeDialog(page, '日記と手掛かり')

    await page.getByRole('button', { name: /手紙/u }).click()
    const letters = page.getByRole('dialog', { name: '自室の机・手紙' })
    await expect(letters).toBeVisible()
    await expect(letters.getByRole('navigation', { name: '手紙一覧' })).toBeVisible()
    await closeDialog(page, '自室の机・手紙')

    await page.getByRole('button', { name: /設定/u }).click()
    const settings = page.getByRole('dialog', { name: '設定と記録' })
    await expect(settings).toBeVisible()
    await settings.getByLabel('文字サイズ').selectOption('1.15')
    await settings.getByLabel('3D画質').selectOption('low')
    await settings.getByRole('button', { name: 'いま保存' }).click()
    await expect(page.getByRole('status').filter({ hasText: '手動保存しました' })).toBeVisible()

    expectNoRuntimeProblems(problems)
  })
})
