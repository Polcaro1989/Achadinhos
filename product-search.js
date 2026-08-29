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

  return { filterProducts, normalizeSearchText };
});
