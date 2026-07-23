This repository is the Astro-based static portfolio for wakadori.me.

The single source of truth for AI-agent rules is `AI_GUIDE.md`.
Read its TL;DR before suggesting changes.

Key boundaries:

- Astro output is static and deployed from `dist/` to Cloudflare Pages.
- Keep React limited to `CuratedGallery` and `LatestActivity`.
- Preserve `/api/works`, `/api/repos`, and `/img/pixiv/**`.
- Keep selected works available without JavaScript.
- Manage work content under `src/content/works/`.
- Manage hero, order, copy, and profile links in `src/config/site.ts`.
- Do not read or commit `.env`, `.env.*`, or `.dev.vars`.
- Do not push, deploy, or change GitHub state without explicit approval.

Follow `AI_GUIDE.md` when it is more specific than this file.
