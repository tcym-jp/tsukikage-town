import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { WorldMobileControls } from './WorldMobileControls'
import { WorldScene } from './WorldScene'
import { createWorldInputController } from './inputController'

describe('WorldScene fallbacks and controls', () => {
  it('shows an actionable explanation when WebGL is unavailable', () => {
    render(
      <WorldScene
        timeOfDay="evening"
        quality="low"
        playerPosition={{ x: 0, z: 0 }}
        onPlayerMove={vi.fn()}
        onInteract={vi.fn()}
        forceWebGLSupport={false}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('町の立体地図を開けませんでした')
    expect(screen.getByRole('button', { name: '再読み込み' })).toBeEnabled()
  })

  it('routes the mobile action button through the public controller', () => {
    const controller = createWorldInputController()
    render(<WorldMobileControls controller={controller} />)

    fireEvent.click(screen.getByRole('button', { name: '調べる' }))

    expect(controller.getSnapshot().interactionSequence).toBe(1)
  })

  it('disables the mobile controller while story UI is open', () => {
    const controller = createWorldInputController()
    controller.setMovement({ x: 1, z: 0 })
    render(<WorldMobileControls controller={controller} disabled />)

    expect(screen.getByRole('button', { name: '調べる' })).toBeDisabled()
    expect(controller.getSnapshot().movement).toEqual({ x: 0, z: 0 })
  })
})
