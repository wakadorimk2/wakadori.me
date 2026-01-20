(() => {
  const card = document.getElementById("wkCard");
  const flipBtn = document.getElementById("wkFlipBtn");
  const peekTab = document.getElementById("wkPeekTab");
  const front = document.getElementById("wkFront");
  const back = document.getElementById("wkBack");
  const peekText = peekTab ? peekTab.querySelector(".wk-peek-text") : null;

  if (!card || !flipBtn || !peekTab || !front || !back) {
    return;
  }

  let isFlipped = false;

  const updateInteractable = (panel, { active }) => {
    if (!panel) {
      return;
    }

    if (active) {
      panel.removeAttribute("inert");
      panel.setAttribute("aria-hidden", "false");

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
        } else if (node.getAttribute("tabindex") === "-1") {
          node.removeAttribute("tabindex");
        }
      });
      return;
    }

    panel.setAttribute("inert", "");
    panel.setAttribute("aria-hidden", "true");

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

  const setState = (flipped, { updateHash = true } = {}) => {
    isFlipped = flipped;
    card.classList.toggle("is-flipped", flipped);

    const label = flipped ? "Show Gallery" : "Show Code/UI";

    flipBtn.textContent = label;
    flipBtn.setAttribute("aria-pressed", String(flipped));
    flipBtn.setAttribute("aria-label", label);
    peekTab.setAttribute("aria-pressed", String(flipped));
    peekTab.setAttribute("aria-label", label);

    if (peekText) {
      peekText.textContent = flipped ? "Gallery" : "Code";
    }

    updateInteractable(front, { active: !flipped });
    updateInteractable(back, { active: flipped });

    const focused = focusFirstInPanel(flipped ? back : front);
    if (!focused) {
      flipBtn.focus();
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

  const toggle = () => {
    setState(!isFlipped, { updateHash: true });
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
      setState(false, { updateHash: false });
    }
  };

  syncFromHash();
  window.addEventListener("hashchange", syncFromHash);
})();
