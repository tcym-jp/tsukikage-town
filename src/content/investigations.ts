import {
  bulletinIds,
  characterIds,
  clueIds,
  flagIds,
  investigationIds,
  letterIds,
  locationIds,
  subEventIds,
} from './contentIds'
import type { Investigation } from './types'

export const investigations = [
  {
    id: investigationIds.stationClock,
    locationId: locationIds.station,
    label: '駅時計を調べる',
    nearbyLabel: '秒針の音が一度だけ途切れた',
    variants: [
      {
        id: 'arrival',
        condition: { kind: 'day', comparison: 'eq', value: 0 },
        textBlocks: [
          '列車が去った瞬間、針が午後11時13分を指す。瞬きをすると、正しい時刻へ戻った。',
          '時計の裏には「十三年前交換」とある。交換日だけ、数字が削られている。',
        ],
        effects: [{ kind: 'discoverClue', clueId: clueIds.clock1113 }],
      },
      {
        id: 'history_piece',
        condition: { kind: 'subEvent', subEventId: subEventIds.tornHistory, state: 'started' },
        textBlocks: ['ベンチ裏に水染みの紙片がある。「最後の避難者を確認」の行だけ読めた。'],
        effects: [{ kind: 'setFlag', flagId: flagIds.historyPiece1Found, value: true }],
      },
    ],
    fallbackText: ['時計は正しい時刻を刻む。11と13の数字だけ、文字盤の色が少し新しい。'],
  },
  {
    id: investigationIds.populationBoard,
    locationId: locationIds.townHall,
    label: '人口表示を数え直す',
    nearbyLabel: '最後の一桁がかすかに揺れる',
    variants: [
      {
        id: 'before_registration',
        condition: { kind: 'flag', flagId: flagIds.registered, value: false },
        textBlocks: ['人口は1,284人。窓口で名前を書く間だけ、末尾が5に変わって見える。'],
        effects: [{ kind: 'discoverClue', clueId: clueIds.populationFlicker }],
      },
      {
        id: 'after_registration',
        condition: { kind: 'flag', flagId: flagIds.registered, value: true },
        textBlocks: ['表示は1,285人で落ち着いた。下の紙台帳には、合計1,284と青字である。'],
        effects: [
          { kind: 'discoverClue', clueId: clueIds.populationFlicker },
          { kind: 'discoverClue', clueId: clueIds.blueInk },
        ],
      },
    ],
    fallbackText: ['人口表示は1,284人。数字を替える小窓の内側に、青い指跡がある。'],
  },
  {
    id: investigationIds.mailbox204,
    locationId: locationIds.tsukikageHeights,
    label: '共同郵便受けを調べる',
    nearbyLabel: '203の隣に細い継ぎ目がある',
    variants: [
      {
        id: 'day0_envelope',
        condition: { kind: 'day', comparison: 'eq', value: 0 },
        textBlocks: [
          '203の箱に、隣の細い隙間から封筒が落ちている。宛先は「204号室 星見湊様」。',
          '204の札はない。203の扉だけが、ほかの郵便受けより指二本ぶん広い。',
        ],
        effects: [
          { kind: 'setFlag', flagId: flagIds.mailboxOpened, value: true },
          { kind: 'deliverLetter', letterId: letterIds.to204 },
          { kind: 'discoverClue', clueId: clueIds.envelope204 },
        ],
      },
    ],
    fallbackText: ['203の箱は横幅が広い。底を叩くと、一部だけ乾いた音が返る。'],
  },
  {
    id: investigationIds.ledger,
    locationId: locationIds.townHall,
    label: '古い住民台帳を読む',
    nearbyLabel: '背表紙に十三年前の年号がある',
    variants: [
      {
        id: 'day2',
        condition: { kind: 'day', comparison: 'gte', value: 2 },
        textBlocks: [
          '星見の行は削られ、上から「転出」と青字で重ねられている。転出先は空欄だ。',
          '隣の保守員欄には、留め具だけ残った身分証の台紙が挟まっている。',
        ],
        effects: [
          { kind: 'discoverClue', clueId: clueIds.blueInk },
          { kind: 'discoverClue', clueId: clueIds.minatoBadge },
          { kind: 'setFlag', flagId: flagIds.historyPiece3Found, value: true },
        ],
      },
    ],
    fallbackText: ['最近の台帳だけが机にある。古い背表紙には、住民課の鍵が必要そうだ。'],
  },
  {
    id: investigationIds.historyPage,
    locationId: locationIds.toukaBooks,
    label: '町史の十三ページを開く',
    nearbyLabel: '十二ページと十四ページが直接つながっている',
    variants: [
      {
        id: 'day2_missing',
        condition: { kind: 'day', comparison: 'gte', value: 2 },
        textBlocks: [
          '十三ページは根元から切られている。十四ページの冒頭は「最後の放送の後」と始まる。',
          '切り口には三種類の水染み。別々の場所へ分けられた紙片と合いそうだ。',
        ],
        effects: [
          { kind: 'discoverClue', clueId: clueIds.missingPage13 },
          { kind: 'startSubEvent', subEventId: subEventIds.tornHistory },
        ],
      },
    ],
    fallbackText: ['町史は年代順に並ぶ。十三年前の巻だけ、棚から少し奥へ押し込まれている。'],
  },
  {
    id: investigationIds.badge,
    locationId: locationIds.townHall,
    label: '保守員証を確かめる',
    nearbyLabel: '台帳の間に真鍮色が見える',
    variants: [
      {
        id: 'found',
        condition: { kind: 'day', comparison: 'gte', value: 2 },
        textBlocks: ['写真は剥がれているが、「星見 湊」「放送設備保守」の刻印は消えていない。'],
        effects: [{ kind: 'discoverClue', clueId: clueIds.minatoBadge }],
      },
    ],
    fallbackText: ['台紙だけがあり、身分証を留めた金具の跡が二つ残る。'],
  },
  {
    id: investigationIds.blueCorrection,
    locationId: locationIds.townHall,
    label: '青い訂正跡を比べる',
    nearbyLabel: '同じ青でも、筆圧が違う',
    variants: [
      {
        id: 'with_sumi',
        condition: { kind: 'trust', characterId: characterIds.sumi, comparison: 'gte', value: 2 },
        textBlocks: [
          '古い訂正は濃く、澄の筆跡とは違う。欄外に「混乱防止、転出処理」と命令印がある。',
          '澄は自分の青いペンを横に置く。似ているのは色だけで、書いた人は別だ。',
        ],
        effects: [{ kind: 'discoverClue', clueId: clueIds.blueInk }],
      },
    ],
    fallbackText: ['訂正は青いインク。現在の住民票と同じ色だが、筆跡までは分からない。'],
  },
  {
    id: investigationIds.cassette,
    locationId: locationIds.yoimachiCafe,
    label: 'カセットを裏返す',
    nearbyLabel: '透明ケースの裏に青い線がある',
    variants: [
      {
        id: 'day3',
        condition: { kind: 'day', comparison: 'gte', value: 3 },
        textBlocks: [
          'ケースを裏返すと「十二の後、返事不要」とある。H.M.の頭文字が小さく添えられている。',
          'B面の最後には、避難先を一軒ずつ読み上げる声と、雨の中の足音が残る。',
        ],
        effects: [
          { kind: 'setFlag', flagId: flagIds.cassetteTurned, value: true },
          { kind: 'discoverClue', clueId: clueIds.cassetteBack },
        ],
      },
    ],
    fallbackText: ['ラベルのないカセット。奏に頼めば、店の古いデッキで再生できそうだ。'],
  },
  {
    id: investigationIds.doorOutline,
    locationId: locationIds.tsukikageHeights,
    label: '壁紙の継ぎ目をたどる',
    nearbyLabel: '203の東側だけ、花模様が半分ずれている',
    variants: [
      {
        id: 'day4',
        condition: { kind: 'day', comparison: 'gte', value: 4 },
        textBlocks: [
          '壁紙の下に扉の輪郭がある。蝶番跡は203側へ向き、壁の厚みは部屋一つぶんもない。',
          '剥がれた端に「改装工事・二室統合」の鉛筆書きが残っている。',
        ],
        effects: [
          { kind: 'setFlag', flagId: flagIds.doorOutlineFound, value: true },
          { kind: 'discoverClue', clueId: clueIds.oldFloorplan },
        ],
      },
    ],
    fallbackText: ['廊下の花模様が一箇所だけずれる。管理人と一緒なら詳しく見られそうだ。'],
  },
  {
    id: investigationIds.mailboxBottom,
    locationId: locationIds.tsukikageHeights,
    label: '郵便受けの底を押す',
    nearbyLabel: '203の箱だけ、底板が二重に見える',
    variants: [
      {
        id: 'with_small_key',
        condition: { kind: 'flag', flagId: flagIds.smallKeyFound, value: true },
        textBlocks: [
          '小鍵を回すと底板が外れた。中には、湊の未送信手紙と空欄の転出届がある。',
          '隠したというより、宛先が決まるまで湿気から守るための造りに見える。',
        ],
        effects: [
          { kind: 'setFlag', flagId: flagIds.doubleBottomOpened, value: true },
          { kind: 'setFlag', flagId: flagIds.room204RecordRecovered, value: true },
          { kind: 'discoverClue', clueId: clueIds.mailboxFalseBottom },
          { kind: 'discoverClue', clueId: clueIds.unsentMoveOut },
          { kind: 'deliverLetter', letterId: letterIds.minatoUnsent },
        ],
      },
    ],
    fallbackText: ['底板には小さな鍵穴がある。部屋の鍵では細すぎて入らない。'],
  },
  {
    id: investigationIds.floorplan,
    locationId: locationIds.room203,
    label: '古い間取りを広げる',
    nearbyLabel: '現在の部屋より東壁が細く描かれている',
    variants: [
      {
        id: 'day4',
        condition: { kind: 'day', comparison: 'gte', value: 4 },
        textBlocks: [
          '旧図面には203と204がある。改装図では境界が消え、両方を指す矢印が203へ向かう。',
          '204は消失したのでなく、配管工事の際に203へ統合されたと日付入りで記されている。',
        ],
        effects: [{ kind: 'discoverClue', clueId: clueIds.oldFloorplan }],
      },
    ],
    fallbackText: ['東壁まで歩くと、部屋の外から見た幅と合わない気がする。'],
  },
  {
    id: investigationIds.familyPhoto,
    locationId: locationIds.townHall,
    label: '机の写真を見る',
    nearbyLabel: '書類の下に写真の角が見える',
    variants: [
      {
        id: 'trusted',
        condition: { kind: 'trust', characterId: characterIds.sumi, comparison: 'gte', value: 3 },
        textBlocks: [
          '放送塔の前で、幼い澄と制服姿の湊が笑っている。裏には「兄さん、帰ったら」とだけある。',
          '澄は写真を隠さない。町が消した名前を、家族は一度も消していなかった。',
        ],
        effects: [{ kind: 'discoverClue', clueId: clueIds.sumiPhoto }],
      },
    ],
    fallbackText: ['書類の下に古い写真の角がある。澄は青いペンを置き、まだ伏せたままにする。'],
  },
  {
    id: investigationIds.renLog,
    locationId: locationIds.mainStreet,
    label: '榊家の業務日誌を読む',
    nearbyLabel: '懐中電灯の下に、雨染みの手帳がある',
    variants: [
      {
        id: 'trusted',
        condition: { kind: 'trust', characterId: characterIds.ren, comparison: 'gte', value: 2 },
        textBlocks: [
          '豪雨翌日。「混乱を避け、星見を転出処理」とある。次の行には「遺留品なし」と訂正。',
          '欄外には別の筆跡で「命令に従った。正しかったとは書けない」と残されている。',
        ],
        effects: [{ kind: 'discoverClue', clueId: clueIds.renFatherLog }],
      },
    ],
    fallbackText: ['榊は手帳を閉じたまま持っている。出所の分かる証拠を示せば、話してくれそうだ。'],
  },
  {
    id: investigationIds.towerFence,
    locationId: locationIds.broadcastHill,
    label: '立入禁止柵を確かめる',
    nearbyLabel: '錠前に新しい油が差してある',
    variants: [
      {
        id: 'day6',
        condition: { kind: 'day', comparison: 'gte', value: 6 },
        textBlocks: [
          '錠前は壊れていない。榊の許可札か、ツキが示した保守道の小門なら安全に入れる。',
          '小門の鍵には「H.M.」の刻印。首輪と同じ二文字だ。',
        ],
        effects: [{ kind: 'discoverClue', clueId: clueIds.towerKey }],
      },
    ],
    fallbackText: ['斜面は暗く、柵の先へ進むのは危険だ。町の案内と鍵が必要になる。'],
  },
  {
    id: investigationIds.towerConsole,
    locationId: locationIds.broadcastHill,
    label: '放送卓の記録を再生する',
    nearbyLabel: '十三番のボタンだけ、文字が手書きだ',
    variants: [
      {
        id: 'day7_full',
        condition: { kind: 'clueCount', comparison: 'gte', value: 10 },
        textBlocks: [
          '配線図では台帳端末の更新音が放送卓へ送られる。消された名前が、十三番へ蓄積した。',
          '最後の録音で湊は、避難確認後に保守道へ向かったと話す。帰還の音だけはない。',
        ],
        effects: [
          { kind: 'discoverClue', clueId: clueIds.evacuationLog },
          { kind: 'setFlag', flagId: flagIds.finalRecordingHeard, value: true },
        ],
      },
    ],
    fallbackText: ['配線は複雑だが、台帳端末と十三番のボタンが同じ線へつながっている。'],
  },
  {
    id: investigationIds.noticeGap,
    locationId: locationIds.bulletinBoard,
    label: '右下の紙跡を調べる',
    nearbyLabel: '十二枚の外に、古い四角い跡がある',
    variants: [
      {
        id: 'day6_notice',
        condition: { kind: 'bulletinRead', bulletinId: bulletinIds.thirteenth },
        textBlocks: [
          '十三枚目は新しいのに、画鋲穴は十三年前のものと重なる。紙面は{{playerName}}の名を知る。',
          '裏面には放送塔への簡単な道順と、「返事ではなく選択を」と書かれている。',
        ],
        effects: [
          { kind: 'discoverClue', clueId: clueIds.thirteenthNotice },
          { kind: 'setFlag', flagId: flagIds.thirteenthNoticeVisible, value: true },
        ],
      },
      {
        id: 'history_piece',
        condition: { kind: 'subEvent', subEventId: subEventIds.tornHistory, state: 'started' },
        textBlocks: ['剥がれかけた掲示の裏に、水染みの紙片がある。「十三番、私信」の語が読めた。'],
        effects: [{ kind: 'setFlag', flagId: flagIds.historyPiece2Found, value: true }],
      },
    ],
    fallbackText: ['紙は十二枚。右下には、長く何かが貼られていた四角い日焼け跡がある。'],
  },
] as const satisfies readonly Investigation[]
