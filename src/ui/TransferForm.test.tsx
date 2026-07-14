import { fireEvent, render, screen } from '@testing-library/react'
import { TransferForm } from './TransferForm'
import { validatePlayerName } from './playerName'

describe('validatePlayerName', () => {
  it.each([
    ['', 'お名前を一文字以上'],
    ['abcdefghijklmnop', '十二文字以内'],
    ['a\u0000b', '制御文字'],
  ])('rejects invalid value %j', (value, message) => {
    expect(validatePlayerName(value)).toContain(message)
  })

  it('accepts Japanese, symbols and emoji', () => {
    expect(validatePlayerName('月野🌙・灯')).toBeUndefined()
  })
})

describe('TransferForm', () => {
  it('submits a safe text name', () => {
    const onSubmit = vi.fn()
    render(<TransferForm onSubmit={onSubmit} onCancel={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('転入する方のお名前'), {
      target: { value: '<月影>🌙' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'この名前で転入する' }))
    expect(onSubmit).toHaveBeenCalledWith('<月影>🌙')
  })

  it('announces a validation error without submitting', () => {
    const onSubmit = vi.fn()
    render(<TransferForm onSubmit={onSubmit} onCancel={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'この名前で転入する' }))
    expect(screen.getByRole('alert')).toHaveTextContent('一文字以上')
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
