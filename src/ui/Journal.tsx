import { useState } from 'react'
import type { CharacterProfileView, JournalEntryView } from './types'

interface JournalProps {
  objective: string
  hintSteps: readonly string[]
  completed: readonly JournalEntryView[]
  clues: readonly JournalEntryView[]
  characters: readonly CharacterProfileView[]
  collectedLetters: number
  totalLetters: number
  collectedBulletins: number
  totalBulletins: number
}

type JournalTab = 'objective' | 'events' | 'people' | 'clues' | 'collection'

export function Journal({
  objective,
  hintSteps,
  completed,
  clues,
  characters,
  collectedLetters,
  totalLetters,
  collectedBulletins,
  totalBulletins,
}: JournalProps) {
  const [tab, setTab] = useState<JournalTab>('objective')
  const [hintLevel, setHintLevel] = useState(0)
  const tabs: readonly { id: JournalTab; label: string }[] = [
    { id: 'objective', label: '目的' },
    { id: 'events', label: '出来事' },
    { id: 'people', label: '人物' },
    { id: 'clues', label: '手掛かり' },
    { id: 'collection', label: '収集' },
  ]

  return (
    <div className="journal">
      <nav className="tab-list" aria-label="日記の分類">
        {tabs.map((item) => (
          <button
            type="button"
            key={item.id}
            onClick={() => setTab(item.id)}
            aria-current={tab === item.id ? 'page' : undefined}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <section className="journal__page">
        {tab === 'objective' ? (
          <>
            <p className="page-kicker">いま、すること</p>
            <h3>{objective}</h3>
            <div className="hint-box">
              <strong>道しるべ</strong>
              <p>
                {hintSteps[Math.min(hintLevel, hintSteps.length - 1)] ??
                  '町を歩き、気になる場所を調べてみよう。'}
              </p>
              {hintLevel < hintSteps.length - 1 ? (
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setHintLevel((value) => value + 1)}
                >
                  もう少し詳しいヒント
                </button>
              ) : null}
            </div>
          </>
        ) : null}
        {tab === 'events' ? (
          <JournalEntries entries={completed} empty="まだ書き留めた出来事はありません。" />
        ) : null}
        {tab === 'clues' ? (
          <JournalEntries entries={clues} empty="手掛かりはまだ見つかっていません。" />
        ) : null}
        {tab === 'people' ? (
          <div className="profile-grid">
            {characters.map((character) =>
              character.discovered ? (
                <article key={character.id} className="profile-card">
                  <span className="profile-card__portrait" aria-hidden="true">
                    {character.name.slice(0, 1)}
                  </span>
                  <div>
                    <h3>
                      {character.name}
                      <small>{character.reading}</small>
                    </h3>
                    <p>{character.role}</p>
                    <p>{character.note}</p>
                    <meter
                      min="0"
                      max="100"
                      value={character.trust}
                      aria-label={`${character.name}との信頼 ${character.trust}%`}
                    />
                  </div>
                </article>
              ) : (
                <article key={character.id} className="profile-card profile-card--locked">
                  <span>?</span>
                  <p>まだ出会っていない住民</p>
                </article>
              ),
            )}
          </div>
        ) : null}
        {tab === 'collection' ? (
          <div className="collection-grid">
            <CollectionGauge
              label="手紙"
              value={collectedLetters}
              total={totalLetters}
              symbol="〒"
            />
            <CollectionGauge
              label="回覧項目"
              value={collectedBulletins}
              total={totalBulletins}
              symbol="回"
            />
            <CollectionGauge
              label="手掛かり"
              value={clues.filter((item) => !item.locked).length}
              total={15}
              symbol="鍵"
            />
          </div>
        ) : null}
      </section>
    </div>
  )
}

function JournalEntries({
  entries,
  empty,
}: {
  entries: readonly JournalEntryView[]
  empty: string
}) {
  if (entries.length === 0) return <p className="empty-copy">{empty}</p>
  return (
    <div className="journal-entries">
      {entries.map((entry) => (
        <article
          key={entry.id}
          className={entry.locked ? 'journal-entry journal-entry--locked' : 'journal-entry'}
        >
          <header>
            <h3>{entry.locked ? 'まだ記録されていない' : entry.title}</h3>
            {entry.new ? <span>新着</span> : null}
            {entry.complete ? <span>完了</span> : null}
          </header>
          <p>{entry.locked ? '町を歩き、別の記録を探してみよう。' : entry.body}</p>
        </article>
      ))}
    </div>
  )
}

function CollectionGauge({
  label,
  value,
  total,
  symbol,
}: {
  label: string
  value: number
  total: number
  symbol: string
}) {
  return (
    <article className="collection-gauge">
      <span aria-hidden="true">{symbol}</span>
      <h3>{label}</h3>
      <strong>
        {value}
        <small> / {total}</small>
      </strong>
      <progress max={total} value={value} aria-label={`${label} ${value}/${total}`} />
    </article>
  )
}
