/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-portfolio. Base: tabs. Source: https://www.marvell.com/
 * Model (blocks/tabs-portfolio/_tabs-portfolio.json) item tabs-portfolio-item:
 *   title (tab label), content_richtext + content_image (grouped into one cell).
 * Structure: one row per tab -> [label | h3, paragraph, CTA link, image].
 *
 * Selectors validated against migration-work/block-context/tabs-portfolio/source.html:
 *   panels: :scope > article.mrvll-portfolio__card (5) -> .mrvll-portfolio__title h3,
 *           .mrvll-portfolio__body p, a.mrvll-portfolio__cta
 *   images: .mrvll-portfolio__media > .mrvll-portfolio__image-slide img (5, paired by index)
 *   labels: ul.mrvll-portfolio__tabs .mrvll-portfolio__tab-label (5, <br> -> space)
 * Arrows (.mrvll-portfolio__arrows) are UI chrome and are dropped.
 */
export default function parse(element, { document }) {
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

  let panels = Array.from(element.querySelectorAll(':scope > article.mrvll-portfolio__card'));
  if (!panels.length) panels = Array.from(element.querySelectorAll('article.mrvll-portfolio__card, [id*="-panel-"]'));

  const imageSlides = Array.from(element.querySelectorAll('.mrvll-portfolio__media > .mrvll-portfolio__image-slide'));

  const labels = Array.from(element.querySelectorAll('ul.mrvll-portfolio__tabs .mrvll-portfolio__tab-label, ul.mrvll-portfolio__tabs button:not(:has(.mrvll-portfolio__tab-label))'))
    .map((el) => {
      el.querySelectorAll('br').forEach((br) => br.replaceWith(document.createTextNode(' ')));
      return clean(el.textContent);
    });

  if (!panels.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  panels.forEach((panel, i) => {
    const heading = panel.querySelector('.mrvll-portfolio__title h3, .mrvll-portfolio__title h2, h3, h2');
    const bodyParas = Array.from(panel.querySelectorAll('.mrvll-portfolio__body p')).filter((p) => clean(p.textContent));
    const cta = panel.querySelector('a.mrvll-portfolio__cta[href], a.cmp-button[href]');
    const img = imageSlides[i] ? imageSlides[i].querySelector('img') : null;

    const label = labels[i] || (cta ? clean(cta.textContent) : '') || (heading ? clean(heading.textContent) : `Tab ${i + 1}`);

    const labelCell = document.createDocumentFragment();
    labelCell.appendChild(document.createComment(' field:title '));
    labelCell.appendChild(document.createTextNode(label));

    const contentCell = document.createDocumentFragment();
    contentCell.appendChild(document.createComment(' field:content_richtext '));
    if (heading && clean(heading.textContent)) {
      const h3 = document.createElement('h3');
      h3.textContent = clean(heading.textContent);
      contentCell.appendChild(h3);
    }
    bodyParas.forEach((p) => {
      const np = document.createElement('p');
      np.innerHTML = p.innerHTML;
      contentCell.appendChild(np);
    });
    if (cta) {
      const a = document.createElement('a');
      a.href = cta.getAttribute('href');
      a.textContent = clean(cta.textContent);
      const p = document.createElement('p');
      p.appendChild(a);
      contentCell.appendChild(p);
    }
    if (img) {
      contentCell.appendChild(document.createComment(' field:content_image '));
      const p = document.createElement('p');
      p.appendChild(img);
      contentCell.appendChild(p);
    }

    cells.push([labelCell, contentCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-portfolio', cells });
  element.replaceWith(block);
}
