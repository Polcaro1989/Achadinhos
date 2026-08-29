(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ProductSearch = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function normalizeSearchText(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('pt-BR')
      .trim();
  }

  function filterProducts(products, searchTerm, category) {
    const term = normalizeSearchText(searchTerm);
    const selectedCategory = category || 'all';

    return products.filter(product => {
      if (selectedCategory !== 'all' && product.categoria !== selectedCategory) return false;
      if (!term) return true;

      const searchableText = normalizeSearchText([
        product.nome,
        product.categoria,
        product.categoria_label
      ].join(' '));

      return searchableText.includes(term);
    });
  }

  if (root && root.document) {
    const style = root.document.createElement('style');
    style.setAttribute('data-product-grid', 'responsive');
    style.textContent = `
      @media (max-width: 1020px) {
        .deal-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
      }
      @media (max-width: 560px) {
        .deal-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 0.75rem !important; }
        .deal-card { min-width: 0; }
        .deal-body { padding: 0.8rem; }
        .deal-title { font-size: 0.82rem; }
      }
      .deal-card.product-deeplink-target {
        outline: 3px solid var(--accent, #f59e0b);
        outline-offset: 3px;
      }
    `;
    root.document.head.appendChild(style);

    // Complemento carregado separadamente para corrigir a vitrine e tratar
    // links ?produto=<id> sem alterar o destino afiliado do botão "Eu Quero!".
    const fixes = root.document.createElement('script');
    fixes.src = 'site-fixes.js?v=20260829-2';
    fixes.defer = true;
    root.document.head.appendChild(fixes);
  }

  return { filterProducts, normalizeSearchText };
});
