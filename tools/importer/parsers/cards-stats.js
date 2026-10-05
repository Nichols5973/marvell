/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-stats. Base: cards. Source: https://www.marvell.com/
 * Model (blocks/cards-stats/_cards-stats.json) item cards-stats-card:
 *   image (+imageAlt collapsed), text (richtext statement).
 * Structure: one row per card -> [icon image | statement paragraph].
 *
 * The instance selector (section.mrvll-stats article.mrvll-stats-card) matches each of the
 * 5 sibling cards individually. The parser is invoked once per card, so the FIRST card
 * builds a single block from itself plus all following sibling cards, and the other cards
 * are removed. Later invocations on already-consumed (detached) cards are no-ops.
 *
 * Selectors validated against migration-work/block-context/cards-stats/source.html and
 * instances/01-04.html:
 *   .mrvll-stats-card__icon img (icon), .mrvll-stats-card__text p (statement)
 *   .mrvll-bg img.mrvll-bg__image is a decorative gradient background -> dropped.
 */
const CARD_SELECTOR = 'article.mrvll-stats-card';

export default function parse(element, { document }) {
  // Already consumed by the first card's invocation.
  if (!element.parentNode || element.dataset.cardsStatsConsumed === 'true') return;

  const parent = element.parentElement;
  const siblings = parent
    ? Array.from(parent.children).filter((el) => el.matches(CARD_SELECTOR))
    : [element];
  // Start from this element and take every sibling card from here on.
  const cards = siblings.slice(Math.max(0, siblings.indexOf(element)));

  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const cells = [];

  cards.forEach((card) => {
    const icon = card.querySelector('.mrvll-stats-card__icon img, .cmp-image img:not(.mrvll-bg__image)');
    const textEls = Array.from(card.querySelectorAll('.mrvll-stats-card__text p, .mrvll-stats-card__text h2, .mrvll-stats-card__text h3'))
      .filter((el) => clean(el.textContent));

    if (!icon && !textEls.length) return;

    let imageCell = '';
    if (icon) {
      // html2md's convertIcons rule turns any <img src="*.svg"> into ":name:" icon text,
      // which would put plain text into the xwalk "image" reference field. Most stat icons
      // are SVGs (icon-*.svg), so append a no-op query so the src no longer ends in ".svg"
      // and the icon survives as a real image.
      const src = icon.getAttribute('src') || '';
      if (/\.svg$/i.test(src)) icon.setAttribute('src', `${src}?fmt=svg`);
      imageCell = document.createDocumentFragment();
      imageCell.appendChild(document.createComment(' field:image '));
      imageCell.appendChild(icon);
    }

    let textCell = '';
    if (textEls.length) {
      textCell = document.createDocumentFragment();
      textCell.appendChild(document.createComment(' field:text '));
      textEls.forEach((el) => {
        const n = document.createElement(el.tagName.toLowerCase());
        n.innerHTML = el.innerHTML;
        textCell.appendChild(n);
      });
    }

    cells.push([imageCell, textCell]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Remove the other consumed cards; mark them so a later invocation is a no-op.
  cards.slice(1).forEach((card) => {
    card.dataset.cardsStatsConsumed = 'true';
    card.remove();
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-stats', cells });
  element.replaceWith(block);
}
