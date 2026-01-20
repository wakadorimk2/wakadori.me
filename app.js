(() => {
  const card = document.getElementById("wkCard");
  const flipBtn = document.getElementById("wkFlipBtn");
  const peekTab = document.getElementById("wkPeekTab");
  const peekText = peekTab ? peekTab.querySelector(".wk-peek-text") : null;

  if (!card || !flipBtn || !peekTab) {
    return;
  }

  let isFlipped = false;

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
    } else if (hash === "") {
      setState(false, { updateHash: true });
    }
  };

  syncFromHash();
  window.addEventListener("hashchange", syncFromHash);
})();
