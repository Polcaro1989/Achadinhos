(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ProductCarousel = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function selectFeaturedProducts(products, limit = 4) {
    return [...products]
      .sort((a, b) => Number(a.ordem || 0) - Number(b.ordem || 0))
      .slice(0, limit);
  }

  function getNextSlideIndex(currentIndex, direction, slideCount) {
    if (slideCount <= 0) return 0;
    return (currentIndex + direction + slideCount) % slideCount;
  }

  return { selectFeaturedProducts, getNextSlideIndex };
});
