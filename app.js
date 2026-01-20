(() => {
  const card = document.getElementById("wkCard");
  const flipBtn = document.getElementById("wkFlipBtn");
  const peekTab = document.getElementById("wkPeekTab");
  const peekText = document.querySelector(".wk-peek-text");
  const front = document.getElementById("wkFront");
  const back = document.getElementById("wkBack");

  if (!card || !flipBtn || !peekTab || !front || !back) {
    return;
  }

  let isFlipped = false;
  const supportsInert = "inert" in HTMLElement.prototype;
  // Use native `inert` when available (Chromium/Safari/Firefox 120+).
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
    const peekLabel = flipped ? "Show Gallery" : "Show Code";
    const peekTextValue = flipped ? "Gallery" : "Code";

    flipBtn.textContent = label;
    flipBtn.setAttribute("aria-pressed", String(flipped));
    peekTab.setAttribute("aria-pressed", String(flipped));
    peekTab.setAttribute("aria-label", peekLabel);
    if (peekText) {
      peekText.textContent = peekTextValue;
    }

    updateInteractable(front, { active: !flipped });
    updateInteractable(back, { active: flipped });

    if (moveFocus) {
      const focused = focusFirstInPanel(flipped ? back : front);
      if (!focused) {
        const fallback = fallbackFocusEl || flipBtn;
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

  flipBtn.addEventListener("click", toggle);
  peekTab.addEventListener("click", toggle);

  const syncFromHash = () => {
    const hash = location.hash.toLowerCase();
    if (hash === "#code") {
      setState(true, { updateHash: false, moveFocus: true });
    } else if (hash === "#gallery") {
      setState(false, { updateHash: false, moveFocus: true });
    } else if (hash === "" || hash === "#") {
      // Empty or root hash → show default view without modifying the URL
      setState(false, { updateHash: false, moveFocus: true });
    } else {
      // Unknown hash → reset to default state without overwriting the existing hash
      setState(false, { updateHash: false, moveFocus: true });
    }
  };

  syncFromHash();
  window.addEventListener("hashchange", syncFromHash);
})();
