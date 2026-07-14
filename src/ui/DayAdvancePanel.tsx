interface DayAdvancePanelProps {
  day: number
  period: 'morning' | 'evening' | 'night'
  canAdvance: boolean
  blockedMessage?: string
  nextLabel: string
  onAdvance: () => void
}

export function DayAdvancePanel({
  day,
  period,
  canAdvance,
  blockedMessage,
  nextLabel,
  onAdvance,
}: DayAdvancePanelProps) {
  return (
    <section className="day-advance">
      <span className="day-advance__clock" aria-hidden="true">
        <i />
      </span>
      <div>
        <p className="kicker">
          第{day}日・{period === 'morning' ? '朝' : period === 'evening' ? '夕方' : '夜'}
        </p>
        <h3>{canAdvance ? '今日の記録を閉じますか' : 'まだ、今日することが残っています'}</h3>
        <p>
          {canAdvance ? '未読の手紙や寄り道は、あとから自室と記録で確認できます。' : blockedMessage}
        </p>
      </div>
      <button
        type="button"
        className="paper-button paper-button--primary"
        onClick={onAdvance}
        disabled={!canAdvance}
      >
        {nextLabel}
      </button>
    </section>
  )
}
