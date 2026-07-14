import { expect, test, type Page } from '@playwright/test'
import { simulateCompleteStory } from '../src/app/simulator'
import { DEFAULT_SETTINGS, exportSave, type GameState } from '../src/game'
import {
  AUTO_SAVE_KEY,
  BACKUP_SAVE_KEY,
  MANUAL_SAVE_KEY,
  SETTINGS_KEY,
  closeDialog,
  completeDialogue,
  openMapLocation,
  openTitleEnvelope,
  performLocationAction,
  seedFastSettings,
} from './helpers'

/**
 * ACCEPTANCE_TESTS.md E2E traceability:
 *  1/3 onboarding.spec, 2/15 persistence.spec, 4 this file (choice),
 *  5 this file (Day 6→7), 6 this file (13th notice), 7/8/9 endings.spec,
 * 10 this file (export/import), 11 mobile.spec, 12 this file (keyboard),
 * 13 this file (reduced motion), 14 this file (low quality).
 */
const simulation = simulateCompleteStory()
const ACCEPTANCE_SETTINGS = {
  ...DEFAULT_SETTINGS,
  bgmVolume: 0,
  sfxVolume: 0,
  muted: true,
  textSpeed: 'instant' as const,
  reducedMotion: true,
  quality: 'low' as const,
}
const LAST_DAY_SAVE_KEY = 'tsukikage-town:save:day-seven'

async function installState(page: Page, state: GameState, lastDaySave?: string): Promise<void> {
  if (page.url() === 'about:blank') {
    await seedFastSettings(page, true)
    await page.goto('/')
  }
  const saveText = exportSave(state, ACCEPTANCE_SETTINGS, new Date('2026-07-15T11:13:00.000Z'))
  await page.evaluate(
    ({ autoKey, manualKey, backupKey, settingsKey, dayKey, save, settings, daySave }) => {
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
      storage.setItem(settingsKey, JSON.stringify(settings))
      if (daySave === undefined) storage.removeItem(dayKey)
      else storage.setItem(dayKey, daySave)
    },
    {
      autoKey: AUTO_SAVE_KEY,
      manualKey: MANUAL_SAVE_KEY,
      backupKey: BACKUP_SAVE_KEY,
      settingsKey: SETTINGS_KEY,
      dayKey: LAST_DAY_SAVE_KEY,
      save: saveText,
      settings: ACCEPTANCE_SETTINGS,
      daySave: lastDaySave,
    },
  )
  await page.reload()
  await openTitleEnvelope(page)
  await page.getByRole('button', { name: /つづきから/u }).click()
}

function incompleteActionState(
  state: GameState,
  actionId: string,
  clock: GameState['clock'],
  currentLocationId: string,
): GameState {
  return {
    ...state,
    clock,
    currentLocationId,
    flags: { ...state.flags, [`story_action:${actionId}`]: false },
    currentEndingId: null,
    finalChoice: null,
  }
}

test.describe('受入条件のE2E補強', () => {
  test.setTimeout(90_000)

  test('E2E 4: 会話選択が信頼度と物語フラグへ反映される', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', '受入分岐はデスクトップで検証する')
    const state: GameState = {
      ...incompleteActionState(
        simulation.preEndingState,
        'd2_ledger',
        { day: 2, period: 'morning' },
        'town_hall',
      ),
      trust: { ...simulation.preEndingState.trust, sumi: 0 },
      flags: {
        ...simulation.preEndingState.flags,
        'story_action:d2_ledger': false,
        sumi_answered: false,
      },
    }
    await installState(page, state)
    await openMapLocation(page, '月影町役場')
    await page.getByRole('button', { name: /古い住民台帳を調べる/u }).click()
    await completeDialogue(page, '澄の立場を聞く')

    const choiceResult = await page.evaluate((key) => {
      const storage = (
        globalThis as unknown as {
          readonly localStorage: { getItem(name: string): string | null }
        }
      ).localStorage
      const raw = storage.getItem(key)
      if (raw === null) return null
      const save = JSON.parse(raw) as {
        game?: { flags?: Record<string, boolean>; trust?: Record<string, number> }
      }
      return {
        answered: save.game?.flags?.sumi_answered,
        trust: save.game?.trust?.sumi,
      }
    }, AUTO_SAVE_KEY)
    expect(choiceResult).toEqual({ answered: true, trust: 3 })
  })

  test('E2E 6: 条件前は12件、手掛かり条件後は13件目が実UIへ出現する', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', '回覧条件はデスクトップで検証する')
    const before: GameState = {
      ...incompleteActionState(
        simulation.preEndingState,
        'd6_changed_board',
        { day: 6, period: 'morning' },
        'bulletin_board',
      ),
      discoveredClues: simulation.preEndingState.discoveredClues.slice(0, 9),
    }
    await installState(page, before)
    await openMapLocation(page, '町内掲示板')
    await performLocationAction(page, '書き換えられた十二枚を比べる')
    const beforeBoard = page.getByRole('dialog', { name: '町内掲示板' })
    await expect(beforeBoard.locator('button.notice-paper')).toHaveCount(12)
    await expect(beforeBoard.getByRole('button', { name: /十三番目/u })).toHaveCount(0)

    const after = incompleteActionState(
      simulation.preEndingState,
      'd6_thirteenth',
      { day: 6, period: 'evening' },
      'bulletin_board',
    )
    await installState(page, after)
    await openMapLocation(page, '町内掲示板')
    await performLocationAction(page, '十三番目の紙を読む')
    const afterBoard = page.getByRole('dialog', { name: '町内掲示板' })
    await expect(afterBoard.locator('button.notice-paper')).toHaveCount(13)
    await expect(afterBoard.getByRole('button', { name: /十三番目/u })).toBeVisible()
  })

  test('E2E 5: Day 6夜からDay 7朝へ進み、Ending後も最終日前と記録を保持する', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', '最終日遷移はデスクトップで検証する')
    const daySix: GameState = {
      ...simulation.preEndingState,
      clock: { day: 6, period: 'night' },
      currentLocationId: 'room_203',
      currentEndingId: null,
      finalChoice: null,
    }
    await installState(page, daySix)
    await page.getByRole('button', { name: '時間を進める' }).click()
    await page
      .getByRole('dialog', { name: '時間を進める' })
      .getByRole('button', { name: '第7日へ' })
      .click()
    await expect(page.getByText('第7日・朝', { exact: true })).toBeVisible()
    const daySevenSave = await page.evaluate((key) => {
      const storage = (
        globalThis as unknown as {
          readonly localStorage: { getItem(name: string): string | null }
        }
      ).localStorage
      return storage.getItem(key)
    }, LAST_DAY_SAVE_KEY)
    expect(daySevenSave).not.toBeNull()
    if (daySevenSave === null) throw new Error('Day 7 checkpoint was not written.')

    await installState(page, simulation.endingStates.A, daySevenSave)
    await expect(page.getByTestId('ending-A')).toBeVisible()
    await page.getByRole('button', { name: '記録を見る' }).click()
    const records = page.getByRole('dialog', { name: '町の記録' })
    await expect(records).toContainText('月影町の住民')
    await closeDialog(page, '町の記録')
    await page.getByRole('button', { name: '最終日前から' }).click()
    await expect(page.getByTestId('game-screen')).toBeVisible()
    await expect(page.getByText('第7日・朝', { exact: true })).toBeVisible()
    await expect(page.getByRole('dialog', { name: '日記と手掛かり' })).toBeVisible()
    const retainedEndings = await page.evaluate((key) => {
      const storage = (
        globalThis as unknown as {
          readonly localStorage: { getItem(name: string): string | null }
        }
      ).localStorage
      const raw = storage.getItem(key)
      if (raw === null) return []
      const save = JSON.parse(raw) as { game?: { reachedEndings?: string[] } }
      return save.game?.reachedEndings ?? []
    }, AUTO_SAVE_KEY)
    expect(retainedEndings).toContain('A')
  })

  test('E2E 12–14: PCキーボード、モーション軽減、低画質で探索できる', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'PC入力はデスクトップで検証する')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await seedFastSettings(page, false)
    await page.goto('/')
    await expect(page.getByRole('button', { name: /はじめから/u })).toBeVisible()
    expect(
      await page.evaluate<boolean>("matchMedia('(prefers-reduced-motion: reduce)').matches"),
    ).toBe(true)

    await page.getByRole('button', { name: /はじめから/u }).click()
    await page.getByLabel('転入する方のお名前').fill('鍵盤住民')
    await page.getByRole('button', { name: 'この名前で転入する' }).click()
    await closeDialog(page, '住民票')
    const world = page.getByRole('application', { name: '月影町の3D探索画面' })
    await expect(world).toHaveAttribute('data-world-quality', 'low')
    await expect(page.getByTestId('world-interaction-prompt')).toContainText('月影町駅')

    await world.focus()
    await page.keyboard.press('e')
    await expect(page.getByRole('dialog', { name: '月影町駅' })).toBeVisible()
    await closeDialog(page, '月影町駅')

    await world.focus()
    await page.keyboard.down('d')
    await page.waitForTimeout(1_100)
    await page.keyboard.up('d')
    await expect(page.getByTestId('world-interaction-prompt')).toBeHidden()

    await page.keyboard.press('m')
    await expect(page.getByRole('dialog', { name: '月影町案内図' })).toBeVisible()
    await page.keyboard.press('Escape')
    await page.keyboard.press('j')
    await expect(page.getByRole('dialog', { name: '日記と手掛かり' })).toBeVisible()
  })
})
