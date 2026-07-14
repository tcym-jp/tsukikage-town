import { expect, test } from '@playwright/test'
import {
  beginNewGame,
  closeDialog,
  expectNoRuntimeProblems,
  seedFastSettings,
  watchRuntimeProblems,
} from './helpers'

test.describe('スマートフォン操作', () => {
  test('縦画面で転入し、タッチ移動と調べる操作を利用できる', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chrome', 'モバイル用プロジェクトでのみ検証する')
    const problems = watchRuntimeProblems(page)
    await seedFastSettings(page)
    await page.goto('/')
    await beginNewGame(page, '携帯検証者')
    await closeDialog(page, '住民票')

    const game = page.getByTestId('game-screen')
    const gameBox = await game.boundingBox()
    expect(gameBox?.width).toBeLessThanOrEqual(390)

    const touchControls = page.getByLabel('町のタッチ操作')
    const joystick = page.getByRole('group', { name: '移動スティック' })
    const interact = touchControls.getByRole('button', { name: '調べる' })
    await expect(touchControls).toBeVisible()
    await expect(joystick).toBeVisible()
    await expect(interact).toBeVisible()
    await expect(interact).toBeEnabled()

    // The player begins beside the station, so a real touchscreen tap should
    // open the nearby interaction through the public mobile controller.
    await interact.tap()
    await expect(page.getByRole('dialog', { name: '月影町駅' })).toBeVisible()
    await closeDialog(page, '月影町駅')

    const box = await joystick.boundingBox()
    if (box === null) throw new Error('移動スティックの位置を取得できません。')
    const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
    await page.mouse.move(center.x, center.y)
    await page.mouse.down()
    await page.mouse.move(center.x + 38, center.y)
    const movedStyle = await joystick.locator('span').getAttribute('style')
    expect(movedStyle).not.toContain('translate(0px, 0px)')
    await page.mouse.up()

    expectNoRuntimeProblems(problems)
  })

  test('横画面でもHUDと主要メニューが画面内に収まる', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chrome', 'モバイル用プロジェクトでのみ検証する')
    await page.setViewportSize({ width: 844, height: 390 })
    await seedFastSettings(page)
    await page.goto('/')
    await beginNewGame(page, '横画面検証')
    await closeDialog(page, '住民票')

    const menu = page.getByRole('navigation', { name: '手帳メニュー' })
    await expect(menu).toBeVisible()
    const box = await menu.boundingBox()
    if (box === null) throw new Error('手帳メニューの位置を取得できません。')
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.y).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(844)
    expect(box.y + box.height).toBeLessThanOrEqual(390)

    await menu.getByRole('button', { name: /地図/u }).click()
    const dialog = page.getByRole('dialog', { name: '月影町案内図' })
    await expect(dialog).toBeVisible()
    const dialogBox = await dialog.boundingBox()
    if (dialogBox === null) throw new Error('地図ダイアログの位置を取得できません。')
    expect(dialogBox.x).toBeGreaterThanOrEqual(0)
    expect(dialogBox.y).toBeGreaterThanOrEqual(0)
    expect(dialogBox.x + dialogBox.width).toBeLessThanOrEqual(844)
    expect(dialogBox.y + dialogBox.height).toBeLessThanOrEqual(390)
  })
})
