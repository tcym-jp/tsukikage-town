import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { simulateCompleteStory } from '../src/app/simulator'
import { DEFAULT_SETTINGS, exportSave, type GameState } from '../src/game'
import {
  AUTO_SAVE_KEY,
  BACKUP_SAVE_KEY,
  MANUAL_SAVE_KEY,
  SETTINGS_KEY,
  advanceTo,
  closeDialog,
  completeDialogue,
  expectNoRuntimeProblems,
  openMapLocation,
  openTitleEnvelope,
  performLocationAction,
  seedFastSettings,
  watchRuntimeProblems,
} from './helpers'

const simulation = simulateCompleteStory()
const VISUAL_SETTINGS = {
  ...DEFAULT_SETTINGS,
  bgmVolume: 0,
  sfxVolume: 0,
  muted: true,
  textSpeed: 'instant' as const,
  reducedMotion: true,
  quality: 'low' as const,
}

async function capture(page: Page, directory: string, name: string): Promise<void> {
  const canvas = page.locator('canvas')
  if ((await canvas.count()) > 0) {
    await expect(canvas).toBeVisible({ timeout: 15_000 })
    await page.evaluate<boolean>(
      'new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => resolve(true)))))',
    )
    await page.waitForTimeout(180)
  }
  const toast = page.locator('.game-toast')
  if ((await toast.count()) > 0 && (await toast.isVisible())) {
    await expect(toast).toBeHidden({ timeout: 5_000 })
  }
  await page.screenshot({
    path: path.join(directory, `${name}.png`),
    animations: 'disabled',
    caret: 'hide',
    fullPage: false,
    scale: 'css',
  })
}

async function expectLargeDialogContained(page: Page, title: string): Promise<void> {
  const viewport = page.viewportSize()
  if (viewport === null) throw new Error('viewport size is unavailable')
  const dialog = page.getByRole('dialog', { name: title })
  const closeButton = dialog.getByRole('button', { name: '閉じる', exact: true })
  await expect(dialog).toBeVisible()
  await expect(closeButton).toBeVisible()

  for (const [label, locator] of [
    ['dialog', dialog],
    ['close button', closeButton],
  ] as const) {
    const box = await locator.boundingBox()
    if (box === null) throw new Error(`${title} ${label} has no bounding box`)
    expect(box.x, `${title} ${label} left`).toBeGreaterThanOrEqual(0)
    expect(box.y, `${title} ${label} top`).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width, `${title} ${label} right`).toBeLessThanOrEqual(viewport.width + 1)
    expect(box.y + box.height, `${title} ${label} bottom`).toBeLessThanOrEqual(viewport.height + 1)
  }

  await expect
    .poll(() => page.evaluate<number>('document.documentElement.scrollWidth - window.innerWidth'))
    .toBeLessThanOrEqual(0)
}

async function replaceSave(page: Page, state: GameState): Promise<void> {
  const save = exportSave(state, VISUAL_SETTINGS, new Date('2026-07-15T11:13:00.000Z'))
  await page.evaluate(
    ({ autoKey, manualKey, backupKey, settingsKey, saveText, settings }) => {
      const storage = (
        globalThis as unknown as {
          readonly localStorage: {
            removeItem(name: string): void
            setItem(name: string, content: string): void
          }
        }
      ).localStorage
      storage.setItem(autoKey, saveText)
      storage.removeItem(manualKey)
      storage.removeItem(backupKey)
      storage.setItem(settingsKey, JSON.stringify(settings))
    },
    {
      autoKey: AUTO_SAVE_KEY,
      manualKey: MANUAL_SAVE_KEY,
      backupKey: BACKUP_SAVE_KEY,
      settingsKey: SETTINGS_KEY,
      saveText: save,
      settings: VISUAL_SETTINGS,
    },
  )
  await page.reload()
  await openTitleEnvelope(page)
  await page.getByRole('button', { name: /つづきから/u }).click()
}

test.describe('UX_VISUAL_SPEC 最終スクリーンショット', () => {
  test.setTimeout(180_000)

  test('@visual 12画面を指定ビューポートで保存する', async ({ page }, testInfo) => {
    const variant = testInfo.project.name === 'mobile-chrome' ? 'mobile' : 'desktop'
    const directory = path.resolve('artifacts', 'screenshots', variant)
    await mkdir(directory, { recursive: true })
    const problems = watchRuntimeProblems(page)

    await seedFastSettings(page, true)
    await page.goto('/')
    await openTitleEnvelope(page)
    await capture(page, directory, 'title')

    await page.getByRole('button', { name: /はじめから/u }).click()
    await expect(page.getByRole('heading', { name: '転入届' })).toBeVisible()
    await capture(page, directory, 'transfer')

    await page.getByLabel('転入する方のお名前').fill('月野しずく')
    await page.getByRole('button', { name: 'この名前で転入する' }).click()
    await closeDialog(page, '住民票')

    await openMapLocation(page, '月影通り')
    await closeDialog(page, '月影通り')
    await expect(page.getByRole('application', { name: '月影町の3D探索画面' })).toHaveAttribute(
      'data-world-location',
      'moon-street',
    )
    await capture(page, directory, 'street-evening')

    await openMapLocation(page, '月影町駅')
    await page.getByRole('button', { name: /駅時計と時刻表を確かめる/u }).click()
    await expect(page.getByTestId('dialogue-panel')).toBeVisible()
    await capture(page, directory, 'dialogue')
    await completeDialogue(page)
    await closeDialog(page, '月影町駅')

    await openMapLocation(page, '月影町役場')
    await performLocationAction(page, '転入手続きをする')
    await closeDialog(page, '月影町役場')
    await advanceTo(page, '夜へ')
    await openMapLocation(page, '月影荘')
    await closeDialog(page, '月影荘')
    await expect(page.getByText('第0日・夜', { exact: true })).toBeVisible()
    await capture(page, directory, 'apartment-night')

    await openMapLocation(page, '月影荘')
    await performLocationAction(page, '203号室の郵便受けを開ける')
    const earlyLetters = page.getByRole('dialog', { name: '自室の机・手紙' })
    await earlyLetters.getByRole('button', { name: /返事はいりません/u }).click()
    await capture(page, directory, 'letter')
    await closeDialog(page, '自室の机・手紙')

    await page.getByRole('button', { name: /設定/u }).click()
    await expect(page.getByRole('dialog', { name: '設定と記録' })).toBeVisible()
    await capture(page, directory, 'settings')
    await closeDialog(page, '設定と記録')

    const towerState: GameState = {
      ...simulation.preEndingState,
      currentLocationId: 'broadcast_hill',
      unlockedLocations: [
        ...new Set([...simulation.preEndingState.unlockedLocations, 'broadcast_hill']),
      ],
      visitedLocations: [
        ...new Set([...simulation.preEndingState.visitedLocations, 'broadcast_hill']),
      ],
    }
    await replaceSave(page, towerState)
    await expect(page.getByTestId('game-screen')).toBeVisible()
    await expect(page.getByRole('application', { name: '月影町の3D探索画面' })).toHaveAttribute(
      'data-world-location',
      'broadcast-tower',
    )
    await capture(page, directory, 'tower')

    await page.getByRole('button', { name: /日記/u }).click()
    await expect(page.getByRole('dialog', { name: '日記と手掛かり' })).toBeVisible()
    await capture(page, directory, 'journal')
    await closeDialog(page, '日記と手掛かり')

    const bulletinState: GameState = {
      ...simulation.preEndingState,
      clock: { day: 6, period: 'evening' },
      currentLocationId: 'bulletin_board',
      flags: {
        ...simulation.preEndingState.flags,
        'story_action:d6_thirteenth': false,
      },
      finalChoice: null,
      currentEndingId: null,
    }
    await replaceSave(page, bulletinState)
    await expect(page.getByTestId('game-screen')).toBeVisible()
    await openMapLocation(page, '町内掲示板')
    await performLocationAction(page, '十三番目の紙を読む')
    const board = page.getByRole('dialog', { name: '町内掲示板' })
    await expect(board).toBeVisible()
    if (variant === 'mobile') {
      await expectLargeDialogContained(page, '町内掲示板')
      const notices = board.locator('.notice-paper')
      for (const index of [0, 1]) {
        const box = await notices.nth(index).boundingBox()
        if (box === null) throw new Error(`回覧板 ${String(index + 1)}番 has no bounding box`)
        expect(box.x, `回覧板 ${String(index + 1)}番 left`).toBeGreaterThanOrEqual(0)
        expect(box.x + box.width, `回覧板 ${String(index + 1)}番 right`).toBeLessThanOrEqual(391)
      }
    }
    await board
      .getByRole('button', { name: /十三番目/u })
      .first()
      .click()
    await capture(page, directory, 'bulletin')

    await replaceSave(page, simulation.endingStates.A)
    await expect(page.getByTestId('ending-A')).toBeVisible()
    await capture(page, directory, 'ending')
    await page.getByRole('button', { name: '記録を見る' }).click()
    await expect(page.getByRole('dialog', { name: '町の記録' })).toBeVisible()
    if (variant === 'mobile') await expectLargeDialogContained(page, '町の記録')
    await capture(page, directory, 'records')

    expectNoRuntimeProblems(problems)
  })
})
