# Third-Party Notices

この文書は`package-lock.json`に固定された直接依存パッケージのライセンス一覧です。バージョンとSPDX識別子は、インストール済みパッケージの`package.json`に記載された値を基にしています。

本作の日本語本文、UI図形、低ポリゴン3D、Web Audio APIで生成する音、`scripts/generate-assets.mjs`から生成するアイコンとOG画像はプロジェクト内で制作しています。外部の画像、録音、3Dモデル、Webフォントは同梱していません。

## 実行時依存

これらは本番バンドルの実行に使用します。

| Package              | Locked version | License | 用途                           |
| -------------------- | -------------: | ------- | ------------------------------ |
| `@react-three/drei`  |         10.7.7 | MIT     | React Three Fiber用3Dヘルパー  |
| `@react-three/fiber` |          9.6.1 | MIT     | ReactとThree.jsの統合          |
| `focus-trap-react`   |         12.0.3 | MIT     | ダイアログ内フォーカストラップ |
| `react`              |         19.2.7 | MIT     | UIランタイム                   |
| `react-dom`          |         19.2.7 | MIT     | DOMレンダリング                |
| `three`              |        0.185.1 | MIT     | 3Dレンダリング                 |
| `zod`                |          4.4.3 | MIT     | セーブ・設定スキーマ検証       |

## 開発・検証依存

これらは開発、静的解析、テスト、ビルド、コード生成にだけ使用します。

| Package                       | Locked version | License    |
| ----------------------------- | -------------: | ---------- |
| `@axe-core/playwright`        |         4.12.1 | MPL-2.0    |
| `@eslint/js`                  |         10.0.1 | MIT        |
| `@playwright/test`            |         1.61.1 | Apache-2.0 |
| `@testing-library/jest-dom`   |          6.9.1 | MIT        |
| `@testing-library/react`      |         16.3.2 | MIT        |
| `@testing-library/user-event` |         14.6.1 | MIT        |
| `@types/node`                 |         26.1.1 | MIT        |
| `@types/react`                |        19.2.17 | MIT        |
| `@types/react-dom`            |         19.2.3 | MIT        |
| `@types/three`                |        0.185.1 | MIT        |
| `@vitejs/plugin-react`        |          6.0.3 | MIT        |
| `@vitest/coverage-v8`         |         4.1.10 | MIT        |
| `eslint`                      |         10.7.0 | MIT        |
| `eslint-plugin-react-hooks`   |          7.1.1 | MIT        |
| `eslint-plugin-react-refresh` |          0.5.3 | MIT        |
| `jsdom`                       |         29.1.1 | MIT        |
| `prettier`                    |          3.9.5 | MIT        |
| `sharp`                       |         0.35.3 | Apache-2.0 |
| `tsx`                         |         4.23.1 | MIT        |
| `typescript`                  |          6.0.3 | Apache-2.0 |
| `typescript-eslint`           |         8.64.0 | MIT        |
| `vite`                        |          8.1.4 | MIT        |
| `vitest`                      |         4.1.10 | MIT        |

## 完全な依存ツリー

間接依存を含む正確な名前、バージョン、配布元、integrityハッシュは`package-lock.json`が正本です。本番依存のライセンス文と著作権表示は`public/THIRD_PARTY_LICENSES.txt`へ集約し、静的サイトの配布物にも同梱します。

```bash
npm run licenses:generate
```

このコマンドは`npm ls --omit=dev --all`の結果と、各パッケージに同梱された`LICENSE`、`COPYING`、`NOTICE`ファイルから配布用の通知ファイルを再生成します。

依存を更新した場合は、次の確認を行い、この一覧も更新します。

```bash
npm ci
npm ls --all
npm audit
```

新しい外部素材を追加する場合は、パッケージ依存とは別に、この文書へ次を記載してください。

- 素材名と作者・権利者
- 取得元URL
- ライセンス名とライセンス本文へのURL
- 変更の有無
- ゲーム内での用途

権利者、利用条件、再配布可否のいずれかを確認できない素材は使用しません。

## License texts

### MIT License

```text
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Apache License 2.0

Apache-2.0の全文はApache Software Foundationのライセンス本文に従います。

<https://www.apache.org/licenses/LICENSE-2.0>

### Mozilla Public License 2.0

MPL-2.0の全文はMozilla Foundationのライセンス本文に従います。

<https://www.mozilla.org/MPL/2.0/>
