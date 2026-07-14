export type SoundEffect =
  'paper' | 'step' | 'chime' | 'discovery' | 'broadcast' | 'select' | 'letter'
export type AudioTime = 'morning' | 'evening' | 'night'

interface AudioLevels {
  bgm: number
  sfx: number
  muted: boolean
}

export const EFFECT_NOTES: Readonly<Record<SoundEffect, readonly number[]>> = {
  paper: [620, 410],
  step: [105, 82],
  chime: [523.25, 659.25, 783.99],
  discovery: [392, 523.25, 659.25],
  broadcast: [220, 218, 222],
  select: [440, 554.37],
  letter: [349.23, 440, 523.25],
}

const AMBIENT_CHORDS: Readonly<Record<AudioTime, readonly number[]>> = {
  morning: [146.83, 220, 293.66],
  evening: [130.81, 196, 261.63],
  night: [110, 164.81, 220],
}

export function normalizeAudioLevel(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, value))
}

export class TownAudioEngine {
  private context: AudioContext | undefined
  private master: GainNode | undefined
  private bgmGain: GainNode | undefined
  private sfxGain: GainNode | undefined
  private ambienceNodes: AudioNode[] = []
  private levels: AudioLevels = { bgm: 0.42, sfx: 0.62, muted: false }

  get supported() {
    return typeof window !== 'undefined' && 'AudioContext' in window
  }
  get unlocked() {
    return Boolean(this.context)
  }

  async unlock(): Promise<boolean> {
    if (!this.supported) return false
    if (!this.context) {
      this.context = new AudioContext({ latencyHint: 'interactive' })
      this.master = this.context.createGain()
      this.bgmGain = this.context.createGain()
      this.sfxGain = this.context.createGain()
      this.bgmGain.connect(this.master)
      this.sfxGain.connect(this.master)
      this.master.connect(this.context.destination)
      this.applyLevels()
    }
    if (this.context.state === 'suspended') await this.context.resume()
    return this.context.state === 'running'
  }

  setLevels(bgm: number, sfx: number, muted: boolean) {
    this.levels = { bgm: normalizeAudioLevel(bgm), sfx: normalizeAudioLevel(sfx), muted }
    this.applyLevels()
  }

  private applyLevels() {
    if (!this.context || !this.master || !this.bgmGain || !this.sfxGain) return
    const now = this.context.currentTime
    this.master.gain.setTargetAtTime(this.levels.muted ? 0 : 1, now, 0.02)
    this.bgmGain.gain.setTargetAtTime(this.levels.bgm * 0.16, now, 0.05)
    this.sfxGain.gain.setTargetAtTime(this.levels.sfx * 0.28, now, 0.02)
  }

  play(effect: SoundEffect) {
    if (!this.context || !this.sfxGain || this.levels.muted) return
    const now = this.context.currentTime
    const notes = EFFECT_NOTES[effect]
    notes.forEach((frequency, index) => {
      const oscillator = this.context?.createOscillator()
      const gain = this.context?.createGain()
      if (!oscillator || !gain || !this.sfxGain) return
      oscillator.type =
        effect === 'broadcast' ? 'sawtooth' : effect === 'step' ? 'triangle' : 'sine'
      oscillator.frequency.setValueAtTime(frequency, now + index * 0.045)
      if (effect === 'paper')
        oscillator.frequency.exponentialRampToValueAtTime(
          Math.max(60, frequency * 0.55),
          now + 0.12,
        )
      gain.gain.setValueAtTime(0.0001, now + index * 0.045)
      gain.gain.exponentialRampToValueAtTime(
        effect === 'step' ? 0.13 : 0.3,
        now + index * 0.045 + 0.012,
      )
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + index * 0.045 + (effect === 'broadcast' ? 0.48 : 0.26),
      )
      oscillator.connect(gain)
      gain.connect(this.sfxGain)
      oscillator.start(now + index * 0.045)
      oscillator.stop(now + index * 0.045 + 0.55)
    })
  }

  startAmbience(time: AudioTime, reducedMotion = false) {
    if (!this.context || !this.bgmGain || this.levels.muted) return
    this.stopAmbience()
    const now = this.context.currentTime
    for (const [index, frequency] of AMBIENT_CHORDS[time].entries()) {
      const oscillator = this.context.createOscillator()
      const gain = this.context.createGain()
      const filter = this.context.createBiquadFilter()
      oscillator.type = index === 0 ? 'sine' : 'triangle'
      oscillator.frequency.value = frequency
      oscillator.detune.value = index * 3 - 3
      filter.type = 'lowpass'
      filter.frequency.value = time === 'night' ? 520 : 780
      gain.gain.value = 0.12 / (index + 1)
      if (!reducedMotion) {
        gain.gain.setValueAtTime(0.025, now)
        gain.gain.linearRampToValueAtTime(0.12 / (index + 1), now + 3 + index)
      }
      oscillator.connect(filter)
      filter.connect(gain)
      gain.connect(this.bgmGain)
      oscillator.start()
      this.ambienceNodes.push(oscillator, filter, gain)
    }
  }

  stopAmbience() {
    for (const node of this.ambienceNodes) {
      if (node instanceof OscillatorNode) {
        try {
          node.stop()
        } catch {
          /* oscillator was already stopped */
        }
      }
      node.disconnect()
    }
    this.ambienceNodes = []
  }

  async close() {
    this.stopAmbience()
    if (this.context) await this.context.close()
    this.context = undefined
    this.master = undefined
    this.bgmGain = undefined
    this.sfxGain = undefined
  }
}

export const townAudio = new TownAudioEngine()
