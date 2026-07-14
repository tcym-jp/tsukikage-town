# 実装記録・運用資料

> 本文書は長時間作業の外部記憶兼、公開候補の最終報告である。製品仕様は`PRODUCT_SPEC.md`、完成判定は`ACCEPTANCE_TESTS.md`を正とする。

## 現在の状態

- 状態：公開候補完成
- マイルストーン：M0〜M9完了
- 最終更新：2026-07-15（JST）
- 必須機能：実装済み
- Critical / Highバグ：0 / 0
- 進行不能：0
- ビルド：成功。Cloudflare Pagesへ静的配置可能な`dist/`を生成
- 最終E2E：22/22 passed（desktop-chrome 19、mobile-chrome 3、skip 0、fail 0、3.8分）
- 実装基準コミット：`6aed8c975477`
- 本番デプロイ：未実行。明示制約どおり手順と成果物まで

## 完成した製品

「月影町 ― 十三番目の回覧板」は、ブラウザだけで最後まで遊べる2.5D探索アドベンチャーとして完成した。

### 主要体験

- 封筒を開くタイトルから転入届を提出し、住民票と月影荘203号室を受け取る。
- Day 0の到着からDay 7の放送塔まで、朝・夕方・夜の23時間帯を進む。
- 低ポリゴンの町をPCではWASD/矢印、モバイルでは仮想スティックと調査ボタンで探索する。
- 駅、役場、月影通り、掲示板、灯下書房、宵待、月影荘、自室、放送塔の9地点を訪れる。
- 御影澄、久世灯、雨宮奏、榊蓮、月白こよみ、星見湊、猫ツキの記憶をたどる。
- 会話、選択肢、履歴、段階ヒント、地図、日記、人物、手掛かり、収集記録を利用する。
- 本編8通以上の手紙、公式12項目と条件付き十三番目の回覧、15手掛かり、4サブイベントを収集する。
- Day 7夜に三つの選択を行い、Ending A/B/Cへ到達する。条件不足時にはEnding Dへ安全に着地する。
- 結末後は最後の手紙、町の変化、収集状況、実績、最終日前からの再開を確認できる。

### 保存と端末内データ

- 自動保存、手動保存、リロード再開、続きからを実装。
- `schemaVersion`付きZodスキーマ、直前正常バックアップ、破損自動保存からの復旧を実装。
- v0からv1への移行、UTF-8 JSON書出・読込、不正JSON拒否を実装。
- Day 7朝の専用スナップショットと周回メタを分離し、最終日前から戻っても到達結末を保持。
- 確認語句を要求する二段階初期化を実装。
- 名前、セーブ、設定は同一オリジンのlocalStorageだけへ保存し、外部送信しない。

### PWAと静的公開

- Manifest、192px/512px/マスカブルアイコン、OG画像、Service Worker、更新通知、オフライン案内を同梱。
- 初回オンライン訪問後、オフライン再読込してタイトルと保存済み記録を閲覧できることをE2Eで確認。
- `public/_redirects`でSPAフォールバック、`public/_headers`でCSPとキャッシュ方針を設定。
- robots、sitemap、privacy、offlineページを同梱。
- Viteの`dist/`をCloudflare PagesのBuild output directoryとして公開できる。

## 実装構成

| 領域                  | 役割                                                           |
| --------------------- | -------------------------------------------------------------- |
| `src/app/`            | 画面統合、物語アクション、全日シミュレーター、各IDアダプター   |
| `src/game/`           | 状態、条件/効果、時間、会話、クエスト、実績、結末、セーブ      |
| `src/content/`        | 人物、章、手紙、回覧板、調査、手掛かり、結末の型付きデータ     |
| `src/world/`          | 低ポリゴンの町、入力、移動、衝突、調査、カメラ、画質、WebGL    |
| `src/ui/`             | タイトル、転入届、住民票、会話、手紙、回覧板、日記、記録、設定 |
| `src/audio/`          | Web Audio APIだけで生成する環境音と効果音                      |
| `src/pwa/`, `public/` | Service Worker登録、Manifest、アイコン、静的公開設定           |
| `scripts/`            | コンテンツ整合性、物語到達性、コード生成画像、ライセンス集約   |
| `e2e/`                | 受入、レスポンシブ、a11y、PWA、保存、結末、視覚撮影            |

重要なゲームロジックは3D表示層から分離されており、物語全体とEnding A/B/CをWebGLなしでシミュレーションできる。3D側のhyphen IDとゲーム/コンテンツ側IDは9件の明示アダプターで変換し、セーブへ表示層IDを混在させない。

## 主要な設計判断

| 判断                                           | 理由                                                 | 結果                                          |
| ---------------------------------------------- | ---------------------------------------------------- | --------------------------------------------- |
| 静的SPA + localStorage                         | Cloudflare Pages、バックエンド禁止、プライバシー要件 | サーバー、ログイン、秘密情報送信なし          |
| React/TypeScript/Vite + R3F                    | 2.5D表現、型安全、UI/E2E検証を両立                   | 町と紙UIを同一SPAへ統合                       |
| 条件/効果とデータ駆動コンテンツ                | 7日分の分岐を表示層から検証可能にする                | 23期間・31行動を自動シミュレーション          |
| Ending条件は`src/content/endings.ts`を正とする | 閾値の二重定義を避ける                               | UI、unit、シミュレーター、E2Eが同じ規則を使用 |
| `WorldScene`を遅延読込                         | タイトル/転入届の初期表示を3Dバンドルから守る        | 3Dを別chunkへ分離                             |
| 低ポリゴンと単純コライダー                     | モバイルでの安定操作を優先                           | 画質段階、DPR上限、WebGL案内を実装            |
| Day 7専用スナップショット                      | Ending周回時に記録を失わない                         | 最終日前再開と結末メタを両立                  |
| CSS/プリミティブ/Web Audioの自作素材           | 権利不明素材を避ける                                 | 外部画像、音声、3Dモデル、Webフォントなし     |
| Cloudflare本番公開を実行しない                 | ユーザーの不可逆操作制約                             | 公開可能な成果物と手順まで提供                |

## 起動・検証・ビルド

Node.js 22.12以上を使用する。

```bash
npm ci
npm run dev
```

開発サーバーの表示URLをブラウザで開く。公開候補の全品質確認は次の順で行う。

```bash
npm run quality
npm run simulate:story
npm run test:pwa
npm run test:e2e
npm run audit:a11y
npm run build
```

静的成果物の確認は次で行う。

```bash
npm run preview
```

## 検証結果

| 検証                       | 結果         | 根拠                                                            |
| -------------------------- | ------------ | --------------------------------------------------------------- |
| `npm run lint`             | 成功         | ESLint warning/error 0                                          |
| `npm run typecheck`        | 成功         | TypeScript project build成功                                    |
| `npm run test`             | 115/115成功  | game/content/world/UI/audio/PWAのunit/component成功             |
| `npm run validate:content` | 成功         | errors 0 / warnings 0、製品下限と全参照を確認                   |
| `npm run simulate:story`   | 成功         | 23期間、31行動、15手掛かり、A/B/C、周回記録、save往復           |
| `npm run test:pwa`         | 成功         | Manifest、アイコン、SW、公開ファイルを検証                      |
| `npm run build`            | 成功         | Vite production build、静的`dist/`生成                          |
| Playwright最終集計         | 22/22 passed | desktop 19、mobile 3、skip/fail 0、3.8分                        |
| クリーン再現               | 成功         | `npm ci`、production tree extraneous 0、audit脆弱性0            |
| 真のDay 7 A/B/C            | 成功         | 保存済み結末表示だけでなく、録音→最終三択→結末を実UIで操作      |
| PWAオフライン              | 成功         | 初回オンライン→Service Worker制御→オフライン再読込→保存記録閲覧 |
| アクセシビリティ           | 成功         | axe serious/critical 0、キーボード、focus trap、Escape、ARIA    |
| レスポンシブ               | 成功         | 360×800、390×844、768×1024、1366×768、1920×1080                 |
| 視覚確認                   | 成功         | desktop/mobile各12画面、コンソール/pageerror監視                |

### E2E受入の追跡

1. 新規開始からDay 1：タイトル、転入届、住民票、駅、役場、郵便受け、時間進行。
2. セーブとリロード：自動保存、続きから、バックアップ復旧。
3. 手紙：到着、未読、本文、再読。
4. 会話選択：選択後の信頼度と物語フラグ。
5. 日付進行：必須ゲート、Day 6夜からDay 7朝、専用スナップショット。
6. 十三番目：条件前12件、条件後13件を同じUIで比較。
7. Ending A：Day 7放送塔の実際の最終選択から到達。
8. Ending B：Day 7放送塔の実際の最終選択から到達。
9. Ending C：Day 7放送塔の実際の最終選択から到達。
10. JSON：UIから書出し、空の端末へ読込、最終日前再開。
11. モバイル：縦画面タッチ移動/調査、横画面HUD。
12. キーボード：WASD、E、M、J、Escape。
13. モーション軽減：OS設定とゲーム設定を反映。
14. 低画質：3D品質属性と操作継続。
15. 破損復旧：壊れた自動保存から直前バックアップへ復帰。

## スクリーンショット

UX仕様の12画面を1366×768と390×844で保存した。PNGはCSS viewport scaleで記録している。

| 画面           | デスクトップ                                        | モバイル                                           |
| -------------- | --------------------------------------------------- | -------------------------------------------------- |
| タイトル       | `artifacts/screenshots/desktop/title.png`           | `artifacts/screenshots/mobile/title.png`           |
| 転入届         | `artifacts/screenshots/desktop/transfer.png`        | `artifacts/screenshots/mobile/transfer.png`        |
| 夕方の月影通り | `artifacts/screenshots/desktop/street-evening.png`  | `artifacts/screenshots/mobile/street-evening.png`  |
| 夜の月影荘     | `artifacts/screenshots/desktop/apartment-night.png` | `artifacts/screenshots/mobile/apartment-night.png` |
| 会話           | `artifacts/screenshots/desktop/dialogue.png`        | `artifacts/screenshots/mobile/dialogue.png`        |
| 手紙           | `artifacts/screenshots/desktop/letter.png`          | `artifacts/screenshots/mobile/letter.png`          |
| 回覧板         | `artifacts/screenshots/desktop/bulletin.png`        | `artifacts/screenshots/mobile/bulletin.png`        |
| 日記           | `artifacts/screenshots/desktop/journal.png`         | `artifacts/screenshots/mobile/journal.png`         |
| 放送塔         | `artifacts/screenshots/desktop/tower.png`           | `artifacts/screenshots/mobile/tower.png`           |
| エンディング   | `artifacts/screenshots/desktop/ending.png`          | `artifacts/screenshots/mobile/ending.png`          |
| 設定           | `artifacts/screenshots/desktop/settings.png`        | `artifacts/screenshots/mobile/settings.png`        |
| 記録           | `artifacts/screenshots/desktop/records.png`         | `artifacts/screenshots/mobile/records.png`         |

最終目視では文字切れ、画面外操作、重大な重なり、ローディング停止、致命的コンソールエラーを認めなかった。改善過程でデスクトップの調査プロンプト二重表示、モバイルHUDと回覧板の横方向の収まり、記録画面の情報密度を修正し、対象画像を再撮影した。

## 品質改善ループ

各回で最低点の軸を一つ選び、修正後に品質コマンド、対象E2E、desktop/mobile実画面を再確認した。

|               回 | 完成度 | 初見理解 | 操作性 | 視覚 | 物語 | モバイル | 性能 | A11y | テスト | 保守性 | 最低軸と改善                                                           |
| ---------------: | -----: | -------: | -----: | ---: | ---: | -------: | ---: | ---: | -----: | -----: | ---------------------------------------------------------------------- |
|       0 統合直後 |     87 |       84 |     83 |   82 |   92 |       79 |   85 |   83 |     86 |     89 | モバイル：HUD/操作/大型ダイアログの競合を修正                          |
|     1 UI再配置後 |     90 |       87 |     89 |   86 |   93 |       87 |   86 |   84 |     88 |     90 | A11y：focus trap、Escape、44px、200%ズーム、axeを補強                  |
|     2 受入補強後 |     92 |       90 |     91 |   89 |   94 |       89 |   88 |   91 |     92 |     91 | 性能：3D遅延読込、DPR/画質、描画待ちと非表示タブ制御を確認             |
| 3 最終視覚/E2E後 |     94 |       92 |     93 |   92 |   95 |       91 |   89 |   93 |     95 |     93 | 最低89。二重プロンプト、回覧/記録レイアウト、真のDay 7 A/B/Cを最終改善 |

最終判定：全10軸85点以上、Critical 0、High 0、進行不能0。新機能の追加ではなく、初見導線、画面内収まり、物語理解、テスト信頼性を優先して改善した。

## 性能・アクセシビリティ

- 3D本体を遅延chunkへ分離し、タイトルと転入届を先に表示する。
- 自動/低/中/高画質、DPR上限、粒子/影/アンチエイリアス調整を実装。
- 非表示タブではThree.jsのframe loopを停止する。
- WebGLが使えない場合は一般ユーザー向けの説明と再読み込みを表示する。
- すべての物語情報を文字でも提供し、音量0でも欠落しない。
- HTML UIはキーボード操作、明瞭なfocus ring、フォーカストラップ、Escape閉じ、ARIAラベルに対応。
- モーション軽減はOS設定とゲーム設定の論理和で適用する。
- 5ビューポートとフォント最大設定で横スクロール、ダイアログ、閉じる操作を検証した。

## セキュリティ・プライバシー

- バックエンド、ログイン、広告、課金、外部API、解析SDKを使用しない。
- プレイヤー名をReactテキストとして描画し、HTMLとして挿入しない。
- セーブインポートは2 MBを上限とし、Zodとカタログ参照で検証する。不正データでは現在記録を置換しない。
- CSPなどの静的セキュリティヘッダーを`public/_headers`へ定義。
- 個人情報や秘密情報を外部送信しない。保存はブラウザの同一オリジン内だけ。

## 素材・依存・ライセンス

- 画面背景、紙、封筒、回覧、街並みはCSS、SVG相当のコード表現、Three.jsプリミティブで自作。
- BGM/環境音/効果音はWeb Audio APIで実行時生成。
- PWAアイコンとOG画像は同梱スクリプトで生成。
- 外部の画像、音声、3Dモデル、Webフォントは使用していない。
- 製品コードと文章はMIT License。npm依存の名称、版、ライセンスは`THIRD_PARTY_NOTICES.md`へ記録し、本番依存74パッケージのライセンス本文・著作権表示を`public/THIRD_PARTY_LICENSES.txt`へ同梱。
- コンテンツ追加規則は`CONTENT_GUIDE.md`、開発手順は`CONTRIBUTING.md`、セキュリティ方針は`SECURITY.md`に記載。

## Cloudflare Pages公開手順

1. GitHubの対象リポジトリをCloudflare Pagesへ接続する。
2. Framework presetをViteにする。
3. Build commandを`npm run build`にする。
4. Build output directoryを`dist`にする。
5. `NODE_VERSION=22.22.2`を指定する。
6. 実URLが既定値と異なる場合はrobots、sitemap、canonical、OGP URLを置換する。
7. Previewで新規開始、続きから、直接URL、リロード、モバイル、SNSカード、オンライン初回後のオフライン再訪を確認する。
8. 問題がない場合にだけ、本番ブランチを公開する。

本作業では本番デプロイを実行していない。静的ビルド、SPAフォールバック、PWA、公開手順までを検証済みであり、デプロイ可否は「可」である。

## Git状態

- ブランチ：`main`
- リポジトリ：既存履歴のない新規プロジェクトとして初期化
- 実装基準コミット：`6aed8c975477`
- force push、履歴破壊、本番デプロイ、秘密情報の追加：なし
- GitHub：`https://github.com/tcym-jp/tsukikage-town`。最新の公開コミットはGitHub `main`を正とする

## 既知のLow/制約

Critical/Highの既知問題はない。以下は公開を妨げないLowまたは意図した制約である。

| 重大度 | 内容                                                            | 影響と回避                                                                |
| ------ | --------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Low    | 初回3D読込は低性能端末でshader準備に短い待ちが出る場合がある    | 紙調ローディングを表示。設定の低画質で負荷を下げられる                    |
| Low    | WebGL無効環境には完全な2D探索代替がない                         | 対応案内と再読み込みを表示。一般的なChrome/Safari/EdgeのWebGLを対象とする |
| Info   | セーブはオリジンごとの端末内保存                                | JSON書出・読込で手動移送できる。クラウド同期は仕様外                      |
| Info   | PWAインストールUI、音声許可、ストレージ永続性はブラウザ差がある | 音なしでも情報欠落なし。初回操作後に音を開始                              |
| Info   | ルート配信を前提とし、GitHub Pages等のサブパスは初期設定外      | Vite base、Manifest、Service Worker URLを変更すれば対応可能               |

## デモ手順

1. `npm ci && npm run dev`を実行し、表示URLを開く。
2. タイトルの封筒を開き、「はじめから」を選ぶ。
3. 転入届へ名前を入力し、住民票と203号室を確認する。
4. 地図または3Dで駅と役場を訪れ、転入の夕方を終える。
5. 月影荘の郵便受けを調べ、204号室宛の手紙を読む。
6. 日記の目的と段階ヒントに従い、Day 1〜5で住民の証言、町史、録音、鍵、手紙を集める。
7. Day 6の掲示板で十二枚の差分と十三番目を読む。
8. Day 7に放送塔へ行き、湊の最後の録音を聞く。
9. 「町へ名前を返す」「外へ持ち出す」「役目を引き継ぐ」のいずれかを選ぶ。
10. 結末、最後の手紙、町の記録を確認し、「最終日前から」で別分岐を試す。
11. 設定から手動保存、JSON書出・読込、音なし、低画質を確認する。
12. リロードし、「つづきから」で同じ進行へ戻る。

## 再開点

必須実装は完了しており、開発上の未完了地点はない。公開前または将来の変更後は次から再開する。

```bash
npm ci
npm run quality
npm run simulate:story
npm run test:e2e
npm run build
git status -sb
```

障害が出た場合は`PRODUCT_SPEC.md`、`ACCEPTANCE_TESTS.md`、本書、`PLAN.md`を読み直し、失敗した最上位要件から修正する。テストを通すために要件を無効化しない。

## 最終報告

- 実装：必須機能すべて完了。Day 0〜7、9地点、3D探索、転入届、住民票、自室/郵便受け、会話、手紙、掲示板/回覧板、セーブ、PWA、Ending A/B/C/Dを実装
- 未実装：製品仕様上の必須項目なし。写真モード、季節差分、管理画面、マルチプレイ等は意図的にスコープ外
- 検証：lint、typecheck、unit/component、content、story、PWA、build、desktop/mobile E2E、offline、a11y、5 viewport、各12画像を成功確認
- デプロイ可否：可。Cloudflare Pages向け静的成果物と公開手順あり。本番デプロイ自体は未実行
- 既知問題：Critical 0 / High 0。Low/ブラウザ依存の制約は上記のとおり
- Git：`main`、実装基準コミット`6aed8c975477`。文書自身のhashを埋め込む自己参照を避け、最新HEADはGitHub `main`を正とする
- 最終E2E：22/22 passed（desktop 19 / mobile 3、skip 0、fail 0）
