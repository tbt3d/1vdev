/* ══════════════════════════════════════════════
   TBT3D — JavaScript partagé
   ══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  // ── Année footer
  const yr = document.getElementById('footerYear');
  if (yr) yr.textContent = new Date().getFullYear();

  // ── Active nav link
  const page = document.body.dataset.page;
  document.querySelectorAll('.nav-links a[data-page]').forEach(a => {
    if (a.dataset.page === page) a.classList.add('active');
  });

  // ── Scroll shadow navbar
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 10);
    });
  }

  // ── Fade in on scroll
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.08 });
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

  // ── Close mobile nav on resize
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      const mn = document.getElementById('mobileNav');
      if (mn) mn.classList.remove('open');
    }
  });

});

// ── Search bar
function toggleSearch() {
  const bar = document.getElementById('searchBar');
  if (!bar) return;
  bar.classList.toggle('open');
  if (bar.classList.contains('open')) {
    setTimeout(() => {
      const inp = document.getElementById('searchInput');
      if (inp) inp.focus();
    }, 50);
  }
}

// ── Mobile nav
function toggleMobileNav() {
  const mn = document.getElementById('mobileNav');
  if (mn) mn.classList.toggle('open');
}
