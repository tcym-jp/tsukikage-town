import {
  ACHIEVEMENT_IDS,
  FLAG_IDS,
  applyEffects,
  evaluateCondition,
  type Condition,
  type Day,
  type Effect,
  type GameState,
  type TimeOfDay,
} from '../game'
import {
  bulletinIds,
  characterIds,
  clueIds,
  flagIds,
  letterIds,
  locationIds,
  objectiveIds,
  subEventIds,
  subEventStageIds,
} from '../content/contentIds'
import type { DialogueChoiceView } from '../ui/types'

export type StoryActionKind =
  'story' | 'talk' | 'inspect' | 'rest' | 'letters' | 'bulletins' | 'final'

export interface StoryDialogueChoice extends DialogueChoiceView {
  readonly effects: readonly Effect[]
  readonly response: readonly string[]
}

export interface StoryAction {
  readonly id: string
  readonly day: Day
  readonly periods: readonly TimeOfDay[]
  readonly locationId: string
  readonly label: string
  readonly description: string
  readonly symbol: string
  readonly kind: StoryActionKind
  readonly speaker?: string
  readonly speakerRole?: string
  readonly portraitSymbol?: string
  readonly lines: readonly string[]
  readonly choices?: readonly StoryDialogueChoice[]
  readonly condition?: Condition
  readonly effects: readonly Effect[]
  readonly repeatable?: boolean
}

export interface StoryBeat {
  readonly day: Day
  readonly period: TimeOfDay
  readonly title: string
  readonly objective: string
  readonly hints: readonly string[]
  readonly requiredActionIds: readonly string[]
  readonly minimumRequired?: number
  readonly blockedMessage: string
}

const actionFlag = (id: string) => `story_action:${id}`
const done = (id: string): Effect => ({ kind: 'setFlag', flagId: actionFlag(id), value: true })
const clue = (id: string): Effect => ({ kind: 'discoverClue', clueId: id })
const journal = (id: string): Effect => ({ kind: 'addJournalEntry', entryId: id })
const completeObjective = (id: string): Effect => ({ kind: 'completeObjective', objectiveId: id })
const unlock = (id: string): Effect => ({ kind: 'unlockLocation', locationId: id })
const trust = (id: string, amount: number): Effect => ({
  kind: 'addTrust',
  characterId: id,
  amount,
})

export const STORY_ACTIONS: readonly StoryAction[] = [
  {
    id: 'd0_station_arrival',
    day: 0,
    periods: ['evening'],
    locationId: locationIds.station,
    label: '駅時計と時刻表を確かめる',
    description: '最終列車が去ったホームに、時刻のずれが残っている。',
    symbol: '駅',
    kind: 'story',
    speaker: '地の文',
    portraitSymbol: '終',
    lines: [
      '最終列車の赤い尾灯が、曲がり角の向こうへ消えた。ホームに残ったのは、あなたと湿った風だけだ。',
      '駅時計の針が一瞬だけ十一時十三分を指す。瞬きをすると、夕方六時へ戻っていた。',
      '駅前の案内板には、町役場への細い道が青いインクで書き足されている。',
    ],
    effects: [
      clue(clueIds.clock1113),
      unlock(locationIds.townHall),
      unlock(locationIds.mainStreet),
      journal('journal_d0_arrival'),
      completeObjective(objectiveIds.d0Arrive),
    ],
  },
  {
    id: 'd0_register',
    day: 0,
    periods: ['evening'],
    locationId: locationIds.townHall,
    label: '転入手続きをする',
    description: '御影澄から住民票と月影荘203号室の鍵を受け取る。',
    symbol: '届',
    kind: 'talk',
    speaker: '御影 澄',
    speakerRole: '月影町役場・住民課',
    portraitSymbol: '澄',
    lines: [
      '「ようこそ、{{playerName}}さん。月影町へ。町が忘れないよう、お名前は丁寧に記しておきますね」',
      '澄は青いインクで住民票を整えた。人口欄の数字が、1,284と1,285の間でわずかに滲む。',
      '「月影荘の203号室です。郵便受けの番号も、念のため確かめてください」',
    ],
    effects: [
      { kind: 'setFlag', flagId: flagIds.registered, value: true },
      { kind: 'setFlag', flagId: flagIds.roomKeyReceived, value: true },
      trust(characterIds.sumi, 2),
      unlock(locationIds.tsukikageHeights),
      unlock(locationIds.room203),
      unlock(locationIds.bulletinBoard),
      unlock(locationIds.toukaBooks),
      unlock(locationIds.yoimachiCafe),
      { kind: 'deliverLetter', letterId: letterIds.transferGuide },
      journal('journal_d0_registered'),
      completeObjective(objectiveIds.d0Register),
    ],
  },
  {
    id: 'd0_mailbox',
    day: 0,
    periods: ['night'],
    locationId: locationIds.tsukikageHeights,
    label: '203号室の郵便受けを開ける',
    description: '自分の番号の奥に、別の宛名が見えている。',
    symbol: '〒',
    kind: 'letters',
    speaker: '月白 こよみ',
    speakerRole: '月影荘 管理人',
    portraitSymbol: '暦',
    lines: [
      '「お部屋は203号室です。204？　この建物は、偶数が少し苦手なのかもしれませんね」',
      '203の扉を開くと、奥からもう一通滑り落ちた。宛名は「204号室　星見湊様」。',
      '封筒は十三年分の湿気を吸ったように重い。だが切手の消印は、今日の日付だった。',
    ],
    effects: [
      { kind: 'setFlag', flagId: flagIds.mailboxOpened, value: true },
      clue(clueIds.envelope204),
      { kind: 'deliverLetter', letterId: letterIds.to204 },
      trust(characterIds.koyomi, 1),
      journal('journal_d0_mailbox'),
      completeObjective(objectiveIds.d0Mailbox),
    ],
  },
  {
    id: 'd0_settle_room',
    day: 0,
    periods: ['night'],
    locationId: locationIds.room203,
    label: '自室を整える',
    description: '鍵、住民票、届いた封筒を机へ並べる。',
    symbol: '室',
    kind: 'rest',
    speaker: '地の文',
    lines: [
      '壁の向こうから十二回、古いチャイムが響いた。十三回目の代わりに、短いノイズが落ちる。',
      '机の引き出しは、手紙と記録をいつでも読み返せる大きさだった。',
    ],
    effects: [journal('journal_d0_first_night')],
  },

  {
    id: 'd1_greet_kanade',
    day: 1,
    periods: ['morning'],
    locationId: locationIds.yoimachiCafe,
    label: '雨宮奏に挨拶する',
    description: '喫茶「宵待」で町の音について聞く。',
    symbol: '奏',
    kind: 'talk',
    speaker: '雨宮 奏',
    speakerRole: '喫茶「宵待」',
    portraitSymbol: '奏',
    lines: [
      '「新しい人だ。クリームソーダは、空の色が変わる前に飲むのがおすすめ」',
      '「静かな町ほど、みんな音を聞いてるんだよ。電車とか、雨とか……聞こえないはずの放送とか」',
    ],
    effects: [
      trust(characterIds.kanade, 1),
      { kind: 'incrementStat', statId: 'spokenCharacters', amount: 1 },
      { kind: 'markDialogueSeen', dialogueId: 'kanade_d1_cafe' },
    ],
  },
  {
    id: 'd1_greet_akari',
    day: 1,
    periods: ['morning'],
    locationId: locationIds.toukaBooks,
    label: '久世灯に挨拶する',
    description: '古書店の奥に、町史が積まれている。',
    symbol: '灯',
    kind: 'talk',
    speaker: '久世 灯',
    speakerRole: '灯下書房 店主',
    portraitSymbol: '灯',
    lines: [
      '「本は、読まれなくなっても、書かれたことまで消えるわけじゃない」',
      '灯は棚の十三段目だけを避けるように、指で背表紙をなぞった。「町も、たぶん同じです」',
    ],
    effects: [
      trust(characterIds.akari, 1),
      { kind: 'incrementStat', statId: 'spokenCharacters', amount: 1 },
      { kind: 'markDialogueSeen', dialogueId: 'akari_d1_bookshop' },
    ],
  },
  {
    id: 'd1_greet_ren',
    day: 1,
    periods: ['morning'],
    locationId: locationIds.mainStreet,
    label: '榊蓮に挨拶する',
    description: '駐在所の巡査が、町の境界を見回っている。',
    symbol: '巡',
    kind: 'talk',
    speaker: '榊 蓮',
    speakerRole: '月影町駐在所',
    portraitSymbol: '榊',
    lines: [
      '「転入した人か。道は狭いが、迷うほど広い町じゃない」',
      '「知らないものを追うのは止めない。ただ、帰る場所まで見失うな」',
    ],
    effects: [
      trust(characterIds.ren, 1),
      { kind: 'incrementStat', statId: 'spokenCharacters', amount: 1 },
      { kind: 'markDialogueSeen', dialogueId: 'ren_d1_warning' },
    ],
  },
  {
    id: 'd1_board',
    day: 1,
    periods: ['evening'],
    locationId: locationIds.bulletinBoard,
    label: '十二枚の回覧を読む',
    description: '日常のお知らせの並びと、紙を剥がした跡を確かめる。',
    symbol: '回',
    kind: 'bulletins',
    speaker: '地の文',
    lines: [
      '木枠には、ちょうど十二枚の紙が並んでいる。ごみの日、街灯点検、迷い猫。どれも普通のお知らせだ。',
      '右下にだけ、十三枚目を貼れそうな不自然な隙間がある。画鋲の穴は新しい。',
    ],
    effects: [journal('journal_d1_board')],
  },
  {
    id: 'd1_cat_errand',
    day: 1,
    periods: ['evening'],
    locationId: locationIds.mainStreet,
    label: '白灰の猫を追う',
    description: '首輪の付いた猫が、掲示板の裏へ消えた。',
    symbol: '猫',
    kind: 'inspect',
    speaker: '地の文',
    lines: [
      '白と灰色の猫は「ツキ」と呼ぶと、一度だけ振り返った。',
      '首輪の裏には擦れた「H.M.」。猫は古い放送塔の方角を見て、静かに喉を鳴らす。',
    ],
    effects: [
      { kind: 'startSubEvent', subEventId: subEventIds.tsukiCollar },
      {
        kind: 'advanceSubEvent',
        subEventId: subEventIds.tsukiCollar,
        stageId: subEventStageIds.tsukiMeet,
      },
      { kind: 'setFlag', flagId: flagIds.tsukiCollarRead, value: true },
      { kind: 'incrementStat', statId: 'catPetCount', amount: 1 },
      { kind: 'setFlag', flagId: flagIds.shopErrandStarted, value: true },
      completeObjective(objectiveIds.d1StartErrand),
    ],
  },
  {
    id: 'd1_unknown_letter',
    day: 1,
    periods: ['night'],
    locationId: locationIds.room203,
    label: '差出人不明の手紙を読む',
    description: '「この手紙を、まだ捨てないでください」',
    symbol: '封',
    kind: 'letters',
    speaker: '差出人不明',
    portraitSymbol: '？',
    lines: [
      '「この手紙を、まだ捨てないでください」',
      '「町が忘れた名前は、紙の端に残ります。十二の次を、空白のままにしないで」',
    ],
    effects: [
      { kind: 'deliverLetter', letterId: letterIds.doNotDiscard },
      { kind: 'readLetter', letterId: letterIds.doNotDiscard, anonymous: true },
      journal('journal_d1_unknown_letter'),
    ],
  },

  {
    id: 'd2_ledger',
    day: 2,
    periods: ['morning'],
    locationId: locationIds.townHall,
    label: '古い住民台帳を調べる',
    description: '人口欄と、青いインクの訂正跡を比べる。',
    symbol: '帳',
    kind: 'inspect',
    speaker: '御影 澄',
    speakerRole: '月影町役場・住民課',
    portraitSymbol: '澄',
    lines: [
      '台帳の一行が、紙ごと薄く削られている。青いインクで「転出」と書き直された跡だけが残る。',
      '「事実を知ることと、誰かを責めることは同じではありません」澄は鍵束を握ったまま、目をそらさなかった。',
    ],
    choices: [
      {
        id: 'listen_to_sumi',
        label: '澄の立場を聞く',
        tone: 'accept',
        hint: '決めつけずに尋ねる',
        effects: [
          trust(characterIds.sumi, 3),
          { kind: 'setFlag', flagId: flagIds.sumiAnswered, value: true },
        ],
        response: ['「兄の名前を知っているんですね」澄は、初めて星見湊を兄と呼んだ。'],
      },
      {
        id: 'press_for_truth',
        label: '記録改変の理由を確かめる',
        tone: 'question',
        effects: [
          trust(characterIds.sumi, 1),
          { kind: 'setFlag', flagId: flagIds.sumiAnswered, value: true },
        ],
        response: ['「隠したことは否定しません。ただ、あの夜は誰も正しい答えを持っていなかった」'],
      },
      {
        id: 'keep_distance',
        label: '今は台帳だけを見る',
        tone: 'distance',
        effects: [{ kind: 'setFlag', flagId: flagIds.sumiAnswered, value: true }],
        response: ['澄はうなずき、台帳の端をそっと押さえた。話す機会は、まだ残っている。'],
      },
    ],
    effects: [
      clue(clueIds.populationFlicker),
      clue(clueIds.blueInk),
      completeObjective(objectiveIds.d2Ledger),
      completeObjective(objectiveIds.d2Respond),
      journal('journal_d2_ledger'),
    ],
  },
  {
    id: 'd2_history',
    day: 2,
    periods: ['evening'],
    locationId: locationIds.toukaBooks,
    label: '切り取られた町史を借りる',
    description: '十三ページだけが失われた古い町史。',
    symbol: '史',
    kind: 'inspect',
    speaker: '久世 灯',
    speakerRole: '灯下書房 店主',
    portraitSymbol: '灯',
    lines: [
      '町史の十二ページは豪雨の始まりで終わり、十四ページは避難完了から始まっている。',
      '「ないページほど、長く読まれることもあります」灯は三枚の紙片を封筒へ入れた。',
    ],
    effects: [
      clue(clueIds.missingPage13),
      clue(clueIds.minatoBadge),
      { kind: 'startSubEvent', subEventId: subEventIds.tornHistory },
      {
        kind: 'advanceSubEvent',
        subEventId: subEventIds.tornHistory,
        stageId: subEventStageIds.historyPiece1,
      },
      trust(characterIds.akari, 2),
      { kind: 'deliverLetter', letterId: letterIds.historyReturn },
      completeObjective(objectiveIds.d2History),
      journal('journal_d2_history'),
    ],
  },
  {
    id: 'd2_compare_records',
    day: 2,
    periods: ['night'],
    locationId: locationIds.room203,
    label: '住民票と町史を並べる',
    description: '203号室の住所と、古い間取りの余白を比べる。',
    symbol: '比',
    kind: 'inspect',
    speaker: '地の文',
    lines: [
      '203号室の横幅だけが、古い建物の二室分ある。壁の向こうではなく、この部屋の中に204が残っている。',
      '町史の紙片には、豪雨当日の保守員として「星見湊」の名がある。',
    ],
    effects: [clue(clueIds.oldFloorplan), journal('journal_d2_compare')],
  },

  {
    id: 'd3_invitation',
    day: 3,
    periods: ['morning'],
    locationId: locationIds.yoimachiCafe,
    label: '夜の招待を受け取る',
    description: '奏が古いカセットをカウンターの下から出す。',
    symbol: '音',
    kind: 'talk',
    speaker: '雨宮 奏',
    speakerRole: '喫茶「宵待」',
    portraitSymbol: '奏',
    lines: [
      '「これ、子どもの頃に録ったんだ。雨の音しか入ってないはずなのに、裏側に声がある」',
      '今夜十一時十三分、店を閉めたあとに再生しようと奏は言った。',
    ],
    effects: [
      { kind: 'deliverLetter', letterId: letterIds.cafeInvitation },
      trust(characterIds.kanade, 1),
      { kind: 'startSubEvent', subEventId: subEventIds.cafeCassette },
    ],
  },
  {
    id: 'd3_cassette',
    day: 3,
    periods: ['evening'],
    locationId: locationIds.yoimachiCafe,
    label: 'カセットの裏面を再生する',
    description: '十一時十三分の町内放送へ、どう向き合うか決める。',
    symbol: '録',
    kind: 'talk',
    speaker: '古い録音',
    speakerRole: '11:13 町内放送',
    portraitSymbol: '湊',
    lines: [
      'ノイズの奥から、落ち着いた男の声が聞こえる。',
      '「月影荘二〇四号室の方へ。あなたの転入届を、お預かりしています」',
      '返事を求めるような空白が、テープの終わりまで続いた。',
    ],
    choices: [
      {
        id: 'stay_silent',
        label: '黙って最後まで聞く',
        tone: 'accept',
        hint: '録音全文を残す',
        effects: [
          { kind: 'setFlag', flagId: flagIds.broadcastListened, value: true },
          { kind: 'setFlag', flagId: FLAG_IDS.MINATO_WISH_UNDERSTOOD, value: true },
          trust(characterIds.kanade, 2),
        ],
        response: ['声は返事を待たず、最後に「覚えていてほしい」とだけ残した。'],
      },
      {
        id: 'reply',
        label: '「聞こえています」と返す',
        tone: 'question',
        hint: '町の規則に反する',
        effects: [
          { kind: 'setFlag', flagId: flagIds.broadcastReplied, value: true },
          trust(characterIds.kanade, 1),
        ],
        response: ['店の照明が一度消えた。テープの空白に、自分の名前を呼ぶ声が重なる。'],
      },
      {
        id: 'cut_power',
        label: '電源を切る',
        tone: 'distance',
        hint: '榊の警告を守る',
        effects: [
          { kind: 'setFlag', flagId: flagIds.broadcastCut, value: true },
          trust(characterIds.ren, 2),
        ],
        response: ['回転音が止まり、雨音だけが戻る。奏は責めずに、テープを裏返した。'],
      },
    ],
    effects: [
      clue(clueIds.cassetteBack),
      clue(clueIds.evacuationLog),
      {
        kind: 'advanceSubEvent',
        subEventId: subEventIds.cafeCassette,
        stageId: subEventStageIds.cassetteListen,
      },
      { kind: 'completeSubEvent', subEventId: subEventIds.cafeCassette },
      completeObjective(objectiveIds.d3Cassette),
      completeObjective(objectiveIds.d3Broadcast),
      journal('journal_d3_broadcast'),
    ],
  },
  {
    id: 'd3_night_broadcast',
    day: 3,
    periods: ['night'],
    locationId: locationIds.room203,
    label: '十二回のチャイムを数える',
    description: '部屋のラジオは、電源を切っても微かに鳴る。',
    symbol: '波',
    kind: 'inspect',
    speaker: '星見 湊',
    speakerRole: '放送の反響',
    portraitSymbol: '湊',
    lines: [
      '「聞こえているなら、返事はしなくていい。ただ、誰かがここにいたことだけ、覚えていてほしい」',
      '放送の後、郵便受けで新しい封筒が一通だけ鳴った。',
    ],
    effects: [
      { kind: 'deliverLetter', letterId: letterIds.sumiMeeting },
      { kind: 'deliverLetter', letterId: letterIds.renSafetyNote },
      journal('journal_d3_night'),
    ],
  },

  {
    id: 'd4_keys',
    day: 4,
    periods: ['morning'],
    locationId: locationIds.tsukikageHeights,
    label: 'こよみの鍵束を整理する',
    description: '部屋札と鍵を対応させる。204だけ鍵がない。',
    symbol: '鍵',
    kind: 'inspect',
    speaker: '月白 こよみ',
    speakerRole: '月影荘 管理人',
    portraitSymbol: '暦',
    lines: [
      '「母の代から、鍵は同じ順番にしているんです」こよみは白い鍵束をほどいた。',
      '201、202、203。204の札だけがあり、鍵はない。代わりに郵便受け用の小さな鍵が残った。',
    ],
    effects: [
      { kind: 'startSubEvent', subEventId: subEventIds.keySorting },
      {
        kind: 'advanceSubEvent',
        subEventId: subEventIds.keySorting,
        stageId: subEventStageIds.keySmall,
      },
      { kind: 'completeSubEvent', subEventId: subEventIds.keySorting },
      { kind: 'setFlag', flagId: flagIds.smallKeyFound, value: true },
      clue(clueIds.oldFloorplan),
      trust(characterIds.koyomi, 2),
      completeObjective(objectiveIds.d4Keys),
    ],
  },
  {
    id: 'd4_door',
    day: 4,
    periods: ['evening'],
    locationId: locationIds.room203,
    label: '壁紙の下の扉跡を調べる',
    description: '照明を横から当てると、古い枠が浮かぶ。',
    symbol: '壁',
    kind: 'inspect',
    speaker: '地の文',
    lines: [
      '壁紙の下に、扉の輪郭と「204」の鉛筆跡が残っている。怪異で消えた部屋ではない。',
      '改装図には「203・204統合」とある。事実を曖昧にしたのは、町の方だった。',
    ],
    effects: [
      { kind: 'setFlag', flagId: flagIds.doorOutlineFound, value: true },
      clue(clueIds.oldFloorplan),
      completeObjective(objectiveIds.d4Door),
      journal('journal_d4_door'),
    ],
  },
  {
    id: 'd4_false_bottom',
    day: 4,
    periods: ['evening'],
    locationId: locationIds.tsukikageHeights,
    label: '郵便受けの二重底を開ける',
    description: '小さな鍵が、見えない底板に合う。',
    symbol: '底',
    kind: 'letters',
    speaker: '地の文',
    lines: [
      '底板の下から、未送信の手紙と古い転出届が現れた。転出届の本人署名欄は空白だ。',
      '湊は町を出たのではない。町が、出たことにした。',
    ],
    effects: [
      { kind: 'setFlag', flagId: flagIds.doubleBottomOpened, value: true },
      { kind: 'setFlag', flagId: FLAG_IDS.ROOM_204_RECORD_RECOVERED, value: true },
      clue(clueIds.mailboxFalseBottom),
      clue(clueIds.unsentMoveOut),
      { kind: 'deliverLetter', letterId: letterIds.minatoUnsent },
      completeObjective(objectiveIds.d4Mailbox),
    ],
  },
  {
    id: 'd4_unsent',
    day: 4,
    periods: ['night'],
    locationId: locationIds.room203,
    label: '湊の未送信手紙を読む',
    description: '届け先のない手紙に、十三番目の役目が書かれている。',
    symbol: '湊',
    kind: 'letters',
    speaker: '星見 湊',
    speakerRole: '未送信の手紙',
    portraitSymbol: '湊',
    lines: [
      '「十三番目は、公式の連絡ではありません。消えそうな名前を、もう一人へ渡すための私信です」',
      '「正しい記録より先に、誰かがここにいたことを残したかった」',
    ],
    effects: [
      { kind: 'readLetter', letterId: letterIds.minatoUnsent },
      { kind: 'setFlag', flagId: FLAG_IDS.MINATO_WISH_UNDERSTOOD, value: true },
      { kind: 'setFlag', flagId: FLAG_IDS.ALL_ANONYMOUS_LETTERS_READ, value: true },
      journal('journal_d4_minato_wish'),
    ],
  },

  {
    id: 'd5_sumi_testimony',
    day: 5,
    periods: ['morning'],
    locationId: locationIds.townHall,
    label: '澄の証言を聞く',
    description: '兄の記録を消した町と、残した妹の話。',
    symbol: '澄',
    kind: 'talk',
    speaker: '御影 澄',
    portraitSymbol: '澄',
    lines: [
      '「兄を転出扱いにした書類へ、私も印を押しました。混乱を止めるためだと信じたかった」',
      '家族写真の端に、作業服姿の湊が立っている。青いインクで名前だけが書き足されていた。',
    ],
    effects: [clue(clueIds.sumiPhoto), trust(characterIds.sumi, 3), journal('journal_d5_sumi')],
  },
  {
    id: 'd5_ren_testimony',
    day: 5,
    periods: ['morning'],
    locationId: locationIds.mainStreet,
    label: '榊の業務日誌を読む',
    description: '父が残した豪雨当日の判断。',
    symbol: '榊',
    kind: 'talk',
    speaker: '榊 蓮',
    portraitSymbol: '榊',
    lines: [
      '「親父は立入禁止を命じた。湊さんを見捨てたかったんじゃない。二次災害を恐れた」',
      '業務日誌には、放送で避難できた世帯の名がびっしり並ぶ。最後の一行だけ空白だ。',
    ],
    effects: [clue(clueIds.renFatherLog), trust(characterIds.ren, 3), journal('journal_d5_ren')],
  },
  {
    id: 'd5_akari_testimony',
    day: 5,
    periods: ['evening'],
    locationId: locationIds.toukaBooks,
    label: '灯が保管した紙片を継ぐ',
    description: '町史の破れた三枚を正しい順へ戻す。',
    symbol: '灯',
    kind: 'inspect',
    speaker: '久世 灯',
    portraitSymbol: '灯',
    lines: [
      '三枚を継ぐと、湊が最後まで放送塔に残った理由が読めた。孤立した家の返事を待っていたのだ。',
      '「答えを本に閉じ込めるか、外へ持っていくか。それは読む人が決めることです」',
    ],
    effects: [
      {
        kind: 'advanceSubEvent',
        subEventId: subEventIds.tornHistory,
        stageId: subEventStageIds.historyPiece3,
      },
      { kind: 'completeSubEvent', subEventId: subEventIds.tornHistory },
      trust(characterIds.akari, 3),
      clue(clueIds.evacuationLog),
      journal('journal_d5_akari'),
    ],
  },
  {
    id: 'd5_kanade_testimony',
    day: 5,
    periods: ['evening'],
    locationId: locationIds.yoimachiCafe,
    label: '奏の幼い記憶を聞く',
    description: '十三年前、放送へ返事をしなかった子どもの記憶。',
    symbol: '奏',
    kind: 'talk',
    speaker: '雨宮 奏',
    portraitSymbol: '奏',
    lines: [
      '「返事をしなかったから助かった、って大人は言った。でも、あの声は返事じゃなくて記憶を頼んでたんだと思う」',
      'カセットの裏面には「私信・十三」と湊の筆跡で書かれている。',
    ],
    effects: [
      trust(characterIds.kanade, 3),
      clue(clueIds.cassetteBack),
      journal('journal_d5_kanade'),
    ],
  },
  {
    id: 'd5_intent',
    day: 5,
    periods: ['night'],
    locationId: locationIds.room203,
    label: '真実をどう扱うか考える',
    description: '住民の証言と記録を、机の上で三つに分ける。',
    symbol: '選',
    kind: 'talk',
    speaker: '地の文',
    lines: [
      '真実を町へ公開する。町の中で記憶する。湊本人の望みを探す。どれも正しく、どれも何かを失う。',
    ],
    choices: [
      {
        id: 'intent_public',
        label: '記録を外へも開く',
        tone: 'question',
        effects: [{ kind: 'setFlag', flagId: flagIds.intentPublic, value: true }],
        response: ['紙は閉じておくだけでは、また書き換えられる。複製を作ることにした。'],
      },
      {
        id: 'intent_local',
        label: '町の人と記憶する',
        tone: 'accept',
        effects: [{ kind: 'setFlag', flagId: flagIds.intentLocal, value: true }],
        response: ['記録だけでなく、語る人を残すことにした。'],
      },
      {
        id: 'intent_minato',
        label: '湊の望みを最後まで探す',
        tone: 'distance',
        effects: [
          { kind: 'setFlag', flagId: flagIds.intentMinato, value: true },
          { kind: 'setFlag', flagId: FLAG_IDS.MINATO_WISH_UNDERSTOOD, value: true },
        ],
        response: ['十三番目が何を届けたかったのか、最後の録音まで聞くことにした。'],
      },
    ],
    effects: [
      { kind: 'setFlag', flagId: flagIds.testimonyGathered, value: true },
      completeObjective(objectiveIds.d5Testimony),
      completeObjective(objectiveIds.d5Intent),
    ],
  },

  {
    id: 'd6_changed_board',
    day: 6,
    periods: ['morning'],
    locationId: locationIds.bulletinBoard,
    label: '書き換えられた十二枚を比べる',
    description: '前日と違う箇所を、画鋲跡と日記で確かめる。',
    symbol: '差',
    kind: 'bulletins',
    speaker: '地の文',
    lines: [
      '十二枚は同じ題名のまま、主語だけが少しずつ消えている。「参加者」「住民」「届け先」。',
      '空白だった隙間に、新しい画鋲が一本だけ刺さっている。紙はまだない。',
    ],
    effects: [journal('journal_d6_board_diff')],
  },
  {
    id: 'd6_thirteenth',
    day: 6,
    periods: ['evening'],
    locationId: locationIds.bulletinBoard,
    label: '十三番目の紙を読む',
    description: '「忘れられた方へ。今夜、あなたの名前を返します」',
    symbol: '13',
    kind: 'bulletins',
    speaker: '十三番目の回覧板',
    portraitSymbol: '13',
    lines: [
      '十二枚の隙間に、濡れていない紙が一枚増えている。画鋲は使われず、風にも揺れない。',
      '「忘れられた方へ。今夜、あなたの名前を返します」末尾には、あなたの名前が青いインクで添えられていた。',
    ],
    effects: [
      { kind: 'setFlag', flagId: FLAG_IDS.THIRTEENTH_NOTICE_VISIBLE, value: true },
      { kind: 'readBulletin', bulletinId: bulletinIds.thirteenth, official: false },
      clue(clueIds.thirteenthNotice),
      unlock(locationIds.broadcastHill),
      completeObjective(objectiveIds.d6Notice),
      journal('journal_d6_thirteenth'),
    ],
  },
  {
    id: 'd6_companion',
    day: 6,
    periods: ['night'],
    locationId: locationIds.room203,
    label: '丘へ向かう方法を決める',
    description: '誰かに同行を頼むか、一人で記録を持っていく。',
    symbol: '丘',
    kind: 'talk',
    speaker: '地の文',
    lines: ['放送塔の鍵と、十三枚の紙。明日の丘へ持っていくものを鞄へ入れる。'],
    choices: [
      {
        id: 'ask_companion',
        label: '信頼した住民へ同行を頼む',
        tone: 'accept',
        effects: [
          { kind: 'setFlag', flagId: flagIds.companionAsked, value: true },
          trust(characterIds.ren, 1),
        ],
        response: ['「丘の入口で待つ」短い返事が、四人からそれぞれ届いた。'],
      },
      {
        id: 'go_alone',
        label: '一人で行く',
        tone: 'distance',
        effects: [{ kind: 'setFlag', flagId: flagIds.companionAlone, value: true }],
        response: ['一人で聞くべき声もある。帰る場所だけは、手帳に書き残した。'],
      },
    ],
    effects: [completeObjective(objectiveIds.d6Companion)],
  },

  {
    id: 'd7_prepare',
    day: 7,
    periods: ['morning'],
    locationId: locationIds.room203,
    label: '記録と手紙を鞄へ入れる',
    description: '台帳の写し、町史、録音、未送信の転出届。',
    symbol: '鞄',
    kind: 'inspect',
    speaker: '地の文',
    lines: [
      '机に十五の手掛かりを並べる。どれも単独では真実にならないが、重ねると一人の暮らしが見える。',
      '封筒の底から放送塔の小さな鍵が落ちた。月の形の傷がついている。',
    ],
    effects: [clue(clueIds.towerKey), clue(clueIds.unsentMoveOut), journal('journal_d7_ready')],
  },
  {
    id: 'd7_hill',
    day: 7,
    periods: ['evening'],
    locationId: locationIds.broadcastHill,
    label: '放送塔の丘を登る',
    description: '猫が先を歩き、赤い航空灯が霧の中で明滅する。',
    symbol: '塔',
    kind: 'story',
    speaker: '地の文',
    lines: [
      '丘の古道には、十三年前の豪雨で流された標識が半分だけ残っている。ツキは迷わず塔の扉へ向かった。',
      '扉の鍵穴は、こよみの鍵束から見つかった小鍵と同じ白い傷を持つ。',
    ],
    effects: [
      {
        kind: 'advanceSubEvent',
        subEventId: subEventIds.tsukiCollar,
        stageId: subEventStageIds.tsukiPath,
      },
      { kind: 'completeSubEvent', subEventId: subEventIds.tsukiCollar },
      clue(clueIds.towerKey),
      journal('journal_d7_hill'),
    ],
  },
  {
    id: 'd7_recording',
    day: 7,
    periods: ['night'],
    locationId: locationIds.broadcastHill,
    label: '湊の最後の録音を聞く',
    description: '台帳と放送設備がつながった理由が明かされる。',
    symbol: '声',
    kind: 'story',
    speaker: '星見 湊',
    speakerRole: '最後の録音',
    portraitSymbol: '湊',
    lines: [
      '「台帳の番号を放送先へ変換した。停電で電話が止まっても、家ごとに呼びかけられるように」',
      '「十三番目は、台帳から消えた人のために残した。町を責めるためではなく、誰かが覚えていられるように」',
      '録音が止まると、古いマイクのランプがあなたの返事を待つように灯った。',
    ],
    effects: [
      { kind: 'setFlag', flagId: flagIds.finalRecordingHeard, value: true },
      { kind: 'setFlag', flagId: FLAG_IDS.MINATO_WISH_UNDERSTOOD, value: true },
      completeObjective(objectiveIds.d7Recording),
      journal('journal_d7_recording'),
    ],
  },
  {
    id: 'd7_final_decision',
    day: 7,
    periods: ['night'],
    locationId: locationIds.broadcastHill,
    label: '十三番目の放送を行う',
    description: '真実を町へ返すか、外へ持ち出すか、役目を継ぐか。',
    symbol: '選',
    kind: 'final',
    speaker: 'あなた',
    portraitSymbol: '月',
    lines: [
      'マイクの前に、三枚の原稿を置く。どの言葉も湊を覚えている。違うのは、その記憶をどこへ届けるかだけだ。',
    ],
    choices: [
      {
        id: 'return_name',
        label: '町へ名前を返す',
        tone: 'accept',
        hint: '住民と共に記憶する',
        effects: [{ kind: 'setFinalChoice', value: 'return_name' }],
        response: ['「月影町の皆さんへ。星見湊さんの名前を、町の記録へ返します」'],
      },
      {
        id: 'take_outside',
        label: '記録を外へ持ち出す',
        tone: 'question',
        hint: '町の外にも証拠を残す',
        effects: [{ kind: 'setFinalChoice', value: 'take_outside' }],
        response: ['録音と町史の複製を鞄へ入れ、始発列車の時刻を読む。'],
      },
      {
        id: 'inherit_role',
        label: '十三番目の役目を引き継ぐ',
        tone: 'distance',
        hint: '消えそうな名前へ手紙を届ける',
        effects: [{ kind: 'setFinalChoice', value: 'inherit_role' }],
        response: ['「これからは、私が届けます」マイクのランプが、静かに青へ変わった。'],
      },
    ],
    effects: [
      { kind: 'setFlag', flagId: flagIds.finalDecisionMade, value: true },
      completeObjective(objectiveIds.d7Decision),
    ],
  },
] as const

const beat = (
  day: Day,
  period: TimeOfDay,
  title: string,
  objective: string,
  requiredActionIds: readonly string[],
  blockedMessage: string,
  hints: readonly string[],
  minimumRequired?: number,
): StoryBeat => ({
  day,
  period,
  title,
  objective,
  requiredActionIds,
  blockedMessage,
  hints,
  ...(minimumRequired === undefined ? {} : { minimumRequired }),
})

export const STORY_BEATS: readonly StoryBeat[] = [
  beat(0, 'morning', '転入前', '古い封筒を開き、転入届を記入する', [], '', [
    'タイトルの封蝋を開こう。',
  ]),
  beat(
    0,
    'evening',
    '転入',
    '駅を調べ、役場で転入手続きをする',
    ['d0_station_arrival', 'd0_register'],
    '駅時計を確かめ、町役場で住民票と鍵を受け取ろう。',
    ['駅の時計を調べよう。', '地図から町役場へ移動できる。'],
  ),
  beat(
    0,
    'night',
    '最初の夜',
    '月影荘の郵便受けを確かめる',
    ['d0_mailbox'],
    '月影荘で203号室の郵便受けを開けよう。',
    ['月影荘は通りの北側にある。', '「月影荘」を調べ、郵便受けを開こう。'],
  ),
  beat(
    1,
    'morning',
    '町の挨拶',
    '奏、灯、榊の三人へ挨拶する',
    ['d1_greet_kanade', 'd1_greet_akari', 'd1_greet_ren'],
    '町の三人に挨拶しよう。',
    ['宵待、灯下書房、月影通りを訪ねよう。'],
  ),
  beat(
    1,
    'evening',
    '十二枚',
    '回覧板を読み、白灰の猫を追う',
    ['d1_board', 'd1_cat_errand'],
    '掲示板と月影通りを調べよう。',
    ['町内掲示板には十二枚の紙がある。', '月影通りに白灰の猫がいる。'],
  ),
  beat(
    1,
    'night',
    '差出人不明',
    '自室で差出人不明の手紙を読む',
    ['d1_unknown_letter'],
    '203号室で新しい手紙を読もう。',
    ['日記の手紙タブからも読める。'],
  ),
  beat(
    2,
    'morning',
    '消えた名前',
    '役場の古い台帳を調べる',
    ['d2_ledger'],
    '町役場で古い台帳を見せてもらおう。',
    ['澄へ決めつけずに尋ねると、別の話が聞ける。'],
  ),
  beat(
    2,
    'evening',
    '切り取られた頁',
    '灯下書房で町史を借りる',
    ['d2_history'],
    '灯下書房で十三ページのない町史を調べよう。',
    ['古書店は通りの西側にある。'],
  ),
  beat(
    2,
    'night',
    '二部屋分の幅',
    '自室で記録を比較する',
    ['d2_compare_records'],
    '203号室で住民票、町史、間取りを並べよう。',
    ['自室を調べよう。'],
  ),
  beat(
    3,
    'morning',
    '招待',
    '宵待で夜のカセットについて聞く',
    ['d3_invitation'],
    '喫茶「宵待」で奏に会おう。',
    ['カウンターの下に古いカセットがある。'],
  ),
  beat(
    3,
    'evening',
    '聞こえない放送',
    'カセットの裏面を再生する',
    ['d3_cassette'],
    '宵待で十一時十三分の録音を聞こう。',
    ['放送へどう向き合うかは、価値観で選んでよい。'],
  ),
  beat(
    3,
    'night',
    '十二回のあと',
    '自室で夜の放送を聞く',
    ['d3_night_broadcast'],
    '203号室でチャイムの後を確かめよう。',
    ['音を消していても字幕で全文を読める。'],
  ),
  beat(4, 'morning', '鍵束', 'こよみの鍵束を整理する', ['d4_keys'], '月影荘で204の札を探そう。', [
    '月影荘の管理人、こよみに話しかけよう。',
  ]),
  beat(
    4,
    'evening',
    '204号室',
    '扉跡と郵便受けの二重底を調べる',
    ['d4_door', 'd4_false_bottom'],
    '自室と郵便受けの二箇所を調べよう。',
    ['203号室の壁紙を横から見る。', '小さな鍵は郵便受けに合う。'],
  ),
  beat(
    4,
    'night',
    '未送信',
    '湊の未送信手紙を読む',
    ['d4_unsent'],
    '203号室で二重底から出た手紙を読もう。',
    ['手紙は自室で再読できる。'],
  ),
  beat(
    5,
    'morning',
    'それぞれの記憶・一',
    '澄と榊の証言を聞く',
    ['d5_sumi_testimony', 'd5_ren_testimony'],
    '役場と月影通りで二人の証言を聞こう。',
    ['誰か一人を悪役と決めつけず、動機を比べよう。'],
  ),
  beat(
    5,
    'evening',
    'それぞれの記憶・二',
    '灯と奏の証言を聞く',
    ['d5_akari_testimony', 'd5_kanade_testimony'],
    '灯下書房と宵待で記憶を集めよう。',
    ['町史とカセットは、同じ夜を別の角度から残している。'],
  ),
  beat(
    5,
    'night',
    '真実の行き先',
    '真実をどう扱うか考える',
    ['d5_intent'],
    '203号室で集めた証言を整理しよう。',
    ['公開、町の記憶、湊の望み。正解ではなく価値観で選べる。'],
  ),
  beat(
    6,
    'morning',
    '書き換え',
    '十二枚の差分を確かめる',
    ['d6_changed_board'],
    '町内掲示板で昨日との違いを調べよう。',
    ['題名ではなく、本文の主語が消えている。'],
  ),
  beat(
    6,
    'evening',
    '十三番目',
    '新しく現れた十三番目を読む',
    ['d6_thirteenth'],
    '町内掲示板の不自然な隙間を調べよう。',
    ['十二枚の外側に、番号のない紙がある。'],
  ),
  beat(
    6,
    'night',
    '丘への道',
    '同行者を頼むか決める',
    ['d6_companion'],
    '203号室で明日の準備をしよう。',
    ['一人でも同行者ありでも、最後まで進められる。'],
  ),
  beat(
    7,
    'morning',
    '最後の朝',
    '記録と放送塔の鍵を準備する',
    ['d7_prepare'],
    '203号室で手掛かりを鞄へ入れよう。',
    ['手掛かりは日記で確認できる。'],
  ),
  beat(
    7,
    'evening',
    '放送塔の丘',
    '放送塔へ向かう',
    ['d7_hill'],
    '地図に解放された放送塔の丘へ向かおう。',
    ['猫が古道の入口を知っている。'],
  ),
  beat(
    7,
    'night',
    '最後の放送',
    '最後の録音を聞き、三つの行き先から選ぶ',
    ['d7_recording', 'd7_final_decision'],
    '放送塔で湊の録音を最後まで聞こう。',
    ['録音を聞いた後、マイクを調べる。'],
  ),
] as const

export function getStoryBeat(state: GameState): StoryBeat {
  const current = STORY_BEATS.find(
    (candidate) => candidate.day === state.clock.day && candidate.period === state.clock.period,
  )
  if (current !== undefined) return current
  const fallback = STORY_BEATS[0]
  if (fallback === undefined) throw new Error('Story beat catalog is empty.')
  return fallback
}

export function isStoryActionComplete(state: GameState, actionId: string): boolean {
  return state.flags[actionFlag(actionId)] === true
}

export function getAvailableStoryActions(
  state: GameState,
  locationId: string,
): readonly StoryAction[] {
  return STORY_ACTIONS.filter(
    (action) =>
      action.day === state.clock.day &&
      action.periods.includes(state.clock.period) &&
      action.locationId === locationId &&
      (action.condition === undefined || evaluateCondition(state, action.condition)),
  )
}

export function canAdvanceStory(state: GameState): boolean {
  const current = getStoryBeat(state)
  const completed = current.requiredActionIds.filter((id) =>
    isStoryActionComplete(state, id),
  ).length
  return completed >= (current.minimumRequired ?? current.requiredActionIds.length)
}

export function completeStoryAction(
  state: GameState,
  action: StoryAction,
  choiceEffects: readonly Effect[] = [],
): GameState {
  const next = applyEffects(state, [...action.effects, ...choiceEffects, done(action.id)])
  const withSubEvents =
    (next.stats.completedSubEvents ?? 0) >= 3
      ? applyEffects(next, [
          { kind: 'unlockAchievement', achievementId: ACHIEVEMENT_IDS.TOWN_HELPER },
        ])
      : next
  return withSubEvents
}

export const STORY_ACTION_FLAG_PREFIX = 'story_action:'
