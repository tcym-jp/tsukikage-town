interface EndingScreenProps {
  endingId: 'A' | 'B' | 'C' | 'D'
  title: string
  epilogue: readonly string[]
  clueCount: number
  trustedResidents: readonly string[]
  finalLetter: string
  reducedMotion: boolean
  onRecords: () => void
  onRestartDay7: () => void
  onNewGame: () => void
  onSkip: () => void
}

export function EndingScreen({
  endingId,
  title,
  epilogue,
  clueCount,
  trustedResidents,
  finalLetter,
  reducedMotion,
  onRecords,
  onRestartDay7,
  onNewGame,
  onSkip,
}: EndingScreenProps) {
  return (
    <main
      className={`ending-screen ending-screen--${endingId} ${reducedMotion ? 'is-reduced' : ''}`}
      data-testid={`ending-${endingId}`}
    >
      <div className="ending-town" aria-hidden="true">
        <span className="ending-moon" />
        <span className="ending-tower" />
        <span className="ending-houses" />
        <span className="ending-light ending-light--1" />
        <span className="ending-light ending-light--2" />
        <span className="ending-light ending-light--3" />
      </div>
      <button type="button" className="ending-skip" onClick={onSkip}>
        演出をスキップ
      </button>
      <article className="ending-paper">
        <p className="kicker">ENDING {endingId}</p>
        <h1>{title}</h1>
        <div className="ending-copy">
          {epilogue.map((paragraph, index) => (
            <p key={`${endingId}-${index}`}>{paragraph}</p>
          ))}
        </div>
        <blockquote>{finalLetter}</blockquote>
        <dl className="ending-stats">
          <div>
            <dt>見つけた手掛かり</dt>
            <dd>{clueCount} / 15</dd>
          </div>
          <div>
            <dt>共に記憶した人</dt>
            <dd>
              {trustedResidents.length > 0 ? trustedResidents.join('・') : 'ひとりで見届けた'}
            </dd>
          </div>
        </dl>
        <nav className="ending-actions" aria-label="結末後の操作">
          <button type="button" className="paper-button paper-button--primary" onClick={onRecords}>
            記録を見る
          </button>
          <button type="button" className="paper-button" onClick={onRestartDay7}>
            最終日前から
          </button>
          <button type="button" className="text-button" onClick={onNewGame}>
            最初から
          </button>
        </nav>
      </article>
    </main>
  )
}
