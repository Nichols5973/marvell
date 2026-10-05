/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-teaser. Base: carousel. Source: https://www.marvell.com/
 * Model (blocks/carousel-teaser/_carousel-teaser.json) item carousel-teaser-slide:
 *   image (+imageAlt collapsed), text (richtext: eyebrow paragraph + linked h3 title).
 * Structure: one row per slide -> [image | eyebrow, h3 title (linked when URL known)].
 *
 * Selectors validated against migration-work/block-context/carousel-teaser/source.html:
 *   ul.mrvll-hero-teaser__slides > li (5 slides)
 *     .mrvll-hero-teaser__slide-image img, .mrvll-hero-teaser__eyebrow p,
 *     .mrvll-hero-teaser__title h3.cmp-title__text
 *   a.mrvll-hero-teaser__link — duplicated markup for the ACTIVE slide only; its href
 *   is the only resolved slide URL. It contains an invalid nested <button>, so it is
 *   never iterated; it is only read for its href + title text to pair with a slide.
 */
export default function parse(element, { document }) {
  // Iterate the slide <li> wrappers (stable block-level units; not the nested link/button).
  let slides = Array.from(element.querySelectorAll('ul.mrvll-hero-teaser__slides > li'));
  if (!slides.length) {
    slides = Array.from(element.querySelectorAll('.mrvll-hero-teaser__viewport ul > li'));
  }

  // Active slide link: pair by title text.
  const activeLink = element.querySelector('a.mrvll-hero-teaser__link[href]');
  let activeHref = null;
  let activeTitle = '';
  if (activeLink) {
    activeHref = activeLink.getAttribute('href');
    const t = activeLink.querySelector('.mrvll-hero-teaser__title h3 span, .mrvll-hero-teaser__title h3');
    activeTitle = t ? t.textContent.replace(/Next story/i, '').trim() : '';
  }

  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();

  const cells = [];
  slides.forEach((li) => {
    const img = li.querySelector('.mrvll-hero-teaser__slide-image img, img');
    const eyebrow = li.querySelector('.mrvll-hero-teaser__eyebrow p, .mrvll-hero-teaser__eyebrow');
    const titleEl = li.querySelector('.mrvll-hero-teaser__title h3, .mrvll-hero-teaser__title h2, h3, h2');
    const titleText = titleEl ? titleEl.textContent.replace(/\s+/g, ' ').trim() : '';

    // Per-slide link, if present in the slide itself; otherwise the active-slide link when titles match.
    const ownLink = li.querySelector('a[href]');
    let href = ownLink ? ownLink.getAttribute('href') : null;
    if (!href && activeHref && titleText && norm(titleText) === norm(activeTitle)) href = activeHref;

    if (!img && !titleText && !(eyebrow && eyebrow.textContent.trim())) return;

    // Image cell
    let imageCell = '';
    if (img) {
      imageCell = document.createDocumentFragment();
      imageCell.appendChild(document.createComment(' field:image '));
      imageCell.appendChild(img);
    }

    // Text cell
    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));
    if (eyebrow && eyebrow.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = eyebrow.textContent.trim();
      textCell.appendChild(p);
    }
    if (titleText) {
      const h3 = document.createElement('h3');
      if (href) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = titleText;
        h3.appendChild(a);
      } else {
        h3.textContent = titleText;
      }
      textCell.appendChild(h3);
    }

    cells.push([imageCell, textCell]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-teaser', cells });
  element.replaceWith(block);
}
