# GitHub Actions / Cloudflare Pages 切替runbook

GitHub Actionsを唯一の実行起点にし、既存のCloudflare Pagesプロジェクト
`wakadori-me`へ検証済み成果物だけを送るための手順です。

## このinfra変更の境界

- `main`版の`CI`は既存のlint／formatを維持し、infra fixtureテストだけを追加する
- `Pages Deploy`はdefault branch上の`workflow_run`から起動する
- deploy対象は成功した`CI` runに紐づく`pages-deploy-bundle-<SHA>`だけに限定する
- 現段階の`main`版`CI`はdeploy成果物を生成しない。PR #69側への成果物生成CI追加は、
  このinfra変更がdefault branchへ入った後の別工程とする
- PR Previewは同一repository、actor `wakadorimk2`、open PR、base `main`、
  現在のPR HEADとCI runのSHA一致を要求する
- 権限付きdeploy jobはPRをcheckoutせず、依存関係や成果物内スクリプトを実行しない
- `pages-preview-cleanup.mjs`はdry-runが既定で、apply時は1件ずつDELETEし、
  直後の管理API GETが404でなければ停止する
- 3つのrepository variableが未設定の間、Preview／Production／定期cleanupは無効である

## 事前設定

GitHub Environmentsに`preview`と`production`を作成し、それぞれに以下のsecretを設定します。

- `CLOUDFLARE_API_TOKEN`（対象Pages projectの読み書き）
- `CLOUDFLARE_ACCOUNT_ID`

Repository variablesは初期状態では未設定（すべて無効）にします。

- `PAGES_PREVIEW_DEPLOY_ENABLED`: `true`のときだけPR Previewを許可する
- `PAGES_PRODUCTION_DEPLOY_ENABLED`: `true`のときだけ`main` Productionを許可する
- `PAGES_PREVIEW_CLEANUP_ENABLED`: `true`のときだけscheduleが実削除する

手動cleanupは最後のvariableに関係なく起動できますが、`apply`の既定値は`false`です。

Cloudflare Pages側では、切替前に次を設定・確認します。

1. Git連携build commandを`npm run build`、output directoryを`dist`にして、
   現行PRのGit連携Previewを正常化する
2. Preview専用KV namespaceを`WK_CACHE`へ割り当てる
3. Previewでは`PIXIV_PHPSESSID`と`GITHUB_TOKEN`を未設定にする
4. Pages Preview Access policyを有効化し、Preview URLのみを認証必須にする
5. 本番の`wakadori-me.pages.dev`と`wakadori.me`が公開のままか確認する

リポジトリにWrangler設定ファイルを置いていないのは、既存Pages projectのDashboard設定を
意図せず上書きしないためです。Preview/Productionのbindingとsecretは、切替時にDashboardの
実値を再確認します。

## 直列の切替ゲート

各項目は前項が完了してから進め、失敗時は再試行や次工程への移行をしません。

`workflow_run`はworkflow fileがdefault branchに存在するときだけ起動します。したがって、
PR #69をmerge前に検証するには、このdeploy基盤をPR #69とは別のinfra変更として先に
default branchへ載せる必要があります。その時点では3つのrepository variableを未設定にし、
Production、Preview、定期cleanupのいずれも実行させません。

1. deploy基盤だけのinfra変更について、対象ファイルとCIを確認し、別承認でdefault branchへ載せる
2. PR #69をDraftのまま維持し、HEAD、CI、変更ファイルを再確認する
3. PR #69の`CI`に、全検証成功後だけ`dist/`、`functions/`、対象SHAを
   `pages-deploy-bundle-<SHA>`として7日間保存する工程を追加する
4. Git連携Previewで固有URL、branch alias、Functions、Access、Preview KVを確認する
5. 明示承認後、`PAGES_PREVIEW_DEPLOY_ENABLED=true`にしてPR #69のCIを対象HEADで実行する
6. GitHub Actions Previewの固有URL、branch alias、Functions、Access、Preview KV、SHAを確認する
7. cleanupを手動dry-runし、30日以内・Production・各branch最新が保持されることを確認する
8. 必要なら別承認後に`PAGES_PREVIEW_CLEANUP_ENABLED=true`としてscheduleを有効化する
9. 明示承認後、Cloudflareのautomatic production deploymentsを無効化する
10. 同じ承認工程でPreview branchを`None`へ変更する
11. Cloudflare設定の反映確認後、`PAGES_PRODUCTION_DEPLOY_ENABLED=true`にする
12. その後に限り、別承認でPR #69をmergeする
13. `main` CI由来のProduction deploymentと公開URLを確認する
14. `/api/works`、`/api/repos`、`/img/pixiv/**`をsmoke testする

切替完了までは旧Git連携設定を記録し、復元可能な状態を保ちます。
