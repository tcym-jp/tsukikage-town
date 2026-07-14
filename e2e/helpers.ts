import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

export const SETTINGS_KEY = 'tsukikage-town:settings'
export const AUTO_SAVE_KEY = 'tsukikage-town:save:auto'
export const MANUAL_SAVE_KEY = 'tsukikage-town:save:manual'
export const BACKUP_SAVE_KEY = 'tsukikage-town:save:backup'

export const E2E_SETTINGS = {
  bgmVolume: 0,
  sfxVolume: 0,
  muted: true,
  textSpeed: 'instant',
  autoAdvance: false,
  reducedMotion: false,
  quality: 'low',
  showControlGuide: true,
  fontScale: 1,
} as const

export interface RuntimeProblems {
  readonly consoleErrors: string[]
  readonly pageErrors: string[]
}

export function watchRuntimeProblems(page: Page): RuntimeProblems {
  const problems: RuntimeProblems = { consoleErrors: [], pageErrors: [] }
  page.on('console', (message) => {
    if (message.type() === 'error') problems.consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => problems.pageErrors.push(error.message))
  return problems
}

export async function seedFastSettings(page: Page, reducedMotion = false): Promise<void> {
  await page.addInitScript(
    ({ key, value }) => {
      const storage = (
        globalThis as unknown as {
          readonly localStorage: { setItem(name: string, content: string): void }
        }
      ).localStorage
      storage.setItem(key, JSON.stringify(value))
    },
    {
      key: SETTINGS_KEY,
      value: { ...E2E_SETTINGS, reducedMotion },
    },
  )
}

export async function openTitleEnvelope(page: Page): Promise<void> {
  const envelope = page.getByTestId('open-envelope')
  if (await envelope.isVisible()) await envelope.click()
  await expect(page.getByRole('heading', { name: /月影町/ })).toBeVisible()
}

export async function beginNewGame(page: Page, playerName = '検証住民'): Promise<void> {
  await openTitleEnvelope(page)
  await page.getByRole('button', { name: /はじめから/ }).click()
  await expect(page.getByRole('heading', { name: '転入届' })).toBeVisible()
  await page.getByLabel('転入する方のお名前').fill(playerName)
  await page.getByRole('button', { name: 'この名前で転入する' }).click()
  await expect(page.getByTestId('game-screen')).toBeVisible()
  await expect(page.getByRole('dialog', { name: '住民票' })).toBeVisible()
}

export async function closeDialog(page: Page, title?: string): Promise<void> {
  const dialog =
    title === undefined
      ? page.getByRole('dialog').last()
      : page.getByRole('dialog', { name: title })
  await dialog.getByRole('button', { name: '閉じる' }).click()
  await expect(dialog).toBeHidden()
}

export async function completeDialogue(page: Page, choiceLabel?: string): Promise<void> {
  const panel = page.getByTestId('dialogue-panel')
  await expect(panel).toBeVisible()

  for (let step = 0; step < 30; step += 1) {
    if (!(await panel.isVisible())) return

    if (choiceLabel !== undefined) {
      const choice = panel.getByRole('button', { name: new RegExp(choiceLabel, 'u') })
      if ((await choice.count()) > 0 && (await choice.isVisible())) {
        await choice.click()
        choiceLabel = undefined
        continue
      }
    }

    const advance = panel.getByRole('button', { name: /^(全文を表示|次へ)$/u })
    if ((await advance.count()) > 0 && (await advance.isVisible())) {
      await advance.click()
      continue
    }

    throw new Error('会話を進めるボタンまたは指定した選択肢が見つかりません。')
  }

  throw new Error('会話が30操作以内に完了しませんでした。')
}

export async function openMapLocation(page: Page, locationName: string): Promise<void> {
  await page.getByRole('button', { name: /地図/u }).click()
  const mapDialog = page.getByRole('dialog', { name: '月影町案内図' })
  await expect(mapDialog).toBeVisible()
  await mapDialog.getByRole('button', { name: new RegExp(locationName, 'u') }).click()
  await expect(page.getByRole('dialog', { name: locationName })).toBeVisible()
}

export async function performLocationAction(
  page: Page,
  actionLabel: string,
  choiceLabel?: string,
): Promise<void> {
  const locationDialog = page.getByTestId('location-panel')
  await locationDialog.getByRole('button', { name: new RegExp(actionLabel, 'u') }).click()
  await completeDialogue(page, choiceLabel)
  await expect(page.getByTestId('dialogue-panel')).toBeHidden()
}

export async function advanceTo(page: Page, nextLabel: string): Promise<void> {
  await page.getByRole('button', { name: '時間を進める' }).click()
  const dialog = page.getByRole('dialog', { name: '時間を進める' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: nextLabel, exact: true }).click()
  await expect(dialog).toBeHidden()
}

export async function expectNoSeriousA11yViolations(page: Page, context: string): Promise<void> {
  const scan = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  const blocking = scan.violations.filter(
    (violation) => violation.impact === 'critical' || violation.impact === 'serious',
  )
  expect(
    blocking.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.map((node) => node.target.join(' ')),
    })),
    `${context} に重大な axe 違反があります`,
  ).toEqual([])
}

export function expectNoRuntimeProblems(problems: RuntimeProblems): void {
  expect(problems.pageErrors, 'ページ例外が発生しました').toEqual([])
  expect(problems.consoleErrors, 'console.error が発生しました').toEqual([])
}
