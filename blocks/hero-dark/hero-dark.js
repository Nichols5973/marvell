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

// No authorable options yet; listed so future options branch in one place.
const OPTION_CLASSES = [];

/**
 * hero-dark: full-bleed background image with overlaid heading, text and CTA.
 * Content contract (rows in any order, cells tolerant):
 *   - a row/cell holding a picture -> background media
 *   - a row/cell holding text (h1, paragraph, link) -> foreground content
 * @param {Element} block
 */
export default function decorate(block) {
  // eslint-disable-next-line no-unused-vars
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));

  const media = document.createElement('div');
  media.className = 'hero-dark-media';
  const content = document.createElement('div');
  content.className = 'hero-dark-content';

  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      const picture = cell.querySelector('picture');
      const hasText = [...cell.children].some((el) => !el.querySelector('picture') && el.textContent.trim());
      if (picture && !media.querySelector('picture')) {
        const img = picture.querySelector('img');
        const optimized = optimizePicture(img, true, [{ media: '(min-width: 900px)', width: '2000' }, { width: '900' }]);
        moveInstrumentation(img, optimized.querySelector('img'));
        const pictureParent = picture.closest('p') || picture;
        pictureParent.remove();
        media.append(optimized);
      }
      if (hasText || (!picture && cell.textContent.trim())) {
        moveInstrumentation(cell, content);
        content.append(...cell.childNodes);
      }
    });
    row.remove();
  });

  // Mark the CTA links so they can be styled as outline buttons later.
  content.querySelectorAll('a[href]').forEach((a) => {
    const p = a.closest('p');
    if (p && p.textContent.trim() === a.textContent.trim()) {
      p.classList.add('hero-dark-cta');
    }
  });

  if (media.children.length) block.append(media);
  else block.classList.add('hero-dark-no-media');
  block.append(content);
}
