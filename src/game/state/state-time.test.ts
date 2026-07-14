import { applyEffect } from '../engine'
import { advanceTime, nextClock, type ProgressionGate } from '../time'
import { createInitialGameState, PlayerNameSchema, type GameState } from '.'

const NOW = new Date('2026-07-15T09:00:00.000Z')

describe('game state and time', () => {
  it('creates a deterministic resident state with a Unicode player name', () => {
    const state = createInitialGameState('  月🌙  ', NOW)

    expect(state.player.name).toBe('月🌙')
    expect(state.player.address).toBe('月影町 月影荘203号室')
    expect(state.player.residentNumber).toMatch(/^TK-260715-\d{4}$/u)
    expect(state.clock).toEqual({ day: 0, period: 'evening' })
    expect(state.visitedLocations).toEqual(['station'])
  })

  it('rejects empty, overlong and control-character player names', () => {
    expect(PlayerNameSchema.safeParse('   ').success).toBe(false)
    expect(PlayerNameSchema.safeParse('あ'.repeat(13)).success).toBe(false)
    expect(PlayerNameSchema.safeParse('月\n影').success).toBe(false)
  })

  it('moves through morning, evening and night before incrementing the day', () => {
    expect(nextClock({ day: 2, period: 'morning' })).toEqual({ day: 2, period: 'evening' })
    expect(nextClock({ day: 2, period: 'evening' })).toEqual({ day: 2, period: 'night' })
    expect(nextClock({ day: 2, period: 'night' })).toEqual({ day: 3, period: 'morning' })
  })

  it('blocks time progression until the current slot gate is satisfied', () => {
    const initial = createInitialGameState('灯', NOW)
    const gates: readonly ProgressionGate[] = [
      {
        id: 'gate.transfer-complete',
        day: 0,
        period: 'evening',
        condition: { kind: 'flag', flagId: 'transfer_complete', value: true },
        blockedMessage: '役場で転入手続きを済ませてください。',
      },
    ]

    const blocked = advanceTime(initial, gates)
    expect(blocked.advanced).toBe(false)
    if (blocked.advanced) throw new Error('gate should block')
    expect(blocked.reason).toBe('gate')
    expect(blocked.blockedMessage).toContain('転入手続き')

    const ready = applyEffect(initial, {
      kind: 'setFlag',
      flagId: 'transfer_complete',
      value: true,
    })
    const advanced = advanceTime(ready, gates)
    expect(advanced.advanced).toBe(true)
    if (!advanced.advanced) throw new Error('gate should pass')
    expect(advanced.state.clock).toEqual({ day: 0, period: 'night' })
  })

  it('does not advance beyond Day 7 night', () => {
    const initial = createInitialGameState('澄', NOW)
    const completed: GameState = { ...initial, clock: { day: 7, period: 'night' } }

    expect(nextClock(completed.clock)).toBeNull()
    const result = advanceTime(completed)
    expect(result.advanced).toBe(false)
    if (result.advanced) throw new Error('completed story must not advance')
    expect(result.reason).toBe('story-complete')
  })
})
