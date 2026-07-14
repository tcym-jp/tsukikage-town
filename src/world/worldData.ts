import type { WorldArea, WorldBounds, WorldCollider, WorldPosition } from './types'

export const WORLD_BOUNDS: WorldBounds = {
  minX: -18,
  maxX: 18,
  minZ: -13,
  maxZ: 13,
}

export const DEFAULT_PLAYER_POSITION: WorldPosition = { x: -13, z: 3 }

/**
 * Story-facing destinations. Positions are deliberately placed at entrances,
 * outside the corresponding building collider.
 */
export const WORLD_AREAS = [
  {
    id: 'station',
    label: '月影町駅',
    shortLabel: '駅',
    description: '終点の小さな木造駅。時計は、ときどき11時13分を指す。',
    position: { x: -13, z: 3.1 },
    interactionRadius: 1.8,
    mapOrder: 1,
  },
  {
    id: 'town-hall',
    label: '月影町役場',
    shortLabel: '役場',
    description: '青いインクの匂いが残る、町の記録を預かる建物。',
    position: { x: -7, z: -3.7 },
    interactionRadius: 1.55,
    mapOrder: 2,
  },
  {
    id: 'moon-street',
    label: '月影通り',
    shortLabel: '通り',
    description: '雨上がりの石畳に、店の灯りが細長く映っている。',
    position: { x: 2.2, z: 0 },
    interactionRadius: 2.1,
    mapOrder: 3,
  },
  {
    id: 'bulletin-board',
    label: '町内掲示板',
    shortLabel: '掲示板',
    description: '十二枚の紙が、風に同じ向きで揺れている。',
    position: { x: -1.5, z: 2.4 },
    interactionRadius: 1.45,
    mapOrder: 4,
  },
  {
    id: 'toka-books',
    label: '古書店「灯下書房」',
    shortLabel: '灯下書房',
    description: '琥珀色のランプに照らされた、町史の眠る古書店。',
    position: { x: 0.9, z: -3.45 },
    interactionRadius: 1.5,
    mapOrder: 5,
  },
  {
    id: 'yoimachi-cafe',
    label: '喫茶「宵待」',
    shortLabel: '宵待',
    description: '古いカセットとクリームソーダのある喫茶店。',
    position: { x: 7, z: -3.45 },
    interactionRadius: 1.5,
    mapOrder: 6,
  },
  {
    id: 'tsukikage-apartments',
    label: '月影荘',
    shortLabel: '月影荘',
    description: '古い木造アパート。郵便受けには一つ余分な隙間がある。',
    position: { x: 9.1, z: 3.35 },
    interactionRadius: 1.35,
    mapOrder: 7,
  },
  {
    id: 'room-203',
    label: '自室・203号室',
    shortLabel: '203号室',
    description: '新しい鍵で開く自室。壁の向こう側が少しだけ広い。',
    position: { x: 13, z: 3.35 },
    interactionRadius: 1.35,
    mapOrder: 8,
  },
  {
    id: 'broadcast-tower',
    label: '放送塔の丘',
    shortLabel: '放送塔',
    description: '町を見下ろす古い放送塔。赤い標識灯がゆっくり瞬く。',
    position: { x: -12.2, z: -7.2 },
    interactionRadius: 1.8,
    mapOrder: 9,
  },
] as const satisfies readonly WorldArea[]

/** Axis-aligned, intentionally simple collision shapes for reliable mobile play. */
export const WORLD_COLLIDERS = [
  { id: 'station-building', minX: -17.2, maxX: -9.2, minZ: 4.7, maxZ: 9.4 },
  { id: 'town-hall-building', minX: -10.2, maxX: -3.8, minZ: -9.4, maxZ: -4.9 },
  { id: 'toka-books-building', minX: -1.35, maxX: 3.25, minZ: -8.8, maxZ: -4.55 },
  { id: 'yoimachi-cafe-building', minX: 4.65, maxX: 9.35, minZ: -8.8, maxZ: -4.55 },
  { id: 'apartment-building', minX: 7.35, maxX: 15.4, minZ: 4.6, maxZ: 9.8 },
  { id: 'bulletin-board', minX: -2.5, maxX: -0.45, minZ: 2.9, maxZ: 3.25 },
  { id: 'broadcast-tower-base', minX: -14.4, maxX: -12.75, minZ: -10.5, maxZ: -8.7 },
  { id: 'north-houses', minX: -7.4, maxX: -3.5, minZ: 6.5, maxZ: 10.3 },
  { id: 'east-house', minX: 15.6, maxX: 17.8, minZ: -2.4, maxZ: 2.4 },
] as const satisfies readonly WorldCollider[]
