import { EFFECT_NOTES, TownAudioEngine, normalizeAudioLevel } from './townAudio'

describe('town audio', () => {
  it.each([
    [-1, 0],
    [0, 0],
    [0.35, 0.35],
    [1, 1],
    [1.4, 1],
    [Number.NaN, 0],
  ])('normalizes %s to %s', (input, output) => {
    expect(normalizeAudioLevel(input)).toBe(output)
  })

  it('defines audible cues for every information event', () => {
    expect(Object.keys(EFFECT_NOTES)).toEqual(
      expect.arrayContaining(['paper', 'chime', 'discovery', 'broadcast', 'letter']),
    )
    expect(Object.values(EFFECT_NOTES).every((notes) => notes.length > 0)).toBe(true)
  })

  it('fails safely where Web Audio is unavailable', async () => {
    const engine = new TownAudioEngine()
    expect(engine.supported).toBe(false)
    await expect(engine.unlock()).resolves.toBe(false)
    expect(() => engine.play('paper')).not.toThrow()
  })
})
