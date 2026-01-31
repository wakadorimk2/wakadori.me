// --- Hand-fan Deck (Issue #13) ---
(() => {
  const decks = document.querySelectorAll("[data-wk-deck]");
  if (!decks.length) return;

  const getDeckIndex = (card, fallback) => {
    const raw = card?.getAttribute?.("data-deck-index");
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const setPressedState = (cards, activeCard) => {
    cards.forEach((card) => {
      card.setAttribute("aria-pressed", card === activeCard ? "true" : "false");
    });
  };

  const clearAllPressed = () => {
    decks.forEach((deck) => {
      deck.querySelectorAll(".wk-deck-card").forEach((card) => {
        card.setAttribute("aria-pressed", "false");
      });
    });
  };

  const openPeekFromCard = (card) => {
    // PC棚モード中はpopupを開かない（棚は静かに眺める）
    if (typeof window.wkIsPcShelfMode === "function" && window.wkIsPcShelfMode()) {
      return;
    }
    if (typeof window.wkOpenPeekCard !== "function") {
      return;
    }
    const img = card?.tagName === "IMG" ? card : card?.querySelector("img");
    if (img) {
      window.wkOpenPeekCard({ src: img.src, alt: img.alt });
    }
  };

  // グローバル互換（既存呼び出しの安全化）
  window.wkClearDeckSelections = clearAllPressed;
  window.wkIsDeckSelectionActive = () => false;

  // カードタップハンドラ
  decks.forEach((deck) => {
    const cards = deck.querySelectorAll(".wk-deck-card");
    const orderedCards = [...cards].sort(
      (a, b) => getDeckIndex(a, 0) - getDeckIndex(b, 0)
    );
    cards.forEach((card) => {
      card.addEventListener("click", (ev) => {
        // リンク/ボタン上では選択しない
        if (ev.target.closest("a, button")) return;
        ev.stopPropagation();
        setPressedState(orderedCards, card);
        openPeekFromCard(card);
      });
      card.addEventListener("keydown", (ev) => {
        if (ev.target.closest("a, button")) return;
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          setPressedState(orderedCards, card);
          openPeekFromCard(card);
        }
      });
    });
  });
})();
