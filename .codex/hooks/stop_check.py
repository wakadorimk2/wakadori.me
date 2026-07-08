#!/usr/bin/env python3
"""Non-blocking stop-time guardrail hints for wakadori.me Codex sessions."""

from __future__ import annotations

import subprocess
from pathlib import Path


AI_DOCS = {
    "AI_GUIDE.md",
    "AGENTS.md",
    "CLAUDE.md",
    ".github/copilot-instructions.md",
    "README.md",
}

UI_PREFIXES = ("index.html", "css/", "js/")
CODEX_POLICY_PREFIXES = (".codex/config.toml", ".codex/rules/", ".codex/hooks")


def git_lines(*args: str) -> set[str]:
    result = subprocess.run(
        ["git", *args],
        check=False,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
    )
    if result.returncode != 0:
        return set()
    return {line.strip() for line in result.stdout.splitlines() if line.strip()}


def changed_files() -> set[str]:
    changed = git_lines("diff", "--name-only")
    changed |= git_lines("diff", "--name-only", "--cached")
    changed |= git_lines("ls-files", "--others", "--exclude-standard")
    return changed


def has_prefix(path: str, prefixes: tuple[str, ...]) -> bool:
    return any(path == prefix.rstrip("/") or path.startswith(prefix) for prefix in prefixes)


def main() -> int:
    if not Path(".git").exists():
        return 0

    changed = changed_files()
    if not changed:
        return 0

    messages: list[str] = []

    if changed & AI_DOCS:
        messages.append(
            "AI docs changed: confirm AI_GUIDE.md remains the single source of truth."
        )

    if any(has_prefix(path, UI_PREFIXES) for path in changed):
        messages.append(
            "UI files changed: verify quietness, mode boundaries, and responsive behavior."
        )

    if any(has_prefix(path, CODEX_POLICY_PREFIXES) for path in changed):
        messages.append(
            "Codex policy changed: run execpolicy checks and review hook trust before relying on it."
        )

    if messages:
        print("[wakadori stop-check]")
        for message in messages:
            print(f"- {message}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
