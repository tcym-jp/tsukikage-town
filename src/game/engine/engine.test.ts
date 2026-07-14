import {
  DEFAULT_ACHIEVEMENT_RULES,
  evaluateAchievements,
  getAvailableDialogueChoices,
  selectDialogueChoice,
  type DialogueChoiceLike,
} from '..'
import { createInitialGameState } from '../state'
import {
  applyEffect,
  applyEffects,
  applyNarrativeEvent,
  evaluateCondition,
  type NarrativeEvent,
} from '.'
import { advanceQuest, completeQuest, startQuest } from '../quests'

const NOW = new Date('2026-07-15T09:00:00.000Z')

describe('condition and effect engine', () => {
  it('evaluates nested all, any and not conditions', () => {
    const state = applyEffects(createInitialGameState('奏', NOW), [
      { kind: 'setFlag', flagId: 'heard_broadcast', value: true },
      { kind: 'addTrust', characterId: 'kanade', amount: 4 },
      { kind: 'discoverClue', clueId: 'cassette_note' },
    ])

    expect(
      evaluateCondition(state, {
        kind: 'all',
        conditions: [
          { kind: 'flag', flagId: 'heard_broadcast', value: true },
          {
            kind: 'any',
            conditions: [
              { kind: 'trust', characterId: 'kanade', comparison: 'gte', value: 4 },
              { kind: 'never' },
            ],
          },
          { kind: 'not', condition: { kind: 'clue', clueId: 'missing_clue' } },
        ],
      }),
    ).toBe(true)
  })

  it('applies trust and clue effects immutably and idempotently', () => {
    const initial = createInitialGameState('灯', NOW)
    const changed = applyEffects(initial, [
      { kind: 'addTrust', characterId: 'akari', amount: 3 },
      { kind: 'discoverClue', clueId: 'torn_page' },
      { kind: 'discoverClue', clueId: 'torn_page' },
    ])

    expect(initial.trust.akari).toBe(0)
    expect(changed.trust.akari).toBe(3)
    expect(changed.discoveredClues).toEqual(['torn_page'])
  })

  it('tracks letter and bulletin reads once', () => {
    const initial = createInitialGameState('蓮', NOW)
    const changed = applyEffects(initial, [
      { kind: 'readLetter', letterId: 'unknown_1', anonymous: true },
      { kind: 'readLetter', letterId: 'unknown_1', anonymous: true },
      { kind: 'readBulletin', bulletinId: 'official_1' },
      { kind: 'readBulletin', bulletinId: 'official_1' },
    ])

    expect(changed.deliveredLetters).toContain('unknown_1')
    expect(changed.stats.anonymousLettersRead).toBe(1)
    expect(changed.stats.officialBulletinsRead).toBe(1)
  })

  it('starts, advances and completes a sub-event once', () => {
    const state = applyEffects(createInitialGameState('こよみ', NOW), [
      { kind: 'startSubEvent', subEventId: 'key_sorting' },
      { kind: 'advanceSubEvent', subEventId: 'key_sorting', stageId: 'match_tags' },
      { kind: 'completeSubEvent', subEventId: 'key_sorting' },
      { kind: 'completeSubEvent', subEventId: 'key_sorting' },
    ])

    expect(state.subEvents.key_sorting).toEqual({ status: 'completed', stageId: 'match_tags' })
    expect(state.stats.completedSubEvents).toBe(1)
  })

  it('applies a one-shot narrative event only when its condition passes', () => {
    const event: NarrativeEvent = {
      id: 'event.notice_13',
      condition: { kind: 'clueCount', comparison: 'gte', value: 1 },
      effects: [{ kind: 'setFlag', flagId: 'notice_13_visible', value: true }],
    }
    const initial = createInitialGameState('湊', NOW)
    expect(applyNarrativeEvent(initial, event).applied).toBe(false)

    const ready = applyEffect(initial, { kind: 'discoverClue', clueId: 'envelope_204' })
    const first = applyNarrativeEvent(ready, event)
    expect(first.applied).toBe(true)
    const second = applyNarrativeEvent(first.state, event)
    expect(second).toMatchObject({ applied: false, reason: 'already-triggered' })
  })

  it('runs the quest lifecycle without losing timestamps or steps', () => {
    const initial = createInitialGameState('澄', NOW)
    expect(advanceQuest(initial, 'unknown')).toBe(initial)
    const started = startQuest(initial, 'restore_history', '2026-07-15T10:00:00.000Z')
    const advanced = advanceQuest(started, 'restore_history')
    const completed = completeQuest(advanced, 'restore_history', '2026-07-15T11:00:00.000Z')

    expect(completed.quests.restore_history).toEqual({
      status: 'completed',
      step: 1,
      startedAt: '2026-07-15T10:00:00.000Z',
      completedAt: '2026-07-15T11:00:00.000Z',
    })
    expect(advanceQuest(completed, 'restore_history')).toBe(completed)
  })

  it('filters dialogue choices by story conditions', () => {
    const choices = [
      { id: 'ask', condition: { kind: 'always' }, effects: [], nextNodeId: 'answer' },
      {
        id: 'prove',
        condition: { kind: 'clue', clueId: 'maintenance_badge' },
        effects: [],
        nextNodeId: 'proof',
      },
    ] as const satisfies readonly DialogueChoiceLike[]

    expect(getAvailableDialogueChoices(createInitialGameState('蓮', NOW), choices)).toHaveLength(1)
  })

  it('records a dialogue selection and applies its effects', () => {
    const choices = [
      {
        id: 'listen',
        condition: { kind: 'always' },
        effects: [{ kind: 'addTrust', characterId: 'sumi', amount: 2 }],
        nextNodeId: 'end',
      },
    ] as const satisfies readonly DialogueChoiceLike[]
    const result = selectDialogueChoice(
      createInitialGameState('月', NOW),
      'sumi_day2',
      choices,
      'listen',
    )

    expect(result.selected).toBe(true)
    if (!result.selected) throw new Error('choice should be available')
    expect(result.state.seenDialogues).toContain('sumi_day2')
    expect(result.state.selectedDialogueChoices).toContain('sumi_day2:listen')
    expect(result.state.trust.sumi).toBe(2)
  })

  it('rejects unavailable choices without changing state', () => {
    const initial = createInitialGameState('月', NOW)
    const choices = [
      {
        id: 'locked',
        condition: { kind: 'flag', flagId: 'secret', value: true },
        effects: [{ kind: 'discoverClue', clueId: 'secret' }],
        nextNodeId: 'end',
      },
    ] as const satisfies readonly DialogueChoiceLike[]
    const result = selectDialogueChoice(initial, 'secret_talk', choices, 'locked')

    expect(result).toMatchObject({ selected: false, reason: 'unavailable-choice', state: initial })
  })

  it('unlocks all six default achievements when their conditions are met', () => {
    const clues = Array.from({ length: 10 }, (_, index) => `clue_${index}`)
    const ready = {
      ...createInitialGameState('ツキ', NOW),
      discoveredClues: clues,
      trust: { sumi: 4, akari: 4, kanade: 4, ren: 3 },
      stats: { completedSubEvents: 3, catPetCount: 5 },
      reachedEndings: ['A', 'B', 'C'],
    }
    const result = evaluateAchievements(ready, DEFAULT_ACHIEVEMENT_RULES)

    expect(result.newlyUnlocked).toHaveLength(6)
    expect(result.state.unlockedAchievements).toHaveLength(6)
  })
})
