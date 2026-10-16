/* Navigation and focus behaviour shared by all six static pages. */
(() => {
  const button = document.querySelector('.hamburger');
  const drawer = document.getElementById('sidebar');
  const backdrop = document.querySelector('.nav-backdrop');
  const desktop = window.matchMedia('(min-width: 961px)');
  const workMenu = document.querySelector('.work-menu');
  let wasOpen = false;

  function visibleDialog() {
    return [...document.querySelectorAll('[aria-modal="true"]')]
      .find(element => getComputedStyle(element).display !== 'none');
  }

  function setMenu(open, restoreFocus = false) {
    open = open && !desktop.matches;
    wasOpen = open;
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    button.classList.toggle('open', open);
    drawer.classList.toggle('open', open);
    drawer.inert = !open;
    backdrop.classList.toggle('visible', open);
    document.body.style.overflow = open || visibleDialog() ? 'hidden' : '';
    if (restoreFocus) button.focus();
  }

  button.addEventListener('click', () => setMenu(!wasOpen));
  backdrop.addEventListener('click', () => setMenu(false, true));
  drawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => setMenu(false));
  });
  desktop.addEventListener('change', () => {
    setMenu(false);
    workMenu.open = false;
  });
  document.addEventListener('click', event => {
    if (!workMenu.contains(event.target)) workMenu.open = false;
  });
  workMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => { workMenu.open = false; });
  });
  workMenu.addEventListener('focusout', () => {
    requestAnimationFrame(() => {
      if (!workMenu.contains(document.activeElement)) workMenu.open = false;
    });
  });

  document.addEventListener('keydown', event => {
    const dialog = visibleDialog();
    if (event.key === 'Escape') {
      if (wasOpen) setMenu(false, true);
      if (workMenu.open) {
        workMenu.open = false;
        workMenu.querySelector('summary').focus();
      }
      if (dialog?.id === 'cs-modal') {
        dialog.classList.remove('open');
        document.body.style.overflow = '';
        modalOpener?.focus();
      }
    }
    if (event.key !== 'Tab') return;
    const container = dialog || (wasOpen ? drawer : null);
    if (!container) return;
    const focusable = [...container.querySelectorAll('a[href], button, input, summary, [tabindex="0"]')]
      .filter(element => !element.disabled && element.getClientRects().length);
    if (!dialog) focusable.unshift(button);
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && (document.activeElement === first || !focusable.includes(document.activeElement))) {
      event.preventDefault(); last?.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !focusable.includes(document.activeElement))) {
      event.preventDefault(); first?.focus();
    }
  });

  // Keep background navigation outside the tab order while a password prompt is open.
  let modalOpener;
  let previousDialog;
  const modal = document.getElementById('cs-modal');
  const gate = document.getElementById('pw-gate');
  function syncDialog() {
    const dialog = visibleDialog();
    document.querySelector('main').inert = Boolean(dialog);
    document.querySelector('.site-header').inert = Boolean(dialog);
    drawer.inert = Boolean(dialog) || !wasOpen;
    document.body.style.overflow = dialog || wasOpen ? 'hidden' : '';
    if (!dialog && previousDialog?.id === 'cs-modal') modalOpener?.focus();
    previousDialog = dialog;
  }
  if (modal) {
    document.addEventListener('click', event => {
      const link = event.target.closest('a[href]');
      if (link && /case-study-\d+\.html/.test(link.getAttribute('href'))) modalOpener = link;
      if (event.target === modal) modalOpener?.focus();
    });
    new MutationObserver(syncDialog).observe(modal, { attributes: true, attributeFilter: ['class'] });
  }
  if (gate) new MutationObserver(syncDialog).observe(gate, { attributes: true, attributeFilter: ['style'] });
  setMenu(false);
  syncDialog();

  // Recalculate open accordion height when its text reflows at another viewport width.
  const resizeObserver = new ResizeObserver(() => {
    document.querySelectorAll('.accordion-trigger[aria-expanded="true"]').forEach(trigger => {
      const body = trigger.nextElementSibling;
      body.style.maxHeight = body.scrollHeight + 'px';
    });
  });
  document.querySelectorAll('.accordion-body-inner').forEach(element => resizeObserver.observe(element));
})();
