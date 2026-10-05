/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-distance. Base: tabs. Source: https://www.marvell.com/
 * Model (blocks/tabs-distance/_tabs-distance.json) item tabs-distance-item:
 *   title (tab label), content_image + content_richtext (grouped into one cell).
 * Structure: one row per distance stop -> [label | image, headline p, h3 title, description p].
 *
 * Selectors validated against migration-work/block-context/tabs-distance/source.html:
 *   labels:  ol.mrvll-distance-explorer__labels > li (6), fallback
 *            ul.mrvll-distance-explorer__stops button .mrvll-visually-hidden
 *   images:  .mrvll-distance-explorer__illustration > .mrvll-distance-explorer__visual img (6)
 *   text (active stop only): .mrvll-distance-explorer__card .mrvll-distance-explorer__distance p,
 *            .mrvll-distance-explorer__title h3, .mrvll-distance-explorer__body p
 * Non-active stops only expose image + alt in the DOM; alt is used as the stop's h3 title.
 * .mrvll-distance-explorer__footer (note + CTA) is section default content and is kept
 * outside the block.
 */
export default function parse(element, { document }) {
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

  // Labels
  let labels = Array.from(element.querySelectorAll('ol.mrvll-distance-explorer__labels > li'))
    .map((li) => clean(li.textContent)).filter(Boolean);
  if (!labels.length) {
    labels = Array.from(element.querySelectorAll('.mrvll-distance-explorer__stops li'))
      .map((li) => clean(li.textContent)).filter(Boolean);
  }

  // Visual per stop (image)
  const visuals = Array.from(element.querySelectorAll('.mrvll-distance-explorer__illustration > .mrvll-distance-explorer__visual'));
  let activeIndex = visuals.findIndex((v) => v.classList.contains('is-active'));
  if (activeIndex < 0) activeIndex = 0;

  // Active stop text from the card
  const card = element.querySelector('.mrvll-distance-explorer__card');
  const activeHeadline = card && card.querySelector('.mrvll-distance-explorer__distance p, .mrvll-distance-explorer__distance');
  const activeTitle = card && card.querySelector('.mrvll-distance-explorer__title h3, .mrvll-distance-explorer__title h2, h3');
  const activeBody = card && card.querySelector('.mrvll-distance-explorer__body p, .mrvll-distance-explorer__body');

  const count = Math.max(labels.length, visuals.length);
  if (!count) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Keep the footer (default content) outside the block.
  const footer = element.querySelector('.mrvll-distance-explorer__footer');

  const cells = [];

  // Block-level drag_label field: "Drag to travel the distance" (.mrvll-distance-explorer__drag-label)
  const dragLabel = element.querySelector('.mrvll-distance-explorer__drag-label p, .mrvll-distance-explorer__drag-label');
  if (dragLabel && clean(dragLabel.textContent)) {
    const dragCell = document.createDocumentFragment();
    dragCell.appendChild(document.createComment(' field:drag_label '));
    dragCell.appendChild(document.createTextNode(clean(dragLabel.textContent)));
    cells.push([dragCell]);
  }

  for (let i = 0; i < count; i += 1) {
    const label = labels[i] || `Stop ${i + 1}`;
    const img = visuals[i] ? visuals[i].querySelector('img') : null;

    const labelCell = document.createDocumentFragment();
    labelCell.appendChild(document.createComment(' field:title '));
    labelCell.appendChild(document.createTextNode(label));

    const contentCell = document.createDocumentFragment();
    if (img) {
      contentCell.appendChild(document.createComment(' field:content_image '));
      const p = document.createElement('p');
      p.appendChild(img);
      contentCell.appendChild(p);
    }
    contentCell.appendChild(document.createComment(' field:content_richtext '));
    if (i === activeIndex && (activeHeadline || activeTitle || activeBody)) {
      if (activeHeadline && clean(activeHeadline.textContent)) {
        const p = document.createElement('p');
        p.textContent = clean(activeHeadline.textContent);
        contentCell.appendChild(p);
      }
      if (activeTitle && clean(activeTitle.textContent)) {
        const h3 = document.createElement('h3');
        h3.textContent = clean(activeTitle.textContent);
        contentCell.appendChild(h3);
      }
      if (activeBody && clean(activeBody.textContent)) {
        const p = document.createElement('p');
        p.textContent = clean(activeBody.textContent);
        contentCell.appendChild(p);
      }
    } else {
      const titleText = img ? clean(img.getAttribute('alt')) : '';
      const h3 = document.createElement('h3');
      h3.textContent = titleText || label;
      contentCell.appendChild(h3);
    }

    cells.push([labelCell, contentCell]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-distance', cells });
  if (footer) element.after(footer);
  element.replaceWith(block);
}
