/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-news. Base: tabs. Source: https://www.marvell.com/
 * Model (blocks/tabs-news/_tabs-news.json) item tabs-news-item:
 *   title (tab label), content_image + content_richtext (grouped into one cell).
 * Structure: one row per article -> [tab label | image, "Category · Date" p,
 *   h3 linked title, optional summary p].
 *
 * Selectors validated against migration-work/block-context/tabs-news/source.html:
 *   element = section.mrvll-news .mrvll-news__panels
 *   panels: :scope > .mrvll-news__panel (id "mrvll-news-1-panel-{key}")
 *   labels: sibling ul.mrvll-news__tabs button.mrvll-news__tab (id "mrvll-news-1-tab-{key}")
 *   The hidden "All" tab/panel (key "all") is dropped.
 *   articles: .mrvll-news-card__body-wrap (meta p > span + time, joined with " · ", .mrvll-news-card__title h3,
 *             .mrvll-news-card__body p) paired with its sibling .mrvll-news-card__media img.
 * Iteration is keyed on the inner .mrvll-news-card__body-wrap, NOT on the a.mrvll-news-card
 * wrappers: adjacent sibling <a> elements wrapping block content can be merged by html2md
 * preprocessing. The href is read from body.closest('a') and re-attached to the h3.
 */
export default function parse(element, { document }) {
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const keyOf = (id, marker) => {
    const m = (id || '').match(new RegExp(`-${marker}-([\\w-]+)$`));
    return m ? m[1] : null;
  };

  const section = element.closest('section.mrvll-news') || element.parentElement;
  const tabList = section ? section.querySelector('ul.mrvll-news__tabs') : null;
  const tabButtons = tabList ? Array.from(tabList.querySelectorAll('button.mrvll-news__tab, li > button')) : [];
  const labelsByKey = {};
  tabButtons.forEach((b) => {
    const k = keyOf(b.id, 'tab');
    if (k) labelsByKey[k] = clean(b.textContent);
  });

  let panels = Array.from(element.querySelectorAll(':scope > .mrvll-news__panel'));
  if (!panels.length) panels = Array.from(element.querySelectorAll('.mrvll-news__panel, [role="tabpanel"]'));

  const cells = [];
  panels.forEach((panel, i) => {
    const key = keyOf(panel.id, 'panel');
    let label = (key && labelsByKey[key]) || (tabButtons[i] ? clean(tabButtons[i].textContent) : '');
    if (!label && key) label = key.charAt(0).toUpperCase() + key.slice(1);
    // Drop the hidden aggregate "All" tab.
    if (key === 'all' || /^all$/i.test(label)) return;

    // Articles keyed on the inner body wrapper.
    let bodies = Array.from(panel.querySelectorAll('.mrvll-news-card__body-wrap'));
    let articles = bodies.map((body) => {
      const prev = body.previousElementSibling;
      const media = prev && prev.classList.contains('mrvll-news-card__media') ? prev : null;
      const anchor = body.closest('a[href]');
      return { body, media, href: anchor ? anchor.getAttribute('href') : null };
    });
    if (!articles.length) {
      // Fallback: iterate the card anchors directly.
      articles = Array.from(panel.querySelectorAll('a.mrvll-news-card')).map((a) => ({
        body: a, media: a.querySelector('.mrvll-news-card__media'), href: a.getAttribute('href'),
      }));
    }
    if (!articles.length) return;

    // One row per article (model tabs-news-item: title = tab label, content_image,
    // content_richtext). A rich-text field holds at most one image in xwalk/md2jcr, so the
    // articles of a tab cannot share a single cell; the block regroups rows by tab label.
    articles.forEach(({ body, media, href }) => {
      const labelCell = document.createDocumentFragment();
      labelCell.appendChild(document.createComment(' field:title '));
      labelCell.appendChild(document.createTextNode(label || `Tab ${i + 1}`));

      const contentCell = document.createDocumentFragment();
      const img = media ? media.querySelector('img') : null;
      if (img) {
        contentCell.appendChild(document.createComment(' field:content_image '));
        const p = document.createElement('p');
        p.appendChild(img);
        contentCell.appendChild(p);
      }
      contentCell.appendChild(document.createComment(' field:content_richtext '));

      const meta = body.querySelector('.mrvll-news-card__meta p, .mrvll-news-card__meta');
      if (meta) {
        // html2md preprocessing unwraps class-less <span>s before parsing, so the category is
        // a bare text node next to <time>: take it as the meta text minus the date.
        const time = meta.querySelector('time');
        const date = time ? clean(time.textContent) : '';
        const category = clean(time ? meta.textContent.replace(time.textContent, '') : '');
        const parts = [category, date].filter(Boolean);
        // Join with a middle dot, not '|': a pipe inside a block cell is read as a
        // markdown table column separator by html2md and the category is dropped.
        const metaText = parts.length ? parts.join(' · ') : clean(meta.textContent);
        if (metaText) {
          const p = document.createElement('p');
          p.textContent = metaText;
          contentCell.appendChild(p);
        }
      }

      const title = body.querySelector('.mrvll-news-card__title h3, .mrvll-news-card__title h2, h3, h2');
      if (title && clean(title.textContent)) {
        const h3 = document.createElement('h3');
        if (href) {
          const a = document.createElement('a');
          a.href = href;
          a.textContent = clean(title.textContent);
          h3.appendChild(a);
        } else {
          h3.textContent = clean(title.textContent);
        }
        contentCell.appendChild(h3);
      }

      Array.from(body.querySelectorAll('.mrvll-news-card__body p'))
        .filter((p) => clean(p.textContent))
        .forEach((p) => {
          const np = document.createElement('p');
          np.textContent = clean(p.textContent);
          contentCell.appendChild(np);
        });

      cells.push([labelCell, contentCell]);
    });
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // The tab buttons are now represented by the block's label cells.
  if (tabList) tabList.remove();

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-news', cells });
  element.replaceWith(block);
}
