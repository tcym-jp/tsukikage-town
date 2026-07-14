import { achievements } from './achievements'
import { bulletins } from './bulletins'
import { chapters } from './chapters'
import { characters } from './characters'
import { clues } from './clues'
import { dialogues } from './dialogues'
import { endings } from './endings'
import { investigations } from './investigations'
import { letters } from './letters'
import { locations } from './locations'
import { narrativeFlags } from './narrativeFlags'
import { subEvents } from './subEvents'
import type { ContentCatalog } from './types'

export const catalog = {
  metadata: {
    schemaVersion: 1,
    title: '月影町 ― 十三番目の回覧板',
    locale: 'ja-JP',
  },
  locations,
  characters,
  chapters,
  dialogues,
  letters,
  bulletins,
  clues,
  subEvents,
  investigations,
  endings,
  achievements,
  narrativeFlags,
} as const satisfies ContentCatalog

export type TsukikageCatalog = typeof catalog
