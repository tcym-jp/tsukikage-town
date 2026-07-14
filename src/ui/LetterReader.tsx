import { useEffect, useState } from 'react'
import type { LetterView } from './types'

interface LetterReaderProps {
  letters: readonly LetterView[]
  initialLetterId?: string
  onRead: (letterId: string) => void
  onAction?: (letterId: string) => void
}

export function LetterReader({ letters, initialLetterId, onRead, onAction }: LetterReaderProps) {
  const [selectedId, setSelectedId] = useState(initialLetterId ?? letters[0]?.id)
  const selected = letters.find((letter) => letter.id === selectedId)

  useEffect(() => {
    if (selected) onRead(selected.id)
  }, [onRead, selected])

  if (letters.length === 0) {
    return (
      <div className="empty-state">
        <span aria-hidden="true">〒</span>
        <p>郵便受けは空です。</p>
      </div>
    )
  }

  return (
    <div className="mail-layout">
      <nav className="mail-list" aria-label="手紙一覧">
        {letters.map((letter) => (
          <button
            type="button"
            key={letter.id}
            className={
              letter.id === selectedId
                ? 'mail-list__item mail-list__item--selected'
                : 'mail-list__item'
            }
            onClick={() => setSelectedId(letter.id)}
            aria-current={letter.id === selectedId ? 'true' : undefined}
          >
            <span>
              {letter.unread ? <i className="new-dot">新着</i> : <i>既読</i>}
              <time>{letter.date}</time>
            </span>
            <strong>{letter.subject}</strong>
            <small>{letter.anonymous ? '差出人不明' : letter.sender}</small>
          </button>
        ))}
      </nav>
      {selected ? (
        <article
          className={`letter letter--${selected.kind ?? 'personal'}`}
          aria-labelledby={`letter-${selected.id}`}
        >
          <div className="letter__crease" aria-hidden="true" />
          <header>
            <p>
              <span>差出人</span>
              {selected.anonymous ? '記載なし' : selected.sender}
            </p>
            <p>
              <span>宛名</span>
              {selected.recipient}
            </p>
            <time>{selected.date}</time>
          </header>
          <h3 id={`letter-${selected.id}`}>{selected.subject}</h3>
          <div className="letter__body">
            {selected.body.map((paragraph, index) => (
              <p key={`${selected.id}-${index}`}>{paragraph}</p>
            ))}
          </div>
          <footer>
            <span>{selected.anonymous ? '封蝋には月の欠けた跡がある。' : selected.sender}</span>
            {selected.actionLabel && onAction ? (
              <button
                type="button"
                className="paper-button paper-button--ink"
                onClick={() => onAction(selected.id)}
              >
                {selected.actionLabel}
              </button>
            ) : null}
          </footer>
        </article>
      ) : null}
    </div>
  )
}
