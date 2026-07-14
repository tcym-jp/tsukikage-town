import type { WorldQuality } from './types'

export interface WorldQualityEnvironment {
  readonly viewportWidth: number
  readonly devicePixelRatio: number
  readonly hardwareConcurrency: number
  readonly deviceMemory?: number
}

export interface ResolvedWorldQuality {
  readonly level: Exclude<WorldQuality, 'auto'>
  readonly dpr: [number, number]
  readonly shadows: boolean
  readonly shadowMapSize: number
  readonly particleCount: number
  readonly antialias: boolean
}

export function resolveWorldQuality(
  quality: WorldQuality,
  environment: WorldQualityEnvironment,
): ResolvedWorldQuality {
  const selected = quality === 'auto' ? inferQuality(environment) : quality

  if (selected === 'low') {
    return {
      level: 'low',
      dpr: [1, 1],
      shadows: false,
      shadowMapSize: 0,
      particleCount: 0,
      antialias: false,
    }
  }

  if (selected === 'medium') {
    return {
      level: 'medium',
      dpr: [1, Math.max(1, Math.min(1.35, environment.devicePixelRatio))],
      shadows: true,
      shadowMapSize: 512,
      particleCount: 12,
      antialias: true,
    }
  }

  return {
    level: 'high',
    dpr: [1, Math.max(1, Math.min(1.75, environment.devicePixelRatio))],
    shadows: true,
    shadowMapSize: 1024,
    particleCount: 28,
    antialias: true,
  }
}

function inferQuality(environment: WorldQualityEnvironment): Exclude<WorldQuality, 'auto'> {
  const narrowScreen = environment.viewportWidth < 700
  const lowMemory =
    environment.deviceMemory !== undefined && environment.deviceMemory > 0
      ? environment.deviceMemory <= 4
      : false
  const fewCores = environment.hardwareConcurrency > 0 && environment.hardwareConcurrency <= 4

  if ((narrowScreen && (lowMemory || fewCores)) || environment.devicePixelRatio > 3) {
    return 'low'
  }

  if (narrowScreen || lowMemory || fewCores) {
    return 'medium'
  }

  return 'high'
}
