(() => {
  const card = document.getElementById("wkCard");
  const orbToggle = document.getElementById("wkOrbToggle");
  const front = document.getElementById("wkFront");
  const back = document.getElementById("wkBack");
  const entryButtons = document.querySelectorAll("[data-wk-action]");
  const illustPeek = document.getElementById("wkIllustPeek");
  const illustButton = document.querySelector('[data-wk-action="illustration"]');
  const codeButton = document.querySelector('[data-wk-action="code"]');

  if (!card || !orbToggle || !front || !back || !illustPeek || !illustButton || !codeButton) {
    return;
  }

  // Avoid JS gesture interception due to potential scroll/a11y (VoiceOver) impact; prefer CSS touch-action: manipulation.

  let isFlipped = false;
  let lastIllustTrigger = null;
  const supportsInert = "inert" in HTMLElement.prototype;
  // Use native `inert` when available (Chromium/Safari/Firefox 112+).
  // Fallback path only manages focusability via tabindex and aria-hidden; it does NOT
  // block pointer events or exclude content from find-in-page. For full inert behavior
  // in older browsers, include a proven inert polyfill (e.g. WICG/inert) at the app level.

  const updateInteractable = (panel, { active }) => {
    if (!panel) {
      return;
    }

    if (active) {
      if (supportsInert) {
        panel.removeAttribute("inert");
      }
      panel.setAttribute("aria-hidden", "false");

      if (!supportsInert) {
        const nodes = panel.querySelectorAll("a, button, input, textarea, select, [tabindex]");
        nodes.forEach((node) => {
          if (node.hasAttribute("data-wk-tabindex")) {
            const prev = node.getAttribute("data-wk-tabindex");
            if (prev === "") {
              node.removeAttribute("tabindex");
            } else {
              node.setAttribute("tabindex", prev);
            }
            node.removeAttribute("data-wk-tabindex");
          }
        });
      }
      return;
    }

    if (supportsInert) {
      panel.setAttribute("inert", "");
    }
    panel.setAttribute("aria-hidden", "true");

    if (!supportsInert) {
      const nodes = panel.querySelectorAll("a, button, input, textarea, select, [tabindex]");
      nodes.forEach((node) => {
        if (!node.hasAttribute("data-wk-tabindex")) {
          const current = node.getAttribute("tabindex");
          if (current === null) {
            node.setAttribute("data-wk-tabindex", "");
          } else {
            node.setAttribute("data-wk-tabindex", current);
          }
        }
        node.setAttribute("tabindex", "-1");
      });
    }
  };

  const focusFirstInPanel = (panel) => {
    if (!panel) {
      return false;
    }

    const target = panel.querySelector(
      "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"
    );

    if (target && typeof target.focus === "function") {
      target.focus();
      return true;
    }

    return false;
  };

  const setState = (
    flipped,
    { updateHash = true, fallbackFocusEl = null, moveFocus = true } = {}
  ) => {
    isFlipped = flipped;
    card.classList.toggle("is-flipped", flipped);

    const label = flipped ? "Show Gallery" : "Show Code/UI";
    orbToggle.setAttribute("aria-pressed", String(flipped));
    orbToggle.setAttribute("aria-label", label);

    if (codeButton) {
      codeButton.setAttribute("aria-expanded", String(flipped));
    }

    updateInteractable(front, { active: !flipped });
    updateInteractable(back, { active: flipped });

    if (moveFocus) {
      const focused = focusFirstInPanel(flipped ? back : front);
      if (!focused) {
        const fallback = fallbackFocusEl || orbToggle;
        if (fallback && typeof fallback.focus === "function") {
          fallback.focus();
        }
      }
    }

    if (updateHash) {
      const hash = flipped ? "#code" : "#gallery";
      if (history.replaceState) {
        history.replaceState(null, "", hash);
      } else {
        location.hash = hash;
      }
    }

    // 束の選択を解除（Hand-fan Deck）
    if (typeof window.wkClearDeckSelections === "function") {
      window.wkClearDeckSelections();
    }
  };

  const toggle = (ev) => {
    // If peek card is open, close it first before flipping
    if (typeof window.wkIsPeekOpen === "function" && window.wkIsPeekOpen()) {
      const PEEK_ANIM_MS = window.WK_PEEK_ANIM_MS || 500;
      window.wkClosePeekCard();
      // Wait for close animation, then flip
      setTimeout(() => {
        setState(!isFlipped, {
          updateHash: true,
          fallbackFocusEl: ev?.currentTarget || null,
          moveFocus: false,
        });
      }, PEEK_ANIM_MS + 50);
      return;
    }

    setState(!isFlipped, {
      updateHash: true,
      fallbackFocusEl: ev?.currentTarget || null,
      moveFocus: false,
    });
  };

  orbToggle.addEventListener("click", toggle);

  const isPeekVisible = (target = illustPeek) => {
    if (!target || target.hidden || !target.isConnected) {
      return false;
    }
    const rects = target.getClientRects();
    return rects.length > 0;
  };

  const canFocus = (target) => {
    if (!target || typeof target.focus !== "function") {
      return false;
    }
    if (!target.isConnected || target.hidden) {
      return false;
    }
    const rects = target.getClientRects();
    return rects.length > 0;
  };

  const focusIfAvailable = (target) => {
    if (canFocus(target)) {
      target.focus({ preventScroll: true });
      return true;
    }
    return false;
  };

  const schedulePeekFocus = () => {
    if (!illustPeek) {
      return;
    }
    const target = illustPeek;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (isPeekVisible(target)) {
          focusIfAvailable(target);
        }
      });
    });
  };

  const setIllustPeek = (
    open,
    { triggerEl = null, moveFocusToPeek = false, returnFocus = true } = {}
  ) => {
    if (!illustPeek) {
      return;
    }
    const button = triggerEl || illustButton;
    if (open) {
      lastIllustTrigger = button || document.activeElement;
      illustPeek.hidden = false;
      if (button) {
        button.setAttribute("aria-expanded", "true");
      }
      if (moveFocusToPeek) {
        schedulePeekFocus();
      }
      return;
    }

    illustPeek.hidden = true;
    if (button) {
      button.setAttribute("aria-expanded", "false");
    }
    if (returnFocus) {
      const fallback = lastIllustTrigger || button;
      if (fallback && typeof fallback.focus === "function") {
        fallback.focus({ preventScroll: true });
      }
    }
  };

  entryButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.getAttribute("data-wk-action");
      if (action === "code") {
        setIllustPeek(false, { returnFocus: false });
        setState(true, { updateHash: true, fallbackFocusEl: button, moveFocus: true });
        return;
      }
      if (action === "illustration") {
        const willOpen = illustPeek ? illustPeek.hidden : true;
        setIllustPeek(willOpen, {
          triggerEl: button,
          moveFocusToPeek: willOpen,
          returnFocus: !willOpen,
        });
      }
    });
  });

  const syncFromHash = () => {
    const hash = location.hash.toLowerCase();
    setIllustPeek(false, { returnFocus: true });
    if (hash === "#code") {
      setState(true, { updateHash: false, moveFocus: true, fallbackFocusEl: orbToggle });
    } else if (hash === "#gallery") {
      setState(false, { updateHash: false, moveFocus: true, fallbackFocusEl: orbToggle });
    } else if (hash === "" || hash === "#") {
      // Empty/root hash → show default view (do not add or overwrite the hash)
      setState(false, { updateHash: false, moveFocus: true, fallbackFocusEl: orbToggle });
    } else {
      // Unknown hash → show default view (preserve the existing hash)
      setState(false, { updateHash: false, moveFocus: true, fallbackFocusEl: orbToggle });
    }

    const active = document.activeElement;
    if (
      !active ||
      active === document.body ||
      (active instanceof HTMLElement &&
        (active.hidden || !active.isConnected || active.getClientRects().length === 0))
    ) {
      focusIfAvailable(orbToggle);
    }
  };

  syncFromHash();
  window.addEventListener("hashchange", syncFromHash);

  // --- Card Tilt (pointer-driven) ---
  // Reuse `card` (wkCard = .wk-card-rotator) defined at the top of this IIFE.
  const cardShell = document.querySelector(".wk-card-shell");

  if (!cardShell || !card) {
    return;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)");
  const MAX_TILT = 30; // degrees
  const LIFT_MIN = 5;  // px at center
  const LIFT_MAX = 16; // px at edge
  const TILT_INTERACTIVE_SELECTOR =
    "a[href], button, input, textarea, select, [tabindex]:not([tabindex='-1'])";

  let isTiltActive = false;
  let rafId = null;
  let pendingTilt = null;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const isOnInteractive = (target) => {
    if (!target || !(target instanceof Element)) {
      return false;
    }
    return target.closest(TILT_INTERACTIVE_SELECTOR) !== null;
  };

  const canTilt = () => supportsHover.matches && !prefersReducedMotion.matches;

  // Viewer open時はtiltを止める
  const isDeckTiltBlocked = (target) => {
    if (typeof window.wkIsViewerOpen === "function" && window.wkIsViewerOpen()) {
      return true;
    }
    return false;
  };

  const applyTilt = () => {
    if (!pendingTilt) {
      return;
    }
    const { nx, ny, px, py } = pendingTilt;
    pendingTilt = null;
    rafId = null;

    if (!canTilt()) {
      return;
    }
    card.style.setProperty("--tilt-y", `${nx * MAX_TILT}deg`);
    card.style.setProperty("--tilt-x", `${ny * MAX_TILT}deg`);
    // Pointer glow position (0〜100%)
    cardShell.style.setProperty("--px", `${px * 100}%`);
    cardShell.style.setProperty("--py", `${py * 100}%`);
    cardShell.style.setProperty("--glow-a", "1");
    // Lift: stronger at edges, weaker at center.
    // 0.707 ≈ 1/√2: max distance from center to corner in a unit square.
    // Assumes roughly square aspect ratio; acceptable for this card design.
    const dist = Math.sqrt((px - 0.5) ** 2 + (py - 0.5) ** 2) / 0.707; // 0〜1
    const lift = LIFT_MIN + (LIFT_MAX - LIFT_MIN) * dist;
    card.style.setProperty("--lift", `${lift}px`);
  };

  const scheduleTilt = (nx, ny, px, py) => {
    pendingTilt = { nx, ny, px, py };
    if (rafId === null) {
      rafId = requestAnimationFrame(applyTilt);
    }
  };

  const resetTilt = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    pendingTilt = null;
    card.classList.remove("is-tilting");
    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");
    cardShell.style.setProperty("--px", "50%");
    cardShell.style.setProperty("--py", "50%");
    cardShell.style.setProperty("--glow-a", "0");
    card.style.setProperty("--lift", "0px");
  };

  const handlePointerDown = (ev) => {
    if (ev.pointerType !== "mouse") {
      return;
    }
    if (!canTilt()) {
      return;
    }
    if (isOnInteractive(ev.target)) {
      return;
    }
    if (isDeckTiltBlocked(ev.target)) {
      return;
    }
    isTiltActive = true;
    card.classList.add("is-tilting");
  };

  const handlePointerEnter = (ev) => {
    if (ev.pointerType !== "mouse") {
      return;
    }
    if (!canTilt()) {
      return;
    }
    if (isOnInteractive(ev.target)) {
      return;
    }
    if (isDeckTiltBlocked(ev.target)) {
      return;
    }
    isTiltActive = true;
    card.classList.add("is-tilting");
  };

  const handlePointerMove = (ev) => {
    if (ev.pointerType !== "mouse") {
      return;
    }
    if (!canTilt()) {
      return;
    }
    if (!isTiltActive) {
      return;
    }
    if (isOnInteractive(ev.target)) {
      isTiltActive = false;
      resetTilt();
      return;
    }
    if (isDeckTiltBlocked(ev.target)) {
      isTiltActive = false;
      resetTilt();
      return;
    }
    const rect = cardShell.getBoundingClientRect();
    const px = (ev.clientX - rect.left) / rect.width;
    const py = (ev.clientY - rect.top) / rect.height;
    const nx = clamp((px - 0.5) * 2, -1, 1);
    const ny = clamp((py - 0.5) * 2, -1, 1);
    scheduleTilt(nx, ny, px, py);
  };

  const handlePointerUp = (ev) => {
    // no-op (mouse hover keeps tilt)
  };

  const handlePointerLeave = (ev) => {
    if (ev.pointerType !== "mouse") {
      return;
    }
    isTiltActive = false;
    resetTilt();
  };

  const handlePointerCancel = (ev) => {
    if (ev.pointerType !== "mouse") {
      return;
    }
    isTiltActive = false;
    resetTilt();
  };

  cardShell.addEventListener("pointerdown", handlePointerDown);
  cardShell.addEventListener("pointerenter", handlePointerEnter);
  cardShell.addEventListener("pointermove", handlePointerMove);
  cardShell.addEventListener("pointerup", handlePointerUp);
  cardShell.addEventListener("pointerleave", handlePointerLeave);
  cardShell.addEventListener("pointercancel", handlePointerCancel);
})();

// --- Hand-fan Deck (Issue #13) ---
(() => {
  const decks = document.querySelectorAll("[data-wk-deck]");
  if (!decks.length) return;

  const openPeekFromCard = (card) => {
    if (typeof window.wkOpenPeekCard !== "function") {
      return;
    }
    const img = card?.tagName === "IMG" ? card : card?.querySelector("img");
    if (img) {
      window.wkOpenPeekCard({ src: img.src, alt: img.alt });
    }
  };

  // グローバル互換（既存呼び出しの安全化）
  window.wkClearDeckSelections = () => {};
  window.wkIsDeckSelectionActive = () => false;

  // カードタップハンドラ
  decks.forEach((deck) => {
    const cards = deck.querySelectorAll(".wk-deck-card");
    cards.forEach((card) => {
      card.removeAttribute("aria-pressed");
      card.addEventListener("click", (ev) => {
        // リンク/ボタン上では選択しない
        if (ev.target.closest("a, button")) return;
        ev.stopPropagation();
        openPeekFromCard(card);
      });
      card.addEventListener("keydown", (ev) => {
        if (ev.target.closest("a, button")) return;
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          openPeekFromCard(card);
        }
      });
    });
  });
})();

// --- Peek Card Overlay (card pops out from deck) ---
(() => {
  const PEEK_ANIM_MS = 500;
  window.WK_PEEK_ANIM_MS = PEEK_ANIM_MS;

  const overlay = document.getElementById("wkPeekOverlay");
  const peekCard = document.getElementById("wkPeekCard");
  const peekImg = peekCard?.querySelector(".wk-peek-card__img");
  const peekClose = document.getElementById("wkPeekClose");
  if (!overlay || !peekCard || !peekImg) return;

  const cardShell = document.querySelector(".wk-card-shell");

  let lastFocusedEl = null;
  let isOpen = false;
  let isClosing = false;

  // Pointer tracking for swipe/drag detection (prevent accidental close)
  let pointerStart = null;
  const MOVE_THRESHOLD = 20; // px

  const openPeekCard = (data) => {
    if (isOpen || isClosing) return;
    lastFocusedEl = document.activeElement;
    isOpen = true;

    peekImg.src = data.src || "";
    peekImg.alt = data.alt || "";

    overlay.classList.add("is-opening");
    overlay.hidden = false;
    document.body.classList.add("has-peek-open");

    // Make card shell inert while peek is open
    if (cardShell) cardShell.setAttribute("inert", "");

    // Trigger reflow, then start animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.remove("is-opening");
        overlay.classList.add("is-open");
      });
    });

    // Focus the card for a11y
    peekCard.focus({ preventScroll: true });
  };

  const closePeekCard = () => {
    if (!isOpen || isClosing) return;
    isClosing = true;

    overlay.classList.add("is-closing");
    overlay.classList.remove("is-open");

    // Wait for animation before hiding
    setTimeout(() => {
      overlay.hidden = true;
      overlay.classList.remove("is-closing");
      document.body.classList.remove("has-peek-open");
      isOpen = false;
      isClosing = false;

      // Remove inert from card shell after overlay is fully closed
      if (cardShell) cardShell.removeAttribute("inert");

      if (lastFocusedEl && typeof lastFocusedEl.focus === "function") {
        lastFocusedEl.focus({ preventScroll: true });
      }
      lastFocusedEl = null;

      // Clear deck selection after close
      if (typeof window.wkClearDeckSelections === "function") {
        window.wkClearDeckSelections();
      }
    }, PEEK_ANIM_MS);
  };

  // Pointer tracking: only close if tap (not drag/swipe)
  overlay.addEventListener("pointerdown", (ev) => {
    if (peekCard.contains(ev.target)) return;
    pointerStart = { x: ev.clientX, y: ev.clientY };
  });

  overlay.addEventListener("pointerup", (ev) => {
    if (peekCard.contains(ev.target)) return;
    if (!pointerStart) return;

    const dx = Math.abs(ev.clientX - pointerStart.x);
    const dy = Math.abs(ev.clientY - pointerStart.y);
    pointerStart = null;

    // Only close if movement is below threshold (tap, not drag)
    if (dx < MOVE_THRESHOLD && dy < MOVE_THRESHOLD) {
      closePeekCard();
    }
  });

  overlay.addEventListener("pointercancel", () => {
    pointerStart = null;
  });

  peekClose?.addEventListener("click", () => {
    closePeekCard();
  });

  // Esc key
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && isOpen && !isClosing) {
      ev.preventDefault();
      ev.stopPropagation();
      closePeekCard();
    }
  });

  // Expose for deck integration
  window.wkOpenPeekCard = openPeekCard;
  window.wkClosePeekCard = closePeekCard;
  window.wkIsPeekOpen = () => isOpen;

  // Legacy alias for compatibility
  window.wkOpenViewer = (mode, data) => {
    if (mode === "preview") openPeekCard(data);
  };
  window.wkCloseViewer = closePeekCard;
  window.wkIsViewerOpen = () => isOpen;
})();

// --- External Link Confirmation Dialog ---
(() => {
  const dialog = document.getElementById("wkExternalDialog");
  const openLink = document.getElementById("wkExternalLink");
  const cancelButton = document.getElementById("wkExternalCancel");
  if (!dialog || !openLink) return;

  const backdrop = dialog.querySelector(".wk-external-dialog__backdrop");
  const cardShell = document.querySelector(".wk-card-shell");
  const main = document.querySelector("main");
  const inertTargets = [main, cardShell].filter(Boolean);
  let lastFocusedEl = null;

  const setInertForDialog = (active) => {
    inertTargets.forEach((el) => {
      if (active) {
        el.setAttribute("inert", "");
      } else {
        el.removeAttribute("inert");
      }
    });
  };

  const focusFirstInDialog = () => {
    const target = dialog.querySelector(
      "button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"
    );
    if (target && typeof target.focus === "function") {
      target.focus({ preventScroll: true });
    }
  };

  const openExternal = (href) => {
    lastFocusedEl = document.activeElement;
    openLink.href = href;
    dialog.hidden = false;
    setInertForDialog(true);
    focusFirstInDialog();
  };

  const closeExternal = () => {
    dialog.hidden = true;
    setInertForDialog(false);
    if (lastFocusedEl && typeof lastFocusedEl.focus === "function") {
      lastFocusedEl.focus({ preventScroll: true });
    }
    lastFocusedEl = null;
  };

  backdrop?.addEventListener("click", closeExternal);
  cancelButton?.addEventListener("click", closeExternal);

  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && !dialog.hidden) {
      ev.preventDefault();
      closeExternal();
    }
  });

  document.querySelectorAll('[data-wk-action="external"]').forEach((link) => {
    link.addEventListener("click", (ev) => {
      if (ev.button !== 0) return;
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      ev.preventDefault();
      openExternal(link.getAttribute("href") || "#");
    });
  });
})();
