import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Optimize same-origin raster images; keep cross-origin (e.g. absolute source-site URLs in
 * imported content) and SVG images as authored, since createOptimizedPicture keeps only the
 * pathname and would point them at a non-existent local path.
 */
function optimizePicture(img, eager, breakpoints) {
  const url = new URL(img.src, window.location.href);
  if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) {
    const picture = document.createElement('picture');
    const copy = img.cloneNode(false);
    copy.setAttribute('loading', eager ? 'eager' : 'lazy');
    picture.append(copy);
    return picture;
  }
  return createOptimizedPicture(img.src, img.alt, eager, breakpoints);
}

const OPTION_CLASSES = [];
const AUTOPLAY_MS = 6000;

let instanceCount = 0;

function showSlide(block, index) {
  const slides = [...block.querySelectorAll('.carousel-teaser-slide')];
  if (!slides.length) return;
  const next = (index + slides.length) % slides.length;
  slides.forEach((slide, i) => {
    const isActive = i === next;
    slide.classList.toggle('active', isActive);
    slide.setAttribute('aria-hidden', String(!isActive));
    slide.querySelectorAll('a').forEach((a) => { a.tabIndex = isActive ? 0 : -1; });
  });
  block.querySelectorAll('.carousel-teaser-dot').forEach((dot, i) => {
    dot.setAttribute('aria-current', i === next ? 'true' : 'false');
  });
  block.dataset.activeSlide = String(next);
}

/**
 * carousel-teaser: compact rotating teaser card.
 * Content contract: one row per slide -> [image | eyebrow paragraph, h3 title (optionally linked)].
 * Cells are tolerated in any order; a slide with no image renders text-only, and a slide
 * without a link renders as a non-interactive card.
 * @param {Element} block
 */
export default function decorate(block) {
  // eslint-disable-next-line no-unused-vars
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));
  instanceCount += 1;
  const id = `carousel-teaser-${instanceCount}`;

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');
  block.setAttribute('aria-label', 'Featured stories');

  const track = document.createElement('ul');
  track.className = 'carousel-teaser-slides';
  track.id = `${id}-slides`;

  [...block.children].forEach((row, i) => {
    if (!row.textContent.trim() && !row.querySelector('picture')) {
      row.remove();
      return;
    }
    const li = document.createElement('li');
    li.className = 'carousel-teaser-slide';
    li.setAttribute('role', 'group');
    li.setAttribute('aria-roledescription', 'slide');
    moveInstrumentation(row, li);

    const imageWrap = document.createElement('div');
    imageWrap.className = 'carousel-teaser-image';
    const body = document.createElement('div');
    body.className = 'carousel-teaser-body';

    [...row.children].forEach((cell) => {
      const picture = cell.querySelector('picture');
      if (picture && !imageWrap.children.length) {
        const img = picture.querySelector('img');
        const optimized = optimizePicture(img, i === 0, [{ width: '400' }]);
        moveInstrumentation(img, optimized.querySelector('img'));
        (picture.closest('p') || picture).remove();
        imageWrap.append(optimized);
      }
      if (!cell.textContent.trim()) return;
      // In Universal Editor the richtext field arrives wrapped in an instrumented <div>;
      // unwrap it so eyebrow/title stay direct children of the body (styling relies on it).
      const wrapper = cell.children.length === 1 && cell.firstElementChild.tagName === 'DIV'
        ? cell.firstElementChild : null;
      if (wrapper) {
        moveInstrumentation(wrapper, body);
        body.append(...wrapper.childNodes);
      } else {
        body.append(...cell.childNodes);
      }
    });

    // First paragraph before the heading is the eyebrow.
    const firstP = [...body.children].find((el) => el.tagName === 'P');
    const firstHeading = [...body.children].find((el) => /^H[1-6]$/.test(el.tagName));
    const children = [...body.children];
    if (firstP && (!firstHeading || children.indexOf(firstP) < children.indexOf(firstHeading))) {
      firstP.classList.add('carousel-teaser-eyebrow');
    }

    // Only some slides are linked (in imported content just one, via its h3). A linked slide
    // gets a stretched link so the whole card is clickable; unlinked slides stay plain.
    const link = body.querySelector('a[href]');
    if (link) {
      li.classList.add('has-link');
      link.classList.add('carousel-teaser-link');
    }

    if (imageWrap.children.length) li.append(imageWrap);
    else li.classList.add('no-image');
    li.append(body);
    track.append(li);
    row.remove();
  });

  const slides = [...track.children];
  slides.forEach((slide, i) => slide.setAttribute('aria-label', `${i + 1} of ${slides.length}`));
  block.append(track);

  if (slides.length > 1) {
    const nav = document.createElement('div');
    nav.className = 'carousel-teaser-nav';
    nav.innerHTML = `
      <button type="button" class="carousel-teaser-prev" aria-controls="${track.id}" aria-label="Previous slide"></button>
      <button type="button" class="carousel-teaser-next" aria-controls="${track.id}" aria-label="Next slide"></button>`;
    const dots = document.createElement('div');
    dots.className = 'carousel-teaser-dots';
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel-teaser-dot';
      dot.setAttribute('aria-label', `Show slide ${i + 1}`);
      dot.addEventListener('click', () => showSlide(block, i));
      dots.append(dot);
    });
    block.append(nav, dots);

    const current = () => Number(block.dataset.activeSlide || 0);
    nav.querySelector('.carousel-teaser-prev').addEventListener('click', () => showSlide(block, current() - 1));
    nav.querySelector('.carousel-teaser-next').addEventListener('click', () => showSlide(block, current() + 1));

    // Auto-rotate, paused on hover/focus and for reduced-motion users.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced) {
      let timer;
      const start = () => {
        clearInterval(timer);
        timer = setInterval(() => showSlide(block, current() + 1), AUTOPLAY_MS);
      };
      const stop = () => clearInterval(timer);
      block.addEventListener('mouseenter', stop);
      block.addEventListener('mouseleave', start);
      block.addEventListener('focusin', stop);
      block.addEventListener('focusout', start);
      start();
    }
  }

  showSlide(block, 0);
}
