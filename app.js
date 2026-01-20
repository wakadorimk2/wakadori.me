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
  // Use inert when available (Chromium/Safari/Firefox 120+); otherwise fallback.

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

  const setState = (flipped, { updateHash = true, fallbackFocusEl = null } = {}) => {
    isFlipped = flipped;
    card.classList.toggle("is-flipped", flipped);

    const label = flipped ? "Show Gallery" : "Show Code/UI";
    const peekLabel = flipped ? "Show Gallery" : "Show Code";
    const peekTextValue = flipped ? "Gallery" : "Code";

    flipBtn.textContent = label;
    flipBtn.setAttribute("aria-pressed", String(flipped));
    flipBtn.setAttribute("aria-label", label);
    peekTab.setAttribute("aria-pressed", String(flipped));
    peekTab.setAttribute("aria-label", peekLabel);
    if (peekText) {
      peekText.textContent = peekTextValue;
    }

    updateInteractable(front, { active: !flipped });
    updateInteractable(back, { active: flipped });

    const focused = focusFirstInPanel(flipped ? back : front);
    if (!focused) {
      const fallback = fallbackFocusEl || flipBtn;
      if (fallback && typeof fallback.focus === "function") {
        fallback.focus();
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
    setState(!isFlipped, { updateHash: true, fallbackFocusEl: ev?.currentTarget || null });
  };

  flipBtn.addEventListener("click", toggle);
  peekTab.addEventListener("click", toggle);

  const syncFromHash = () => {
    const hash = location.hash.toLowerCase();
    if (hash === "#code") {
      setState(true, { updateHash: false });
    } else if (hash === "#gallery") {
      setState(false, { updateHash: false });
    } else if (hash === "" || hash === "#") {
      setState(false, { updateHash: true });
    } else {
      // Explicitly handle unknown hash values by resetting to the default (unflipped) state.
      setState(false, { updateHash: true });
    }
  };

  syncFromHash();
  window.addEventListener("hashchange", syncFromHash);
})();
