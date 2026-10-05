/*
 * Footer: a CTA band and the site footer sharing one full-bleed background (poster image +
 * decorative looping video). All copy, links and images come from the footer fragment
 * (content/footer.plain.html):
 *   section 1: background (poster <img>, link to the video file)
 *   section 2: CTA band (<h2>, body <p>, <strong> link = primary button,
 *              <em> link = outline button)
 *   section 3: linked logo, then <h3> + <ul> link columns
 *   section 4: <ul> of social icon links
 *   section 5: copyright <p> + <ul> of legal links
 */

/**
 * Loads the footer fragment: /content first (local preview), then the site root (DA/EDS).
 * @returns {Promise<HTMLElement|null>}
 */
async function fetchFooter() {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
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

/**
 * Background layer: the poster image becomes the wrapper's CSS background (fallback, as on the
 * source) and the video poster; a muted looping video plays on top when a video file is linked.
 */
function buildBackground(section, wrapper) {
  const media = el('div', 'footer-media', { 'aria-hidden': 'true' });
  const img = section?.querySelector('img');
  if (img) wrapper.style.backgroundImage = `url("${img.getAttribute('src')}")`;
  const videoLink = [...(section?.querySelectorAll('a') || [])]
    .find((a) => /\.(mp4|webm)(\?|$)/i.test(a.getAttribute('href') || ''));
  if (videoLink) {
    const video = el('video', 'footer-media-video', { playsinline: '', loop: '', preload: 'none' });
    video.muted = true;
    video.autoplay = true;
    if (img) video.poster = img.getAttribute('src');
    const source = el('source', '', { src: videoLink.getAttribute('href'), type: `video/${videoLink.getAttribute('href').split('.').pop().split('?')[0]}` });
    video.append(source);
    media.append(video);
    // start loading only when the footer approaches the viewport
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        video.load();
        video.play().catch(() => {});
      }
    }, { rootMargin: '200px' });
    io.observe(media);
  }
  return media;
}

/** CTA band: heading + copy on the left, buttons on the right. */
function buildCta(section) {
  const band = el('section', 'footer-cta');
  const inner = el('div', 'footer-inner');
  const layout = el('div', 'footer-cta-layout');
  const copy = el('div', 'footer-cta-copy');
  const actions = el('div', 'footer-cta-actions');
  [...(section?.children || [])].forEach((node) => {
    const link = node.querySelector('a');
    if (link && (node.querySelector('strong, em'))) {
      link.className = `footer-button ${node.querySelector('em') ? 'footer-button-outline' : 'footer-button-primary'}`;
      actions.append(link);
    } else if (/^H[1-6]$/.test(node.tagName)) {
      node.className = 'footer-cta-title';
      copy.append(node);
    } else if (node.textContent.trim()) {
      node.className = 'footer-cta-body';
      copy.append(node);
    }
  });
  layout.append(copy);
  if (actions.children.length) layout.append(actions);
  inner.append(layout);
  band.append(inner);
  return band;
}

/** Logo + heading/list link columns. */
function buildTop(section) {
  const top = el('div', 'footer-top');
  const logoLink = section?.querySelector('p a img')?.closest('a');
  if (logoLink) {
    logoLink.className = 'footer-logo';
    top.append(logoLink);
  }
  const columns = el('ul', 'footer-columns');
  [...(section?.children || [])].forEach((node) => {
    if (/^H[1-6]$/.test(node.tagName)) {
      const column = el('li', 'footer-column');
      node.className = 'footer-heading';
      column.append(node);
      columns.append(column);
    } else if (node.tagName === 'UL' && columns.lastElementChild) {
      node.className = 'footer-links';
      node.querySelectorAll('a').forEach((a) => a.classList.add('footer-link'));
      columns.lastElementChild.append(node);
    }
  });
  top.append(columns);
  return top;
}

export default async function decorate(block) {
  const fragment = await fetchFooter();
  block.textContent = '';
  if (!fragment) return;

  const [
    mediaSection, ctaSection, linksSection, socialSection, legalSection,
  ] = [...fragment.children];

  const wrapper = el('div', 'footer-close');
  wrapper.append(buildBackground(mediaSection, wrapper), buildCta(ctaSection));

  const main = el('div', 'footer-main');
  const inner = el('div', 'footer-inner');
  inner.append(buildTop(linksSection));

  const social = socialSection?.querySelector('ul');
  if (social) {
    social.className = 'footer-social';
    social.querySelectorAll('a').forEach((a) => {
      const img = a.querySelector('img');
      a.className = 'footer-social-link';
      if (img) {
        a.setAttribute('aria-label', img.alt);
        img.alt = '';
      }
    });
    inner.append(social);
  }

  inner.append(el('hr', 'footer-rule'));

  const legal = el('div', 'footer-legal');
  [...(legalSection?.children || [])].forEach((node) => {
    if (node.tagName === 'UL') {
      node.className = 'footer-legal-links';
      node.querySelectorAll('a').forEach((a) => a.classList.add('footer-legal-link'));
    } else {
      node.className = 'footer-copy';
    }
    legal.append(node);
  });
  inner.append(legal);

  main.append(inner);
  wrapper.append(main);
  block.append(wrapper);
}
