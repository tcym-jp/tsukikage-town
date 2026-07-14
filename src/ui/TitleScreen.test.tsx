import { fireEvent, render, screen } from '@testing-library/react'
import { TitleScreen } from './TitleScreen'

const props = {
  canContinue: false,
  soundMuted: false,
  reducedMotion: false,
  onNewGame: vi.fn(),
  onContinue: vi.fn(),
  onOpenRecords: vi.fn(),
  onOpenSettings: vi.fn(),
  onToggleMute: vi.fn(),
}

describe('TitleScreen', () => {
  it('opens the envelope and exposes the menu', () => {
    render(<TitleScreen {...props} />)
    fireEvent.click(screen.getByRole('button', { name: '古い封筒を開く' }))
    expect(screen.getByRole('heading', { name: /月影町/ })).toBeVisible()
    expect(screen.getByRole('button', { name: /つづきから/ })).toBeDisabled()
  })

  it('skips the envelope motion when reduced motion is requested', () => {
    render(<TitleScreen {...props} reducedMotion />)
    expect(screen.getByRole('button', { name: /はじめから/ })).toBeVisible()
  })
})
