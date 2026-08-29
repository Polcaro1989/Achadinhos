(function () {
  const params = new URLSearchParams(window.location.search);
  const targetProductId = params.get('produto');
  if (!targetProductId) return;

  function focusTargetCard() {
    const cards = Array.from(document.querySelectorAll('#dealGrid .deal-card'));
    if (!cards.length) return false;

    // O HTML principal ainda não grava o id no card. O feed inclui também o
    // link afiliado como parâmetro opcional para permitir identificação segura
    // enquanto mantemos o botão "Eu Quero!" apontando diretamente ao afiliado.
    const affiliate = params.get('afiliado');
    let target = null;

    if (affiliate) {
      target = cards.find(card => {
        const cta = card.querySelector('a.cta');
        return cta && cta.href === affiliate;
      });
    }

    if (!target) {
      const index = Number(params.get('pos'));
      if (Number.isInteger(index) && index >= 0) target = cards[index] || null;
    }

    if (!target) return false;
    target.dataset.productId = String(targetProductId);
    target.classList.add('product-deeplink-target');
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => target.classList.remove('product-deeplink-target'), 4500);
    return true;
  }

  if (focusTargetCard()) return;
  const grid = document.getElementById('dealGrid');
  if (!grid) return;
  const observer = new MutationObserver(() => {
    if (focusTargetCard()) observer.disconnect();
  });
  observer.observe(grid, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), 12000);
})();
