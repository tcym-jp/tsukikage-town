export interface LocationActionView {
  id: string
  label: string
  description: string
  symbol: string
  kind?: 'story' | 'talk' | 'inspect' | 'rest'
  completed?: boolean
  disabled?: boolean
  disabledReason?: string
}

interface LocationPanelProps {
  name: string
  atmosphere: string
  description: string
  day: number
  timeLabel: string
  actions: readonly LocationActionView[]
  onAction: (actionId: string) => void
  onLeave: () => void
}

export function LocationPanel({
  name,
  atmosphere,
  description,
  day,
  timeLabel,
  actions,
  onAction,
  onLeave,
}: LocationPanelProps) {
  return (
    <div className="location-panel" data-testid="location-panel">
      <header className="location-panel__scene">
        <div className="location-vignette" aria-hidden="true">
          <span />
          <i />
          <b />
        </div>
        <div>
          <p className="kicker">
            第{day}日・{timeLabel}
          </p>
          <h3>{name}</h3>
          <p>{atmosphere}</p>
        </div>
      </header>
      <p className="location-panel__description">{description}</p>
      <div className="location-actions">
        {actions.length === 0 ? (
          <p className="empty-copy">今はできることがない。時間を変えて、また訪れてみよう。</p>
        ) : (
          actions.map((action) => (
            <button
              type="button"
              key={action.id}
              className={`location-action location-action--${action.kind ?? 'inspect'} ${action.completed ? 'location-action--complete' : ''}`}
              disabled={action.disabled}
              onClick={() => onAction(action.id)}
            >
              <span aria-hidden="true">{action.completed ? '✓' : action.symbol}</span>
              <div>
                <strong>{action.label}</strong>
                <p>{action.disabled ? action.disabledReason : action.description}</p>
              </div>
            </button>
          ))
        )}
      </div>
      <footer>
        <button type="button" className="paper-button" onClick={onLeave}>
          町へ戻る
        </button>
      </footer>
    </div>
  )
}
