/*
 * Header: fixed overlay with an inset white bar (logo | centered nav | tool icons),
 * hover/click mega-menu panels, a language popover, a search panel and auto-hide on scroll.
 * All copy, links and images come from the nav fragment (content/nav.plain.html):
 *   section 1: brand (linked logo)
 *   section 2: one <h2> per menu, followed by its panel content
 *              (eyebrow <p>, <h3> groups with one or more <ul>, then an optional promo card
 *              starting at an image-only <p>: image, kicker <p>, <strong> title, link CTA)
 *   section 3: tools (language icon + <ul> of languages, account link, search link)
 */

const DESKTOP_MQ = window.matchMedia('(width >= 1025px), (width >= 801px) and (orientation: landscape)');
const CLOSE_DELAY_MS = 140;
const PANEL_TRANSITION_MS = 560;
const SCROLL_DELTA = 4;

let instanceCount = 0;

/**
 * Loads the nav fragment: /content first (local preview), then the site root (DA/EDS).
 * @returns {Promise<HTMLElement|null>}
 */
async function fetchNav() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const wrapper = document.createElement('div');
  wrapper.innerHTML = await resp.text();
  // resolve fragment-relative image paths against the fragment URL, not the current page
  wrapper.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !/^(https?:|\/|data:)/.test(src)) img.setAttribute('src', new URL(src, resp.url).pathname);
  });
  return wrapper;
}

function el(tag, className, attrs = {}) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  return node;
}

/** Shows only the icon; its text (link text or alt) becomes a visually hidden label. */
function labelIcon(control, img, text = img.alt) {
  const label = el('span', 'nav-visually-hidden');
  label.textContent = text;
  img.alt = '';
  control.append(img, label);
}

/**
 * Splits a section's children into chunks, each starting at an element matching `selector`.
 * @returns {{ head: Element, body: Element[] }[]}
 */
function chunkBy(children, selector) {
  const chunks = [];
  children.forEach((child) => {
    if (child.matches(selector)) chunks.push({ head: child, body: [] });
    else if (chunks.length) chunks[chunks.length - 1].body.push(child);
  });
  return chunks;
}

/** Builds a promo card link from its paragraphs (image, kicker, strong title, link CTA). */
function buildPromo(nodes) {
  const link = nodes.map((n) => n.querySelector('a')).find(Boolean);
  const card = el('a', 'nav-promo', { href: link ? link.getAttribute('href') : '#' });
  const img = nodes.map((n) => n.querySelector('img')).find(Boolean);
  if (img) {
    const media = el('div', 'nav-promo-image');
    img.setAttribute('loading', 'lazy');
    media.append(img);
    card.append(media);
  }
  nodes.filter((n) => n.tagName === 'P' && !n.querySelector('img')).forEach((p) => {
    const strong = p.querySelector('strong');
    if (p.querySelector('a')) {
      const cta = el('span', 'nav-promo-cta');
      cta.textContent = p.textContent.trim();
      card.append(cta);
    } else if (strong) {
      const title = el('strong', 'nav-promo-title');
      title.textContent = strong.textContent.trim();
      card.append(title);
    } else if (p.textContent.trim()) {
      const kicker = el('span', 'nav-promo-kicker');
      kicker.textContent = p.textContent.trim();
      card.append(kicker);
    }
  });
  return card;
}

/** Builds a mega-menu panel from the elements that follow a menu's <h2>. */
function buildPanel(nodes, id) {
  const panel = el('div', 'nav-dropdown', { id, hidden: '', 'aria-hidden': 'true' });
  const content = el('div', 'nav-dropdown-content');
  const main = el('div', 'nav-dropdown-main');
  const groups = el('div', 'nav-groups');
  // an image-only paragraph starts the promo card; everything after it belongs to the card
  const isImageOnly = (n) => n.tagName === 'P' && n.querySelector('img') && !n.textContent.trim();
  const promoStart = nodes.findIndex(isImageOnly);
  const promo = promoStart >= 0 ? buildPromo(nodes.slice(promoStart)) : null;
  const menuNodes = promoStart >= 0 ? nodes.slice(0, promoStart) : nodes;

  const groupChunks = chunkBy(menuNodes, 'h3');
  menuNodes.forEach((node) => {
    if (node.tagName === 'P' && !node.querySelector('a, img') && !groupChunks.some((c) => c.body.includes(node))) {
      const eyebrow = el('p', 'nav-dropdown-eyebrow');
      eyebrow.textContent = node.textContent.trim();
      main.append(eyebrow);
    }
  });

  groupChunks.forEach(({ head, body }) => {
    const group = el('div', 'nav-group');
    const lists = body.filter((n) => n.tagName === 'UL');
    group.append(head);
    if (lists.length > 1) {
      group.classList.add('nav-group-multi');
      const columns = el('div', 'nav-group-columns');
      columns.append(...lists);
      group.append(columns);
    } else {
      group.append(...lists);
    }
    groups.append(group);
  });

  main.append(groups);
  content.append(main);
  if (promo) {
    content.classList.add('has-promo');
    content.append(promo);
  }
  const count = groupChunks.length;
  panel.classList.add(`nav-dropdown-cols-${count}`);
  if (groupChunks.some(({ body }) => body.filter((n) => n.tagName === 'UL').length > 1)) {
    panel.classList.add('has-multi-column-group');
  }
  panel.append(content);
  return panel;
}

export default async function decorate(block) {
  const fragment = await fetchNav();
  block.textContent = '';
  if (!fragment) return;
  instanceCount += 1;
  const uid = `nav-${instanceCount}`;

  const [brandSection, menuSection, toolsSection] = [...fragment.children];

  const header = block.closest('header') || document.querySelector('header');
  const nav = el('div', 'nav', { id: 'nav' });
  const inner = el('div', 'nav-inner');
  const bar = el('div', 'nav-bar');

  // brand
  const brandLink = brandSection?.querySelector('a');
  if (brandLink) {
    brandLink.className = 'nav-brand';
    bar.append(brandLink);
  }

  // menus + panels
  const list = el('ul', 'nav-list');
  const panels = [];
  const triggers = [];
  chunkBy(menuSection ? [...menuSection.children] : [], 'h2').forEach(({ head, body }, i) => {
    const panelId = `${uid}-panel-${i}`;
    const li = el('li', 'nav-item');
    const trigger = el('button', 'nav-trigger', { type: 'button', 'aria-expanded': 'false', 'aria-controls': panelId });
    trigger.textContent = head.textContent.trim();
    li.append(trigger);
    list.append(li);
    triggers.push(trigger);
    panels.push(buildPanel(body, panelId));
  });
  const sections = el('nav', 'nav-sections', { 'aria-label': 'Main navigation' });
  sections.append(list);
  bar.append(sections);

  // tools: language, account, search
  const tools = el('ul', 'nav-tools');
  let languageTrigger = null;
  let languageMenu = null;
  let searchTrigger = null;
  let searchPanel = null;
  const toolNodes = toolsSection ? [...toolsSection.children] : [];
  toolNodes.forEach((node, i) => {
    const next = toolNodes[i + 1];
    const img = node.querySelector('img');
    const link = node.querySelector('a');
    if (node.tagName === 'P' && img && !link && next?.tagName === 'UL') {
      // icon followed by a list -> popover menu (language selector)
      const item = el('li', 'nav-tool nav-tool-language');
      languageTrigger = el('button', 'nav-tool-button', {
        type: 'button', 'aria-expanded': 'false', 'aria-controls': `${uid}-language`,
      });
      labelIcon(languageTrigger, img);
      languageMenu = el('div', 'nav-language-menu', { id: `${uid}-language`, hidden: '' });
      next.querySelectorAll('a').forEach((a) => {
        const strong = a.querySelector('strong');
        if (strong) {
          a.textContent = strong.textContent;
          a.classList.add('is-active');
          a.setAttribute('aria-current', 'true');
        }
      });
      next.className = 'nav-language-list';
      next.querySelectorAll('a').forEach((a) => a.classList.add('nav-language-link'));
      languageMenu.append(next);
      item.append(languageTrigger, languageMenu);
      tools.append(item);
    } else if (link && img && /search/i.test(link.getAttribute('href') || '')) {
      // search link -> search panel; the link target is the results page, alt the label
      const item = el('li', 'nav-tool nav-tool-search');
      const label = img.alt || 'Search';
      searchTrigger = el('button', 'nav-tool-button', {
        type: 'button', 'aria-expanded': 'false', 'aria-controls': `${uid}-search`,
      });
      labelIcon(searchTrigger, img);
      item.append(searchTrigger);
      tools.append(item);

      searchPanel = el('div', 'nav-search-panel', { id: `${uid}-search`, hidden: '', 'aria-hidden': 'true' });
      const form = el('form', 'nav-search-form', { role: 'search', action: link.getAttribute('href') });
      const formLabel = el('label');
      const labelText = el('span', 'nav-visually-hidden');
      labelText.textContent = label;
      const input = el('input', 'nav-search-input', {
        type: 'search', name: 'query', placeholder: label, autocomplete: 'off',
      });
      formLabel.append(labelText, input);
      form.append(formLabel);
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = input.value.trim();
        if (query) window.location.href = `${form.getAttribute('action')}?query=${encodeURIComponent(query)}`;
      });
      searchPanel.append(form);
    } else if (link && img) {
      // plain icon link (account)
      const item = el('li', 'nav-tool');
      link.className = 'nav-tool-link';
      const text = link.textContent.trim() || img.alt;
      link.textContent = '';
      labelIcon(link, img, text);
      item.append(link);
      tools.append(item);
    }
  });
  bar.append(tools);

  inner.append(bar, ...panels);
  if (searchPanel) inner.append(searchPanel);
  nav.append(inner);
  block.append(nav);

  /* ---------- behavior ---------- */
  const hideTimers = new WeakMap();
  let closeTimer = null;

  const showPanel = (panel) => {
    clearTimeout(hideTimers.get(panel));
    if (panel.classList.contains('is-open')) return;
    panel.hidden = false;
    panel.setAttribute('aria-hidden', 'false');
    // commit the closed state so the open transition runs from `hidden`
    // eslint-disable-next-line no-unused-expressions
    panel.offsetWidth;
    panel.classList.add('is-open');
  };

  const hidePanel = (panel, immediate = false) => {
    clearTimeout(hideTimers.get(panel));
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    if (immediate || panel.hidden) {
      panel.hidden = true;
      return;
    }
    hideTimers.set(panel, setTimeout(() => {
      if (!panel.classList.contains('is-open')) panel.hidden = true;
    }, PANEL_TRANSITION_MS));
  };

  const closeLanguage = () => {
    if (!languageMenu) return;
    languageMenu.classList.remove('is-open');
    languageMenu.hidden = true;
    languageTrigger.setAttribute('aria-expanded', 'false');
  };

  const closePanels = (immediate = false) => {
    clearTimeout(closeTimer);
    [...panels, searchPanel].filter(Boolean).forEach((p) => hidePanel(p, immediate));
    triggers.forEach((t) => t.setAttribute('aria-expanded', 'false'));
    searchTrigger?.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
  };

  const openPanel = (index) => {
    if (!DESKTOP_MQ.matches) return;
    clearTimeout(closeTimer);
    closeLanguage();
    [...panels, searchPanel].filter(Boolean).forEach((p, i) => { if (i !== index) hidePanel(p); });
    showPanel(panels[index]);
    triggers.forEach((t, i) => t.setAttribute('aria-expanded', String(i === index)));
    searchTrigger?.setAttribute('aria-expanded', 'false');
    nav.classList.add('is-open');
    header?.classList.remove('nav-hidden');
  };

  triggers.forEach((trigger, i) => {
    trigger.addEventListener('mouseenter', () => openPanel(i));
    trigger.addEventListener('focusin', () => openPanel(i));
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      openPanel(i);
    });
  });

  inner.addEventListener('mouseenter', () => clearTimeout(closeTimer));
  inner.addEventListener('mouseleave', () => {
    if (!DESKTOP_MQ.matches || searchPanel?.classList.contains('is-open')) return;
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => closePanels(), CLOSE_DELAY_MS);
  });

  languageTrigger?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const willOpen = languageMenu.hidden;
    closePanels();
    closeLanguage();
    if (willOpen) {
      languageMenu.hidden = false;
      languageMenu.classList.add('is-open');
      languageTrigger.setAttribute('aria-expanded', 'true');
    }
  });

  searchTrigger?.addEventListener('click', (e) => {
    e.preventDefault();
    const willOpen = !searchPanel.classList.contains('is-open');
    closeLanguage();
    closePanels();
    if (willOpen) {
      showPanel(searchPanel);
      searchTrigger.setAttribute('aria-expanded', 'true');
      nav.classList.add('is-open');
      // the panel is still visibility:hidden on this frame; focus once it is visible
      setTimeout(() => searchPanel.querySelector('input')?.focus(), 60);
    }
  });

  document.addEventListener('click', (e) => {
    if (nav.contains(e.target)) return;
    closeLanguage();
    if (nav.classList.contains('is-open')) closePanels();
  });

  nav.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (languageMenu && !languageMenu.hidden) {
      closeLanguage();
      languageTrigger.focus();
    } else if (nav.classList.contains('is-open')) {
      const expanded = nav.querySelector('[aria-expanded="true"]');
      closePanels();
      expanded?.focus();
    }
  });

  // leaving the desktop layout closes any open desktop panel/popover
  DESKTOP_MQ.addEventListener('change', () => {
    closePanels(true);
    closeLanguage();
  });

  /* ---------- auto-hide on scroll (after the first section, like the source hero) ---------- */
  if (header) {
    let lastY = Math.max(window.scrollY, 0);
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = Math.max(window.scrollY, 0);
      const hero = document.querySelector('main .section');
      const heroBottom = hero ? hero.getBoundingClientRect().bottom + y : 0;
      const delta = y - lastY;
      if (y < heroBottom || nav.classList.contains('is-open') || nav.contains(document.activeElement)) {
        header.classList.remove('nav-hidden');
        lastY = y;
        return;
      }
      if (Math.abs(delta) < SCROLL_DELTA) return;
      header.classList.toggle('nav-hidden', delta > 0);
      lastY = y;
    };
    const request = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    nav.addEventListener('focusin', () => header.classList.remove('nav-hidden'));
  }
}
