# 実装計画・進捗

> `PRODUCT_SPEC.md`を製品仕様、`AGENTS.md`を開発規則、`ACCEPTANCE_TESTS.md`を完成判定として扱う。各マイルストーンは実装、品質コマンド、実ブラウザ確認、デスクトップ/モバイル撮影、文書更新までを含めて完了とする。

## 現在地

- 状態：公開候補完成。必須機能・受入条件・品質改善ループを完了
- 現在のマイルストーン：M9 完了
- 最終更新：2026-07-15（JST）
- 最終E2E：22/22 passed（desktop-chrome 19、mobile-chrome 3、skip 0、fail 0、3.8分）
- 最終コミット：`FINAL_COMMIT_PENDING`
- 再開コマンド：`npm ci && npm run quality && npm run test:e2e`

## 初期調査（2026-07-15）

- 配布ZIPには仕様・計画・記録のみがあり、既存コード、Git履歴、未コミット変更はなかった。
- Node.js `v22.22.2`、npm/npx `10.9.7`、Git `2.52.0.windows.1`、Chrome 149、Edge 150を確認した。
- GitHub CLIは未導入。既存のGit Credential Manager認証を用い、GitHub REST APIで`tcym-jp/tsukikage-town`を作成し、通常のGit remoteを設定した。
- React 19 + TypeScript + Vite、Three.js / React Three Fiber、Zod、Vitest、Testing Library、Playwrightを採用した。
- バックエンド、ログイン、外部API、外部素材を使わない静的SPAとし、Cloudflare Pagesのルート配信を対象にした。

## マイルストーン

### M0：環境と品質基盤 ✅ 2026-07-15

- [x] 仕様7文書・配布README・環境・既存状態を調査
- [x] Vite/React/TypeScript初期化、Git初期化、`.gitignore`
- [x] ESLint / Prettier / Vitest / Playwright / content validation基盤
- [x] `lint` / `typecheck` / `test` / `build` / `quality`スクリプト
- [x] Cloudflare Pages向け静的SPAの骨格
- 受入：依存を再現でき、空でない初期画面を表示し、全品質コマンドを実行できる。
- 検証：`npm run lint && npm run typecheck && npm run test && npm run build && npm run quality`
- 結果：PC 1366×768、モバイル390×844で初期表示とコンソールを確認し、以後の自動検証基盤を確立した。

### M1：状態・イベント・セーブ ✅ 2026-07-15

- [x] 型付きID、ゲーム/設定状態、Zodスキーマ
- [x] Day 0〜7・朝/夕/夜の遷移と進行ゲート
- [x] 条件/効果エンジン、会話、クエスト、手掛かり、実績
- [x] localStorage自動/手動セーブ、直前バックアップ、破損復旧
- [x] v0→v1マイグレーション、JSON書出・読込、不正JSON拒否
- [x] 二段階初期化と保存設定
- [x] コンテンツ参照・製品下限・結末到達性の整合性検証
- 受入：初期状態、進行、分岐、セーブ往復、移行、破損復旧を表示層なしでも検証できる。
- 検証：`npm run test && npm run validate:content && npm run simulate:story && npm run typecheck`
- 結果：23時間帯・31行動・15手掛かりを通し、A/B/C到達、周回記録保持、保存往復を確認した。

### M2：タイトル・転入・基本UI ✅ 2026-07-15

- [x] 封筒を開くタイトル、はじめから/つづきから/記録/設定
- [x] 1〜12文字・Unicode対応・HTML無害化の転入届
- [x] 名前、住所、住民番号、転入日、備考、印章を含む住民票
- [x] 音量、文字速度、自動送り、モーション、画質、文字サイズ設定
- [x] 共通ダイアログ、フォーカストラップ、ローディング、エラー境界
- 受入：キーボード/タッチで転入し、名前を住民票・会話・手紙へ安全に反映できる。
- 検証：UI unit/component、転入E2E、200%ズーム、PC/モバイル実画面。
- 結果：タイトルからDay 0へ入り、住民票を受け取り、保存済み端末では続きから再開できる。

### M3：3Dハブと移動 ✅ 2026-07-15

- [x] 低ポリゴン/2.5Dの密度ある町と9エリア
- [x] プレイヤー、境界、建物コライダー、調査範囲
- [x] 斜め上追従カメラ、夕/夜、街灯、窓、掲示物、猫、遠景電車
- [x] WASD/矢印、仮想スティック、タッチ調査
- [x] 自動/低/中/高画質、DPR上限、非表示タブ抑制
- [x] WebGLフォールバックと3Dコード分割読込
- 受入：PC/モバイルで移動・調査でき、壁抜け、操作不能、重大なカメラ事故がない。
- 検証：movement/collision/input/quality/WebGL unit、PC/モバイルE2E、5ビューポート。
- 結果：9地点をゲーム/コンテンツ/3D間の明示アダプターで統合し、夕方・夜・低画質を実機相当表示で確認した。

### M4：場所・会話・調査 ✅ 2026-07-15

- [x] 駅、役場、通り、掲示板、灯下書房、宵待、月影荘、自室、放送塔
- [x] 御影澄、久世灯、雨宮奏、榊蓮、月白こよみ、星見湊、猫ツキ
- [x] データ駆動会話、選択肢、履歴、速度、自動送り、信頼度
- [x] 日/時間/フラグ別調査と手掛かり記録
- [x] 地図、日記（目的/出来事/人物/手掛かり/収集/段階ヒント）
- 受入：6名以上と会話でき、調査結果を記録し、次の行動を常に確認できる。
- 検証：ゲーム/UI unit、コンテンツ整合性、会話選択/日記/地図E2E。
- 結果：会話選択が信頼とフラグへ反映され、進行ゲートと段階ヒントが行き詰まりを防ぐ。

### M5：手紙・掲示板・回覧板 ✅ 2026-07-15

- [x] 自室、郵便受け、新着/未読/再読、条件付き行動
- [x] 本編8通以上と結末差分、差出人/宛名/日付/件名/本文
- [x] 日ごとに追加・剥離・改変される公式12項目
- [x] 条件前12件、条件後に現れる十三番目
- [x] 紙跡、注記、状態文による色以外の差分表現
- 受入：手紙と公式12件＋条件付き13件目をデータ駆動で表示し、収集記録へ反映できる。
- 検証：content/UI unit、12→13件E2E、長文/スクロール/読み上げ順の実画面確認。
- 結果：Day 6の条件前後を実UIで比較し、十三番目の出現と本文、回覧差分を確認した。

### M6：7日間・サブイベント・結末 ✅ 2026-07-15

- [x] Day 0〜7の必須イベント、NPC/手紙/掲示板/目的更新
- [x] 15手掛かりと4サブイベント
- [x] 放送塔最終選択とEnding A/B/C、条件不足時のD
- [x] 結末別の町、最後の手紙、記録、収集状況、演出スキップ
- [x] 最終日前から再開、新規開始、周回メタ保持
- [x] 真のDay 7最終選択からA/B/Cへ到達するブラウザE2E
- 受入：Day 0からDay 7まで進行不能なくつながり、実UIでA/B/Cへ到達できる。
- 検証：`npm run simulate:story`、Ending A/B/C/D unit、Day 7 A/B/C E2E。
- 結果：ヘッドレス到達性だけでなく、放送塔の録音と三択を操作して各結末・記録更新を確認した。

### M7：音・演出・PWA ✅ 2026-07-15

- [x] Web Audio生成の環境音/BGM/効果音、字幕、ミュート、自動再生制限
- [x] 朝/夕/夜の空、街灯、窓、封筒/紙/放送演出、モーション軽減
- [x] Manifest、192/512/マスカブルアイコン、Service Worker
- [x] 更新案内、オフライン案内、保存記録のオフライン再開
- [x] SPAフォールバック、OGP、robots、sitemap、privacy、セキュリティヘッダー
- [x] WebGL/セーブ/音声/アセット/予期しないエラーの案内
- 受入：静的ビルド/PWA要件を満たし、初回オンライン訪問後にオフラインでタイトルと保存記録を開ける。
- 検証：`npm run build && npm run test:pwa`、Service Workerを使うオフラインE2E、モーション軽減E2E。
- 結果：Cloudflare Pagesへ配置可能な`dist/`を生成し、オフライン再読込と端末内セーブ閲覧を確認した。

### M8：E2E・性能・アクセシビリティ ✅ 2026-07-15

- [x] 受入15シナリオをPlaywrightで追跡
- [x] Desktop Chrome / Mobile Chromeの主要フロー
- [x] UX仕様12画面×desktop/mobileの最終スクリーンショット
- [x] 360×800、390×844、768×1024、1366×768、1920×1080
- [x] Tab順、フォーカストラップ、Escape/Enter/Space、ARIA、44px、200%ズーム
- [x] モーション軽減、低画質、DPR、遅延3D読込、非表示タブ制御
- [x] console.error / pageerror監視、axe serious/critical 0
- 受入：主要E2Eが成功し、Critical/High/進行不能/致命的コンソールエラーが0。
- 検証：`npm run quality && npm run test:e2e && npm run test:e2e:mobile && npm run audit:a11y`
- 結果：22/22 passed（desktop 19、mobile 3、skip/fail 0）。axe 1/1、オフライン1/1、5ビューポート、真のDay 7 A/B/C、desktop/mobile各12画像を確認した。

### M9：磨き込み・最終化・GitHub ✅ 2026-07-15

- [x] 10品質軸を採点し、最低軸を改善する反復ループ
- [x] 全軸85点以上、Critical/High 0、必須検証成功
- [x] デスクトップの調査プロンプト二重表示を解消
- [x] モバイルHUD、回覧板、記録画面の収まりと情報密度を改善
- [x] README、Cloudflare Pages手順、コンテンツ追加ガイド、依存/ライセンス
- [x] `PLAN.md`、`DOCUMENTATION.md`、受入チェック、既知問題、デモ手順を最終化
- [x] Git差分、履歴、機密、依存を確認し、tcym-jp新規リポジトリへ引き渡せる状態を作成
- 受入：第三者がREADMEだけで起動、テスト、ビルドでき、静的公開可否を判断できる。
- 検証：`npm ci && npm run quality && npm run test:e2e && npm audit --audit-level=high && git status -sb`
- 結果：公開候補完成。クリーンな`npm ci`、本番依存ツリー、配布ライセンス、静的buildを再確認。本番Cloudflareデプロイは制約どおり実行せず、設定と手順まで提供した。最終コミットは`FINAL_COMMIT_PENDING`。

## 品質改善ループの完了条件

- [x] 全品質コマンドとE2Eを実行
- [x] デスクトップ/モバイル主要12画面を目視
- [x] 完成度、初見理解、操作、視覚、物語、モバイル、性能、A11y、テスト、保守性を採点
- [x] 最低軸を選び、改善し、全検証を再実行
- [x] 全軸85点以上
- [x] Critical 0 / High 0 / 進行不能 0

## 解消・緩和した主要リスク

- 3D初期バンドル：`WorldScene`を遅延読込し、画質段階とDPR上限を実装。
- 7日分の分岐漏れ：カタログ参照検証、23期間シミュレータ、実UIのDay 7 A/B/Cで検出。
- localStorage破損：Zod、schemaVersion、直前バックアップ、旧版移行、JSON検証で復旧。
- モバイル操作/レイアウト：単純コライダー、仮想スティック、低画質、5ビューポート、12画面撮影で確認。
- PWA更新/オフライン：Service Worker更新通知とオンライン初回後のオフラインE2Eで確認。

## 意図的に実行していないこと

- Cloudflare Pages本番デプロイ、課金、ログイン、バックエンド、外部API、force pushは実行していない。
- 写真モード、季節差分、管理画面、マルチプレイは製品スコープ外として追加していない。

## 最終チェック

- [x] `PRODUCT_SPEC.md`全成果物
- [x] `ACCEPTANCE_TESTS.md`全必須項目
- [x] 7日間とEnding A/B/C/D
- [x] PC・モバイル3D操作
- [x] セーブ・移行・破損復旧・JSON入出力
- [x] PWA・静的ビルド・Cloudflare Pages手順
- [x] 単体/コンポーネント/E2E/コンテンツ整合性
- [x] desktop/mobile主要12スクリーンショット
- [x] 5指定ビューポート
- [x] README・追加ガイド・依存/ライセンス
- [x] `DOCUMENTATION.md`最終報告、既知問題、デモ、Git/デプロイ状態
