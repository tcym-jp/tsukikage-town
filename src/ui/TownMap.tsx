interface MapLocation {
  id: string
  name: string
  description: string
  x: number
  y: number
  unlocked: boolean
  objective?: boolean
}

interface TownMapProps {
  locations: readonly MapLocation[]
  currentLocationId: string
  onTravel: (locationId: string) => void
}

export function TownMap({ locations, currentLocationId, onTravel }: TownMapProps) {
  return (
    <div className="town-map">
      <div className="town-map__paper" aria-label="月影町案内図">
        <span className="map-river" aria-hidden="true" />
        <span className="map-road map-road--main" aria-hidden="true" />
        <span className="map-road map-road--branch" aria-hidden="true" />
        <span className="map-rail" aria-hidden="true" />
        {locations.map((location) => (
          <button
            type="button"
            key={location.id}
            className={`map-pin ${location.id === currentLocationId ? 'map-pin--current' : ''} ${location.objective ? 'map-pin--objective' : ''}`}
            style={{ left: `${location.x}%`, top: `${location.y}%` }}
            disabled={!location.unlocked}
            onClick={() => onTravel(location.id)}
            aria-label={`${location.name}${location.id === currentLocationId ? '、現在地' : ''}${location.objective ? '、目的地' : ''}${!location.unlocked ? '、未解放' : ''}`}
          >
            <span aria-hidden="true">{location.unlocked ? location.name.slice(0, 1) : '×'}</span>
            <strong>{location.unlocked ? location.name : 'まだ行けない場所'}</strong>
          </button>
        ))}
        <div className="map-compass" aria-hidden="true">
          <span>北</span>
          <i />
        </div>
      </div>
      <aside className="map-legend">
        <strong>案内図の見方</strong>
        <span>
          <i className="legend-current" />
          現在地
        </span>
        <span>
          <i className="legend-objective" />
          目的地
        </span>
        <span>
          <i className="legend-locked" />
          閉鎖中
        </span>
        <p>地図から解放済みの場所へ移動できます。歩いて向かうこともできます。</p>
      </aside>
    </div>
  )
}

export type { MapLocation }
