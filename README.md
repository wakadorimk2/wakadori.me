# wakadori.me

**絵とコードで、つくる。**

イラストレーションとソフトウェアを同じ制作の風景として見せる、わかどりの静的ポートフォリオです。

## Design

- 白い余白と淡い光を中心にしたライトモード
- Illustration 3件、Software 3件を混在させた選抜展示
- hover / keyboard focusでだけ現れる小さな制作痕跡
- 完成作、日英要約、任意の制作工程、作品情報、前後作品を持つ詳細ページ
- JavaScript無効時も作品と外部リンクを閲覧できるprogressive enhancement

旧Orb、表裏flip、Shelf、外部リンク確認ダイアログは廃止しています。

## Stack

| 領域       | 技術                                                     |
| ---------- | -------------------------------------------------------- |
| 静的サイト | Astro (`output: "static"`)                               |
| 動的な部分 | React islands 2箇所                                      |
| コンテンツ | Astro Content Collections                                |
| 配信       | Cloudflare Pages + Pages Functions                       |
| 検証       | Astro Check / ESLint / Stylelint / Prettier / Playwright |

Reactは次の2箇所に限定しています。

- `CuratedGallery`: hover / focus、制作レイヤー、ポインター位置の淡い光
- `LatestActivity`: pixiv / GitHub APIの並行取得、日付統合、失敗時フォールバック

## Content

作品は `src/content/works/*.md`、展示全体の設定は `src/config/site.ts` で管理します。

```ts
export const site = {
  heroWork: "irys-fan-art",
  curatedWorks: [
    "irys-fan-art",
    "ae2-dashboard",
    "tokoyami-towa-fan-art",
    "enterlight",
    "shishiro-botan-fan-art",
    "portfolio-ui",
  ],
  // ...
};
```

代表作や6作品の順序、ヒーローコピー、About文、リンクはコンポーネントを編集せず差し替えられます。

作品選定用の入力素材は `tmp/works-review/` に置き、公開アセットやコミット対象には含めません。

## Development

```bash
npm install
npm run dev
npm run check
npm run lint
npm run format:check
npm run build
npm run test:e2e
```

Playwrightブラウザはgitignore済みの `.playwright/` へ統一して保存・参照します。

Cloudflare Pages Functionsを含むローカル確認:

```bash
npm run pages:dev
```

このコマンドは `dist/` と `functions/` だけを一時ディレクトリへ複製してWranglerを起動します。リポジトリ直下の `.env` は読み込みません。

Astroの成果物は `dist/` です。Cloudflare Pagesのbuild commandは `npm run build`、build output directoryは `dist` を使用します。

## Pages Functions

ルートの `functions/` は既存の公開インターフェースとレスポンス形式を維持します。

| ルート          | 内容                                            |
| --------------- | ----------------------------------------------- |
| `/api/works`    | pixiv最新作品（30分cache + KV last-known-good） |
| `/api/repos`    | GitHub最新repository（同上）                    |
| `/img/pixiv/**` | pixiv thumbnail proxy（allowlist + 7日cache）   |

任意のPages設定:

- KV binding `WK_CACHE`
- Secret `PIXIV_PHPSESSID`
- Secret `GITHUB_TOKEN`

秘密情報はコミットしません。ローカル値は `.dev.vars` 等を使い、`.env` / `.env.*` を含めgitignoreしています。

## SEO

canonical、OGP、Twitter Card、JSON-LD Person、`robots.txt`、sitemapをビルド時に生成します。

## License

- コード: [GPL-3.0](./LICENSE)
- 画像、イラスト、デザイン資産: All rights reserved

## AI Assistants

AI向けルールの正本は [`AI_GUIDE.md`](./AI_GUIDE.md) です。最初にTL;DRを参照してください。
