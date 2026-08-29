(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ProductSearch = api;
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  function normalizeSearchText(value) {
    const text = String(value || '');
    let normalized = text;
    try {
      if (typeof normalized.normalize === 'function') normalized = normalized.normalize('NFD');
    } catch (_) {}
    return normalized
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function normalFilter(products, searchTerm, category) {
    const list = Array.isArray(products) ? products : [];
    const term = normalizeSearchText(searchTerm);
    const selectedCategory = category || 'all';

    return list.filter(function (product) {
      if (!product) return false;
      if (selectedCategory !== 'all' && product.categoria !== selectedCategory) return false;
      if (!term) return true;

      const searchableText = normalizeSearchText([
        product.nome,
        product.categoria,
        product.categoria_label
      ].join(' '));

      return searchableText.indexOf(term) !== -1;
    });
  }

  function filterProductsForView(products, searchTerm, category, targetProductId) {
    const list = Array.isArray(products) ? products : [];
    const targetId = String(targetProductId || '').trim();
    if (targetId) {
      const target = list.find(function (product) {
        return product && String(product.id) === targetId;
      });
      if (target) return [target];
    }
    return normalFilter(list, searchTerm, category);
  }

  function getTargetProductId() {
    try {
      if (!root || !root.location) return '';
      return new URLSearchParams(root.location.search || '').get('produto') || '';
    } catch (_) {
      return '';
    }
  }

  function filterProducts(products, searchTerm, category) {
    return filterProductsForView(products, searchTerm, category, getTargetProductId());
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
    `;
    root.document.head.appendChild(style);
  }

  return {
    filterProducts,
    filterProductsForView,
    getTargetProductId,
    normalizeSearchText
  };
});
