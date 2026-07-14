import { useId, useMemo, useState, type SyntheticEvent } from 'react'
import { countPlayerNameCharacters, validatePlayerName } from './playerName'

interface TransferFormProps {
  onSubmit: (playerName: string) => void
  onCancel: () => void
}

export function TransferForm({ onSubmit, onCancel }: TransferFormProps) {
  const [name, setName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const inputId = useId()
  const error = useMemo(() => validatePlayerName(name), [name])

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    if (error) return
    onSubmit(name.trim())
  }

  return (
    <main className="form-screen" data-testid="transfer-screen">
      <div className="desk-grain" aria-hidden="true" />
      <form className="transfer-form" onSubmit={handleSubmit} noValidate>
        <header className="transfer-form__header">
          <div>
            <p>月影町役場　住民課</p>
            <h1>転入届</h1>
          </div>
          <span className="form-number">様式 13-2</span>
        </header>

        <p className="transfer-form__lead">
          町が忘れないよう、読みやすい字でお名前を記してください。
        </p>

        <div className="form-grid">
          <div className="form-field form-field--wide">
            <label htmlFor={inputId}>転入する方のお名前</label>
            <input
              id={inputId}
              name="player-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-describedby={`${inputId}-hint ${inputId}-error`}
              aria-invalid={submitted && Boolean(error)}
              autoComplete="name"
              autoFocus
              maxLength={24}
              placeholder="例：月野 しずく"
            />
            <div className="form-field__meta">
              <small id={`${inputId}-hint`}>日本語・記号・絵文字を含む十二文字まで</small>
              <span>{countPlayerNameCharacters(name.trim())} / 12</span>
            </div>
            <p id={`${inputId}-error`} className="field-error" role="alert">
              {submitted && error ? error : ''}
            </p>
          </div>

          <div className="form-field">
            <span className="form-label">新しい住所</span>
            <strong>月影町　月影荘203号室</strong>
          </div>
          <div className="form-field">
            <span className="form-label">転入日</span>
            <strong>町の暦・第〇日</strong>
          </div>
          <div className="form-field form-field--wide form-field--note">
            <span className="form-label">転入の理由</span>
            <p>少し、生活を変えたかったため。</p>
          </div>
        </div>

        <aside className="form-notice">
          <strong>個人情報について</strong>
          <p>記入内容はこの端末内のセーブデータだけに保存され、外部へ送信されません。</p>
        </aside>

        <div className="form-actions">
          <button type="button" className="paper-button" onClick={onCancel}>
            封筒へ戻る
          </button>
          <button type="submit" className="paper-button paper-button--primary">
            この名前で転入する
          </button>
        </div>
        <span className="stamp stamp--ghost" aria-hidden="true">
          月影町
          <br />
          住民課
        </span>
      </form>
    </main>
  )
}
