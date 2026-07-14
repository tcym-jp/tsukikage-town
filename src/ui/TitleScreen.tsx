import { useState } from 'react'

interface TitleScreenProps {
  canContinue: boolean
  soundMuted: boolean
  reducedMotion: boolean
  onNewGame: () => void
  onContinue: () => void
  onOpenRecords: () => void
  onOpenSettings: () => void
  onToggleMute: () => void
}

export function TitleScreen({
  canContinue,
  soundMuted,
  reducedMotion,
  onNewGame,
  onContinue,
  onOpenRecords,
  onOpenSettings,
  onToggleMute,
}: TitleScreenProps) {
  const [opened, setOpened] = useState(reducedMotion)
  const envelopeOpened = opened || reducedMotion

  return (
    <main className="title-screen" data-testid="title-screen">
      <div className="title-screen__sky" aria-hidden="true">
        <span className="moon" />
        <span className="horizon horizon--one" />
        <span className="horizon horizon--two" />
        <span className="rail-line" />
      </div>

      <section className={`title-envelope ${envelopeOpened ? 'title-envelope--open' : ''}`}>
        {!envelopeOpened ? (
          <button
            className="title-envelope__seal"
            type="button"
            onClick={() => setOpened(true)}
            aria-label="古い封筒を開く"
            data-testid="open-envelope"
          >
            <span aria-hidden="true">月</span>
            <small>封を開く</small>
          </button>
        ) : (
          <div className="title-paper">
            <p className="kicker">終点から、三つ目の街灯</p>
            <h1>
              月影町
              <span>十三番目の回覧板</span>
            </h1>
            <p className="title-paper__rule">町内回覧・第十三号</p>

            <nav className="title-menu" aria-label="タイトルメニュー">
              <button
                type="button"
                className="paper-button paper-button--primary"
                onClick={onNewGame}
              >
                <span>はじめから</span>
                <small>月影町へ転入する</small>
              </button>
              <button
                type="button"
                className="paper-button"
                onClick={onContinue}
                disabled={!canContinue}
              >
                <span>つづきから</span>
                <small>{canContinue ? '最後に保存した場所へ' : '保存された記録はありません'}</small>
              </button>
              <div className="title-menu__row">
                <button type="button" className="text-button" onClick={onOpenRecords}>
                  記録
                </button>
                <button type="button" className="text-button" onClick={onOpenSettings}>
                  設定
                </button>
              </div>
            </nav>
          </div>
        )}
      </section>

      <footer className="title-footer">
        <span>v1.0.0</span>
        <button
          type="button"
          className="sound-toggle"
          onClick={onToggleMute}
          aria-pressed={soundMuted}
        >
          <span aria-hidden="true">{soundMuted ? '◻' : '♪'}</span>
          {soundMuted ? '音声なし' : '音声あり'}
        </button>
        <span>保存はこの端末内のみ</span>
      </footer>
    </main>
  )
}
