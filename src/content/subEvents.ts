import {
  characterIds,
  clueIds,
  dialogueIds,
  flagIds,
  locationIds,
  subEventIds,
  subEventStageIds,
} from './contentIds'
import type { SubEvent } from './types'

export const subEvents = [
  {
    id: subEventIds.tsukiCollar,
    title: 'ツキの首輪',
    summary: '町の各所に現れる猫を急かさず見守り、首輪と古い保守道のつながりを確かめる。',
    ownerCharacterId: characterIds.tsuki,
    startCondition: { kind: 'day', comparison: 'gte', value: 1 },
    stages: [
      {
        id: subEventStageIds.tsukiMeet,
        title: '町角の白い尾',
        objective: '違う場所でツキを二度見つけ、驚かせずに撫でる。',
        completionCondition: { kind: 'stat', statId: 'catPetCount', comparison: 'gte', value: 2 },
        effects: [
          {
            kind: 'advanceSubEvent',
            subEventId: subEventIds.tsukiCollar,
            stageId: subEventStageIds.tsukiCollar,
          },
        ],
      },
      {
        id: subEventStageIds.tsukiCollar,
        title: 'H.M.の刻印',
        objective: '月影荘の灯りの下で、首輪の裏を確かめる。',
        completionCondition: { kind: 'flag', flagId: flagIds.tsukiCollarRead, value: true },
        effects: [
          {
            kind: 'advanceSubEvent',
            subEventId: subEventIds.tsukiCollar,
            stageId: subEventStageIds.tsukiPath,
          },
        ],
      },
      {
        id: subEventStageIds.tsukiPath,
        title: '草の倒れた古道',
        objective: 'ツキが待つ丘の手前で、使われなくなった保守道を見つける。',
        completionCondition: { kind: 'locationVisited', locationId: locationIds.broadcastHill },
        effects: [
          { kind: 'discoverClue', clueId: clueIds.towerKey },
          { kind: 'completeSubEvent', subEventId: subEventIds.tsukiCollar },
        ],
      },
    ],
    completionEffects: [],
    endingRelevance: '放送塔への安全な古道を示し、どの結末でも同行者なしの進行を保証する。',
  },
  {
    id: subEventIds.tornHistory,
    title: '破れた町史',
    summary: '三枚に分かれた町史の紙片を集め、豪雨当日の記述を灯と復元する。',
    ownerCharacterId: characterIds.akari,
    startCondition: { kind: 'day', comparison: 'gte', value: 1 },
    stages: [
      {
        id: subEventStageIds.historyPiece1,
        title: '駅の紙片',
        objective: '駅のベンチ裏に挟まった、水染みのある紙片を見つける。',
        completionCondition: { kind: 'flag', flagId: flagIds.historyPiece1Found, value: true },
        effects: [
          {
            kind: 'advanceSubEvent',
            subEventId: subEventIds.tornHistory,
            stageId: subEventStageIds.historyPiece2,
          },
        ],
      },
      {
        id: subEventStageIds.historyPiece2,
        title: '掲示板の紙片',
        objective: '剥がれた掲示の裏から、同じ罫線の紙片を見つける。',
        completionCondition: { kind: 'flag', flagId: flagIds.historyPiece2Found, value: true },
        effects: [
          {
            kind: 'advanceSubEvent',
            subEventId: subEventIds.tornHistory,
            stageId: subEventStageIds.historyPiece3,
          },
        ],
      },
      {
        id: subEventStageIds.historyPiece3,
        title: '欠けた十三ページ',
        objective: '役場資料箱の紙片を持ち帰り、灯下書房で三枚を並べる。',
        completionCondition: {
          kind: 'all',
          conditions: [
            { kind: 'flag', flagId: flagIds.historyPiece3Found, value: true },
            { kind: 'locationVisited', locationId: locationIds.toukaBooks },
          ],
        },
        effects: [
          { kind: 'discoverClue', clueId: clueIds.missingPage13 },
          { kind: 'discoverClue', clueId: clueIds.evacuationLog },
          { kind: 'completeSubEvent', subEventId: subEventIds.tornHistory },
        ],
      },
    ],
    completionEffects: [{ kind: 'addTrust', characterId: characterIds.akari, amount: 2 }],
    endingRelevance: '豪雨と避難放送を町外へ示せる資料になり、Ending Bの証拠を補う。',
  },
  {
    id: subEventIds.cafeCassette,
    title: '宵待のカセット',
    summary: '難しい音響解析ではなく、再生・裏返し・メモ確認の三段階で放送全文へ届く。',
    ownerCharacterId: characterIds.kanade,
    startCondition: { kind: 'day', comparison: 'gte', value: 3 },
    stages: [
      {
        id: subEventStageIds.cassettePlay,
        title: 'A面の雨音',
        objective: '宵待のデッキでカセットを再生し、十二回のチャイムを聞く。',
        completionCondition: { kind: 'dialogueSeen', dialogueId: dialogueIds.kanadeD3 },
        effects: [
          {
            kind: 'advanceSubEvent',
            subEventId: subEventIds.cafeCassette,
            stageId: subEventStageIds.cassetteTurn,
          },
        ],
      },
      {
        id: subEventStageIds.cassetteTurn,
        title: 'ラベルの裏',
        objective: 'カセットを裏返し、ケースに隠れた青いメモを確認する。',
        completionCondition: { kind: 'flag', flagId: flagIds.cassetteTurned, value: true },
        effects: [
          { kind: 'discoverClue', clueId: clueIds.cassetteBack },
          {
            kind: 'advanceSubEvent',
            subEventId: subEventIds.cafeCassette,
            stageId: subEventStageIds.cassetteListen,
          },
        ],
      },
      {
        id: subEventStageIds.cassetteListen,
        title: '十三番目を黙って聞く',
        objective: '放送へ返事をせず、録音の最後まで聞く。電源を切った場合は翌日、奏に再確認する。',
        completionCondition: {
          kind: 'any',
          conditions: [
            { kind: 'flag', flagId: flagIds.broadcastListened, value: true },
            { kind: 'dialogueSeen', dialogueId: dialogueIds.kanadeD5High },
          ],
        },
        effects: [
          { kind: 'discoverClue', clueId: clueIds.evacuationLog },
          { kind: 'completeSubEvent', subEventId: subEventIds.cafeCassette },
        ],
      },
    ],
    completionEffects: [{ kind: 'addTrust', characterId: characterIds.kanade, amount: 2 }],
    endingRelevance:
      '湊の私信の目的と、返事を求めていなかった事実を補い、Ending A/Cを理解しやすくする。',
  },
  {
    id: subEventIds.keySorting,
    title: '鍵束の整理',
    summary: '部屋札と鍵を対応させ、204号室の鍵がない理由と二重底の小鍵を見つける。',
    ownerCharacterId: characterIds.koyomi,
    startCondition: { kind: 'day', comparison: 'gte', value: 4 },
    stages: [
      {
        id: subEventStageIds.keyGroup,
        title: '白い札と真鍮の札',
        objective: '形ではなく刻印を見て、201・202・203の鍵を部屋札へ戻す。',
        completionCondition: { kind: 'flag', flagId: flagIds.keysGrouped, value: true },
        effects: [
          {
            kind: 'advanceSubEvent',
            subEventId: subEventIds.keySorting,
            stageId: subEventStageIds.keyMissing204,
          },
        ],
      },
      {
        id: subEventStageIds.keyMissing204,
        title: '鍵のない札',
        objective: '204の部屋札だけに、鍵穴の擦れがないことを確かめる。',
        completionCondition: { kind: 'flag', flagId: flagIds.key204Missing, value: true },
        effects: [
          { kind: 'discoverClue', clueId: clueIds.oldFloorplan },
          {
            kind: 'advanceSubEvent',
            subEventId: subEventIds.keySorting,
            stageId: subEventStageIds.keySmall,
          },
        ],
      },
      {
        id: subEventStageIds.keySmall,
        title: '部屋を開けない小鍵',
        objective: '鍵束の留め具に隠れた小鍵を外し、共同郵便受けの二重底へ使う。',
        completionCondition: { kind: 'flag', flagId: flagIds.smallKeyFound, value: true },
        effects: [
          { kind: 'setFlag', flagId: flagIds.doubleBottomOpened, value: true },
          { kind: 'setFlag', flagId: flagIds.room204RecordRecovered, value: true },
          { kind: 'discoverClue', clueId: clueIds.mailboxFalseBottom },
          { kind: 'completeSubEvent', subEventId: subEventIds.keySorting },
        ],
      },
    ],
    completionEffects: [{ kind: 'addTrust', characterId: characterIds.koyomi, amount: 2 }],
    endingRelevance:
      '204号室が怪異で消えたのでなく、改装で203へ統合された事実を生活の道具から示す。',
  },
] as const satisfies readonly SubEvent[]
