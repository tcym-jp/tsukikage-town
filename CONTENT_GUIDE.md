# コンテンツ追加ガイド

このゲームの人物、章、会話、手紙、回覧板、手掛かり、サブイベント、調査文、エンディング、実績は`src/content/`のTypeScriptデータとして管理します。表示層や3Dシーンへ物語条件を直接埋め込まず、「条件」と「効果」を通してゲーム状態へ反映してください。

## まず知っておく構成

| ファイル                         | 内容                                             |
| -------------------------------- | ------------------------------------------------ |
| `src/content/types.ts`           | すべてのコンテンツ型、条件、効果、ブランド付きID |
| `src/content/contentIds.ts`      | 共有IDの集中定義                                 |
| `src/content/catalog.ts`         | 全データを束ねる唯一のカタログ                   |
| `src/content/locations.ts`       | 9つの場所、解放日、アクセス条件                  |
| `src/content/characters.ts`      | 人物プロフィール、文体、予定、信頼軸             |
| `src/content/chapters.ts`        | Day 0〜7の目的、場面、ヒント、進行条件           |
| `src/content/dialogues.ts`       | ノード式会話と選択肢                             |
| `src/content/letters.ts`         | 到着条件、本文、行動、添付手掛かり、結末差分     |
| `src/content/bulletins.ts`       | 公式12件、条件付き13件目、日別改訂               |
| `src/content/clues.ts`           | 手掛かりと複数の取得経路                         |
| `src/content/subEvents.ts`       | 複数段階のサブイベント                           |
| `src/content/investigations.ts`  | 日・時間・フラグで変わる調査文                   |
| `src/content/endings.ts`         | Ending A〜Dの条件、場面、最後の手紙              |
| `src/content/achievements.ts`    | 表示名、隠し状態、解除条件                       |
| `src/content/narrativeFlags.ts`  | 物語フラグの説明と初期値                         |
| `src/content/validateCatalog.ts` | ID参照、件数、本文、会話グラフの検証             |

実際にプレイヤーが各時間帯で選ぶ行動と進行ゲートは`src/app/storyActions.ts`の`STORY_ACTIONS`と`STORY_BEATS`が担当します。カタログへ文章を追加しただけでは、必ずしも町の調査ボタンへ現れません。プレイ可能な新イベントは両方を接続してください。

## IDの規則

1. 先に`src/content/contentIds.ts`へIDを追加します。
2. `ids.character(...)`、`ids.letter(...)`のように種類ごとのコンストラクターを使います。
3. 保存JSONへ残るため、値は短く、意味が分かるASCIIの`snake_case`を基本にします。
4. 既存IDの文字列は公開後に変更しません。名前や表示文は変更しても、IDは保存データとの契約です。
5. 場所とEndingのIDは`src/game/ids.ts`とも共有します。3D側の別名は`src/app/adapters.ts`で明示変換します。

既存IDをどうしても変更する場合は、同じ変更でセーブのスキーマバージョンとマイグレーション、保存データ参照検証、全カタログ参照、物語アクション、テストを更新してください。単純な検索置換だけでは古いセーブが進行不能になります。

## 条件と効果

コンテンツの表示・分岐は`Condition`、進行への反映は`Effect`で記述します。使用可能な形は`src/content/types.ts`が正本です。

主な条件：

- `always`、`day`、`time`
- `flag`、`trust`、`totalTrust`
- `clue`、`clueCount`
- `letterRead`、`bulletinRead`、`dialogueSeen`、`locationVisited`
- `subEvent`、`objectiveComplete`、`stat`
- `finalChoice`、`endingReached`
- `all`、`any`、`not`

主な効果：

- フラグ設定、信頼加算、手掛かり発見、手紙配達
- サブイベント開始・段階更新・完了
- 目的完了、場所解放、最終選択、統計加算

同じ出来事を何度調べても加算が増え続けないよう、通常は物語アクションの完了フラグか条件で一度だけ適用します。再読可能な文章と、一度だけ発生する状態変更を分けてください。

## 手紙を追加する

1. `contentIds.ts`の`letterIds`へIDを追加します。
2. `letters.ts`へ`Letter`を追加します。
3. `day`と`arrivalCondition`を設定します。`src/app/gameRuntime.ts`は、日付と条件を満たした手紙を決定的に配達します。
4. プレイヤー名を宛名へ入れる場合は、`recipient`に`{{playerName}}`を使用します。
5. 手掛かりを同封する場合は`attachments`へIDを入れ、手掛かり側の`sourceRefs`にもこの手紙を登録します。
6. 手紙を読むこと自体がその時間帯の必須出来事なら、`STORY_ACTIONS`にも`kind: 'letters'`の行動を追加し、`STORY_BEATS.requiredActionIds`へ接続します。
7. 結末後だけ届く手紙は`endingVariant`をEnding IDへ設定し、対応するEndingの`finalLetterId`から参照します。

本文は`bodyBlocks`へ短い段落単位で入れます。差出人の文体を守り、重要情報はほかの会話・調査・回覧板からも得られるようにしてください。

## 回覧板を追加・改訂する

公式番号1〜12と非公式13番は製品上の固定セットです。通常の追加は新番号を増やさず、既存項目の`revisions`へ日付順で改訂を追加してください。

- `status`は`posted`、`amended`、`removed`のいずれかです。
- `changeNote`で紙跡や書き込みを説明し、色だけに頼らず差分を示します。
- 状態で本文を変える場合は`variants`を条件の具体的な順から並べます。
- 13番目は`official: false`、`officialNumber: 13`を維持し、無条件表示にしません。

`validate:content`は、公式1〜12の欠落・重複、13番目の件数、改訂順、空本文を検出します。

## 会話を追加する

1. `dialogueIds`と必要な`DialogueNodeId`を集中定義します。
2. `dialogues.ts`へ会話を追加し、`entryNodeId`から開始するグラフを作ります。
3. `line`ノードは`nextNodeId`と`effects`、`choice`ノードは2件以上の選択肢を持たせます。
4. すべてのノードが入口から到達でき、すべての遷移先が存在することを確認します。
5. 一つの本文は原則80文字程度、検証上限は100文字です。
6. 選択肢は正解当てではなく「受け入れる・確かめる・距離を取る」の価値観差として書きます。
7. UIでその会話を実行する行動が必要なら、`STORY_ACTIONS`へ話者、行、選択肢、効果を追加します。

主要人物には複数の日の会話と価値観選択を用意し、信頼を持つ人物には信頼条件の差分も必要です。

## 手掛かりと調査を追加する

手掛かりは`clues.ts`へ追加し、次を満たします。

- `locationIds`に取得可能な場所を登録する。
- `sourceRefs`を2件以上、かつ会話・調査・手紙・回覧板・サブイベントのうち2媒体以上から登録する。
- `shortFact`は観測した事実、`interpretation`は日記上の仮説として分ける。
- `tags`は`record`、`room-204`、`broadcast`、`family`、`disaster`から選ぶ。

調べる対象の文章は`investigations.ts`へ置きます。条件の厳しい`variants`を先に並べ、どれにも合わない時の`fallbackText`を必ず用意してください。新しい手掛かりを実際の進行へ組み込む場合は、対応する物語アクションの`discoverClue`効果も追加します。

## サブイベントを追加する

1. イベントIDと各段階IDを`contentIds.ts`へ追加します。
2. `subEvents.ts`で開始条件、2段階以上（現行コンテンツは3段階）、各段階の完了条件・効果、完了効果を定義します。
3. 複数の日・場所へまたがる場合、各段階を進める`STORY_ACTIONS`を用意します。
4. 最終的な真相やEnding条件へどう関係するかを`endingRelevance`へ記録します。
5. 中断・再開しても現在段階だけから続けられることをテストします。

## 場所を追加する

場所はカタログだけでなく3D世界との接続が必要です。

1. `contentIds.ts`と、共有が必要なら`src/game/ids.ts`へ同じ保存IDを追加します。
2. `locations.ts`へ説明、座標、開始日、アクセス条件を追加します。
3. `src/world/worldData.ts`へ3D側のエリアと調査半径を追加します。
4. 3D IDとゲームIDが異なる場合は`src/app/adapters.ts`の双方向マップへ追加します。
5. 衝突境界、初期位置、地図ピン、目的地表示、キーボードとタッチの両方を確認します。
6. デスクトップとモバイル、夕方と夜、低画質でスクリーンショットを確認します。

場所の追加はバンドル、構図、移動不能のリスクがあるため、広さより既存エリア内の調査密度を優先してください。

## 章・時間帯・進行ゲートを変更する

現行仕様はDay 0〜7を各1章、朝・夕方・夜の最大23時間帯として扱います。

- 章の物語上の目的・場面・三段階ヒントは`chapters.ts`へ記述します。
- UIに表示する現在目的、必須行動、進行不能理由は`STORY_BEATS`へ記述します。
- 実行可能な行動は`STORY_ACTIONS`へ記述します。
- 必須行動IDは`STORY_BEATS.requiredActionIds`に存在し、同じ日・時間帯で到達できる必要があります。
- 物語シミュレーターが各ゲートを「未完了なら停止、完了後は通過」と検証します。

Day 8以降を追加する場合は、型、時計遷移、セーブスキーマ、シミュレーターの時間帯数、カタログ検証、UI表記まで一つの変更として設計してください。

## エンディングと実績を追加する

製品上のEnding IDは`A`、`B`、`C`、`D`です。A〜Cが主要分岐、Dが条件不足時のフォールバックです。判定はpriority順で、Dは最後の`always`条件を維持します。

各Endingには次が必要です。

- 選択ラベルと到達条件
- 肯定されるものと代償
- 場所・時間・本文からなる場面
- 町の変化
- 結末専用の最後の手紙
- 住民票の備考

主要3分岐を変更したら、`src/app/simulator.ts`の期待条件とUIの最終選択も同時に更新します。実績は隠し条件でも、未解除時に条件を露出しない表示を確認してください。

## 文章・世界観チェック

- 主事件の原因と人物の動機は回収し、怪異か反響かだけを断定しすぎない。
- 説明台詞を連続させず、日常会話、紙、数字、記憶のずれから違和感を見せる。
- 同じ重要情報へ最低2経路を用意する。
- どの結末にも肯定と代償を持たせる。
- 主人公を選ばれし者にせず、住民がプレイヤー不在でも暮らしていると感じられる文章にする。
- 日本語本文を画像へ焼き込まない。重要な音声・放送には同内容のテキストを用意する。
- 権利不明の文章、画像、音声、モデル、フォントを追加しない。

## 変更後の検証

最低限、次をすべて実行します。

```bash
npm run validate:content
npm run simulate:story
npm run lint
npm run typecheck
npm run test
npm run build
```

プレイ可能な進行を変えた場合は、さらに`npm run test:e2e`を実行し、デスクトップとモバイルの実画面で対象時間帯を確認します。文章が長くなった画面は、会話、手紙、回覧板、日記のスクロールと200%ズームも点検してください。

`validate:content`が現在守る製品下限は、9場所、6人の名前付き人物、Day 0〜7の8章、8通以上の本編手紙、公式12回覧＋条件付き13番、15手掛かり、4サブイベント、Ending A〜D、6件以上の実績です。警告も内容を確認し、参照エラーや到達不能ノードを無視して公開しないでください。
