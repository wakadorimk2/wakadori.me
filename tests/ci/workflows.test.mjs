import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWorkflow = (name) =>
  readFile(new URL(`../../.github/workflows/${name}`, import.meta.url), "utf8");

test("CI validates one exact SHA before publishing its Pages bundle", async () => {
  const workflow = await readWorkflow("ci.yml");

  assert.doesNotMatch(workflow, /CLOUDFLARE_API_TOKEN|CLOUDFLARE_ACCOUNT_ID/);
  assert.match(workflow, /TARGET_SHA:.*pull_request\.head\.sha.*github\.sha/);
  assert.match(workflow, /actions\/checkout@[0-9a-f]{40}/);
  assert.match(workflow, /actions\/setup-node@[0-9a-f]{40}/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /node --test tests\/ci\/\*\.test\.mjs/);
  assert.match(workflow, /npm run check/);
  assert.match(workflow, /npm run lint/);
  assert.match(workflow, /npm run format:check/);
  assert.match(workflow, /npm run build/);
  assert.match(workflow, /npm run test:e2e/);
  assert.match(workflow, /actions\/upload-artifact@[0-9a-f]{40}/);
  assert.match(workflow, /pages-deploy-bundle-\$\{\{ env\.TARGET_SHA \}\}/);
  assert.match(workflow, /dist\/\s+functions\/\s+pages-commit-sha\.txt/s);
  assert.match(workflow, /retention-days: 7/);

  const upload = workflow.indexOf("Save deployable Pages bundle");
  for (const requiredStep of [
    "Validate CI and cleanup policy",
    "Check Astro and TypeScript",
    "Lint",
    "Check formatting",
    "Build",
    "Run Playwright",
    "Record the source revision",
  ]) {
    assert.ok(workflow.indexOf(requiredStep) < upload, `${requiredStep} must run before upload`);
  }
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
