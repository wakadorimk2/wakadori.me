# AI_GUIDE.md

This document is a lightweight guide for AI assistants (e.g. Copilot) working on this project.

It does not define strict rules or correct answers.
Its purpose is to share the **intent and philosophy** behind design and implementation decisions,
to help guide judgment when multiple options seem possible.

---

## What this project is

This UI is not a simple profile or self-introduction.

It is designed as an **entry point** —
a place that gently invites interaction, rather than explaining everything at once.

Clarity, balance, and a sense of touch are valued more than feature richness or information density.

---

## Information design principles

- The circular avatar image and the Japanese name **「わかどり」** are the primary identity anchors.
- The English name **“wakadori”** is secondary and should remain visually subtle.
- Text should suggest activity and atmosphere rather than fully explain it.
- Minimal links are preferred (currently Illustration / Tech).

---

## Front / Back structure

The card has a front and back, but this is **not** for increasing information volume.

- Front side:  
  Represents the *viewer-facing* aspect (e.g. Illustration, presence, impression).
- Back side:  
  Represents the *maker-facing* aspect (e.g. Code, UI, process, experimentation).

Switching sides is meant to feel like a **change in perspective**, not a reveal of hidden content.

The back side may show unfinished ideas, notes, or experiments.
Polish is not required there.

---

## Visual and interaction effects

Visual effects are not decorative by default — each has a role.

- 3D tilt / rotation  
  → gives a sense of physical presence and touch
- Diagonal gloss highlight  
  → small reward for interaction
- Circular dent and orb toggle  
  → visual justification for interaction
- Shadows and translucency  
  → softness and calm, not emphasis

These elements should be adjusted for balance, not removed unless their role is clearly replaced.

---

## Snapshot / placeholder areas

Empty or placeholder regions are intentional.

They represent **future growth space**, not missing features.
Do not aggressively fill them without a clear reason.

---

## Implementation guidance

When modifying code:

- Prefer small adjustments over large refactors.
- Naming, spacing, comments, and balance matter.
- Avoid adding features solely because they are possible.
- When unsure, choose the option that feels:
  - gentler
  - quieter
  - less intrusive

This project favors restraint.

---

## Final note

If a change feels technically correct but emotionally off,
it is probably not aligned yet.

Pause, reduce, and re-balance.
