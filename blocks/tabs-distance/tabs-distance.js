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
  const tabs = [...block.querySelectorAll('.tabs-distance-stop')];
  const panels = [...block.querySelectorAll('.tabs-distance-panel')];
  if (!tabs.length) return;
  const next = Math.max(0, Math.min(index, tabs.length - 1));
  tabs.forEach((tab, i) => {
    const isActive = i === next;
    tab.setAttribute('aria-selected', String(isActive));
    tab.tabIndex = isActive ? 0 : -1;
    tab.classList.toggle('passed', i < next);
  });
  panels.forEach((panel, i) => { panel.hidden = i !== next; });
  const range = block.querySelector('.tabs-distance-range');
  if (range) range.value = String(next);
  block.style.setProperty('--tabs-distance-progress', tabs.length > 1 ? next / (tabs.length - 1) : 0);
  if (focus) tabs[next].focus();
}

/**
 * The block-level "drag_label" field renders as a leading single-cell, text-only row
 * (no picture, no heading) ahead of the two-cell stop rows. Returns its paragraph, or null.
 * @param {Element} block
 */
function takeDragLabel(block) {
  const [first, ...rest] = [...block.children];
  if (!first || !rest.some((row) => row.children.length > 1)) return null;
  const cells = [...first.children];
  if (cells.length !== 1 || !first.textContent.trim()) return null;
  if (first.querySelector('picture, h1, h2, h3, h4, h5, h6')) return null;
  const p = cells[0].querySelector('p') || document.createElement('p');
  if (!p.parentElement) p.append(...cells[0].childNodes);
  first.remove();
  return p;
}

/**
 * tabs-distance: labelled distance stops along a draggable track; each stop switches a panel
 * of [image | headline, h3 title, description].
 * Content contract: optional leading drag-label row, then one row per stop ->
 * [label cell | content cell (image + rich text)].
 * The rich text may be a full headline/h3/description set or just the h3 title.
 * A single-cell row uses its first line as the label.
 * @param {Element} block
 */
export default function decorate(block) {
  // eslint-disable-next-line no-unused-vars
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));
  instanceCount += 1;
  const id = `tabs-distance-${instanceCount}`;
  const dragLabel = takeDragLabel(block);

  const panels = document.createElement('div');
  panels.className = 'tabs-distance-panels';
  const tablist = document.createElement('div');
  tablist.className = 'tabs-distance-stops';
  tablist.setAttribute('role', 'tablist');
  tablist.setAttribute('aria-label', 'Distance');

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (!row.textContent.trim() && !row.querySelector('picture')) {
      row.remove();
      return;
    }
    let labelCell = cells.length > 1 ? cells[0] : null;
    let contentCells = cells.length > 1 ? cells.slice(1) : cells;
    let label = labelCell ? labelCell.textContent.trim() : '';
    if (!label && contentCells[0]) {
      // fall back to the first text element in the content as the label
      const first = [...contentCells[0].children].find((el) => el.textContent.trim());
      label = first ? first.textContent.trim() : '';
      if (first) first.remove();
      labelCell = null;
    }
    const index = tablist.children.length;

    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'tabs-distance-stop';
    tab.id = `${id}-tab-${index}`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', `${id}-panel-${index}`);
    const dot = document.createElement('span');
    dot.className = 'tabs-distance-dot';
    dot.setAttribute('aria-hidden', 'true');
    const labelEl = document.createElement('span');
    labelEl.className = 'tabs-distance-label';
    labelEl.textContent = label;
    tab.append(dot, labelEl);
    if (labelCell) moveInstrumentation(labelCell, tab);
    tab.addEventListener('click', () => select(block, index));
    tablist.append(tab);

    const panel = document.createElement('div');
    panel.className = 'tabs-distance-panel';
    panel.id = `${id}-panel-${index}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    moveInstrumentation(row, panel);

    const media = document.createElement('div');
    media.className = 'tabs-distance-media';
    const text = document.createElement('div');
    text.className = 'tabs-distance-text';
    contentCells = contentCells.filter(Boolean);
    contentCells.forEach((cell) => {
      cell.querySelectorAll('picture').forEach((picture) => {
        const img = picture.querySelector('img');
        const optimized = optimizePicture(img, index === 0, [{ media: '(min-width: 900px)', width: '1200' }, { width: '750' }]);
        moveInstrumentation(img, optimized.querySelector('img'));
        (picture.closest('p') || picture).remove();
        media.append(optimized);
      });
      text.append(...cell.childNodes);
    });
    // First paragraph ahead of the title is the large headline (e.g. "1,000+ kilometers").
    const kids = [...text.children];
    const heading = kids.find((el) => /^H[1-6]$/.test(el.tagName));
    const firstP = kids.find((el) => el.tagName === 'P' && el.textContent.trim());
    if (firstP && heading && kids.indexOf(firstP) < kids.indexOf(heading)) {
      firstP.classList.add('tabs-distance-headline');
    }
    // Most stops carry only an image + h3 title (no headline/description).
    if (heading && !kids.some((el) => el !== heading && el.textContent.trim())) {
      panel.classList.add('title-only');
    }

    if (media.children.length) panel.append(media);
    else panel.classList.add('no-media');
    if (text.textContent.trim()) panel.append(text);
    else panel.classList.add('no-text');
    panels.append(panel);
    row.remove();
  });

  const count = tablist.children.length;
  const track = document.createElement('div');
  track.className = 'tabs-distance-track';
  if (dragLabel) {
    dragLabel.classList.add('tabs-distance-drag-label');
    track.append(dragLabel);
  }
  if (count > 1) {
    const range = document.createElement('input');
    range.type = 'range';
    range.className = 'tabs-distance-range';
    range.min = '0';
    range.max = String(count - 1);
    range.step = '1';
    range.value = '0';
    range.setAttribute('aria-label', 'Travel the distance');
    range.setAttribute('aria-controls', panels.querySelector('.tabs-distance-panel')?.id || '');
    range.addEventListener('input', () => select(block, Number(range.value)));
    track.append(range);
  }
  track.append(tablist);
  tablist.style.setProperty('--tabs-distance-count', count);

  tablist.addEventListener('keydown', (e) => {
    const tabs = [...tablist.children];
    const current = tabs.indexOf(document.activeElement);
    if (current < 0) return;
    const keys = {
      ArrowRight: current + 1,
      ArrowDown: current + 1,
      ArrowLeft: current - 1,
      ArrowUp: current - 1,
      Home: 0,
      End: tabs.length - 1,
    };
    if (e.key in keys) {
      e.preventDefault();
      select(block, (keys[e.key] + tabs.length) % tabs.length, true);
    }
  });

  block.append(panels, track);
  select(block, 0);
}
