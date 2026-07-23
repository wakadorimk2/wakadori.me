import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWorkflow = (name) =>
  readFile(new URL(`../../.github/workflows/${name}`, import.meta.url), "utf8");

test("CI preserves lint and format checks and runs the infrastructure fixtures", async () => {
  const workflow = await readWorkflow("ci.yml");

  assert.match(workflow, /node --test tests\/ci\/\*\.test\.mjs/);
  assert.match(workflow, /npm run lint/);
  assert.match(workflow, /npm run format:check/);
  assert.doesNotMatch(workflow, /upload-artifact|pages-deploy-bundle/);
});

test("privileged deploy consumes one run-scoped artifact without checkout or install", async () => {
  const workflow = await readWorkflow("pages-deploy.yml");

  assert.doesNotMatch(workflow, /actions\/checkout|npm (ci|install)|\brun: node\b/);
  assert.match(workflow, /run-id: \$\{\{ github\.event\.workflow_run\.id \}\}/);
  assert.match(workflow, /vars\.PAGES_PREVIEW_DEPLOY_ENABLED == 'true'/);
  assert.match(workflow, /vars\.PAGES_PRODUCTION_DEPLOY_ENABLED == 'true'/);
  assert.match(workflow, /run\.head_repository\?\.full_name !== expectedRepository/);
  assert.match(workflow, /run\.actor\?\.login !== "wakadorimk2"/);
  assert.match(workflow, /pull\.head\.sha !== run\.head_sha/);
  assert.match(workflow, /artifact_name", `pages-deploy-bundle-\$\{sha\}`/);
  assert.match(workflow, /wranglerVersion: 4\.86\.0/);
  assert.match(workflow, /cloudflare\/wrangler-action@[0-9a-f]{40}/);
});

test("manual cleanup defaults to dry-run and scheduled cleanup applies serially", async () => {
  const workflow = await readWorkflow("pages-preview-cleanup.yml");

  assert.match(workflow, /cron: "17 18 \* \* \*"/);
  assert.match(workflow, /default: false/);
  assert.match(workflow, /vars\.PAGES_PREVIEW_CLEANUP_ENABLED == 'true'/);
  assert.match(workflow, /cancel-in-progress: false/);
  assert.match(workflow, /github\.event_name == 'schedule' && '--apply'/);
});
