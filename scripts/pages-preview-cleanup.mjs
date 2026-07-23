import { pathToFileURL } from "node:url";

const DEFAULT_PROJECT = "wakadori-me";
const DEFAULT_RETENTION_DAYS = 30;
const DAY_MS = 86_400_000;

function deploymentBranch(deployment) {
  return deployment.deployment_trigger?.metadata?.branch || null;
}

export function planPreviewCleanup(
  deployments,
  { now = new Date(), retentionDays = DEFAULT_RETENTION_DAYS } = {},
) {
  const cutoff = now.getTime() - retentionDays * DAY_MS;
  const latestByBranch = new Map();

  for (const deployment of deployments) {
    if (deployment.environment !== "preview") continue;
    const branch = deploymentBranch(deployment);
    if (!branch) continue;

    const current = latestByBranch.get(branch);
    if (!current || new Date(deployment.created_on) > new Date(current.created_on)) {
      latestByBranch.set(branch, deployment);
    }
  }

  return deployments
    .filter((deployment) => {
      if (deployment.environment !== "preview") return false;
      if (new Date(deployment.created_on).getTime() >= cutoff) return false;

      const branch = deploymentBranch(deployment);
      if (!branch) return false;
      if (latestByBranch.get(branch)?.id === deployment.id) return false;
      return true;
    })
    .sort((left, right) => new Date(left.created_on) - new Date(right.created_on));
}

function parseArguments(argv) {
  const options = {
    apply: false,
    project: DEFAULT_PROJECT,
    retentionDays: DEFAULT_RETENTION_DAYS,
  };

  for (const argument of argv) {
    if (argument === "--apply") {
      options.apply = true;
    } else if (argument.startsWith("--project=")) {
      options.project = argument.slice("--project=".length);
    } else if (argument.startsWith("--retention-days=")) {
      options.retentionDays = Number(argument.slice("--retention-days=".length));
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(options.project)) {
    throw new Error("Project name contains unsupported characters");
  }
  if (!Number.isInteger(options.retentionDays) || options.retentionDays < 1) {
    throw new Error("Retention days must be a positive integer");
  }
  return options;
}

function apiEndpoint(accountId, project, suffix = "") {
  const encodedProject = encodeURIComponent(project);
  return `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${encodedProject}/deployments${suffix}`;
}

async function cloudflareRequest(url, token, init = {}, request = fetch) {
  return request(url, {
    ...init,
    headers: {
      accept: "application/json",
      authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });
}

async function listDeployments(accountId, project, token, request) {
  const deployments = [];

  for (let page = 1; ; page += 1) {
    const url = new URL(apiEndpoint(accountId, project));
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", "25");
    const response = await cloudflareRequest(url, token, {}, request);
    const body = await response.json();

    if (!response.ok || body.success !== true || !Array.isArray(body.result)) {
      throw new Error(`Deployment list failed with HTTP ${response.status}`);
    }
    deployments.push(...body.result);

    const totalPages = body.result_info?.total_pages;
    if (Number.isInteger(totalPages) ? page >= totalPages : body.result.length < 25) break;
  }

  return deployments;
}

async function deleteAndVerify(deployment, accountId, project, token, request) {
  const suffix = `/${encodeURIComponent(deployment.id)}`;
  const deleteUrl = new URL(apiEndpoint(accountId, project, suffix));
  deleteUrl.searchParams.set("force", "true");
  const deletion = await cloudflareRequest(deleteUrl, token, { method: "DELETE" }, request);
  const deletionBody = await deletion.json();

  if (!deletion.ok || deletionBody.success !== true) {
    throw new Error(`DELETE ${deployment.id} failed with HTTP ${deletion.status}`);
  }

  const verification = await cloudflareRequest(
    apiEndpoint(accountId, project, suffix),
    token,
    {},
    request,
  );
  if (verification.status !== 404) {
    throw new Error(`GET ${deployment.id} returned HTTP ${verification.status}; expected 404`);
  }
}

export async function main(
  argv = process.argv.slice(2),
  env = process.env,
  { now = new Date(), request = fetch, log = console.log } = {},
) {
  const options = parseArguments(argv);
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  const token = env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !token) {
    throw new Error("CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are required");
  }

  const deployments = await listDeployments(accountId, options.project, token, request);
  const candidates = planPreviewCleanup(deployments, {
    now,
    retentionDays: options.retentionDays,
  });

  log(
    JSON.stringify(
      {
        mode: options.apply ? "apply" : "dry-run",
        project: options.project,
        retentionDays: options.retentionDays,
        candidateCount: candidates.length,
        candidates: candidates.map((deployment) => ({
          id: deployment.id,
          branch: deploymentBranch(deployment),
          createdOn: deployment.created_on,
        })),
      },
      null,
      2,
    ),
  );

  if (!options.apply) return;

  for (const deployment of candidates) {
    await deleteAndVerify(deployment, accountId, options.project, token, request);
    log(`Deleted and verified ${deployment.id}`);
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
