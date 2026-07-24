---
slug: ae2-dashboard
type: software
title:
  ja: AE2 Dashboard
  en: AE2 Dashboard
year: 2026
summary:
  ja: MinecraftのAE2在庫をCC:Tweakedから収集し、FastAPI・PostgreSQL・Web UIで可視化するダッシュボード。
  en: A dashboard that collects Minecraft AE2 inventory data through CC:Tweaked and visualizes it with FastAPI, PostgreSQL, and a web UI.
cover:
  src: /images/ae2-dashboard-cover.png
  alt: AE2のアイテム在庫、クラフト状況、システム状態を表示するダッシュボード
shape: landscape
externalLinks:
  - label: GitHub
    href: https://github.com/wakadorimk2/ae2-dashboard
process:
  - src: /images/ae2-dashboard-detail.png
    alt: AE2 Dashboardの在庫一覧と統計を表示した詳細画面
    caption:
      ja: アイテム在庫を検索し、数量や変化を確認できる画面
      en: Searching inventory and checking quantities and changes
details:
  - label: Stack
    value: Lua / Python / TypeScript / FastAPI
  - label: Data
    value: CC:Tweaked / PostgreSQL
note: inventory → overview
---
