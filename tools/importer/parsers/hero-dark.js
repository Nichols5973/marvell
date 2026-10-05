/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-dark. Base: hero. Source: https://www.marvell.com/
 * Model (blocks/hero-dark/_hero-dark.json): image (+imageAlt collapsed), text (richtext).
 * Structure: 1 column; row 1 = background image, row 2 = heading, lead, CTA.
 * Selectors validated against migration-work/block-context/hero-dark/source.html:
 *   section.mrvll-hero > .mrvll-hero__media > .mrvll-hero__image img.cmp-image__image
 *   .mrvll-hero__title h1.cmp-title__text, .mrvll-hero__lead .cmp-text p,
 *   .mrvll-hero__actions a.cmp-button
 */
export default function parse(element, { document }) {
  const bgImage = element.querySelector('.mrvll-hero__image img, .mrvll-hero__media img, img');
  const heading = element.querySelector('.mrvll-hero__title h1, .mrvll-hero__title h2, h1, h2');
  const leadParas = Array.from(
    element.querySelectorAll('.mrvll-hero__lead p, .mrvll-hero__lead .cmp-text > *:not(p)'),
  ).filter((el) => el.textContent.trim());
  const ctas = Array.from(element.querySelectorAll('.mrvll-hero__actions a[href], a.cmp-button'))
    .filter((a, i, arr) => arr.indexOf(a) === i);

  if (!heading && !bgImage && !leadParas.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 1: background image (field:image)
  if (bgImage) {
    const imgFrag = document.createDocumentFragment();
    imgFrag.appendChild(document.createComment(' field:image '));
    imgFrag.appendChild(bgImage);
    cells.push([imgFrag]);
  } else {
    cells.push(['']);
  }

  // Row 2: richtext (field:text) — heading, lead paragraph(s), CTA link(s)
  const textFrag = document.createDocumentFragment();
  textFrag.appendChild(document.createComment(' field:text '));
  if (heading) {
    // Normalise heading to h1 without AEM classes
    const h = document.createElement(heading.tagName.toLowerCase());
    h.textContent = heading.textContent.trim();
    textFrag.appendChild(h);
  }
  leadParas.forEach((p) => textFrag.appendChild(p));
  ctas.forEach((a) => {
    const link = document.createElement('a');
    link.href = a.getAttribute('href');
    link.textContent = a.textContent.trim();
    const p = document.createElement('p');
    p.appendChild(link);
    textFrag.appendChild(p);
  });
  cells.push([textFrag]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-dark', cells });
  element.replaceWith(block);
}
