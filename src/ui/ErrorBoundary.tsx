import { Component, type ErrorInfo, type ReactNode } from 'react'
import { prepareLowQualityRetry } from './lowQualityRetry'

interface ErrorBoundaryProps {
  children: ReactNode
}
interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error('月影町で予期しないエラーが発生しました', error, info)
  }

  override render() {
    if (!this.state.error) return this.props.children
    return (
      <main className="error-screen">
        <section>
          <span className="error-screen__symbol" aria-hidden="true">
            ！
          </span>
          <p className="kicker">町の記録が途切れました</p>
          <h1>予期しない問題が起きました</h1>
          <p>
            保存済みの記録は端末内に残っています。画面を読み直し、「つづきから」を選ぶと、壊れた記録は直前の正常なバックアップから自動復旧します。
          </p>
          <div className="error-actions">
            <button
              type="button"
              className="paper-button paper-button--primary"
              onClick={() => window.location.reload()}
            >
              画面を読み直す
            </button>
            <button
              type="button"
              className="paper-button"
              onClick={() => {
                prepareLowQualityRetry(window.localStorage)
                window.location.reload()
              }}
            >
              低負荷で再試行
            </button>
          </div>
          <details>
            <summary>開発者向け情報</summary>
            <code>
              {this.state.error.name}: {this.state.error.message}
            </code>
          </details>
        </section>
      </main>
    )
  }
}
