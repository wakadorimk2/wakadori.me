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
  const supportsInert = "inert" in HTMLElement.prototype;
  const FOCUSABLE_SELECTOR = "a, button, input, textarea, select, [tabindex]";
  const DIALOG_TABINDEX_ATTR = "data-wk-dialog-tabindex";
  let lastFocusedEl = null;

  const setInertForDialog = (active) => {
    inertTargets.forEach((el) => {
      if (supportsInert) {
        if (active) {
          el.setAttribute("inert", "");
        } else {
          el.removeAttribute("inert");
        }
        return;
      }
      const nodes = el.querySelectorAll(FOCUSABLE_SELECTOR);
      nodes.forEach((node) => {
        if (active) {
          if (node.hasAttribute(DIALOG_TABINDEX_ATTR)) return;
          const current = node.getAttribute("tabindex");
          node.setAttribute(DIALOG_TABINDEX_ATTR, current === null ? "" : current);
          node.setAttribute("tabindex", "-1");
          return;
        }
        if (!node.hasAttribute(DIALOG_TABINDEX_ATTR)) return;
        const prev = node.getAttribute(DIALOG_TABINDEX_ATTR);
        if (prev === "") {
          node.removeAttribute("tabindex");
        } else {
          node.setAttribute("tabindex", prev);
        }
        node.removeAttribute(DIALOG_TABINDEX_ATTR);
      });
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
