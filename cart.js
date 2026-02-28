/* ── TBTCart — stockage Firestore (Safari compatible) ── */
(function() {
  var PROJECT = 'tbt3d-a0f04';
  var API_KEY  = 'AIzaSyBKdHfHKLxCTKeTVZ-tS5CXXmBe4Xedch8';
  var BASE     = 'https://firestore.googleapis.com/v1/projects/' + PROJECT + '/databases/(default)/documents/carts/';

  function _getSessionId() {
    // 1. Priorité absolue : ?sid= dans l'URL (passé explicitement depuis produit.html sur iOS)
    try {
      var urlSid = new URLSearchParams(window.location.search).get('sid');
      if (urlSid) {
        document.cookie = 'tbt_sid=' + urlSid + ';path=/;max-age=604800;SameSite=Lax';
        return urlSid;
      }
    } catch(e) {}
    // 2. Cookie existant
    var m = document.cookie.match(/(?:^|;)\s*tbt_sid=([^;]+)/);
    if (m) return m[1];
    // 3. Nouveau sid
    var id = 'sid_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    document.cookie = 'tbt_sid=' + id + ';path=/;max-age=604800;SameSite=Lax';
    return id;
  }

  function _toFS(val) {
    if (val === null || val === undefined) return { nullValue: null };
    if (typeof val === 'boolean') return { booleanValue: val };
    if (typeof val === 'number') return isNaN(val) ? { nullValue: null } : { doubleValue: val };
    if (typeof val === 'string') return { stringValue: val };
    if (Array.isArray(val)) return { arrayValue: { values: val.map(_toFS) } };
    if (typeof val === 'object') {
      var fields = {};
      for (var k in val) if (Object.prototype.hasOwnProperty.call(val, k)) fields[k] = _toFS(val[k]);
      return { mapValue: { fields: fields } };
    }
    return { stringValue: String(val) };
  }

  function _fromFS(v) {
    if (!v) return null;
    if (v.stringValue  !== undefined) return v.stringValue;
    if (v.integerValue !== undefined) return Number(v.integerValue);
    if (v.doubleValue  !== undefined) return Number(v.doubleValue);
    if (v.booleanValue !== undefined) return v.booleanValue;
    if (v.nullValue    !== undefined) return null;
    if (v.arrayValue)  return (v.arrayValue.values || []).map(_fromFS);
    if (v.mapValue) {
      var out = {};
      var f = v.mapValue.fields || {};
      for (var k in f) out[k] = _fromFS(f[k]);
      return out;
    }
    return null;
  }

  var _mem = null;
  var _sid = null;
  function _sid_lazy() { if (!_sid) _sid = _getSessionId(); return _sid; }
  function _url() { return BASE + _sid_lazy() + '?key=' + API_KEY; }

  // Expose le sid pour le passer dans les URLs de navigation
  window._getTBTSid = function() { return _sid_lazy(); };

  function _loadRemote() {
    return fetch(_url())
      .then(function(r) {
        if (r.status === 404) return [];
        return r.json().then(function(d) {
          if (!d.fields || !d.fields.items) return [];
          return _fromFS(d.fields.items) || [];
        });
      })
      .catch(function() { return []; });
  }

  function _saveRemote(items) {
    return fetch(_url(), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { items: _toFS(items), updatedAt: _toFS(Date.now()) } })
    }).catch(function(e) { console.warn('Cart save error:', e); });
  }

  function _updateBadge(items) {
    var total = (items || []).reduce(function(s, i) { return s + (i.qty || 1); }, 0);
    document.querySelectorAll('.cart-badge').forEach(function(b) {
      b.style.display = total > 0 ? 'block' : 'none';
    });
  }

  window.TBTCart = {
    load: function() { return _mem || []; },
    init: function() {
      return _loadRemote().then(function(items) {
        _mem = items;
        _updateBadge(items);
        window.dispatchEvent(new Event('cart:updated'));
        return items;
      });
    },
    add: function(item) {
      var items = (_mem || []).slice();
      var k = (item.id || '') + '|' + (item.variant || '');
      var found = items.find(function(x) { return x.key === k; });
      if (found) { found.qty = Math.min((found.qty || 1) + (item.qty || 1), 99); }
      else { item.key = k; item.qty = item.qty || 1; items.push(item); }
      _mem = items;
      _updateBadge(items);
      window.dispatchEvent(new Event('cart:updated'));
      return _saveRemote(items);
    },
    remove: function(key) {
      var items = (_mem || []).filter(function(i) { return i.key !== key; });
      _mem = items;
      _updateBadge(items);
      window.dispatchEvent(new Event('cart:updated'));
      return _saveRemote(items);
    },
    updateQty: function(key, qty) {
      var items = (_mem || []).slice();
      var found = items.find(function(i) { return i.key === key; });
      if (found) found.qty = Math.max(1, Math.min(qty, 99));
      _mem = items;
      _updateBadge(items);
      window.dispatchEvent(new Event('cart:updated'));
      return _saveRemote(items);
    },
    total: function() {
      return (_mem || []).reduce(function(s, i) { return s + parseFloat(i.price || 0) * (i.qty || 1); }, 0);
    },
    count: function() {
      return (_mem || []).reduce(function(s, i) { return s + (i.qty || 1); }, 0);
    },
    clear: function() {
      _mem = [];
      _updateBadge([]);
      window.dispatchEvent(new Event('cart:updated'));
      return _saveRemote([]);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { window.TBTCart.init(); });
  } else {
    window.TBTCart.init();
  }
})();