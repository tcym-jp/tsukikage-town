export interface SettingsView {
  bgmVolume: number
  sfxVolume: number
  muted: boolean
  textSpeed: 'slow' | 'normal' | 'fast' | 'instant'
  autoAdvance: boolean
  reducedMotion: boolean
  quality: 'auto' | 'low' | 'medium' | 'high'
  fontScale: number
}

interface SettingsPanelProps {
  settings: SettingsView
  onChange: (patch: Partial<SettingsView>) => void
  onManualSave?: () => void
  onExport?: () => void
  onImport?: () => void
  onReset?: () => void
}

export function SettingsPanel({
  settings,
  onChange,
  onManualSave,
  onExport,
  onImport,
  onReset,
}: SettingsPanelProps) {
  return (
    <div className="settings-panel">
      <section className="settings-section">
        <header>
          <span aria-hidden="true">♪</span>
          <div>
            <h3>音</h3>
            <p>音がなくても、物語の情報はすべて文字で表示されます。</p>
          </div>
        </header>
        <label className="toggle-row">
          <span>
            <strong>すべての音を消す</strong>
            <small>いつでも変更できます</small>
          </span>
          <input
            type="checkbox"
            checked={settings.muted}
            onChange={(event) => onChange({ muted: event.target.checked })}
          />
        </label>
        <label className="range-row">
          <span>BGM</span>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(settings.bgmVolume * 100)}
            disabled={settings.muted}
            onChange={(event) => onChange({ bgmVolume: Number(event.target.value) / 100 })}
          />
          <output>{Math.round(settings.bgmVolume * 100)}</output>
        </label>
        <label className="range-row">
          <span>効果音</span>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(settings.sfxVolume * 100)}
            disabled={settings.muted}
            onChange={(event) => onChange({ sfxVolume: Number(event.target.value) / 100 })}
          />
          <output>{Math.round(settings.sfxVolume * 100)}</output>
        </label>
      </section>

      <section className="settings-section">
        <header>
          <span aria-hidden="true">文</span>
          <div>
            <h3>文章</h3>
            <p>会話の表示方法と文字の大きさ。</p>
          </div>
        </header>
        <label className="select-row">
          <span>文字送り</span>
          <select
            value={settings.textSpeed}
            onChange={(event) =>
              onChange({ textSpeed: event.target.value as SettingsView['textSpeed'] })
            }
          >
            <option value="slow">ゆっくり</option>
            <option value="normal">ふつう</option>
            <option value="fast">はやい</option>
            <option value="instant">一度に表示</option>
          </select>
        </label>
        <label className="toggle-row">
          <span>
            <strong>会話を自動で送る</strong>
            <small>選択肢では停止します</small>
          </span>
          <input
            type="checkbox"
            checked={settings.autoAdvance}
            onChange={(event) => onChange({ autoAdvance: event.target.checked })}
          />
        </label>
        <label className="select-row">
          <span>文字サイズ</span>
          <select
            value={String(settings.fontScale)}
            onChange={(event) => onChange({ fontScale: Number(event.target.value) })}
          >
            <option value="1">標準</option>
            <option value="1.15">大きい</option>
            <option value="1.3">最大</option>
          </select>
        </label>
      </section>

      <section className="settings-section">
        <header>
          <span aria-hidden="true">景</span>
          <div>
            <h3>画面と動き</h3>
            <p>端末に合わせて町の描画を調整します。</p>
          </div>
        </header>
        <label className="select-row">
          <span>3D画質</span>
          <select
            value={settings.quality}
            onChange={(event) =>
              onChange({ quality: event.target.value as SettingsView['quality'] })
            }
          >
            <option value="auto">自動</option>
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
          </select>
        </label>
        <label className="toggle-row">
          <span>
            <strong>動きを少なくする</strong>
            <small>カメラ・紙・画面切替の演出を軽減</small>
          </span>
          <input
            type="checkbox"
            checked={settings.reducedMotion}
            onChange={(event) => onChange({ reducedMotion: event.target.checked })}
          />
        </label>
      </section>

      {onManualSave || onExport || onImport || onReset ? (
        <section className="settings-section settings-section--data">
          <header>
            <span aria-hidden="true">記</span>
            <div>
              <h3>記録データ</h3>
              <p>記録はこの端末内にだけ保存されます。</p>
            </div>
          </header>
          <div className="data-actions">
            {onManualSave ? (
              <button type="button" className="paper-button" onClick={onManualSave}>
                いま保存
              </button>
            ) : null}
            {onExport ? (
              <button type="button" className="paper-button" onClick={onExport}>
                JSONを書き出す
              </button>
            ) : null}
            {onImport ? (
              <button type="button" className="paper-button" onClick={onImport}>
                JSONを読み込む
              </button>
            ) : null}
            {onReset ? (
              <button type="button" className="paper-button paper-button--danger" onClick={onReset}>
                記録を初期化
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      <details className="control-guide">
        <summary>操作説明</summary>
        <dl>
          <div>
            <dt>移動</dt>
            <dd>WASD / 矢印 / 左下のパッド</dd>
          </div>
          <div>
            <dt>調べる</dt>
            <dd>E / Enter / Space / 右下のボタン</dd>
          </div>
          <div>
            <dt>地図</dt>
            <dd>M</dd>
          </div>
          <div>
            <dt>日記</dt>
            <dd>J</dd>
          </div>
          <div>
            <dt>戻る</dt>
            <dd>Escape</dd>
          </div>
        </dl>
      </details>
    </div>
  )
}
