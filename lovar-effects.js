/* LOVAR LUXE MOTION — no dependencies */
(() => {
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('.site-header, .header');
  const progress = document.createElement('div');
  progress.className = 'lovar-progress';
  document.body.appendChild(progress);

  const updateScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    document.documentElement.style.setProperty('--lovar-progress',
      max > 0 ? String(window.scrollY / max) : '0');
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 12);
  };
  window.addEventListener('scroll', updateScroll, { passive: true });
  updateScroll();

  if (reduce || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('motion-ready');

  const selectors = [
    '.section-head', '.trust-item', '.product-card', '.ritual-banner',
    '.story-image', '.story-copy', '.newsletter', '.footer-main > *',
    '.crumb', '.photo', '.details', '.related', '.panel', '.wrap > .title',
    '.wrap > .sub'
  ].join(',');

  const seen = new WeakSet();
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });

  const attach = root => {
    if (root.matches && root.matches(selectors) && !seen.has(root)) {
      root.classList.add('reveal');
      seen.add(root);
      observer.observe(root);
    }
    if (root.querySelectorAll) root.querySelectorAll(selectors).forEach(el => {
      if (!seen.has(el)) {
        el.classList.add('reveal');
        seen.add(el);
        observer.observe(el);
      }
    });
  };
  attach(document);
  new MutationObserver(records => records.forEach(record =>
    record.addedNodes.forEach(node => { if (node.nodeType === 1) attach(node); })
  )).observe(document.body, { childList: true, subtree: true });
})();
