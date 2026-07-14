import {
  ACHIEVEMENT_IDS,
  DEFAULT_SETTINGS,
  ENDING_IDS,
  advanceTime,
  createInitialGameState,
  evaluateAchievements,
  exportSave,
  importSave,
  resolveEnding,
  type Condition,
  type FinalChoice,
  type GameState,
  type ProgressionGate,
} from '../game'
import {
  STORY_ACTIONS,
  STORY_ACTION_FLAG_PREFIX,
  canAdvanceStory,
  completeStoryAction,
  getAvailableStoryActions,
  getStoryBeat,
  isStoryActionComplete,
  type StoryAction,
  type StoryBeat,
} from './storyActions'

export type RequiredEndingCode = 'A' | 'B' | 'C'

export interface SimulatedPeriod {
  readonly day: number
  readonly period: GameState['clock']['period']
  readonly beatTitle: string
  readonly actionIds: readonly string[]
}

export interface StorySimulationResult {
  /** State immediately before the final three-way decision. */
  readonly preEndingState: GameState
  /** Independent branches produced from the same last-day checkpoint. */
  readonly endingStates: Readonly<Record<RequiredEndingCode, GameState>>
  /** A replay record that has retained A, B, and C across three decisions. */
  readonly retainedRecordState: GameState
  /** The retained record after a real save export/import round trip. */
  readonly restoredRecordState: GameState
  readonly periods: readonly SimulatedPeriod[]
  readonly completedActionIds: readonly string[]
  readonly verifiedGateCount: number
}

const FAVORABLE_CHOICES: Readonly<Record<string, string>> = {
  d2_ledger: 'listen_to_sumi',
  d3_cassette: 'stay_silent',
  d5_intent: 'intent_minato',
  d6_companion: 'ask_companion',
}

const FINAL_CHOICES = {
  A: 'return_name',
  B: 'take_outside',
  C: 'inherit_role',
} as const satisfies Readonly<Record<RequiredEndingCode, FinalChoice>>

const invariant = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(`物語シミュレーション失敗: ${message}`)
}

const actionCompletionCondition = (beat: StoryBeat): Condition => {
  invariant(
    beat.minimumRequired === undefined || beat.minimumRequired === beat.requiredActionIds.length,
    `${beat.day}日目 ${beat.period} の部分達成ゲートはシミュレーターで検証できません。`,
  )
  if (beat.requiredActionIds.length === 0) return { kind: 'always' }
  return {
    kind: 'all',
    conditions: beat.requiredActionIds.map((actionId) => ({
      kind: 'flag' as const,
      flagId: `${STORY_ACTION_FLAG_PREFIX}${actionId}`,
      value: true,
    })),
  }
}

const progressionGateFor = (beat: StoryBeat): ProgressionGate => ({
  id: `story:${beat.day}:${beat.period}`,
  day: beat.day,
  period: beat.period,
  condition: actionCompletionCondition(beat),
  blockedMessage: beat.blockedMessage,
})

const selectChoice = (action: StoryAction, choiceId: string) => {
  const choice = action.choices?.find((candidate) => candidate.id === choiceId)
  invariant(choice !== undefined, `行動「${action.id}」に選択肢「${choiceId}」がありません。`)
  if (choice === undefined) throw new Error('到達不能')
  return choice
}

const completeWithFavorableChoice = (state: GameState, action: StoryAction): GameState => {
  if (action.choices === undefined || action.choices.length === 0) {
    return completeStoryAction(state, action)
  }
  const choiceId = FAVORABLE_CHOICES[action.id]
  invariant(choiceId !== undefined, `分岐行動「${action.id}」の検証用選択肢が未定義です。`)
  if (choiceId === undefined) throw new Error('到達不能')
  return completeStoryAction(state, action, selectChoice(action, choiceId).effects)
}

const currentPeriodActions = (state: GameState): readonly StoryAction[] =>
  STORY_ACTIONS.filter(
    (action) =>
      action.day === state.clock.day &&
      action.periods.includes(state.clock.period) &&
      action.id !== 'd7_final_decision',
  )

const completePeriodActions = (
  state: GameState,
): { readonly state: GameState; readonly actionIds: readonly string[] } => {
  let current = state
  const actionIds: string[] = []
  for (const action of currentPeriodActions(current)) {
    const available = getAvailableStoryActions(current, action.locationId)
    invariant(
      available.some((candidate) => candidate.id === action.id),
      `${current.clock.day}日目 ${current.clock.period} の行動「${action.id}」へ到達できません。`,
    )
    current = completeWithFavorableChoice(current, action)
    invariant(
      isStoryActionComplete(current, action.id),
      `行動「${action.id}」を完了記録できません。`,
    )
    actionIds.push(action.id)
  }
  return { state: current, actionIds }
}

const resolveFinalBranch = (state: GameState, expectedEnding: RequiredEndingCode): GameState => {
  const finalAction = STORY_ACTIONS.find((action) => action.id === 'd7_final_decision')
  invariant(finalAction !== undefined, '最終決断の行動がありません。')
  if (finalAction === undefined) throw new Error('到達不能')

  const finalChoice = FINAL_CHOICES[expectedEnding]
  const chosen = selectChoice(finalAction, finalChoice)
  const decided = completeStoryAction(state, finalAction, chosen.effects)
  invariant(canAdvanceStory(decided), `Ending ${expectedEnding} の最終ゲートを通過できません。`)

  const resolved = resolveEnding(decided, finalChoice)
  invariant(
    resolved.endingId === expectedEnding,
    `選択「${finalChoice}」の結果が ${expectedEnding} ではなく ${resolved.endingId} です。`,
  )
  const terminal = advanceTime(resolved.state, [progressionGateFor(getStoryBeat(resolved.state))])
  invariant(
    !terminal.advanced && terminal.reason === 'story-complete',
    `Ending ${expectedEnding} の後で物語が正しく終了しません。`,
  )
  return evaluateAchievements(resolved.state).state
}

const restoreRecordThroughSave = (state: GameState): GameState => {
  const fixedTime = new Date('2026-07-15T11:13:00.000Z')
  const exported = exportSave(state, DEFAULT_SETTINGS, fixedTime)
  const imported = importSave(exported, fixedTime)
  invariant(imported.success, '三結末記録を保存データから復元できません。')
  if (!imported.success) throw new Error('到達不能')
  return imported.save.game
}

/**
 * Plays every authored action from Day 0 evening through Day 7 night. The
 * simulator deliberately checks each gate both before and after its required
 * actions, then branches the same final checkpoint into endings A, B, and C.
 */
export const simulateCompleteStory = (): StorySimulationResult => {
  let state = createInitialGameState('検証住民', new Date('2026-07-15T09:00:00.000Z'))
  const periods: SimulatedPeriod[] = []
  const completedActionIds: string[] = []
  let verifiedGateCount = 0

  for (let periodIndex = 0; periodIndex < 23; periodIndex += 1) {
    const beat = getStoryBeat(state)
    const gate = progressionGateFor(beat)
    const blocked = advanceTime(state, [gate])
    invariant(
      !blocked.advanced && blocked.reason === 'gate',
      `${state.clock.day}日目 ${state.clock.period} の未達成ゲートが進行を止めません。`,
    )
    verifiedGateCount += 1

    const completed = completePeriodActions(state)
    state = completed.state
    completedActionIds.push(...completed.actionIds)
    periods.push({
      day: state.clock.day,
      period: state.clock.period,
      beatTitle: beat.title,
      actionIds: completed.actionIds,
    })

    if (state.clock.day === 7 && state.clock.period === 'night') continue

    invariant(
      canAdvanceStory(state),
      `${state.clock.day}日目 ${state.clock.period} の必須行動が不足しています。`,
    )
    const advanced = advanceTime(state, [gate])
    invariant(
      advanced.advanced,
      `${state.clock.day}日目 ${state.clock.period} から進行できません。`,
    )
    if (!advanced.advanced) throw new Error('到達不能')
    state = advanced.state
  }

  invariant(
    state.clock.day === 7 && state.clock.period === 'night',
    '23時間帯の検証後にDay 7夜へ到達していません。',
  )
  invariant(!canAdvanceStory(state), '最終決断前にDay 7夜のゲートを通過しています。')
  invariant(periods.length === 23, `検証した時間帯が23ではなく${periods.length}です。`)
  invariant(
    state.discoveredClues.length >= 15,
    `最終決断前の手掛かりが15個未満です（${state.discoveredClues.length}個）。`,
  )

  const endingStates = {
    A: resolveFinalBranch(state, 'A'),
    B: resolveFinalBranch(state, 'B'),
    C: resolveFinalBranch(state, 'C'),
  } as const satisfies Readonly<Record<RequiredEndingCode, GameState>>

  let retainedRecordState = state
  for (const ending of ['A', 'B', 'C'] as const) {
    retainedRecordState = resolveFinalBranch(retainedRecordState, ending)
  }
  const evaluatedRecord = evaluateAchievements(retainedRecordState).state
  invariant(
    ['A', 'B', 'C'].every((ending) => evaluatedRecord.reachedEndings.includes(ending)),
    '三つの結末記録を同じ住民票へ保持できません。',
  )
  invariant(
    evaluatedRecord.unlockedAchievements.includes(ACHIEVEMENT_IDS.THREE_ENDINGS),
    '三結末の実績が解除されません。',
  )

  const restoredRecordState = restoreRecordThroughSave(evaluatedRecord)
  invariant(
    ['A', 'B', 'C'].every((ending) => restoredRecordState.reachedEndings.includes(ending)),
    '保存データの往復後に結末記録が失われました。',
  )
  invariant(
    restoredRecordState.unlockedAchievements.includes(ACHIEVEMENT_IDS.THREE_ENDINGS),
    '保存データの往復後に三結末実績が失われました。',
  )

  invariant(endingStates.A.currentEndingId === ENDING_IDS.A, 'Ending A の記録IDが一致しません。')
  invariant(endingStates.B.currentEndingId === ENDING_IDS.B, 'Ending B の記録IDが一致しません。')
  invariant(endingStates.C.currentEndingId === ENDING_IDS.C, 'Ending C の記録IDが一致しません。')

  return {
    preEndingState: state,
    endingStates,
    retainedRecordState: evaluatedRecord,
    restoredRecordState,
    periods,
    completedActionIds,
    verifiedGateCount,
  }
}
