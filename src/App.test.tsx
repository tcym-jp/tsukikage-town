import { fireEvent, render, screen } from '@testing-library/react'
import { App } from './App'
import { MAX_SAVE_IMPORT_BYTES } from './game'

describe('App entry flow', () => {
  it('opens the sealed title and reaches the transfer form', () => {
    render(<App />)
    expect(screen.getByTestId('title-screen')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: '古い封筒を開く' }))
    fireEvent.click(screen.getByRole('button', { name: /はじめから/ }))
    expect(screen.getByRole('heading', { name: '転入届' })).toBeVisible()
    expect(screen.getByText(/外部へ送信されません/)).toBeVisible()
  })

  it('rejects an oversized save before reading it', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '古い封筒を開く' }))
    fireEvent.click(screen.getByRole('button', { name: '設定' }))

    const oversizedSave = new File(
      [new Uint8Array(MAX_SAVE_IMPORT_BYTES + 1)],
      'oversized-save.json',
      { type: 'application/json' },
    )
    fireEvent.change(screen.getByLabelText('保存記録JSONを読み込む'), {
      target: { files: [oversizedSave] },
    })

    expect(await screen.findByText(/記録JSONは2 MB以下/)).toBeVisible()
  })
})
