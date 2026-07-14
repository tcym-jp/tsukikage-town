import { useState } from 'react'
import type { BulletinView } from './types'

interface BulletinBoardProps {
  bulletins: readonly BulletinView[]
  day: number
  onRead: (bulletinId: string) => void
}

const statusLabel: Record<BulletinView['status'], string> = {
  new: '本日の新着',
  changed: '前回から書き換えあり',
  unchanged: '前回と同じ',
  removed: '剥がされた跡',
  thirteenth: '番号のない追加紙',
}

export function BulletinBoard({ bulletins, day, onRead }: BulletinBoardProps) {
  const [selectedId, setSelectedId] = useState<string>()
  const selected = bulletins.find((item) => item.id === selectedId)

  const select = (item: BulletinView) => {
    setSelectedId(item.id)
    onRead(item.id)
  }

  return (
    <div className="bulletin-view">
      <header className="bulletin-view__title">
        <p>月影町内会</p>
        <h3>回覧のお知らせ</h3>
        <span>第{day}日 掲示分</span>
      </header>
      <div className="cork-board" aria-label={`回覧板 ${bulletins.length}件`}>
        {bulletins.map((item, index) => (
          <button
            type="button"
            key={item.id}
            className={`notice-paper notice-paper--${item.status} notice-paper--tilt-${(index % 5) + 1}`}
            onClick={() => select(item)}
            aria-label={`${item.number === 13 ? '十三番目' : `第${item.number}番`} ${item.title}、${statusLabel[item.status]}`}
          >
            <i className="pin" aria-hidden="true" />
            <small>{item.number === 13 ? '―' : String(item.number).padStart(2, '0')}</small>
            <strong>{item.title}</strong>
            <span>{statusLabel[item.status]}</span>
          </button>
        ))}
        {Array.from({ length: Math.max(0, 12 - bulletins.length) }, (_, index) => (
          <span className="notice-ghost" key={`ghost-${index}`} aria-hidden="true" />
        ))}
      </div>
      {selected ? (
        <article
          className={`bulletin-detail bulletin-detail--${selected.status}`}
          aria-live="polite"
        >
          <button
            type="button"
            className="icon-button"
            onClick={() => setSelectedId(undefined)}
            aria-label="お知らせを閉じる"
          >
            ×
          </button>
          <p className="bulletin-detail__number">
            {selected.number === 13 ? '十三番目の紙片' : `回覧 第${selected.number}項`}
          </p>
          <h3>{selected.title}</h3>
          <p>{selected.body}</p>
          <footer>
            <strong>{statusLabel[selected.status]}</strong>
            {selected.annotation ? <span>{selected.annotation}</span> : null}
          </footer>
        </article>
      ) : (
        <p className="bulletin-help">紙を選ぶと、内容と前回からの差分を確認できます。</p>
      )}
    </div>
  )
}
