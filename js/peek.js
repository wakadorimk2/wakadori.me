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
  const supportsInert = "inert" in HTMLElement.prototype;
  const FOCUSABLE_SELECTOR = "a, button, input, textarea, select, [tabindex]";
  const OVERLAY_TABINDEX_ATTR = "data-wk-overlay-tabindex";

  const setOverlayInert = (active) => {
    if (!cardShell) return;
    if (supportsInert) {
      if (active) {
        cardShell.setAttribute("inert", "");
      } else {
        cardShell.removeAttribute("inert");
      }
      return;
    }

    const nodes = cardShell.querySelectorAll(FOCUSABLE_SELECTOR);
    nodes.forEach((node) => {
      if (active) {
        if (node.hasAttribute(OVERLAY_TABINDEX_ATTR)) return;
        const current = node.getAttribute("tabindex");
        node.setAttribute(OVERLAY_TABINDEX_ATTR, current === null ? "" : current);
        node.setAttribute("tabindex", "-1");
        return;
      }
      if (!node.hasAttribute(OVERLAY_TABINDEX_ATTR)) return;
      const prev = node.getAttribute(OVERLAY_TABINDEX_ATTR);
      if (prev === "") {
        node.removeAttribute("tabindex");
      } else {
        node.setAttribute("tabindex", prev);
      }
      node.removeAttribute(OVERLAY_TABINDEX_ATTR);
    });
  };

  let lastFocusedEl = null;
  let isOpen = false;
  let isClosing = false;

  // Pointer tracking for swipe/drag detection (prevent accidental close)
  let pointerStart = null;
  const MOVE_THRESHOLD = 20; // px

  const openPeekCard = (data = {}) => {
    if (isOpen || isClosing) return;
    lastFocusedEl = document.activeElement;
    isOpen = true;

    const safeData = data && typeof data === "object" ? data : {};
    peekImg.src = safeData.src || "";
    peekImg.alt = safeData.alt || "";

    overlay.classList.add("is-opening");
    overlay.hidden = false;
    document.body.classList.add("has-peek-open");

    // Make card shell inert while peek is open
    setOverlayInert(true);

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
      setOverlayInert(false);

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
