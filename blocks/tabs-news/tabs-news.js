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

const isHeading = (el) => /^H[1-6]$/.test(el.tagName);

/**
 * Split a tab's rich-text content into article groups. An article is
 * [image?, "Category · Date" paragraph?, heading (linked title), summary paragraph(s)?].
 * A new article starts at an image, or at a heading / heading-preceding paragraph once the
 * current article already has a heading.
 */
function groupArticles(elements) {
  const articles = [];
  let current = null;
  const hasHeading = () => current && current.some(isHeading);
  const hasPicture = () => current && current.some((el) => el.querySelector('picture'));
  elements.forEach((el) => {
    const pic = !!el.querySelector('picture') || el.tagName === 'PICTURE';
    const startsMeta = el.tagName === 'P' && !pic
      && el.nextElementSibling && isHeading(el.nextElementSibling);
    const startNew = !current
      || (pic && (hasPicture() || hasHeading()))
      || (isHeading(el) && hasHeading())
      || (startsMeta && hasHeading());
    if (startNew) {
      current = [];
      articles.push(current);
    }
    current.push(el);
  });
  return articles;
}

// Meta line is "Category · Date" (older content used "Category | Date").
const META_PATTERN = /^(.+?)\s*[·|•]\s*(.+)$/;

function splitMeta(p) {
  if (p.children.length) return; // keep any authored inline markup untouched
  const match = p.textContent.trim().match(META_PATTERN);
  if (!match) return;
  const [, category, date] = match;
  const catEl = document.createElement('span');
  catEl.className = 'tabs-news-category';
  catEl.textContent = category;
  const sep = document.createElement('span');
  sep.className = 'tabs-news-separator';
  sep.setAttribute('aria-hidden', 'true');
  sep.textContent = ' · ';
  const dateEl = document.createElement('span');
  dateEl.className = 'tabs-news-date';
  dateEl.textContent = date;
  p.replaceChildren(catEl, sep, dateEl);
}

function buildArticle(parts, index) {
  const article = document.createElement('article');
  article.className = 'tabs-news-article';
  const media = document.createElement('div');
  media.className = 'tabs-news-media';
  const body = document.createElement('div');
  body.className = 'tabs-news-body';
  parts.forEach((el) => {
    const picture = el.tagName === 'PICTURE' ? el : el.querySelector('picture');
    if (picture && !media.children.length) {
      const img = picture.querySelector('img');
      const width = index === 0 ? '900' : '400';
      const optimized = optimizePicture(img, false, [{ width }]);
      moveInstrumentation(img, optimized.querySelector('img'));
      media.append(optimized);
      if (el !== picture && el.textContent.trim()) {
        picture.remove();
        body.append(el);
      }
      return;
    }
    body.append(el);
  });
  const heading = [...body.children].find(isHeading);
  [...body.children].forEach((el) => {
    if (el.tagName !== 'P') return;
    const before = heading && [...body.children].indexOf(el) < [...body.children].indexOf(heading);
    el.classList.add(before ? 'tabs-news-meta' : 'tabs-news-summary');
    if (before) splitMeta(el);
  });
  if (media.children.length) article.append(media);
  else article.classList.add('no-media');
  article.append(body);
  return article;
}

function select(block, index, focus = false) {
  const tabs = [...block.querySelectorAll('.tabs-news-tab')];
  const panels = [...block.querySelectorAll('.tabs-news-panel')];
  if (!tabs.length) return;
  const next = (index + tabs.length) % tabs.length;
  tabs.forEach((tab, i) => {
    tab.setAttribute('aria-selected', String(i === next));
    tab.tabIndex = i === next ? 0 : -1;
  });
  panels.forEach((panel, i) => { panel.hidden = i !== next; });
  if (focus) tabs[next].focus();
}

/**
 * tabs-news: tab bar switching news panels; each panel lists articles with the first
 * rendered as featured and the rest as a compact list.
 * Content contract: one row per article -> [tab label cell | image + rich text].
 * Rows that share a tab label are grouped into the same tab, in order. A row whose content
 * holds several articles is still split into separate articles.
 * @param {Element} block
 */
export default function decorate(block) {
  // eslint-disable-next-line no-unused-vars
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));
  instanceCount += 1;
  const id = `tabs-news-${instanceCount}`;

  const tablist = document.createElement('div');
  tablist.className = 'tabs-news-list';
  tablist.setAttribute('role', 'tablist');
  const panels = document.createElement('div');
  panels.className = 'tabs-news-panels';
  const groups = new Map();

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (!row.textContent.trim() && !row.querySelector('picture')) {
      row.remove();
      return;
    }
    const labelCell = cells.length > 1 ? cells[0] : null;
    const contentCells = cells.length > 1 ? cells.slice(1) : cells;
    const label = (labelCell?.textContent || '').trim() || `Tab ${groups.size + 1}`;

    let group = groups.get(label);
    if (!group) {
      const index = groups.size;
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'tabs-news-tab';
      tab.id = `${id}-tab-${index}`;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', `${id}-panel-${index}`);
      tab.textContent = label;
      tab.addEventListener('click', () => select(block, index));
      tablist.append(tab);

      const panel = document.createElement('div');
      panel.className = 'tabs-news-panel';
      panel.id = `${id}-panel-${index}`;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tab.id);
      panels.append(panel);
      group = { panel, articles: [] };
      groups.set(label, group);
    }

    const elements = contentCells.flatMap((cell) => [...cell.children]);
    const offset = group.articles.length;
    const articles = groupArticles(elements).map((parts, i) => buildArticle(parts, offset + i));
    if (articles.length) moveInstrumentation(row, articles[0]);
    group.articles.push(...articles);
    row.remove();
  });

  groups.forEach(({ panel, articles }) => {
    if (articles.length) {
      articles[0].classList.add('featured');
      panel.append(articles[0]);
    }
    if (articles.length > 1) {
      const rest = document.createElement('div');
      rest.className = 'tabs-news-more';
      rest.append(...articles.slice(1));
      panel.append(rest);
    } else {
      panel.classList.add('single');
    }
  });

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

  block.append(tablist, panels);
  select(block, 0);
}
