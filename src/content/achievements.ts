import { achievementIds, bulletinIds, endingIds, flagIds } from './contentIds'
import type { Achievement } from './types'

export const achievements = [
  {
    id: achievementIds.newResident,
    title: '月影町の住民',
    description: '転入届を提出し、月影荘203号室の住民票を受け取った。',
    hidden: false,
    condition: { kind: 'flag', flagId: flagIds.registered, value: true },
    iconHint: '青い印章の住民票',
  },
  {
    id: achievementIds.goodNeighbor,
    title: 'よき隣人',
    description: '町の小さな頼みを三件以上、最後まで手伝った。',
    hidden: false,
    condition: { kind: 'stat', statId: 'completedSubEvents', comparison: 'gte', value: 3 },
    iconHint: '三枚の小さな依頼札',
  },
  {
    id: achievementIds.paperTrail,
    title: '紙の道しるべ',
    description: '十五個すべての手掛かりを集め、消された記録の経路をつないだ。',
    hidden: true,
    condition: { kind: 'clueCount', comparison: 'gte', value: 15 },
    iconHint: '青い糸で結ばれた十五枚の紙',
  },
  {
    id: achievementIds.catFriend,
    title: 'ツキの友だち',
    description: '町の各所でツキを五回撫でた。',
    hidden: false,
    condition: { kind: 'stat', statId: 'catPetCount', comparison: 'gte', value: 5 },
    iconHint: '月形に曲がった猫の尻尾',
  },
  {
    id: achievementIds.silentListener,
    title: '返事のいらない声',
    description: '11時13分の放送へ返事をせず、最後まで聞いた。',
    hidden: true,
    condition: {
      kind: 'all',
      conditions: [
        { kind: 'flag', flagId: flagIds.broadcastListened, value: true },
        { kind: 'not', condition: { kind: 'flag', flagId: flagIds.broadcastReplied, value: true } },
      ],
    },
    iconHint: '波形のない古いマイク',
  },
  {
    id: achievementIds.thirteenthReader,
    title: '十三枚目の読者',
    description: '条件を満たし、十二枚の外に現れた十三番目の回覧板を読んだ。',
    hidden: true,
    condition: { kind: 'bulletinRead', bulletinId: bulletinIds.thirteenth },
    iconHint: '十二の画鋲穴と一枚の紙',
  },
  {
    id: achievementIds.endingA,
    title: '名前を町へ',
    description: 'Ending A「月影町の住民」へ到達した。',
    hidden: true,
    condition: { kind: 'endingReached', endingId: endingIds.a },
    iconHint: '台帳へ戻った青い一行',
  },
  {
    id: achievementIds.endingB,
    title: '終点の向こうへ',
    description: 'Ending B「終点の向こう」へ到達した。',
    hidden: true,
    condition: { kind: 'endingReached', endingId: endingIds.b },
    iconHint: '朝の線路と封筒',
  },
  {
    id: achievementIds.endingC,
    title: '十三番目の配達人',
    description: 'Ending C「十三番目の配達人」へ到達した。',
    hidden: true,
    condition: { kind: 'endingReached', endingId: endingIds.c },
    iconHint: '手書きの十三がある郵便鞄',
  },
] as const satisfies readonly Achievement[]
