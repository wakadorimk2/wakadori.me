import assert from "node:assert/strict";
import test from "node:test";

import { main, planPreviewCleanup } from "../../scripts/pages-preview-cleanup.mjs";

const now = new Date("2026-07-23T00:00:00.000Z");

function deployment(id, environment, branch, createdOn) {
  return {
    id,
    environment,
    created_on: createdOn,
    deployment_trigger: branch ? { metadata: { branch } } : {},
  };
}

test("keeps production, recent previews, and the latest preview for every branch", () => {
  const deployments = [
    deployment("production-old", "production", "main", "2025-01-01T00:00:00.000Z"),
    deployment("feature-old", "preview", "feature/a", "2026-05-01T00:00:00.000Z"),
    deployment("feature-latest", "preview", "feature/a", "2026-05-02T00:00:00.000Z"),
    deployment("recent", "preview", "feature/b", "2026-07-10T00:00:00.000Z"),
    deployment("branchless-old", "preview", null, "2026-05-03T00:00:00.000Z"),
  ];

  assert.deepEqual(
    planPreviewCleanup(deployments, { now }).map(({ id }) => id),
    ["feature-old"],
  );
});

test("uses an exact 30-day cutoff", () => {
  const deployments = [
    deployment("older", "preview", "feature/a", "2026-06-22T23:59:59.999Z"),
    deployment("at-cutoff", "preview", "feature/a", "2026-06-23T00:00:00.000Z"),
    deployment("latest", "preview", "feature/a", "2026-07-01T00:00:00.000Z"),
  ];

  assert.deepEqual(
    planPreviewCleanup(deployments, { now }).map(({ id }) => id),
    ["older"],
  );
});

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function cleanupFixture() {
  return [
    deployment("delete-a", "preview", "feature/a", "2026-05-01T00:00:00.000Z"),
    deployment("keep-a", "preview", "feature/a", "2026-07-01T00:00:00.000Z"),
    deployment("delete-b", "preview", "feature/b", "2026-05-02T00:00:00.000Z"),
    deployment("keep-b", "preview", "feature/b", "2026-07-02T00:00:00.000Z"),
    deployment("delete-c", "preview", "feature/c", "2026-05-03T00:00:00.000Z"),
    deployment("keep-c", "preview", "feature/c", "2026-07-03T00:00:00.000Z"),
  ];
}

const cleanupEnv = {
  CLOUDFLARE_ACCOUNT_ID: "account-id",
  CLOUDFLARE_API_TOKEN: "test-token",
};

test("dry-run lists candidates without deleting", async () => {
  const calls = [];
  const logs = [];
  const request = async (url, init) => {
    calls.push({ url: String(url), method: init.method || "GET" });
    return jsonResponse({
      success: true,
      result: cleanupFixture(),
      result_info: { total_pages: 1 },
    });
  };

  await main([], cleanupEnv, { now, request, log: (line) => logs.push(line) });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "GET");
  assert.match(logs[0], /"mode": "dry-run"/);
  assert.match(logs[0], /"candidateCount": 3/);
});

test("apply verifies every deletion with GET 404 and stops on the first failure", async () => {
  const calls = [];
  const request = async (url, init) => {
    const parsed = new URL(url);
    const method = init.method || "GET";
    calls.push(`${method} ${parsed.pathname}`);

    if (parsed.searchParams.has("page")) {
      return jsonResponse({
        success: true,
        result: cleanupFixture(),
        result_info: { total_pages: 1 },
      });
    }
    if (method === "DELETE") return jsonResponse({ success: true, result: {} });
    if (parsed.pathname.endsWith("/delete-a")) return jsonResponse({}, 404);
    if (parsed.pathname.endsWith("/delete-b")) return jsonResponse({}, 200);
    throw new Error("The third candidate must not be reached");
  };

  await assert.rejects(
    main(["--apply"], cleanupEnv, { now, request, log: () => {} }),
    /GET delete-b returned HTTP 200; expected 404/,
  );

  assert.deepEqual(
    calls.slice(1).map((call) => call.split("/").at(-1)),
    ["delete-a", "delete-a", "delete-b", "delete-b"],
  );
  assert.ok(calls.every((call) => !call.endsWith("/delete-c")));
});
