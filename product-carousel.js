(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.ProductCarousel = api;
    if (!root.ProductSearch) root.ProductSearch = api.createFallbackSearch(root);
  }
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  function selectFeaturedProducts(products, limit = 4) {
    return [...products].sort((a, b) => Number(a.ordem || 0) - Number(b.ordem || 0)).slice(0, limit);
  }

  function selectFeaturedProductsForView(products, targetProductId, limit = 4) {
    const list = Array.isArray(products) ? products : [];
    const targetId = String(targetProductId || '').trim();
    if (targetId) {
      const target = list.find(product => product && String(product.id) === targetId);
      if (target) return [target];
    }
    return selectFeaturedProducts(list, limit);
  }

  function getNextSlideIndex(currentIndex, direction, slideCount) {
    if (slideCount <= 0) return 0;
    return (currentIndex + direction + slideCount) % slideCount;
  }

  function createFallbackSearch(browserRoot) {
    function normalize(value) {
      let text = String(value || '');
      try { if (typeof text.normalize === 'function') text = text.normalize('NFD'); } catch (_) {}
      return text.replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    }
    function targetId() {
      try { return browserRoot && browserRoot.location ? new URLSearchParams(browserRoot.location.search || '').get('produto') || '' : ''; } catch (_) { return ''; }
    }
    return { filterProducts(products, searchTerm, category) {
      const list = Array.isArray(products) ? products : [];
      const requestedId = targetId();
      if (requestedId) {
        const product = list.find(item => item && String(item.id) === String(requestedId));
        if (product) return [product];
      }
      const term = normalize(searchTerm); const selected = category || 'all';
      return list.filter(item => item && (selected === 'all' || item.categoria === selected) && (!term || normalize([item.nome, item.categoria, item.categoria_label].join(' ')).includes(term)));
    }};
  }

  if (root && root.document) {
    const style = root.document.createElement('style');
    style.setAttribute('data-grid-fallback', 'responsive');
    style.textContent = `@media (max-width:1020px){.deal-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}}@media (max-width:560px){.deal-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:.75rem!important}.deal-card{min-width:0}.deal-body{padding:.8rem}.deal-title{font-size:.82rem}}`;
    root.document.head.appendChild(style);
  }

  return { selectFeaturedProducts, selectFeaturedProductsForView, getNextSlideIndex, createFallbackSearch };
});
