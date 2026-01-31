(() => {
  // PC棚モード判定（hover可能 + 精密ポインタ + 幅800px以上）
  const pcShelfMq = window.matchMedia("(hover:hover) and (pointer:fine) and (min-width:800px)");
  const isPcShelfMode = () => pcShelfMq.matches;
  const root = document.documentElement;

  const isShelfContext = () => {
    const params = new URLSearchParams(location.search);
    const hasUrlTrigger = params.get("shelf") === "1";
    let isEmbedded = false;
    try {
      isEmbedded = window.self !== window.top;
    } catch {
      isEmbedded = true;
    }
    return hasUrlTrigger || isEmbedded;
  };
  const isShelfActive = () => isPcShelfMode() && isShelfContext();

  // --- Shelf Tiles (#48) ---
  const shelfTilesContainerId = "wkShelfTiles";
  let shelfPlaceholders = []; // { placeholder: Comment, img: HTMLImageElement, originalParent: Element }
  const shelfTiltMq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const shelfTiltBindings = new Map();
  const SHELF_TILT_MAX = 4; // degrees (subtle)
  const SHELF_TILT_PERSPECTIVE = 700;

  const clamp01 = (value) => Math.max(0, Math.min(1, value));

  const getShelfTiltTarget = (tile) => {
    if (!tile || !(tile instanceof Element)) {
      return null;
    }
    const target = tile.querySelector(".wk-shelf-media") || tile.firstElementChild;
    if (!target || !(target instanceof HTMLElement)) {
      return null;
    }
    return target;
  };

  const resetShelfTilt = (tile) => {
    const target = getShelfTiltTarget(tile);
    if (!target) return;
    target.style.transform = "";
    target.style.willChange = "";
  };

  const bindShelfTileTilt = (tile) => {
    if (!tile || !(tile instanceof HTMLElement)) return;
    if (tile.dataset.wkShelfTilt === "1") return;
    const target = getShelfTiltTarget(tile);
    if (!target) return;

    const handlePointerMove = (ev) => {
      if (!isShelfActive() || shelfTiltMq.matches) {
        resetShelfTilt(tile);
        return;
      }
      if (ev.pointerType === "touch") return;

      const rect = tile.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const px = clamp01((ev.clientX - rect.left) / rect.width);
      const py = clamp01((ev.clientY - rect.top) / rect.height);
      const rx = (0.5 - py) * SHELF_TILT_MAX;
      const ry = (px - 0.5) * SHELF_TILT_MAX;

      target.style.willChange = "transform";
      target.style.transform =
        `perspective(${SHELF_TILT_PERSPECTIVE}px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    };

    const handlePointerLeave = () => resetShelfTilt(tile);
    const handlePointerUp = () => resetShelfTilt(tile);
    const handlePointerCancel = () => resetShelfTilt(tile);

    tile.addEventListener("pointermove", handlePointerMove);
    tile.addEventListener("pointerleave", handlePointerLeave);
    tile.addEventListener("pointerup", handlePointerUp);
    tile.addEventListener("pointercancel", handlePointerCancel);

    shelfTiltBindings.set(tile, {
      handlePointerMove,
      handlePointerLeave,
      handlePointerUp,
      handlePointerCancel
    });
    tile.dataset.wkShelfTilt = "1";
  };

  const unbindShelfTileTilt = (tile) => {
    if (!tile || !(tile instanceof HTMLElement)) return;
    const handlers = shelfTiltBindings.get(tile);
    if (handlers) {
      tile.removeEventListener("pointermove", handlers.handlePointerMove);
      tile.removeEventListener("pointerleave", handlers.handlePointerLeave);
      tile.removeEventListener("pointerup", handlers.handlePointerUp);
      tile.removeEventListener("pointercancel", handlers.handlePointerCancel);
      shelfTiltBindings.delete(tile);
    }
    tile.removeAttribute("data-wk-shelf-tilt");
    resetShelfTilt(tile);
  };

  const initShelfTileTilt = () => {
    if (!isShelfActive()) return;
    if (shelfTiltMq.matches) return;
    document.querySelectorAll(".wk-shelf-tile").forEach(bindShelfTileTilt);
  };

  const teardownShelfTileTilt = () => {
    document.querySelectorAll(".wk-shelf-tile").forEach(unbindShelfTileTilt);
  };

  const buildShelfTiles = () => {
    // 既に構築済みなら何もしない
    if (document.getElementById(shelfTilesContainerId)) return;

    const frontContent = document.querySelector(".wk-front-content");
    if (!frontContent) return;

    // コンテナ生成
    const container = document.createElement("div");
    container.id = shelfTilesContainerId;
    container.className = "wk-shelf-tiles";
    frontContent.appendChild(container);

    // 対象画像を収集: ポータル画像 + スナップショット画像
    const portalImages = document.querySelectorAll(".wk-portal-image");
    const snapshotImages = document.querySelectorAll(".wk-shot-preview");
    const allImages = [...portalImages, ...snapshotImages];

    shelfPlaceholders = [];

    allImages.forEach((img, idx) => {
      // 元位置にplaceholder挿入
      const placeholder = document.createComment(`wk-shelf-placeholder-${idx}`);
      const originalParent = img.parentNode;
      originalParent.insertBefore(placeholder, img);

      // 記録
      shelfPlaceholders.push({ placeholder, img, originalParent });

      // タイルラッパー生成
      const tile = document.createElement("div");
      tile.className = "wk-shelf-tile";
      tile.appendChild(img);
      container.appendChild(tile);
    });
  };

  const teardownShelfTiles = () => {
    const container = document.getElementById(shelfTilesContainerId);
    if (!container) return;

    teardownShelfTileTilt();

    // 各画像を元位置に戻す
    shelfPlaceholders.forEach(({ placeholder, img }) => {
      if (placeholder.parentNode) {
        placeholder.parentNode.insertBefore(img, placeholder);
        placeholder.parentNode.removeChild(placeholder);
      }
    });

    shelfPlaceholders = [];

    // コンテナ削除
    container.remove();
  };

  const syncShelfModeFlag = () => {
    if (!root) return;
    const shouldEnable = isShelfActive();
    if (shouldEnable) {
      root.setAttribute("data-wk-mode", "shelf");
      buildShelfTiles();
      initShelfTileTilt();
    } else {
      teardownShelfTiles();
      root.removeAttribute("data-wk-mode");
    }
  };

  syncShelfModeFlag();

  const handleShelfTiltMotionChange = () => {
    if (!isShelfActive()) return;
    if (shelfTiltMq.matches) {
      teardownShelfTileTilt();
      return;
    }
    initShelfTileTilt();
  };

  if (typeof shelfTiltMq.addEventListener === "function") {
    shelfTiltMq.addEventListener("change", handleShelfTiltMotionChange);
  } else if (typeof shelfTiltMq.addListener === "function") {
    shelfTiltMq.addListener(handleShelfTiltMotionChange);
  }

  if (typeof pcShelfMq.addEventListener === "function") {
    pcShelfMq.addEventListener("change", syncShelfModeFlag);
  } else if (typeof pcShelfMq.addListener === "function") {
    pcShelfMq.addListener(syncShelfModeFlag);
  }

  const card = document.getElementById("wkCard");
  const flip = document.getElementById("wkFlip");
  const orbToggle = document.getElementById("wkOrbToggle");
  const front = document.getElementById("wkFront");
  const back = document.getElementById("wkBack");
  const entryButtons = document.querySelectorAll(
    '[data-wk-action="illustration"], [data-wk-action="code"]'
  );
  const illustPeek = document.getElementById("wkIllustPeek");
  const illustButton = document.querySelector('[data-wk-action="illustration"]');
  const codeButton = document.querySelector('[data-wk-action="code"]');

  if (!card || !flip || !orbToggle || !front || !back || !illustPeek || !illustButton || !codeButton) {
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
    // 棚モード中は flip（裏面表示）を許可しない
    if (flipped && isShelfActive()) return;

    isFlipped = flipped;
    flip.classList.toggle("is-flipped", flipped);
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
    // 棚モード中は flip しない
    if (isShelfActive()) return;

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
        // 棚モード中は flip しない
        if (isShelfActive()) return;
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
      // 棚モード中は #code を無視し、表の状態に寄せる
      if (isShelfActive()) {
        if (history.replaceState) {
          history.replaceState(null, "", location.pathname + location.search);
        }
        setState(false, { updateHash: false, moveFocus: true, fallbackFocusEl: orbToggle });
      } else {
        setState(true, { updateHash: false, moveFocus: true, fallbackFocusEl: orbToggle });
      }
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

  // 棚モード判定を外部公開（#47 #48 から参照可能）
  window.wkIsPcShelfMode = isShelfActive;

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
  let lastPointerType = "mouse";

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const isOnInteractive = (target) => {
    if (!target || !(target instanceof Element)) {
      return false;
    }
    return target.closest(TILT_INTERACTIVE_SELECTOR) !== null;
  };

  const canTiltFor = (pointerType) => {
    if (prefersReducedMotion.matches) return false;
    if (pointerType === "touch") return true;
    if (pointerType === "pen") {
      // Pen is treated as hover-capable only when the environment supports hover.
      return supportsHover.matches;
    }
    return supportsHover.matches;
  };

  // Viewer open時はtiltを止める
  const isDeckTiltBlocked = () => {
    if (typeof window.wkIsViewerOpen === "function" && window.wkIsViewerOpen()) {
      return true;
    }
    return false;
  };

  const applyTilt = () => {
    if (!pendingTilt) {
      return;
    }
    const { px, py } = pendingTilt;
    pendingTilt = null;
    rafId = null;

    if (!canTiltFor(lastPointerType)) {
      return;
    }
    // px, py: 0〜1 (左上が0,0) → dx, dy: -1〜1 (中心が0)
    const dx = clamp((px - 0.5) * 2, -1, 1);
    const dy = clamp((py - 0.5) * 2, -1, 1);
    // tiltY: ポインタが右(dx>0) → 右端が手前 → rotateY負
    // tiltX: ポインタが下(dy>0) → 下端が手前 → rotateX正
    const tiltY = -dx * MAX_TILT;
    const tiltX = dy * MAX_TILT;
    card.style.setProperty("--tilt-y", `${tiltY}deg`);
    card.style.setProperty("--tilt-x", `${tiltX}deg`);
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

  const scheduleTilt = (px, py) => {
    pendingTilt = { px, py };
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
    lastPointerType = ev.pointerType;
    if (!canTiltFor(ev.pointerType)) return;
    if (isOnInteractive(ev.target)) return;
    if (isDeckTiltBlocked()) return;
    // PC棚モード中は全体tiltを無効化
    if (isShelfActive()) return;

    isTiltActive = true;
    card.classList.add("is-tilting");

    // タッチ: 初期位置でtiltを適用
    if (ev.pointerType === "touch") {
      const rect = cardShell.getBoundingClientRect();
      const px = (ev.clientX - rect.left) / rect.width;
      const py = (ev.clientY - rect.top) / rect.height;
      scheduleTilt(px, py);
    }
  };

  const handlePointerEnter = (ev) => {
    // タッチでは pointerenter は信頼できないのでマウスのみ
    if (ev.pointerType !== "mouse") return;
    lastPointerType = ev.pointerType;
    if (!canTiltFor(ev.pointerType)) return;
    if (isOnInteractive(ev.target)) return;
    if (isDeckTiltBlocked()) return;
    // PC棚モード中は全体tiltを無効化
    if (isShelfActive()) return;

    isTiltActive = true;
    card.classList.add("is-tilting");
  };

  const handlePointerMove = (ev) => {
    lastPointerType = ev.pointerType;
    if (!canTiltFor(ev.pointerType)) return;
    if (!isTiltActive) return;
    // PC棚モード中は全体tiltを無効化
    if (isShelfActive()) {
      isTiltActive = false;
      resetTilt();
      return;
    }

    if (isOnInteractive(ev.target)) {
      isTiltActive = false;
      resetTilt();
      return;
    }
    if (isDeckTiltBlocked()) {
      isTiltActive = false;
      resetTilt();
      return;
    }

    const rect = cardShell.getBoundingClientRect();
    const px = (ev.clientX - rect.left) / rect.width;
    const py = (ev.clientY - rect.top) / rect.height;
    scheduleTilt(px, py);
  };

  const handlePointerUp = (ev) => {
    // マウス: hover継続なので何もしない
    // タッチ: 指を離したら復帰
    if (ev.pointerType === "touch") {
      isTiltActive = false;
      resetTilt();
    }
  };

  const handlePointerLeave = (ev) => {
    // マウスのみ（タッチは pointerup で処理）
    if (ev.pointerType !== "mouse") return;
    isTiltActive = false;
    resetTilt();
  };

  const handlePointerCancel = () => {
    // タッチでもマウスでもキャンセル時はリセット
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
