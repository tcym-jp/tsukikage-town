import { describe, expect, it } from 'vitest'
import { resolveWorldQuality } from './quality'

describe('world quality presets', () => {
  it('removes expensive effects in low quality', () => {
    const preset = resolveWorldQuality('low', {
      viewportWidth: 390,
      devicePixelRatio: 3,
      hardwareConcurrency: 4,
      deviceMemory: 4,
    })

    expect(preset).toMatchObject({
      level: 'low',
      dpr: [1, 1],
      shadows: false,
      particleCount: 0,
      antialias: false,
    })
  })

  it('caps high-quality DPR', () => {
    const preset = resolveWorldQuality('high', {
      viewportWidth: 1920,
      devicePixelRatio: 4,
      hardwareConcurrency: 16,
      deviceMemory: 16,
    })

    expect(preset.dpr).toEqual([1, 1.75])
    expect(preset.shadows).toBe(true)
  })

  it('keeps the DPR range valid when browser zoom reports less than one', () => {
    const preset = resolveWorldQuality('medium', {
      viewportWidth: 1280,
      devicePixelRatio: 0.8,
      hardwareConcurrency: 8,
    })

    expect(preset.dpr).toEqual([1, 1])
  })

  it('automatically selects a conservative mobile preset', () => {
    const preset = resolveWorldQuality('auto', {
      viewportWidth: 390,
      devicePixelRatio: 3,
      hardwareConcurrency: 4,
      deviceMemory: 4,
    })

    expect(preset.level).toBe('low')
  })
})
