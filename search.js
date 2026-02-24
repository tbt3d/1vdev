/**
 * search.js — Recherche universelle TBT3D
 *
 * Comportement :
 *  - Sur boutique.html : filtre les cartes produits en temps réel
 *  - Sur toutes les autres pages : redirige vers boutique.html?q=<terme>
 *    dès la frappe (après 400ms sans activité) OU à la pression d'Entrée
 */

(function () {
  'use strict';

  const IS_BOUTIQUE = window.location.pathname.includes('boutique');

  /* ─── Ouvre la barre ─── */
  window.openSearch = function () {
    const bar = document.getElementById('searchBar');
    if (!bar) return;
    bar.classList.add('open');
    setTimeout(() => {
      const inp = document.getElementById('searchInput');
      if (inp) inp.focus();
    }, 60);
  };

  /* ─── Ferme la barre ─── */
  window.closeSearch = function () {
    const bar = document.getElementById('searchBar');
    if (bar) bar.classList.remove('open');
  };

  /* ─── Toggle ─── */
  window.toggleSearch = function () {
    const bar = document.getElementById('searchBar');
    if (!bar) return;
    if (bar.classList.contains('open')) {
      window.closeSearch();
    } else {
      window.openSearch();
    }
  };

  /* ─── Touche Entrée ou Échap ─── */
  window.searchKeydown = function (e) {
    if (e.key === 'Escape') {
      window.closeSearch();
      return;
    }
    if (e.key === 'Enter') {
      _doSearch();
    }
  };

  /* ─── Timer pour la redirection sur les autres pages ─── */
  let _redirectTimer = null;

  /* ─── Frappe en temps réel ─── */
  window.searchLive = function () {
    if (IS_BOUTIQUE) {
      _filterBoutique();
    } else {
      // Sur les autres pages : redirige après 600ms sans frappe
      clearTimeout(_redirectTimer);
      const inp = document.getElementById('searchInput');
      const q = inp ? inp.value.trim() : '';
      if (!q) return;
      _redirectTimer = setTimeout(() => {
        window.location.href = '/boutique.html?q=' + encodeURIComponent(q);
      }, 600);
    }
  };

  /* ─── Bouton loupe ─── */
  window.submitSearch = function () {
    _doSearch();
  };

  /* ─── Logique principale ─── */
  function _doSearch() {
    const inp = document.getElementById('searchInput');
    const q = inp ? inp.value.trim() : '';
    if (!q) return;

    if (IS_BOUTIQUE) {
      _filterBoutique();
    } else {
      clearTimeout(_redirectTimer);
      window.location.href = '/boutique.html?q=' + encodeURIComponent(q);
    }
  }

  /* ─── Filtre les cartes sur boutique.html ─── */
  function _filterBoutique() {
    const inp = document.getElementById('searchInput');
    if (!inp) return;
    const q = inp.value.toLowerCase().trim();

    // Sélecteur large : accepte les cartes avec ou sans data-id
    const cards = document.querySelectorAll('.product-card');
    let visible = 0;

    cards.forEach(card => {
      // Cherche dans data-attributes ET dans le texte visible de la carte
      const name    = (card.dataset.name    || card.querySelector('.card-name, .prod-name, h3, h2')?.textContent || '').toLowerCase();
      const tagline = (card.dataset.tagline || card.querySelector('.card-tagline, .prod-tagline, p')?.textContent || '').toLowerCase();
      const badge   = (card.dataset.badge   || card.querySelector('.card-badge, .prod-badge, .badge')?.textContent || '').toLowerCase();
      // Fallback : tout le texte de la carte
      const fullText = card.textContent.toLowerCase();

      const match = !q
        || name.includes(q)
        || tagline.includes(q)
        || badge.includes(q)
        || fullText.includes(q);

      card.style.display = match ? '' : 'none';
      if (match) visible++;
    });

    // Message "aucun résultat"
    let noResult = document.getElementById('searchNoResult');
    if (!q || visible > 0) {
      if (noResult) noResult.remove();
    } else {
      if (!noResult) {
        noResult = document.createElement('p');
        noResult.id = 'searchNoResult';
        noResult.style.cssText = 'grid-column:1/-1;text-align:center;color:#999;padding:40px 0;font-size:15px;';
        noResult.textContent = 'Aucun produit ne correspond à "' + inp.value.trim() + '"';
        const grid = document.getElementById('productGrid');
        if (grid) grid.appendChild(noResult);
      }
    }

    _showSearchTag(q);
  }

  /* ─── Étiquette de recherche active (boutique) ─── */
  function _showSearchTag(q) {
    let tag = document.getElementById('activeSearchTag');
    if (!q) {
      if (tag) tag.remove();
      return;
    }
    if (!tag) {
      tag = document.createElement('div');
      tag.id = 'activeSearchTag';
      tag.style.cssText = 'display:inline-flex;align-items:center;gap:8px;background:#f0f0f0;border-radius:50px;padding:6px 14px;font-size:13px;margin-bottom:20px;';
      const filterBar = document.getElementById('filterBar');
      if (filterBar && filterBar.parentNode) {
        filterBar.parentNode.insertBefore(tag, filterBar.nextSibling);
      } else {
        // Fallback : insère avant la grille
        const grid = document.getElementById('productGrid');
        if (grid && grid.parentNode) grid.parentNode.insertBefore(tag, grid);
      }
    }
    tag.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>' +
      '<span>Recherche : <strong>' + _esc(q) + '</strong></span>' +
      '<button onclick="window.clearSearch()" style="background:none;border:none;cursor:pointer;font-size:16px;line-height:1;color:#666;margin-left:4px;" title="Effacer">×</button>';
  }

  /* ─── Efface la recherche ─── */
  window.clearSearch = function () {
    const inp = document.getElementById('searchInput');
    if (inp) inp.value = '';
    if (IS_BOUTIQUE) {
      _filterBoutique();
    }
    document.querySelectorAll('.product-card').forEach(c => c.style.display = '');
  };

  /* ─── Lis le paramètre ?q= à l'arrivée sur boutique.html ─── */
  function _readUrlParam() {
    if (!IS_BOUTIQUE) return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (!q) return;

    const inp = document.getElementById('searchInput');
    if (inp) {
      inp.value = q;
      window.openSearch();
    }

    _waitForGrid(q);
  }

  function _waitForGrid(q, attempts) {
    attempts = attempts || 0;
    if (attempts > 60) return; // max ~3s
    const cards = document.querySelectorAll('.product-card');
    if (cards.length > 0) {
      const inp = document.getElementById('searchInput');
      if (inp) inp.value = q;
      _filterBoutique();
    } else {
      setTimeout(() => _waitForGrid(q, attempts + 1), 50);
    }
  }

  /* ─── Utilitaire ─── */
  function _esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ─── Init ─── */
  document.addEventListener('DOMContentLoaded', _readUrlParam);

})();