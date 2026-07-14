interface ResidentCardProps {
  playerName: string
  residentNumber: string
  day: number
  note: string
  onPrint?: () => void
}

export function ResidentCard({
  playerName,
  residentNumber,
  day,
  note,
  onPrint,
}: ResidentCardProps) {
  return (
    <article className="resident-card" aria-label={`${playerName}の住民票`}>
      <header>
        <div>
          <small>住民票・記録写し</small>
          <h3>月影町 住民票</h3>
        </div>
        <span className="resident-card__mark" aria-hidden="true">
          月
        </span>
      </header>
      <dl>
        <div>
          <dt>氏名</dt>
          <dd>{playerName}</dd>
        </div>
        <div>
          <dt>住所</dt>
          <dd>月影町 月影荘203号室</dd>
        </div>
        <div>
          <dt>住民番号</dt>
          <dd>{residentNumber}</dd>
        </div>
        <div>
          <dt>転入日</dt>
          <dd>町の暦・第〇日</dd>
        </div>
        <div className="resident-card__notes">
          <dt>備考</dt>
          <dd>{note}</dd>
        </div>
      </dl>
      <footer>
        <span>閲覧日：第{day}日</span>
        {onPrint ? (
          <button type="button" className="text-button" onClick={onPrint}>
            印刷する
          </button>
        ) : null}
      </footer>
      <span className="stamp" aria-hidden="true">
        月影町
        <br />
        記録済
      </span>
    </article>
  )
}
