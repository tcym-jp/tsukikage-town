import { FocusTrap } from 'focus-trap-react'
import { useEffect, useId, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface DialogProps {
  title: string
  children: ReactNode
  onClose: () => void
  className?: string
  size?: 'small' | 'medium' | 'large' | 'full'
  closeLabel?: string
}

export function Dialog({
  title,
  children,
  onClose,
  className = '',
  size = 'medium',
  closeLabel = '閉じる',
}: DialogProps) {
  const titleId = useId()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return createPortal(
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose()
      }}
    >
      <FocusTrap focusTrapOptions={{ escapeDeactivates: false, fallbackFocus: '[role="dialog"]' }}>
        <section
          className={`dialog dialog--${size} ${className}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
        >
          <header className="dialog__header">
            <h2 id={titleId}>{title}</h2>
            <button className="icon-button" type="button" onClick={onClose} aria-label={closeLabel}>
              <span aria-hidden="true">×</span>
            </button>
          </header>
          <div className="dialog__body">{children}</div>
        </section>
      </FocusTrap>
    </div>,
    document.body,
  )
}
