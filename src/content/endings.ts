import { endingIds, flagIds, letterIds, locationIds } from './contentIds'
import type { Ending } from './types'

export const endings = [
  {
    id: endingIds.a,
    code: 'A',
    title: '月影町の住民',
    selectionLabel: '町へ名前を返す',
    conditions: {
      kind: 'all',
      conditions: [
        { kind: 'finalChoice', value: 'return_name' },
        { kind: 'totalTrust', comparison: 'gte', value: 12 },
        { kind: 'flag', flagId: flagIds.minatoWishUnderstood, value: true },
      ],
    },
    priority: 100,
    summary: '湊の名を町の台帳へ戻し、十三番目を止める。主人公は記録を直し続ける住民になる。',
    affirmation: '町の人が自分たちの言葉で湊を語り始め、失敗も助けられた事実も同じ台帳へ戻る。',
    cost: '記録を町だけへ戻すため、外の人へ届く証拠は少ない。主人公も町の責任を担い続ける。',
    scenes: [
      {
        id: 'ledger_restored',
        locationId: locationIds.townHall,
        time: 'morning',
        textBlocks: [
          '澄が青い線を引く。削られた溝を消さず、その上に「星見 湊・不在」と書き直した。',
          '人口表示は1,285で止まる。今度は台帳の合計も、同じ数になった。',
        ],
      },
      {
        id: 'ordinary_memory',
        locationId: locationIds.mainStreet,
        time: 'evening',
        textBlocks: [
          '奏は湊が好きだった飲み物を思い出し、榊は父の日誌を町史の隣へ預けた。',
          '誰も英雄だけの話にしない。雨の日の失敗も、助かった十二軒も一緒に語る。',
        ],
      },
      {
        id: 'resident_note',
        locationId: locationIds.room203,
        time: 'night',
        textBlocks: [
          '住民票の備考に「記録係補佐」。十三番目の放送は鳴らず、郵便受けが一度だけ音を立てる。',
          '澄からの手紙の件名は、「ようこそ、月影町へ」。',
        ],
      },
    ],
    townChanges: [
      '役場台帳へ星見湊の名と旧204区画を復元',
      '夜11時13分の十三番目の放送が停止',
      '町史に豪雨記録と訂正経緯を追補',
      '住民が日常会話で湊の名を自然に使う',
    ],
    finalLetterId: letterIds.endingA,
    residentRecordNote: '記録係補佐。消された行を消し返さず、訂正の経緯とともに保存する。',
  },
  {
    id: endingIds.b,
    code: 'B',
    title: '終点の向こう',
    selectionLabel: '記録を外へ持ち出す',
    conditions: {
      kind: 'all',
      conditions: [
        { kind: 'finalChoice', value: 'take_outside' },
        { kind: 'clueCount', comparison: 'gte', value: 10 },
      ],
    },
    priority: 95,
    summary: '町史の複製と録音を持って始発へ乗る。記録は町の外でも検証できる形になる。',
    affirmation: '町だけの沈黙へ閉じず、湊と豪雨の経緯を複数の場所へ残せる。',
    cost: '主人公が町を離れると人口表示は一人減る。住民は外から向けられる視線も引き受ける。',
    scenes: [
      {
        id: 'copy_at_dawn',
        locationId: locationIds.toukaBooks,
        time: 'morning',
        textBlocks: [
          '灯は原本の切り口まで写した複製を封筒へ入れる。「きれいに直しすぎないで」と言う。',
          '榊の日誌も、命令と後悔の両方が見えるページだけ複写した。',
        ],
      },
      {
        id: 'first_train',
        locationId: locationIds.station,
        time: 'morning',
        textBlocks: [
          '始発がホームへ入る。役場の人口表示は一人減るが、住民票は消されず「転出」と正しく残る。',
          '町が小さくなるまで、放送塔の赤色灯が朝の空に見えている。',
        ],
      },
      {
        id: 'carriage_notice',
        locationId: locationIds.station,
        time: 'morning',
        textBlocks: [
          '車内の回覧板には十二枚。その外側へ、見覚えのある紙が一枚だけ挟まっている。',
          '十三枚目は町へ戻れとは言わない。「読んだ名前まで置いていかなくていい」とある。',
        ],
      },
    ],
    townChanges: [
      '町史複製と放送録音が町外へ渡る',
      '主人公の転出を隠さず台帳へ記録',
      '人口表示は一人減るが記録の総数は増える',
      '十三番目の紙が列車の回覧板へ移る',
    ],
    finalLetterId: letterIds.endingB,
    residentRecordNote: '転出。町史複製・避難放送録音・訂正経緯を外部記録として保管。',
  },
  {
    id: endingIds.c,
    code: 'C',
    title: '十三番目の配達人',
    selectionLabel: '十三番目の役目を引き継ぐ',
    conditions: {
      kind: 'all',
      conditions: [
        { kind: 'finalChoice', value: 'inherit_role' },
        { kind: 'flag', flagId: flagIds.allAnonymousLettersRead, value: true },
        { kind: 'flag', flagId: flagIds.room204RecordRecovered, value: true },
      ],
    },
    priority: 90,
    summary: '放送を月一度の短い私信へ変え、消えそうな名前へ手紙を届ける役目を引き継ぐ。',
    affirmation: '公の記録へすぐ戻せない名前にも、誰か一人へ届く経路を残せる。',
    cost: '役目は主人公の時間と注意を求める。次へ渡す説明を怠れば、同じ危険が繰り返される。',
    scenes: [
      {
        id: 'monthly_private_message',
        locationId: locationIds.broadcastHill,
        time: 'night',
        textBlocks: [
          '十三番の配線だけを残し、台帳からの自動呼出しを外す。放送は月に一度、短い私信になる。',
          '最初の文は自分で書く。「返事はいりません。あなたの名前を預かっています」。',
        ],
      },
      {
        id: 'first_delivery',
        locationId: locationIds.tsukikageHeights,
        time: 'evening',
        textBlocks: [
          'こよみから宛先の薄い封筒を受け取る。ツキは古道でなく、駅と反対の路地へ歩き出す。',
          '届け先は日記にだけ記す。名前は噂でなく、本人へ渡すためのものになった。',
        ],
      },
      {
        id: 'handwritten_title',
        locationId: locationIds.room203,
        time: 'night',
        textBlocks: [
          '机の封筒へ「十三番目の回覧板」と書く。筆跡はもう湊のものではない。',
          '役目を終える日と、次の人へ説明する手順も、同じ紙の裏へ書き添えた。',
        ],
      },
    ],
    townChanges: [
      '台帳と放送設備の自動接続を解除',
      '十三番目を月一度の私信へ限定',
      '自室の机に配達記録と引継手順を設置',
      'クリア後に新しい配達手紙を追加',
    ],
    finalLetterId: letterIds.endingC,
    residentRecordNote: '十三番目の配達人。返事を求めず、宛名の本人へ私信を届ける。',
  },
  {
    id: endingIds.d,
    code: 'D',
    title: '誰も読まなかった紙',
    selectionLabel: '記録が足りないまま町を離れる',
    conditions: { kind: 'always' },
    priority: 0,
    summary: '選んだ方法を支える記録が足りず、主人公は町を離れる。最終日前からやり直せる。',
    affirmation: '知らない重さを持たず離れる自由は守られる。集めた記録と出会いは失われない。',
    cost: '住民票の名前が薄れ、十三番目は未解決のまま残る。町の現在の住民も危険から抜けきれない。',
    scenes: [
      {
        id: 'unread_console',
        locationId: locationIds.broadcastHill,
        time: 'night',
        textBlocks: [
          '押したボタンは動かない。欠けた記録の場所だけ、放送卓の灯りが白く抜けている。',
          '湊の声は責めない。「分からないまま持たなくていい」と、ノイズの奥で途切れた。',
        ],
      },
      {
        id: 'faded_record',
        locationId: locationIds.station,
        time: 'morning',
        textBlocks: [
          '町を離れると、住民票の名前が少し薄くなる。消えてはいないが、読みづらい。',
          '手元の日記には、最終日前へ戻れる時刻と、まだ見ていない場所が残されている。',
        ],
      },
    ],
    townChanges: [
      '十三番目の放送は未解決のまま継続',
      '主人公の住民票は薄れるが削除されない',
      '収集済み記録と人物信頼は保持',
      '最終日前から再開する導線を表示',
    ],
    finalLetterId: letterIds.endingD,
    residentRecordNote: '記録保留。最終日前の保存記録から、未確認資料を再調査できる。',
  },
] as const satisfies readonly Ending[]
