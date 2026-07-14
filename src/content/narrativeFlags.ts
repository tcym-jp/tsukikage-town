import { flagIds } from './contentIds'
import type { NarrativeFlagDefinition } from './types'

export const narrativeFlags = [
  { id: flagIds.registered, description: '転入届を提出した', defaultValue: false },
  { id: flagIds.roomKeyReceived, description: '203号室の鍵を受け取った', defaultValue: false },
  { id: flagIds.mailboxOpened, description: '共同郵便受けを初めて開けた', defaultValue: false },
  {
    id: flagIds.shopErrandStarted,
    description: '店または町で小さな依頼を始めた',
    defaultValue: false,
  },
  { id: flagIds.sumiAnswered, description: '青い訂正について澄へ返答した', defaultValue: false },
  { id: flagIds.broadcastReplied, description: '11時13分の放送へ返事をした', defaultValue: false },
  {
    id: flagIds.broadcastListened,
    description: '放送へ返事をせず最後まで聞いた',
    defaultValue: false,
  },
  { id: flagIds.broadcastCut, description: '放送の途中で電源を切った', defaultValue: false },
  { id: flagIds.doorOutlineFound, description: '旧204号室の扉跡を見つけた', defaultValue: false },
  {
    id: flagIds.doubleBottomOpened,
    description: '203の郵便受けの二重底を開けた',
    defaultValue: false,
  },
  {
    id: flagIds.testimonyGathered,
    description: 'Day 5で証言と方針を記録した',
    defaultValue: false,
  },
  {
    id: flagIds.intentPublic,
    description: '記録を町の外へも公開する方針を示した',
    defaultValue: false,
  },
  { id: flagIds.intentLocal, description: '名前をまず町へ返す方針を示した', defaultValue: false },
  { id: flagIds.intentMinato, description: '湊本人の望みを探す方針を示した', defaultValue: false },
  { id: flagIds.companionAsked, description: '放送塔へ榊の同行を頼んだ', defaultValue: false },
  {
    id: flagIds.companionAlone,
    description: '安全な保守道を一人で行くと決めた',
    defaultValue: false,
  },
  { id: flagIds.finalRecordingHeard, description: '湊の最後の録音を聞いた', defaultValue: false },
  { id: flagIds.finalDecisionMade, description: '放送卓で最終選択を行った', defaultValue: false },
  { id: flagIds.tsukiCollarRead, description: 'ツキの首輪のH.M.を読んだ', defaultValue: false },
  { id: flagIds.historyPiece1Found, description: '駅の町史紙片を見つけた', defaultValue: false },
  {
    id: flagIds.historyPiece2Found,
    description: '掲示板の町史紙片を見つけた',
    defaultValue: false,
  },
  { id: flagIds.historyPiece3Found, description: '役場の町史紙片を見つけた', defaultValue: false },
  { id: flagIds.cassetteTurned, description: 'カセットを裏返しメモを読んだ', defaultValue: false },
  { id: flagIds.keysGrouped, description: '鍵を201から203の札へ戻した', defaultValue: false },
  {
    id: flagIds.key204Missing,
    description: '204の札に部屋鍵がないと確認した',
    defaultValue: false,
  },
  { id: flagIds.smallKeyFound, description: '鍵束の留め具から小鍵を見つけた', defaultValue: false },
  {
    id: flagIds.minatoWishUnderstood,
    description: '湊が返事でなく記憶を望んだと理解した',
    defaultValue: false,
  },
  {
    id: flagIds.room204RecordRecovered,
    description: '旧204区画の記録と手紙を回収した',
    defaultValue: false,
  },
  {
    id: flagIds.allAnonymousLettersRead,
    description: '結末前の差出人不明手紙をすべて読んだ',
    defaultValue: false,
  },
  {
    id: flagIds.thirteenthNoticeVisible,
    description: '条件付きの十三番目が現れた',
    defaultValue: false,
  },
] as const satisfies readonly NarrativeFlagDefinition[]
