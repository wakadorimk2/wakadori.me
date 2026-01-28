(() => {
  const pcShelfMq = window.matchMedia(
    "(hover:hover) and (pointer:fine) and (min-width:800px)"
  );

  const state = {
    enabled: false,
    shelf: null,
    back: null,
    front: null,
    moved: new Map(), // node -> { placeholder, parent }
    logged: false,
    hashGuard: false,
    allowProgrammaticFlip: false,
  };

  const supportsInert = "inert" in HTMLElement.prototype;

  const FOCUSABLE_SELECTOR = "a, button, input, textarea, select, [tabindex]";

  const setPanelActive = (panel) => {
    if (!panel) return;
    if (supportsInert) {
      panel.removeAttribute("inert");
    }
    panel.setAttribute("aria-hidden", "false");

    if (!supportsInert) {
      panel.querySelectorAll("[data-wk-tabindex]").forEach((node) => {
        const prev = node.getAttribute("data-wk-tabindex");
        if (prev === "") {
          node.removeAttribute("tabindex");
        } else {
          node.setAttribute("tabindex", prev);
        }
        node.removeAttribute("data-wk-tabindex");
      });
    }
  };

  const setPanelInactive = (panel) => {
    if (!panel) return;
    if (supportsInert) {
      panel.setAttribute("inert", "");
    }
    panel.setAttribute("aria-hidden", "true");

    if (!supportsInert) {
      panel.querySelectorAll(FOCUSABLE_SELECTOR).forEach((node) => {
        if (!node.hasAttribute("data-wk-tabindex")) {
          const current = node.getAttribute("tabindex");
          node.setAttribute("data-wk-tabindex", current ?? "");
        }
        node.setAttribute("tabindex", "-1");
      });
    }
  };

  const ensureGalleryHash = () => {
    if (state.hashGuard) return;
    const hash = location.hash.toLowerCase();
    if (hash === "#code") {
      state.hashGuard = true;
      if (history.replaceState) {
        history.replaceState(null, "", "#gallery");
      } else {
        location.hash = "#gallery";
      }
      state.hashGuard = false;
    }
  };

  const isFlipTrigger = (target) => {
    if (!(target instanceof Element)) return false;
    return (
      target.closest("#wkOrbToggle") ||
      target.closest('[data-wk-action="code"]')
    );
  };

  const isFromFront = (target) => {
    if (!(target instanceof Node)) return false;
    if (!state.front) return false;
    return state.front.contains(target);
  };

  const interceptFlip = (ev) => {
    if (!pcShelfMq.matches) return;
    if (state.allowProgrammaticFlip) return;
    if (!isFromFront(ev.target)) return;
    if (!isFlipTrigger(ev.target)) return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
  };

  const normalizeFlipState = () => {
    const flip = document.getElementById("wkFlip");
    const orbToggle = document.getElementById("wkOrbToggle");
    if (!flip || !orbToggle) return;
    if (!flip.classList.contains("is-flipped")) return;
    state.allowProgrammaticFlip = true;
    orbToggle.click();
    state.allowProgrammaticFlip = false;
  };

  const onHashChange = () => {
    if (!pcShelfMq.matches) return;
    ensureGalleryHash();
    normalizeFlipState();
    setPanelActive(state.front);
    setPanelInactive(state.back);
  };

  const markTiltAdded = (el) => {
    if (!el || !(el instanceof HTMLElement)) return;
    if (!el.classList.contains("wk-tilt-tile")) {
      el.classList.add("wk-tilt-tile");
      el.setAttribute("data-wk-tilt-added", "1");
    }
  };

  const unmarkTiltAdded = (el) => {
    if (!el || !(el instanceof HTMLElement)) return;
    if (el.getAttribute("data-wk-tilt-added") === "1") {
      el.classList.remove("wk-tilt-tile");
      el.removeAttribute("data-wk-tilt-added");
    }
  };

  const tiltify = (root) => {
    markTiltAdded(root);
    root
      .querySelectorAll(
        ".wk-deck-card, .wk-shot, .wk-back-linklist a, [role='button'][tabindex='0']"
      )
      .forEach((el) => markTiltAdded(el));
  };

  const untiltify = (root) => {
    unmarkTiltAdded(root);
    root
      .querySelectorAll("[data-wk-tilt-added='1']")
      .forEach((el) => unmarkTiltAdded(el));
  };

  const findBackRoot = () => {
    return (
      document.getElementById("wkBack") ||
      document.querySelector(".wk-back") ||
      document.querySelector('[data-wk-face="back"]')
    );
  };

  const collectCardGroups = (back) => {
    const results = new Set();
    if (!back) return [];

    const add = (el) => {
      if (!el || !(el instanceof Element)) return;
      if (el === back) return;
      if (!back.contains(el)) return;
      if (el.closest(".wk-back-hero, header")) return;
      results.add(el);
    };

    back.querySelectorAll(".wk-snapshots, .wk-back-links").forEach(add);

    back.querySelectorAll(".wk-shot, .wk-deck-card").forEach((card) => {
      const container =
        card.closest(".wk-snapshots") ||
        card.closest(".wk-deck") ||
        card.parentElement;
      add(container);
    });

    back.querySelectorAll("section, div, ul").forEach((el) => {
      if (results.has(el)) return;
      if (el.closest(".wk-back-hero, header")) return;
      const hasDeckCard = el.querySelector(".wk-deck-card, .wk-shot");
      const hasButtonish = el.querySelector("[role='button'][tabindex='0']");
      const classHint =
        typeof el.className === "string" &&
        /\bwk-.*(card|shot|snap|link)/.test(el.className);
      if ((hasDeckCard || hasButtonish) && classHint) {
        add(el);
      }
    });

    return [...results];
  };

  const moveGroupsToShelf = (groups) => {
    if (!state.shelf) return;
    groups.forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      if (node.dataset.wkMoved === "1") return;
      const parent = node.parentNode;
      if (!parent) return;
      const placeholder = document.createComment("wk-back-placeholder");
      parent.insertBefore(placeholder, node);
      state.moved.set(node, { placeholder, parent });
      state.shelf.appendChild(node);
      node.dataset.wkMoved = "1";
      tiltify(node);
    });
  };

  const restoreGroups = () => {
    state.moved.forEach(({ placeholder, parent }, node) => {
      if (!parent || !placeholder?.parentNode) return;
      untiltify(node);
      placeholder.parentNode.insertBefore(node, placeholder);
      placeholder.remove();
      node.removeAttribute("data-wk-moved");
    });
    state.moved.clear();
  };

  const enablePcShelfMode = () => {
    if (state.enabled) return;
    state.enabled = true;

    state.shelf = document.querySelector(".wk-cards");
    state.back = findBackRoot();
    state.front = document.getElementById("wkFront");

    if (!state.shelf || !state.back || !state.front) {
      state.enabled = false;
      return;
    }

    ensureGalleryHash();
    normalizeFlipState();
    setPanelActive(state.front);
    setPanelInactive(state.back);

    const groups = collectCardGroups(state.back);
    if (!state.logged) {
      const summary = groups.map((el) => {
        const id = el.id ? `#${el.id}` : "";
        const cls =
          typeof el.className === "string" && el.className.trim()
            ? `.${el.className.trim().replace(/\s+/g, ".")}`
            : "";
        return `${el.tagName.toLowerCase()}${id}${cls}`;
      });
      console.info("[wkPcShelf] back card groups:", summary);
      state.logged = true;
    }
    moveGroupsToShelf(groups);
  };

  const disablePcShelfMode = () => {
    if (!state.enabled) return;
    state.enabled = false;

    restoreGroups();
    // Back/frontの最終状態は既存card.jsに委ねるため、ここでは強制しない。
  };

  const syncMode = () => {
    if (pcShelfMq.matches) {
      enablePcShelfMode();
    } else {
      disablePcShelfMode();
    }
  };

  const init = () => {
    document.addEventListener("click", interceptFlip, true);
    document.addEventListener(
      "keydown",
      (ev) => {
        if (!pcShelfMq.matches) return;
        if (state.allowProgrammaticFlip) return;
        if (ev.key !== "Enter" && ev.key !== " ") return;
        if (!isFromFront(ev.target)) return;
        if (!isFlipTrigger(ev.target)) return;
        ev.preventDefault();
        ev.stopImmediatePropagation();
      },
      true
    );
    window.addEventListener("hashchange", onHashChange);
    if (pcShelfMq.addEventListener) {
      pcShelfMq.addEventListener("change", syncMode);
    } else if (pcShelfMq.addListener) {
      pcShelfMq.addListener(syncMode);
    }
    syncMode();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();

