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

let instanceCount = 0;

function select(block, index, focus = false) {
  const tabs = [...block.querySelectorAll('.tabs-portfolio-tab')];
  const panels = [...block.querySelectorAll('.tabs-portfolio-panel')];
  if (!tabs.length) return;
  const next = (index + tabs.length) % tabs.length;
  tabs.forEach((tab, i) => {
    const isActive = i === next;
    tab.setAttribute('aria-selected', String(isActive));
    tab.tabIndex = isActive ? 0 : -1;
  });
  panels.forEach((panel, i) => { panel.hidden = i !== next; });
  block.dataset.activeTab = String(next);
  if (focus) tabs[next].focus();
}

/**
 * tabs-portfolio: labelled panels of [h3, paragraph, CTA | large image] with a tab strip
 * under the image and prev/next controls beside the text.
 * Content contract: one row per tab -> [label cell | content cell (rich text + image)].
 * @param {Element} block
 */
export default function decorate(block) {
  // eslint-disable-next-line no-unused-vars
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));
  instanceCount += 1;
  const id = `tabs-portfolio-${instanceCount}`;

  const panels = document.createElement('div');
  panels.className = 'tabs-portfolio-panels';
  const tablist = document.createElement('div');
  tablist.className = 'tabs-portfolio-list';
  tablist.setAttribute('role', 'tablist');

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (!row.textContent.trim() && !row.querySelector('picture')) {
      row.remove();
      return;
    }
    const labelCell = cells.length > 1 ? cells[0] : null;
    const contentCells = cells.length > 1 ? cells.slice(1) : cells;
    const heading = row.querySelector('h1, h2, h3, h4, h5, h6');
    const label = (labelCell?.textContent || heading?.textContent || '').trim();
    const index = tablist.children.length;

    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'tabs-portfolio-tab';
    tab.id = `${id}-tab-${index}`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', `${id}-panel-${index}`);
    tab.textContent = label || `Tab ${index + 1}`;
    if (labelCell) moveInstrumentation(labelCell, tab);
    tab.addEventListener('click', () => select(block, index));
    tablist.append(tab);

    const panel = document.createElement('div');
    panel.className = 'tabs-portfolio-panel';
    panel.id = `${id}-panel-${index}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    moveInstrumentation(row, panel);

    const text = document.createElement('div');
    text.className = 'tabs-portfolio-text';
    const media = document.createElement('div');
    media.className = 'tabs-portfolio-media';
    contentCells.forEach((cell) => {
      cell.querySelectorAll('picture').forEach((picture) => {
        const img = picture.querySelector('img');
        const optimized = optimizePicture(img, false, [{ media: '(min-width: 900px)', width: '1400' }, { width: '750' }]);
        moveInstrumentation(img, optimized.querySelector('img'));
        (picture.closest('p') || picture).remove();
        media.append(optimized);
      });
      text.append(...cell.childNodes);
    });

    if (text.textContent.trim()) panel.append(text);
    if (media.children.length) panel.append(media);
    else panel.classList.add('no-media');
    panels.append(panel);
    row.remove();
  });

  const count = tablist.children.length;
  block.append(panels, tablist);

  if (count > 1) {
    const nav = document.createElement('div');
    nav.className = 'tabs-portfolio-nav';
    const prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'tabs-portfolio-prev';
    prev.setAttribute('aria-label', 'Previous');
    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'tabs-portfolio-next';
    next.setAttribute('aria-label', 'Next');
    const current = () => Number(block.dataset.activeTab || 0);
    prev.addEventListener('click', () => select(block, current() - 1));
    next.addEventListener('click', () => select(block, current() + 1));
    nav.append(prev, next);
    block.append(nav);
  }

  tablist.addEventListener('keydown', (e) => {
    const tabs = [...tablist.children];
    const idx = tabs.indexOf(document.activeElement);
    if (idx < 0) return;
    const keys = {
      ArrowRight: idx + 1,
      ArrowLeft: idx - 1,
      Home: 0,
      End: tabs.length - 1,
    };
    if (e.key in keys) {
      e.preventDefault();
      select(block, keys[e.key], true);
    }
  });

  select(block, 0);
}
