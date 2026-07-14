# 月影町 ― 十三番目の回覧板

夕暮れの架空の町へ転入し、住民の会話、手紙、掲示板、回覧板をたどって「存在しない十三番目のお知らせ」の謎を追う、静的配信対応の2.5D探索アドベンチャーです。戦闘、ジャンプスケア、ログイン、広告、外部APIはありません。

Day 0からDay 7までの物語、9つの場所、3つの主要エンディングとフォールバック結末、端末内セーブ、PWAを収録しています。入力した名前と進行記録はブラウザ内にだけ保存されます。

## 必要環境

- Node.js `^20.19.0` または `>=22.12.0`（Node.js 22 LTS推奨）
- npm
- WebGLと`localStorage`を利用できる現行ブラウザ

自動ブラウザテストの対象は、デスクトップChromium（1366×768）とモバイルChromium（390×844）です。ほかの現行ブラウザでも標準Web APIだけで動く構成ですが、公開前には実機確認を推奨します。

## すぐに起動する

```bash
npm ci
npm run dev
```

Viteが表示したローカルURLを開きます。開発サーバーではService Workerを登録しません。

初めてE2Eを実行する端末では、先にPlaywrightのChromiumを導入します。Linux CIでOS依存も必要な場合は`npx playwright install --with-deps chromium`を使用してください。

```bash
npx playwright install chromium
```

本番相当の確認は次の順です。

```bash
npm run quality
npm run test:e2e
npm run preview -- --host 127.0.0.1 --port 4173
```

`npm run build`の出力先は`dist/`です。`dist/`は生成物のためGitには含めません。

## 操作

| 操作         | PC                     | スマートフォン                     |
| ------------ | ---------------------- | ---------------------------------- |
| 移動         | `WASD`または矢印キー   | 左下の移動パッド                   |
| 調べる・決定 | `E`、`Enter`、`Space`  | 右下の「調べる」または画面内ボタン |
| 地図         | `M`またはHUDの「地図」 | HUDの「地図」                      |
| 日記         | `J`またはHUDの「日記」 | HUDの「日記」                      |
| 戻る         | `Escape`               | ダイアログの「閉じる」             |
| UI移動       | `Tab`、`Shift+Tab`     | タップ                             |

ダイアログ、会話、メニューを開いている間は町の移動入力を止めます。設定では音量、ミュート、文字送り、自動送り、文字サイズ、モーション軽減、3D画質を変更できます。OS・ブラウザの`prefers-reduced-motion`も反映します。

## 遊び方

タイトルの封筒を開き、「はじめから」で転入届へ進みます。名前は1〜12文字で、日本語・記号・絵文字も使用できます。町ではHUDの目的と日記の段階ヒントを手掛かりに、地図で移動して各場所を調べてください。現在の時間帯に必要な出来事を終えると、HUDから次の時間帯へ進めます。

<details>
<summary>連続デモの流れ（物語の軽いネタバレ）</summary>

1. 転入届へ名前を記入する。
2. 駅時計を調べ、役場で住民票と203号室の鍵を受け取る。
3. 月影荘の郵便受けを開き、204号室宛の封筒を見つける。
4. Day 1に住民へ挨拶し、掲示板と猫を調べる。
5. 日記の目的に沿ってDay 2〜5の台帳、町史、録音、旧204号室の記録、証言を集める。
6. Day 6に十三番目の回覧板を読み、放送塔の丘を解放する。
7. Day 7に最後の録音を聞き、三つの選択肢から結末を選ぶ。
8. エンディング後に「記録を見る」または「最終日前から」を選ぶ。

</details>

## セーブとデータ

- 進行時に自動保存し、町の設定画面から手動保存もできます。
- 自動・手動の保存前データをバックアップへ退避し、通常の保存が壊れている場合は有効な記録を選んで復旧します。
- 設定画面の「JSONを書き出す」「JSONを読み込む」で端末間の手動移行ができます。読み込みは2 MB以下に制限し、スキーマとコンテンツ参照を検証します。
- Day 7のチェックポイントがある場合、エンディング画面の「最終日前から」で戻れます。
- 「記録を初期化」は確認文の入力を必要とし、自動保存、手動保存、バックアップ、設定、最終日チェックポイントをこの端末から削除します。
- ブラウザのサイトデータ削除、プライベートブラウズ終了、オリジン変更で保存が失われることがあります。長く残したい記録はJSONで書き出してください。

プレイヤー名、進行、設定、収集記録は`localStorage`へ保存し、外部へ送信しません。分析、広告、位置情報、カメラ、マイク、クラウド同期は使用しません。詳しくは[`public/privacy.html`](./public/privacy.html)と[`SECURITY.md`](./SECURITY.md)を参照してください。

## 品質コマンド

| コマンド                    | 内容                                                   |
| --------------------------- | ------------------------------------------------------ |
| `npm run lint`              | ESLint（警告も失敗扱い）                               |
| `npm run typecheck`         | TypeScriptの厳格型検査                                 |
| `npm run test`              | Vitestの単体・コンポーネントテスト                     |
| `npm run validate:content`  | ID参照、最低件数、会話グラフなどのコンテンツ整合性検証 |
| `npm run simulate:story`    | Day 0〜7の全時間帯とEnding A/B/C到達性のヘッドレス検証 |
| `npm run test:e2e`          | Playwrightのデスクトップ・モバイルE2E                  |
| `npm run test:e2e:mobile`   | モバイルChromiumだけのE2E                              |
| `npm run test:pwa`          | Manifest、Service Worker、公開用ファイルの検証         |
| `npm run audit:a11y`        | `@a11y`タグ付きPlaywrightテスト                        |
| `npm run build`             | 型検査後にVite本番ビルド                               |
| `npm run licenses:generate` | 本番依存の配布用ライセンス通知を再生成                 |
| `npm run format:check`      | Prettier差分の確認                                     |
| `npm run quality`           | lint、型検査、Vitest、コンテンツ検証、ビルドを連続実行 |

E2Eは`npm run preview`を自動起動し、失敗時のスクリーンショット、動画、トレースを`test-results/`へ保存します。手動確認用スクリーンショットは`artifacts/screenshots/desktop/`と`artifacts/screenshots/mobile/`へ保存します。

## Cloudflare Pagesへ静的公開する

この手順は公開設定の案内です。リポジトリから自動で本番公開する処理は含みません。

1. Cloudflare PagesでGitリポジトリを接続し、対象ブランチを選びます。
2. Framework presetは`Vite`（または手動設定）を選びます。
3. Build commandを`npm run build`にします。
4. Build output directoryを`dist`にします。
5. 環境変数`NODE_VERSION`を`.nvmrc`と同じ`22.22.2`へ設定します。
6. 公開URLが`https://tsukikage-town.pages.dev`と異なる場合は、`public/robots.txt`、`public/sitemap.xml`、`index.html`内のcanonical/OGP URLを実際のHTTPS URLへ置き換えてからビルドします。
7. プレビュー環境で新規開始、続きから、リロード、直接URL、オフライン再訪、モバイル操作、SNSカードの画像URLを確認してから本番ブランチへ反映します。

`public/_redirects`の`/* /index.html 200`がSPAフォールバックを、`public/_headers`がCSPなどのセキュリティヘッダーとキャッシュ方針を提供します。Vite設定の`base`とPWAのURLはルート配信（`/`）を前提にしているため、サブディレクトリ配信では設定変更が必要です。Service WorkerとPWAインストールには、本番のHTTPSまたは`localhost`が必要です。

## PWAとオフライン

Manifest、192/512pxアイコン、マスカブルアイコン、Service Worker、オフライン案内を含みます。最初のオンライン訪問後はアプリシェルと取得済み静的アセットをキャッシュし、オフライン時もタイトルと端末に保存済みの記録を開ける構成です。新しいService Workerが待機状態になると画面内に更新案内を表示します。

オフライン動作はブラウザの保存容量、キャッシュ削除、PWA実装差に左右されます。公開前には対象端末で「オンラインで一度起動 → 閉じる → オフラインで再訪」を確認してください。

## 構成

```text
src/app/       画面統合、物語アクション、3D/ゲーム/コンテンツ間アダプター
src/game/      状態、条件と効果、時間、セーブ、実績、エンディング
src/content/   人物、章、会話、手紙、回覧板、手掛かり等のデータ
src/world/     低ポリゴンの町、移動、衝突、調査、画質制御
src/ui/        紙調UI、ダイアログ、日記、記録、設定
src/audio/     Web Audio APIで生成する環境音と効果音
src/pwa/       Service Worker登録
scripts/       コンテンツ検証、物語シミュレーション、画像生成
e2e/           Playwright E2E
public/        Manifest、Service Worker、アイコン、公開用ヘッダー
```

コンテンツ追加手順は[`CONTENT_GUIDE.md`](./CONTENT_GUIDE.md)、開発参加手順は[`CONTRIBUTING.md`](./CONTRIBUTING.md)、依存ライセンスは[`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md)を参照してください。

## 既知の制約

- セーブはオリジンごとの端末内保存です。アカウント、クラウド同期、複数端末の自動同期はありません。
- WebGLを無効化した環境では3D探索を開始できず、画面内の案内を表示します。
- PWAのインストールUI、ストレージ永続性、音声再生許可はブラウザごとに異なります。音声は最初のユーザー操作後に開始します。
- 自動画質は画面幅、論理コア数、推定メモリ、DPRを基準にする簡易判定です。動作が重い場合は設定から「低」を選んでください。
- GitHub Pagesなどサブパス配信は初期設定の対象外です。

## ライセンス

本プロジェクトのコード、文章、コード生成した図像・音響は[`LICENSE`](./LICENSE)のMIT Licenseで提供します。第三者依存パッケージには各パッケージのライセンスが適用されます。外部の画像、音声、3Dモデル、Webフォントは同梱していません。
