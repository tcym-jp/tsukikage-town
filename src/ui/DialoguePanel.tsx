import { FocusTrap } from 'focus-trap-react'
import { useEffect, useId, useMemo, useState } from 'react'
import type { DialogueChoiceView } from './types'

interface DialoguePanelProps {
  speaker: string
  speakerRole?: string
  portraitSymbol?: string
  lines: readonly string[]
  choices?: readonly DialogueChoiceView[]
  textSpeed: 'slow' | 'normal' | 'fast' | 'instant'
  autoAdvance: boolean
  reducedMotion: boolean
  history: readonly { speaker: string; text: string }[]
  onChoose?: (choiceId: string) => void
  onSkip?: () => void
  onComplete: () => void
  onHistoryChange?: (open: boolean) => void
}

const speedMap = { slow: 58, normal: 32, fast: 14, instant: 0 } as const

export function DialoguePanel({
  speaker,
  speakerRole,
  portraitSymbol = '月',
  lines,
  choices = [],
  textSpeed,
  autoAdvance,
  reducedMotion,
  history,
  onChoose,
  onSkip,
  onComplete,
  onHistoryChange,
}: DialoguePanelProps) {
  const [page, setPage] = useState(0)
  const [visibleCharacters, setVisibleCharacters] = useState(0)
  const [historyOpen, setHistoryOpen] = useState(false)
  const speakerId = useId()
  const current = lines[page] ?? ''
  const characters = useMemo(() => Array.from(current), [current])
  const instant = reducedMotion || textSpeed === 'instant'
  const finishedTyping = instant || visibleCharacters >= characters.length
  const isLastPage = page >= lines.length - 1

  useEffect(() => {
    if (finishedTyping) return
    const timer = window.setInterval(() => {
      setVisibleCharacters((value) => Math.min(value + 1, characters.length))
    }, speedMap[textSpeed])
    return () => window.clearInterval(timer)
  }, [characters.length, finishedTyping, instant, textSpeed])

  useEffect(() => {
    if (!autoAdvance || !finishedTyping || historyOpen || (isLastPage && choices.length > 0)) return
    const timer = window.setTimeout(
      () => {
        if (isLastPage) onComplete()
        else {
          setVisibleCharacters(0)
          setPage((value) => value + 1)
        }
      },
      reducedMotion ? 250 : 1_300,
    )
    return () => window.clearTimeout(timer)
  }, [
    autoAdvance,
    choices.length,
    finishedTyping,
    historyOpen,
    isLastPage,
    onComplete,
    reducedMotion,
  ])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      if (historyOpen) {
        setHistoryOpen(false)
        onHistoryChange?.(false)
      } else if (!finishedTyping) {
        setVisibleCharacters(characters.length)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [characters.length, finishedTyping, historyOpen, onHistoryChange])

  const advance = () => {
    if (!finishedTyping) {
      setVisibleCharacters(characters.length)
      return
    }
    if (!isLastPage) {
      setVisibleCharacters(0)
      setPage((value) => value + 1)
      return
    }
    if (choices.length === 0) onComplete()
  }

  const toggleHistory = () => {
    setHistoryOpen((value) => {
      onHistoryChange?.(!value)
      return !value
    })
  }

  return (
    <FocusTrap
      focusTrapOptions={{
        escapeDeactivates: false,
        fallbackFocus: '[data-testid="dialogue-panel"]',
        initialFocus: '.dialogue-text',
      }}
    >
      <section
        className="dialogue-layer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={speakerId}
        data-testid="dialogue-panel"
        tabIndex={-1}
      >
        <div className="dialogue-portrait" aria-hidden="true">
          <span>{portraitSymbol}</span>
          <i />
        </div>
        <div className="dialogue-panel">
          <header className="dialogue-panel__header">
            <div>
              <strong id={speakerId}>{speaker}</strong>
              {speakerRole ? <small>{speakerRole}</small> : null}
            </div>
            <div className="dialogue-tools">
              {onSkip === undefined ? null : (
                <button type="button" onClick={onSkip}>
                  既読を送る
                </button>
              )}
              <button type="button" onClick={toggleHistory} aria-expanded={historyOpen}>
                履歴
              </button>
              <span aria-label={autoAdvance ? '自動送り有効' : '自動送り無効'}>
                {autoAdvance ? 'AUTO' : ''}
              </span>
            </div>
          </header>

          {historyOpen ? (
            <div className="dialogue-history" role="log" aria-label="会話履歴">
              {history.length === 0 ? (
                <p>まだ履歴はありません。</p>
              ) : (
                history.map((entry, index) => (
                  <p key={`${entry.speaker}-${index}`}>
                    <strong>{entry.speaker}</strong>
                    {entry.text}
                  </p>
                ))
              )}
            </div>
          ) : (
            <>
              <button
                type="button"
                className="dialogue-text"
                onClick={advance}
                aria-label={finishedTyping ? '次へ' : '全文を表示'}
              >
                <span>{instant ? current : characters.slice(0, visibleCharacters).join('')}</span>
                <i aria-hidden="true">{finishedTyping && (isLastPage ? '◆' : '▼')}</i>
              </button>
              {finishedTyping && isLastPage && choices.length > 0 ? (
                <div className="dialogue-choices" aria-label="返答を選ぶ">
                  {choices.map((choice) => (
                    <button
                      type="button"
                      key={choice.id}
                      className={`choice choice--${choice.tone ?? 'question'}`}
                      onClick={() => onChoose?.(choice.id)}
                    >
                      <span>{choice.label}</span>
                      {choice.hint ? <small>{choice.hint}</small> : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>
    </FocusTrap>
  )
}
