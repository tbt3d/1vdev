/* ─── TBT3D CART — cart.js ─── */
/* Utilisé par toutes les pages : navbar badge + logique panier */

const TBTCart = (() => {
  const KEY = 'tbt3d_cart';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch { return []; }
  }

  function save(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
    _updateBadge();
    window.dispatchEvent(new Event('cart:updated'));
  }

  function _updateBadge() {
    const items = load();
    const total = items.reduce((s, i) => s + i.qty, 0);
    document.querySelectorAll('.cart-badge').forEach(b => {
      b.textContent = total;
      b.style.display = total > 0 ? '' : 'none';
    });
  }

  function add(product) {
    // product = { id, name, price, oldPrice, image, variant, paymentUrl }
    const items = load();
    // clé unique = id + variant
    const key = product.id + '|' + (product.variant || '');
    const existing = items.find(i => i.key === key);
    if (existing) {
      existing.qty = Math.min(existing.qty + (product.qty || 1), 99);
    } else {
      items.push({ ...product, key, qty: product.qty || 1 });
    }
    save(items);
    return items;
  }

  function remove(key) {
    save(load().filter(i => i.key !== key));
  }

  function updateQty(key, qty) {
    const items = load();
    const item = items.find(i => i.key === key);
    if (item) { item.qty = Math.max(1, Math.min(qty, 99)); }
    save(items);
  }

  function clear() { save([]); }

  function count() { return load().reduce((s, i) => s + i.qty, 0); }

  function total() {
    return load().reduce((s, i) => s + parseFloat(i.price) * i.qty, 0);
  }

  // Init badge au chargement (fonctionne que le DOM soit prêt ou non)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _updateBadge);
  } else {
    _updateBadge();
  }

  return { load, add, remove, updateQty, clear, count, total };
})();
