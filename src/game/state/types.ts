import type { DialogueId, DialogueNodeId, LocationId } from '../ids'
import type { GameSettings, GameState } from './schema'

export type AppScreen = 'title' | 'transfer' | 'town' | 'ending' | 'records'
export type UiPanel = 'map' | 'journal' | 'letters' | 'bulletins' | 'settings' | null
export type SaveIndicator = 'idle' | 'saving' | 'saved' | 'error'

/** Never persisted. This state may safely be discarded on reload. */
export interface TransientUiState {
  readonly screen: AppScreen
  readonly activePanel: UiPanel
  readonly activeDialogueId: DialogueId | null
  readonly activeDialogueNodeId: DialogueNodeId | null
  readonly interactionLabel: string | null
  readonly interactionLocked: boolean
  readonly saveIndicator: SaveIndicator
  readonly toast: string | null
  readonly pendingLocationId: LocationId | null
}

export interface GameSessionState {
  readonly game: GameState | null
  readonly settings: GameSettings
  readonly ui: TransientUiState
}
