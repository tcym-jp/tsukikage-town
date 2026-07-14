import type { CSSProperties } from 'react'

export type WorldAreaId =
  | 'station'
  | 'town-hall'
  | 'moon-street'
  | 'bulletin-board'
  | 'toka-books'
  | 'yoimachi-cafe'
  | 'tsukikage-apartments'
  | 'room-203'
  | 'broadcast-tower'

export type WorldTimeOfDay = 'morning' | 'evening' | 'night'

export type WorldQuality = 'auto' | 'low' | 'medium' | 'high'

export interface WorldPosition {
  readonly x: number
  readonly z: number
}

export interface WorldInputVector {
  readonly x: number
  readonly z: number
}

export interface WorldBounds {
  readonly minX: number
  readonly maxX: number
  readonly minZ: number
  readonly maxZ: number
}

export interface WorldCollider {
  readonly id: string
  readonly minX: number
  readonly maxX: number
  readonly minZ: number
  readonly maxZ: number
}

export interface WorldArea {
  readonly id: WorldAreaId
  readonly label: string
  readonly shortLabel: string
  readonly description: string
  readonly position: WorldPosition
  readonly interactionRadius: number
  readonly mapOrder: number
}

export interface WorldInteraction {
  readonly area: WorldArea
  readonly distance: number
  readonly isObjective: boolean
}

export interface WorldSceneProps {
  readonly timeOfDay: WorldTimeOfDay
  readonly quality?: WorldQuality
  readonly reducedMotion?: boolean
  readonly playerPosition: WorldPosition
  readonly onPlayerMove: (position: WorldPosition) => void
  readonly interactionEnabled?: boolean
  readonly onInteract: (interaction: WorldInteraction) => void
  readonly activeObjective?: WorldAreaId | null
  readonly currentLocation?: WorldAreaId
  readonly inputController?: WorldInputController
  readonly onNearbyAreaChange?: (area: WorldArea | null) => void
  readonly className?: string
  readonly style?: CSSProperties
  readonly ariaLabel?: string
  readonly forceWebGLSupport?: boolean
}

export interface WorldInputSnapshot {
  readonly movement: WorldInputVector
  readonly interactionSequence: number
}

export type WorldInputListener = (snapshot: WorldInputSnapshot) => void

export interface WorldInputController {
  readonly getSnapshot: () => WorldInputSnapshot
  readonly setMovement: (movement: WorldInputVector) => void
  readonly requestInteraction: () => void
  readonly reset: () => void
  readonly subscribe: (listener: WorldInputListener) => () => void
}
