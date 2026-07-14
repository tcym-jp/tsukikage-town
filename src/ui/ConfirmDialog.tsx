import { Dialog } from './Dialog'

interface ConfirmDialogProps {
  title: string
  body: string
  confirmLabel: string
  danger?: boolean
  phrase?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  danger,
  phrase,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [value, setValue] = useState('')
  const allowed = !phrase || value === phrase
  return (
    <Dialog title={title} onClose={onCancel} size="small">
      <div className="confirm-dialog">
        <p>{body}</p>
        {phrase ? (
          <label>
            <span>確認のため「{phrase}」と入力してください</span>
            <input value={value} onChange={(event) => setValue(event.target.value)} autoFocus />
          </label>
        ) : null}
        <div className="form-actions">
          <button type="button" className="paper-button" onClick={onCancel}>
            やめる
          </button>
          <button
            type="button"
            className={
              danger ? 'paper-button paper-button--danger' : 'paper-button paper-button--primary'
            }
            disabled={!allowed}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Dialog>
  )
}

import { useState } from 'react'
