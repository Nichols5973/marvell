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

/**
 * cards-stats: grid of stat tiles, each with an icon and a statement.
 * Content contract: one row per tile -> [icon image | statement text]. Either cell may be
 * missing; extra cells are appended to the tile body.
 * @param {Element} block
 */
export default function decorate(block) {
  // eslint-disable-next-line no-unused-vars
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));

  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    if (!row.textContent.trim() && !row.querySelector('picture')) {
      row.remove();
      return;
    }
    const li = document.createElement('li');
    li.className = 'cards-stats-card';
    moveInstrumentation(row, li);

    const icon = document.createElement('div');
    icon.className = 'cards-stats-icon';
    const body = document.createElement('div');
    body.className = 'cards-stats-body';

    [...row.children].forEach((cell) => {
      const picture = cell.querySelector('picture');
      if (picture && !icon.children.length) {
        const img = picture.querySelector('img');
        const optimized = optimizePicture(img, false, [{ width: '160' }]);
        moveInstrumentation(img, optimized.querySelector('img'));
        (picture.closest('p') || picture).remove();
        icon.append(optimized);
      }
      if (cell.textContent.trim()) body.append(...cell.childNodes);
    });

    if (icon.children.length) li.append(icon);
    li.append(body);
    ul.append(li);
    row.remove();
  });
  block.append(ul);
}
