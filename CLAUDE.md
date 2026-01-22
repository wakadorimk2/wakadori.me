# CLAUDE.md

Claude Code 向けプロジェクトガイド。

## 設計哲学

**AI_GUIDE.md を最優先で参照すること。**

- 機能追加より「抑制・余白・静けさ」を重視
- 技術的に正しくても感覚的に違和感があれば立ち止まる
- 迷ったら gentler / quieter / less intrusive な選択肢を取る

## 技術スタック

純粋なHTML/CSS/JavaScript。フレームワーク・ビルドツールなし。

## 危険箇所（原則触らない）

以下4箇所は壊れやすい。変更する場合は**事前に理由と影響範囲を説明し、承認を得ること。**

1. **Orb効果** (`style.css` `.wk-orb-*`) — 複数gradient/疑似要素の複雑な重ね合わせ
2. **フォーカス管理** (`app.js` `focusFirstInPanel`, `schedulePeekFocus`) — アクセシビリティの要
3. **inert処理** (`app.js` `updateInteractable`) — 旧ブラウザ対応含む
4. **3Dフリップ** (`style.css` `.wk-card-rotator`, `.wk-face`) — iOS WebKitハック有り

## 作業ルール

- **必ずdiffを提示してから適用確認を取ること**
- 小さな調整を優先、大きなリファクタは避ける
- 空白・プレースホルダー領域は意図的。埋めない
- コメント・命名・バランスを大切に

## ファイル構成

`index.html` / `app.js` / `style.css` の3ファイル構成。画像は `*.jpg`。
