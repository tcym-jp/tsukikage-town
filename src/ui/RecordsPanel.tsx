import type { ReactNode } from 'react'
import type {
  AchievementView,
  BulletinView,
  CharacterProfileView,
  JournalEntryView,
  LetterView,
} from './types'

interface EndingRecord {
  id: string
  title: string
  description: string
  reached: boolean
}

interface ResidentRecord {
  name: string
  number: string
  note: string
}

interface RecordsPanelProps {
  endings: readonly EndingRecord[]
  achievements: readonly AchievementView[]
  clues: readonly JournalEntryView[]
  letters: readonly LetterView[]
  bulletins: readonly BulletinView[]
  characters: readonly CharacterProfileView[]
  resident: ResidentRecord
  playTimeMinutes: number
  totalClues: number
  totalLetters: number
  totalBulletins: number
}

export function RecordsPanel({
  endings,
  achievements,
  clues,
  letters,
  bulletins,
  characters,
  resident,
  playTimeMinutes,
  totalClues,
  totalLetters,
  totalBulletins,
}: RecordsPanelProps) {
  const endingCount = endings.filter((ending) => ending.reached).length
  const achievementCount = achievements.filter((achievement) => achievement.unlocked).length
  const foundClues = clues.filter((clue) => !clue.locked)

  return (
    <div className="records-panel">
      <header className="records-summary">
        <SummaryValue label="結末" value={endingCount} total={endings.length} />
        <SummaryValue label="手掛かり" value={foundClues.length} total={totalClues} />
        <SummaryValue label="手紙" value={letters.length} total={totalLetters} />
        <SummaryValue label="回覧板" value={bulletins.length} total={totalBulletins} />
        <div>
          <span>プレイ時間</span>
          <strong>
            {Math.floor(playTimeMinutes / 60)}
            <small>時間</small> {playTimeMinutes % 60}
            <small>分</small>
          </strong>
        </div>
      </header>

      <section className="records-section">
        <h3>住民票</h3>
        <article className="records-resident" aria-label={`${resident.name}さんの住民票`}>
          <span aria-hidden="true">月影町</span>
          <div>
            <small>住民番号 {resident.number}</small>
            <strong>{resident.name}</strong>
            <p>{resident.note}</p>
          </div>
        </article>
      </section>

      <section className="records-section">
        <h3>到達した結末</h3>
        <div className="ending-stamps">
          {endings.map((ending) => (
            <article
              key={ending.id}
              className={
                ending.reached
                  ? 'ending-stamp ending-stamp--reached'
                  : 'ending-stamp ending-stamp--locked'
              }
            >
              <span aria-hidden="true">{ending.reached ? '月' : '?'}</span>
              <div>
                <strong>{ending.reached ? ending.title : '未到達'}</strong>
                <p>
                  {ending.reached
                    ? ending.description
                    : '別の選択と手掛かりが、まだ町に残っている。'}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="records-section">
        <h3>収集した記録</h3>
        <div className="records-collections">
          <CollectionCard
            title="手紙"
            count={letters.length}
            total={totalLetters}
            missingLabel="まだ届いていない手紙"
          >
            {letters.map((letter) => (
              <details key={letter.id}>
                <summary>{letter.subject}</summary>
                <small>
                  {letter.sender}・{letter.date}
                </small>
                {letter.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </details>
            ))}
          </CollectionCard>
          <CollectionCard
            title="回覧板"
            count={bulletins.length}
            total={totalBulletins}
            missingLabel="まだ記録していない回覧"
          >
            {bulletins.map((bulletin) => (
              <details key={bulletin.id}>
                <summary>
                  第{bulletin.number}項　{bulletin.title}
                </summary>
                <p>{bulletin.body}</p>
                {bulletin.annotation === undefined ? null : <small>{bulletin.annotation}</small>}
              </details>
            ))}
          </CollectionCard>
          <CollectionCard
            title="手掛かり"
            count={foundClues.length}
            total={totalClues}
            missingLabel="まだ見つけていない手掛かり"
          >
            {foundClues.map((clue) => (
              <details key={clue.id}>
                <summary>{clue.title}</summary>
                <p>{clue.body}</p>
              </details>
            ))}
          </CollectionCard>
        </div>
      </section>

      <section className="records-section">
        <h3>
          実績{' '}
          <small>
            {achievementCount} / {achievements.length}
          </small>
        </h3>
        <div className="achievement-grid">
          {achievements.map((achievement) => (
            <article
              key={achievement.id}
              className={achievement.unlocked ? 'achievement achievement--unlocked' : 'achievement'}
            >
              <span aria-hidden="true">{achievement.unlocked ? '印' : '―'}</span>
              <div>
                <strong>{achievement.unlocked ? achievement.title : '未発見'}</strong>
                <p>
                  {achievement.unlocked
                    ? achievement.description
                    : '条件は物語の中に隠されています。'}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="records-section">
        <h3>町の人々</h3>
        <ul className="records-people">
          {characters.map((character) => (
            <li key={character.id}>
              {character.discovered ? (
                <>
                  <strong>{character.name}</strong>
                  <span>{character.role}</span>
                  <p>{character.note}</p>
                </>
              ) : (
                <>
                  <strong>？？？</strong>
                  <span>まだ出会っていない</span>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function SummaryValue({ label, value, total }: { label: string; value: number; total: number }) {
  return (
    <div>
      <span>{label}</span>
      <strong>
        {value}
        <small> / {total}</small>
      </strong>
    </div>
  )
}

function CollectionCard({
  title,
  count,
  total,
  missingLabel,
  children,
}: {
  title: string
  count: number
  total: number
  missingLabel: string
  children: ReactNode
}) {
  const missing = Math.max(0, total - count)
  return (
    <article className="records-collection">
      <h4>
        {title}{' '}
        <small>
          {count} / {total}
        </small>
      </h4>
      <div>{children}</div>
      {missing === 0 ? null : (
        <p className="records-missing">
          {missingLabel}　× {missing}
        </p>
      )}
    </article>
  )
}
