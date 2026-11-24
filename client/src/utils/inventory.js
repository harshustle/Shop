const finiteStock = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : null;
};

// stockOnHand is the same physical-stock source used by checkout. The older
// stockQuantity field can be stale, so it is only a legacy fallback.
export const getAvailableStock = (variant = {}, product = {}) => {
  const explicitAvailable = finiteStock(
    variant.availableStock ?? variant.available_stock ?? variant.availableToSell
  );
  if (explicitAvailable !== null) return explicitAvailable;

  const onHand = finiteStock(
    variant.stockOnHand ?? variant.stock_on_hand ?? product.stockOnHand ?? product.stock_on_hand
  );
  if (onHand !== null) {
    const allocated = finiteStock(variant.stockAllocated ?? variant.stock_allocated) ?? 0;
    return Math.max(0, onHand - allocated);
  }

  return finiteStock(
    variant.stockQuantity ?? variant.stock_quantity ?? product.stockQuantity ?? product.currentStock
  );
};

export const isUnavailable = (product = {}, variant = {}) => {
  const status = String(product.status || '').toLowerCase();
  if (product.isPublished === false || variant.isActive === false) return true;
  if (['inactive', 'out-of-stock', 'out_of_stock'].includes(status)) return true;
  const available = getAvailableStock(variant, product);
  return available !== null && available <= 0;
};
