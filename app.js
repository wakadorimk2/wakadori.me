(() => {
  const card = document.getElementById("wkCard");
  const orbToggle = document.getElementById("wkOrbToggle");
  const front = document.getElementById("wkFront");
  const back = document.getElementById("wkBack");
  const entryButtons = document.querySelectorAll("[data-wk-action]");
  const illustPeek = document.getElementById("wkIllustPeek");
  const illustButton = document.querySelector('[data-wk-action="illustration"]');
  const codeButton = document.querySelector('[data-wk-action="code"]');

  if (!card || !orbToggle || !front || !back) {
    return;
  }

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
  };

  const toggle = (ev) => {
    setState(!isFlipped, {
      updateHash: true,
      fallbackFocusEl: ev?.currentTarget || null,
      moveFocus: false,
    });
  };

  orbToggle.addEventListener("click", toggle);

  const isPeekVisible = () => {
    if (!illustPeek || illustPeek.hidden) {
      return false;
    }
    const rects = illustPeek.getClientRects();
    return rects.length > 0;
  };

  const schedulePeekFocus = () => {
    if (!illustPeek) {
      return;
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (isPeekVisible() && typeof illustPeek.focus === "function") {
          illustPeek.focus({ preventScroll: true });
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
    if (hash === "#code") {
      setState(true, { updateHash: false, moveFocus: true, fallbackFocusEl: orbToggle });
      setIllustPeek(false, { returnFocus: false });
    } else if (hash === "#gallery") {
      setState(false, { updateHash: false, moveFocus: true, fallbackFocusEl: orbToggle });
      setIllustPeek(false, { returnFocus: false });
    } else if (hash === "" || hash === "#") {
      // Empty/root hash → show default view (do not add or overwrite the hash)
      setState(false, { updateHash: false, moveFocus: true, fallbackFocusEl: orbToggle });
      setIllustPeek(false, { returnFocus: false });
    } else {
      // Unknown hash → show default view (preserve the existing hash)
      setState(false, { updateHash: false, moveFocus: true, fallbackFocusEl: orbToggle });
      setIllustPeek(false, { returnFocus: false });
    }
  };

  syncFromHash();
  window.addEventListener("hashchange", syncFromHash);
})();
