export function xmlEscape(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function money(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount.toFixed(2) : '';
}

function moneyBr(value) {
  return Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function validRating(value) {
  const rating = Number(value);
  return Number.isFinite(rating) && rating >= 1 && rating <= 5 ? String(rating) : '';
}

function rfc822(value) {
  const date = value ? new Date(String(value)) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toUTCString() : date.toUTCString();
}

function imageMimeType(url) {
  const path = String(url ?? '').split(/[?#]/, 1)[0].toLowerCase();
  if (path.endsWith('.webp')) return 'image/webp';
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

function googleCategory(category) {
  const key = String(category ?? '').toLocaleLowerCase('pt-BR');
  if (['casa', 'iluminacao', 'organizacao', 'limpeza'].includes(key)) return 'Home & Garden';
  if (['cozinha', 'bolsas térmicas'].includes(key)) return 'Home & Garden > Kitchen & Dining';
  if (key === 'infantil') return 'Baby & Toddler';
  if (key === 'saude') return 'Health & Beauty';
  if (key === 'carro') return 'Vehicles & Parts > Vehicle Parts & Accessories';
  if (['entretenimento', 'armazenamento', 'carregamento'].includes(key)) return 'Electronics';
  return 'Home & Garden';
}

export function isCatalogProduct(product) {
  return product?.ativo === true && Boolean(
    product.id && product.nome && product.imagem_url && product.link_afiliado && money(product.preco_atual)
  );
}

export function renderCatalogItem(product) {
  const currentPrice = money(product.preco_atual);
  const oldPrice = money(product.preco_antigo);
  const hasSale = Boolean(oldPrice && Number(oldPrice) > Number(currentPrice));
  const rating = validRating(product.avaliacao);
  const affiliateUrl = String(product.link_afiliado);
  const productType = product.categoria_label || product.categoria || 'Achadinhos';
  const image = xmlEscape(product.imagem_url);
  const description = [
    `Preço atual: R$ ${moneyBr(currentPrice)}`,
    hasSale ? `Economize ${Math.round((1 - Number(currentPrice) / Number(oldPrice)) * 100)}%` : '',
    product.beneficio,
    rating ? `Avaliação ${rating} de 5` : '',
    product.vendas ? `${product.vendas}` : '',
    `Categoria: ${productType}`
  ].filter(Boolean).join('. ');

  return `    <item>\n` +
    `      <g:id>${xmlEscape(product.id)}</g:id>\n` +
    `      <title>${xmlEscape(product.nome)}</title>\n` +
    `      <description>${xmlEscape(description)}</description>\n` +
    `      <link>${xmlEscape(affiliateUrl)}</link>\n` +
    `      <g:mobile_link>${xmlEscape(affiliateUrl)}</g:mobile_link>\n` +
    `      <guid isPermaLink="false">${xmlEscape(product.id)}</guid>\n` +
    `      <pubDate>${xmlEscape(rfc822(product.atualizado_em || product.criado_em))}</pubDate>\n` +
    `      <media:content url="${image}" medium="image" />\n` +
    `      <enclosure url="${image}" type="${imageMimeType(product.imagem_url)}" />\n` +
    `      <g:image_link>${image}</g:image_link>\n` +
    `      <g:alt_text>${xmlEscape(product.nome)}</g:alt_text>\n` +
    `      <g:price>${hasSale ? oldPrice : currentPrice} BRL</g:price>\n` +
    (hasSale ? `      <g:sale_price>${currentPrice} BRL</g:sale_price>\n` : '') +
    `      <g:availability>in stock</g:availability>\n` +
    `      <g:condition>new</g:condition>\n` +
    `      <g:adult>false</g:adult>\n` +
    `      <g:product_type>${xmlEscape(productType)}</g:product_type>\n` +
    `      <g:google_product_category>${xmlEscape(googleCategory(product.categoria))}</g:google_product_category>\n` +
    (rating ? `      <g:average_review_rating>${rating}</g:average_review_rating>\n` : '') +
    (product.badge ? `      <g:custom_label_0>${xmlEscape(product.badge)}</g:custom_label_0>\n` : '') +
    `    </item>`;
}
