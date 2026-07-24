# AI_GUIDE.md

本ドキュメントは、このリポジトリにおける **AI 向けルールの正本（single source of truth）** です。AI は最初に TL;DR を読み、判断に迷った場合は本ドキュメントへ戻ってください。

## TL;DR（最重要要約）

- AI向けルールの正本は `AI_GUIDE.md` のみ
- サイトは作品を主役にした、Astro製の静的ポートフォリオ
- 静的HTMLを優先し、React islandは `CuratedGallery` と `LatestActivity` に限定
- 白い余白と淡い光を基調に、手描きの痕跡は全体の10〜15%以内
- 作品・掲載順・コピー・リンクはContent Collectionと `src/config/site.ts` で管理する
- 公開APIと画像proxyのURL・レスポンス形式は変えない
- 読み取り、通常検証、小さな低リスク修正、docs更新は自律実行してよい
- 破壊的操作、大きな構造変更、外部公開は事前承認を得る
- Codex の project-local policy は `.codex/` を参照する

## 目的と設計思想

- イラストとソフトウェアを分断せず、同じ `WORKS` の中で見せる
- 自己紹介より作品を先に見せる。鳥アイコンと名前は小さな入口として扱う
- 情報量より静けさ、余白、触感、視線誘導を優先する
- 「白い余白＋淡い光」を85〜90%、手描きメモや制作痕跡を10〜15%の目安にする
- ランダム演出、日替わりテーマ、ダークモード、常時tiltは導入しない
- 外部リンクはサービス名と `↗` を明示し、新しいタブで直接開く

迷った場合は **gentler / quieter / less intrusive** を選びます。

## アーキテクチャ

### 静的優先

- Astroは `output: "static"` とし、ビルド成果物は `dist/`
- Cloudflare Pagesでは静的成果物とルート `functions/` を組み合わせる
- Cloudflare SSR adapterは導入しない
- 作品一覧、作品詳細、外部リンクはJavaScript無効時も閲覧可能にする
- クライアント処理の失敗で静的コンテンツを消さない

### React island境界

Reactは以下の2箇所以外へ広げない。

1. `CuratedGallery`
   - hover / keyboard focus状態
   - ポインター位置に応じた淡い光
   - 制作メモの表示
2. `LatestActivity`
   - `/api/works` と `/api/repos` の並行取得
   - 日付順の統合
   - API失敗時のプロフィールリンクへのフォールバック

ナビゲーション、ヒーロー、About、詳細ページ本文、前後作品はAstroで静的生成する。

### 公開インターフェース

以下は互換性を維持する。

- `GET /api/works`
- `GET /api/repos`
- `GET /img/pixiv/**`

既存のレスポンス形、キャッシュ、KV last-known-good、秘密情報の扱いを変える場合は事前承認を得る。`.env`、`.env.*`、`.dev.vars` は読まず、コミットしない。

## コンテンツ管理

- 作品本文は `src/content/works/`
- スキーマは `src/content.config.ts`
- 展示設定は `src/config/site.ts`
- 代表作は `heroWork`
- 選抜6作品と順序は `curatedWorks`
- コピー、About文、活動先リンクもサイト設定へ集約する

作品データの必須項目:

- slug、種別、日英タイトル、年、日英要約
- カバー画像、alt、外部リンク、表示形状

制作工程、作品情報、手描き注釈、制作レイヤーは任意。工程素材がない作品では工程セクション自体を出さない。架空作品、架空の制作過程、断定できない実績は出荷しない。

## 表現規約

### 作品が主役

- 装飾フレームや巨大なカードUIで作品を囲い込まない
- Illustration / Software は種別ラベルとして控えめに扱う
- 一覧は縦横比と大小を混在させるが、設定順を変えない
- スマートフォンでは1タップで詳細へ進み、hover前提の操作を置かない

### 制作痕跡と動き

- 手描き要素は各セクション1〜2点まで
- 手描き要素は情報理解に必須としない
- hoverとkeyboard focusは同等の内容を示す
- `prefers-reduced-motion` では非本質的な動きを止める
- レイアウトコンテナは傾けない
- 複数の強い演出を同時に走らせない

### アクセシビリティ

- 画像には内容を伝えるaltを付ける
- キーボードフォーカスを常に視認可能にする
- 見出し階層、ランドマーク、リンク名を意味に沿って使う
- ブラウザズームや通常のスクロールを妨げない
- 色だけで状態や種別を伝えない

## AIエージェント運用

### 自律実行してよいこと

- 読み取り、検索、状態確認、差分確認
- 小さな低リスク修正
- `README.md` / `AI_GUIDE.md` / 入口ガイドの更新
- type check、lint、format check、build、ローカルpreview、Playwright
- 変更後の自己レビュー

提示時は **意図・影響範囲・検証結果** を簡潔に示す。

### 事前承認が必要なこと

- 依存関係、ビルド方式、公開APIを変える追加変更
- 作品構造やReact island境界を変える大きな設計変更
- `git push`、deploy、Preview公開、Issue / PR / releaseの更新
- `git reset`、履歴改変、ファイル削除など戻しにくい操作
- `.codex/` のpolicy、rules、hooksの大きな変更

明示承認済みの計画に含まれる変更は、その承認範囲内で実装してよい。Previewが成功しても、本番mergeや公開の承認にはならない。

### Codex project policy

- repo固有のCodex設定は `.codex/`
- `.codex/config.toml` はpermissionsとapprovalの既定値
- `.codex/rules/` は危険コマンドの許可・確認・禁止
- `.codex/hooks/` は監査と注意喚起
- 挙動ルール本文は本ファイルへ集約する

## 作業フロー

1. 調査
2. 方針判断
3. 実装
4. 検証
5. 提示（diff＋意図）

危険箇所、破壊的操作、大きな構造変更は、方針提示と承認を実装前に追加する。

## 必須検証

- `npm run check`
- `npm run lint`
- `npm run format:check`
- `npm run build`
- Playwrightで360px、768px、1440px
- mouse、keyboard、touch、`prefers-reduced-motion`
- JavaScript無効時の作品一覧、詳細、外部リンク
- API失敗時のLatestフォールバック
- `src/config/site.ts` だけで代表作と6作品の順序を変更できること

目標値は Lighthouse Performance 90以上、Accessibility / SEO 95以上、CLS 0.1未満。数値は実測した場合のみ記録する。

## 参照

- `README.md`
- `CLAUDE.md`
- `.github/copilot-instructions.md`
- `.codex/config.toml`
- `.codex/rules/default.rules`
