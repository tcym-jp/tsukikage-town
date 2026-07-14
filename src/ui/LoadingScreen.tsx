interface LoadingScreenProps {
  progress?: number
  message?: string
  onRetry?: () => void
}

export function LoadingScreen({
  progress,
  message = '町の記録を読み込んでいます',
  onRetry,
}: LoadingScreenProps) {
  return (
    <main className="loading-screen" aria-live="polite">
      <div className="loading-scene" aria-hidden="true">
        <span className="loading-train" />
        <span className="loading-platform" />
        <i />
      </div>
      <section>
        <p className="kicker">月影町の規則</p>
        <blockquote>夜十一時十三分の町内放送には、返事をしないこと。</blockquote>
        <div
          className="loading-progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <i style={{ width: `${progress ?? 28}%` }} />
        </div>
        <p role="status">
          {message}
          {progress !== undefined ? ` ${progress}%` : '……'}
        </p>
        {onRetry ? (
          <button type="button" className="paper-button" onClick={onRetry}>
            もう一度読み込む
          </button>
        ) : null}
      </section>
    </main>
  )
}
