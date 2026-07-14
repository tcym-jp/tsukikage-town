import type { GameState } from '../state'

export const appendUnique = (values: readonly string[], value: string): string[] =>
  values.includes(value) ? [...values] : [...values, value]

export const removeValue = (values: readonly string[], value: string): string[] =>
  values.filter((candidate) => candidate !== value)

export const touchGameState = (
  state: GameState,
  updatedAt: string = state.updatedAt,
): GameState => ({
  ...state,
  revision: state.revision + 1,
  updatedAt,
})

export const updateIfChanged = (
  previous: GameState,
  next: GameState,
  updatedAt?: string,
): GameState => {
  if (previous === next) return previous
  return touchGameState(next, updatedAt ?? previous.updatedAt)
}
