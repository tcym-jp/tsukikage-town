import type { MenuPanel } from './types'

interface GameHudProps {
  day: number
  timeLabel: string
  location: string
  objective: string
  interactionLabel?: string
  unreadLetters: number
  newJournalEntries: number
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  onOpenMenu: (panel: MenuPanel) => void
  onInteract: () => void
  onAdvanceTime?: () => void
  canAdvanceTime?: boolean
}

export function GameHud({
  day,
  timeLabel,
  location,
  objective,
  interactionLabel,
  unreadLetters,
  newJournalEntries,
  saveStatus,
  onOpenMenu,
  onInteract,
  onAdvanceTime,
  canAdvanceTime = false,
}: GameHudProps) {
  return (
    <div className="game-hud" aria-label="ゲーム情報">
      <header className="hud-location">
        <span>
          第{day}日・{timeLabel}
        </span>
        <strong>{location}</strong>
      </header>
      <details className="hud-objective" open>
        <summary>いま、すること</summary>
        <p>{objective}</p>
        {onAdvanceTime ? (
          <button
            type="button"
            className="hud-advance"
            onClick={onAdvanceTime}
            disabled={!canAdvanceTime}
          >
            {canAdvanceTime ? '時間を進める' : '目的を続ける'}
          </button>
        ) : null}
      </details>
      <nav className="hud-menu" aria-label="手帳メニュー">
        <button type="button" onClick={() => onOpenMenu('map')}>
          <span aria-hidden="true">町</span>
          <small>地図</small>
        </button>
        <button
          type="button"
          onClick={() => onOpenMenu('journal')}
          className={newJournalEntries > 0 ? 'has-badge' : ''}
        >
          <span aria-hidden="true">記</span>
          <small>日記</small>
          {newJournalEntries > 0 ? (
            <i aria-label={`新着${newJournalEntries}件`}>{newJournalEntries}</i>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => onOpenMenu('letters')}
          className={unreadLetters > 0 ? 'has-badge' : ''}
        >
          <span aria-hidden="true">〒</span>
          <small>手紙</small>
          {unreadLetters > 0 ? <i aria-label={`未読${unreadLetters}件`}>{unreadLetters}</i> : null}
        </button>
        <button type="button" onClick={() => onOpenMenu('settings')}>
          <span aria-hidden="true">歯</span>
          <small>設定</small>
        </button>
      </nav>
      {interactionLabel ? (
        <button
          type="button"
          className="interaction-prompt"
          onClick={onInteract}
          data-testid="interaction-prompt"
        >
          <kbd>E</kbd>
          <span>{interactionLabel}</span>
        </button>
      ) : null}
      <div
        className={`save-indicator save-indicator--${saveStatus}`}
        role="status"
        aria-live="polite"
      >
        {saveStatus === 'saving'
          ? '記録中…'
          : saveStatus === 'saved'
            ? '記録しました'
            : saveStatus === 'error'
              ? '記録できませんでした'
              : ''}
      </div>
    </div>
  )
}
