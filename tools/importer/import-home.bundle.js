/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-home.js
  var import_home_exports = {};
  __export(import_home_exports, {
    default: () => import_home_default
  });

  // tools/importer/parsers/hero-dark.js
  function parse(element, { document: document2 }) {
    const bgImage = element.querySelector(".mrvll-hero__image img, .mrvll-hero__media img, img");
    const heading = element.querySelector(".mrvll-hero__title h1, .mrvll-hero__title h2, h1, h2");
    const leadParas = Array.from(
      element.querySelectorAll(".mrvll-hero__lead p, .mrvll-hero__lead .cmp-text > *:not(p)")
    ).filter((el) => el.textContent.trim());
    const ctas = Array.from(element.querySelectorAll(".mrvll-hero__actions a[href], a.cmp-button")).filter((a, i, arr) => arr.indexOf(a) === i);
    if (!heading && !bgImage && !leadParas.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (bgImage) {
      const imgFrag = document2.createDocumentFragment();
      imgFrag.appendChild(document2.createComment(" field:image "));
      imgFrag.appendChild(bgImage);
      cells.push([imgFrag]);
    } else {
      cells.push([""]);
    }
    const textFrag = document2.createDocumentFragment();
    textFrag.appendChild(document2.createComment(" field:text "));
    if (heading) {
      const h = document2.createElement(heading.tagName.toLowerCase());
      h.textContent = heading.textContent.trim();
      textFrag.appendChild(h);
    }
    leadParas.forEach((p) => textFrag.appendChild(p));
    ctas.forEach((a) => {
      const link = document2.createElement("a");
      link.href = a.getAttribute("href");
      link.textContent = a.textContent.trim();
      const p = document2.createElement("p");
      p.appendChild(link);
      textFrag.appendChild(p);
    });
    cells.push([textFrag]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-dark", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-teaser.js
  function parse2(element, { document: document2 }) {
    let slides = Array.from(element.querySelectorAll("ul.mrvll-hero-teaser__slides > li"));
    if (!slides.length) {
      slides = Array.from(element.querySelectorAll(".mrvll-hero-teaser__viewport ul > li"));
    }
    const activeLink = element.querySelector("a.mrvll-hero-teaser__link[href]");
    let activeHref = null;
    let activeTitle = "";
    if (activeLink) {
      activeHref = activeLink.getAttribute("href");
      const t = activeLink.querySelector(".mrvll-hero-teaser__title h3 span, .mrvll-hero-teaser__title h3");
      activeTitle = t ? t.textContent.replace(/Next story/i, "").trim() : "";
    }
    const norm = (s) => (s || "").replace(/\s+/g, " ").trim().toLowerCase();
    const cells = [];
    slides.forEach((li) => {
      const img = li.querySelector(".mrvll-hero-teaser__slide-image img, img");
      const eyebrow = li.querySelector(".mrvll-hero-teaser__eyebrow p, .mrvll-hero-teaser__eyebrow");
      const titleEl = li.querySelector(".mrvll-hero-teaser__title h3, .mrvll-hero-teaser__title h2, h3, h2");
      const titleText = titleEl ? titleEl.textContent.replace(/\s+/g, " ").trim() : "";
      const ownLink = li.querySelector("a[href]");
      let href = ownLink ? ownLink.getAttribute("href") : null;
      if (!href && activeHref && titleText && norm(titleText) === norm(activeTitle)) href = activeHref;
      if (!img && !titleText && !(eyebrow && eyebrow.textContent.trim())) return;
      let imageCell = "";
      if (img) {
        imageCell = document2.createDocumentFragment();
        imageCell.appendChild(document2.createComment(" field:image "));
        imageCell.appendChild(img);
      }
      const textCell = document2.createDocumentFragment();
      textCell.appendChild(document2.createComment(" field:text "));
      if (eyebrow && eyebrow.textContent.trim()) {
        const p = document2.createElement("p");
        p.textContent = eyebrow.textContent.trim();
        textCell.appendChild(p);
      }
      if (titleText) {
        const h3 = document2.createElement("h3");
        if (href) {
          const a = document2.createElement("a");
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
    const block = WebImporter.Blocks.createBlock(document2, { name: "carousel-teaser", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/tabs-distance.js
  function parse3(element, { document: document2 }) {
    const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
    let labels = Array.from(element.querySelectorAll("ol.mrvll-distance-explorer__labels > li")).map((li) => clean(li.textContent)).filter(Boolean);
    if (!labels.length) {
      labels = Array.from(element.querySelectorAll(".mrvll-distance-explorer__stops li")).map((li) => clean(li.textContent)).filter(Boolean);
    }
    const visuals = Array.from(element.querySelectorAll(".mrvll-distance-explorer__illustration > .mrvll-distance-explorer__visual"));
    let activeIndex = visuals.findIndex((v) => v.classList.contains("is-active"));
    if (activeIndex < 0) activeIndex = 0;
    const card = element.querySelector(".mrvll-distance-explorer__card");
    const activeHeadline = card && card.querySelector(".mrvll-distance-explorer__distance p, .mrvll-distance-explorer__distance");
    const activeTitle = card && card.querySelector(".mrvll-distance-explorer__title h3, .mrvll-distance-explorer__title h2, h3");
    const activeBody = card && card.querySelector(".mrvll-distance-explorer__body p, .mrvll-distance-explorer__body");
    const count = Math.max(labels.length, visuals.length);
    if (!count) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const footer = element.querySelector(".mrvll-distance-explorer__footer");
    const cells = [];
    const dragLabel = element.querySelector(".mrvll-distance-explorer__drag-label p, .mrvll-distance-explorer__drag-label");
    if (dragLabel && clean(dragLabel.textContent)) {
      const dragCell = document2.createDocumentFragment();
      dragCell.appendChild(document2.createComment(" field:drag_label "));
      dragCell.appendChild(document2.createTextNode(clean(dragLabel.textContent)));
      cells.push([dragCell]);
    }
    for (let i = 0; i < count; i += 1) {
      const label = labels[i] || `Stop ${i + 1}`;
      const img = visuals[i] ? visuals[i].querySelector("img") : null;
      const labelCell = document2.createDocumentFragment();
      labelCell.appendChild(document2.createComment(" field:title "));
      labelCell.appendChild(document2.createTextNode(label));
      const contentCell = document2.createDocumentFragment();
      if (img) {
        contentCell.appendChild(document2.createComment(" field:content_image "));
        const p = document2.createElement("p");
        p.appendChild(img);
        contentCell.appendChild(p);
      }
      contentCell.appendChild(document2.createComment(" field:content_richtext "));
      if (i === activeIndex && (activeHeadline || activeTitle || activeBody)) {
        if (activeHeadline && clean(activeHeadline.textContent)) {
          const p = document2.createElement("p");
          p.textContent = clean(activeHeadline.textContent);
          contentCell.appendChild(p);
        }
        if (activeTitle && clean(activeTitle.textContent)) {
          const h3 = document2.createElement("h3");
          h3.textContent = clean(activeTitle.textContent);
          contentCell.appendChild(h3);
        }
        if (activeBody && clean(activeBody.textContent)) {
          const p = document2.createElement("p");
          p.textContent = clean(activeBody.textContent);
          contentCell.appendChild(p);
        }
      } else {
        const titleText = img ? clean(img.getAttribute("alt")) : "";
        const h3 = document2.createElement("h3");
        h3.textContent = titleText || label;
        contentCell.appendChild(h3);
      }
      cells.push([labelCell, contentCell]);
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "tabs-distance", cells });
    if (footer) element.after(footer);
    element.replaceWith(block);
  }

  // tools/importer/parsers/tabs-portfolio.js
  function parse4(element, { document: document2 }) {
    const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
    let panels = Array.from(element.querySelectorAll(":scope > article.mrvll-portfolio__card"));
    if (!panels.length) panels = Array.from(element.querySelectorAll('article.mrvll-portfolio__card, [id*="-panel-"]'));
    const imageSlides = Array.from(element.querySelectorAll(".mrvll-portfolio__media > .mrvll-portfolio__image-slide"));
    const labels = Array.from(element.querySelectorAll("ul.mrvll-portfolio__tabs .mrvll-portfolio__tab-label, ul.mrvll-portfolio__tabs button:not(:has(.mrvll-portfolio__tab-label))")).map((el) => {
      el.querySelectorAll("br").forEach((br) => br.replaceWith(document2.createTextNode(" ")));
      return clean(el.textContent);
    });
    if (!panels.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    panels.forEach((panel, i) => {
      const heading = panel.querySelector(".mrvll-portfolio__title h3, .mrvll-portfolio__title h2, h3, h2");
      const bodyParas = Array.from(panel.querySelectorAll(".mrvll-portfolio__body p")).filter((p) => clean(p.textContent));
      const cta = panel.querySelector("a.mrvll-portfolio__cta[href], a.cmp-button[href]");
      const img = imageSlides[i] ? imageSlides[i].querySelector("img") : null;
      const label = labels[i] || (cta ? clean(cta.textContent) : "") || (heading ? clean(heading.textContent) : `Tab ${i + 1}`);
      const labelCell = document2.createDocumentFragment();
      labelCell.appendChild(document2.createComment(" field:title "));
      labelCell.appendChild(document2.createTextNode(label));
      const contentCell = document2.createDocumentFragment();
      contentCell.appendChild(document2.createComment(" field:content_richtext "));
      if (heading && clean(heading.textContent)) {
        const h3 = document2.createElement("h3");
        h3.textContent = clean(heading.textContent);
        contentCell.appendChild(h3);
      }
      bodyParas.forEach((p) => {
        const np = document2.createElement("p");
        np.innerHTML = p.innerHTML;
        contentCell.appendChild(np);
      });
      if (cta) {
        const a = document2.createElement("a");
        a.href = cta.getAttribute("href");
        a.textContent = clean(cta.textContent);
        const p = document2.createElement("p");
        p.appendChild(a);
        contentCell.appendChild(p);
      }
      if (img) {
        contentCell.appendChild(document2.createComment(" field:content_image "));
        const p = document2.createElement("p");
        p.appendChild(img);
        contentCell.appendChild(p);
      }
      cells.push([labelCell, contentCell]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "tabs-portfolio", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-stats.js
  var CARD_SELECTOR = "article.mrvll-stats-card";
  function parse5(element, { document: document2 }) {
    if (!element.parentNode || element.dataset.cardsStatsConsumed === "true") return;
    const parent = element.parentElement;
    const siblings = parent ? Array.from(parent.children).filter((el) => el.matches(CARD_SELECTOR)) : [element];
    const cards = siblings.slice(Math.max(0, siblings.indexOf(element)));
    const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
    const cells = [];
    cards.forEach((card) => {
      const icon = card.querySelector(".mrvll-stats-card__icon img, .cmp-image img:not(.mrvll-bg__image)");
      const textEls = Array.from(card.querySelectorAll(".mrvll-stats-card__text p, .mrvll-stats-card__text h2, .mrvll-stats-card__text h3")).filter((el) => clean(el.textContent));
      if (!icon && !textEls.length) return;
      let imageCell = "";
      if (icon) {
        const src = icon.getAttribute("src") || "";
        if (/\.svg$/i.test(src)) icon.setAttribute("src", `${src}?fmt=svg`);
        imageCell = document2.createDocumentFragment();
        imageCell.appendChild(document2.createComment(" field:image "));
        imageCell.appendChild(icon);
      }
      let textCell = "";
      if (textEls.length) {
        textCell = document2.createDocumentFragment();
        textCell.appendChild(document2.createComment(" field:text "));
        textEls.forEach((el) => {
          const n = document2.createElement(el.tagName.toLowerCase());
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
    cards.slice(1).forEach((card) => {
      card.dataset.cardsStatsConsumed = "true";
      card.remove();
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-stats", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/tabs-news.js
  function parse6(element, { document: document2 }) {
    const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
    const keyOf = (id, marker) => {
      const m = (id || "").match(new RegExp(`-${marker}-([\\w-]+)$`));
      return m ? m[1] : null;
    };
    const section = element.closest("section.mrvll-news") || element.parentElement;
    const tabList = section ? section.querySelector("ul.mrvll-news__tabs") : null;
    const tabButtons = tabList ? Array.from(tabList.querySelectorAll("button.mrvll-news__tab, li > button")) : [];
    const labelsByKey = {};
    tabButtons.forEach((b) => {
      const k = keyOf(b.id, "tab");
      if (k) labelsByKey[k] = clean(b.textContent);
    });
    let panels = Array.from(element.querySelectorAll(":scope > .mrvll-news__panel"));
    if (!panels.length) panels = Array.from(element.querySelectorAll('.mrvll-news__panel, [role="tabpanel"]'));
    const cells = [];
    panels.forEach((panel, i) => {
      const key = keyOf(panel.id, "panel");
      let label = key && labelsByKey[key] || (tabButtons[i] ? clean(tabButtons[i].textContent) : "");
      if (!label && key) label = key.charAt(0).toUpperCase() + key.slice(1);
      if (key === "all" || /^all$/i.test(label)) return;
      let bodies = Array.from(panel.querySelectorAll(".mrvll-news-card__body-wrap"));
      let articles = bodies.map((body) => {
        const prev = body.previousElementSibling;
        const media = prev && prev.classList.contains("mrvll-news-card__media") ? prev : null;
        const anchor = body.closest("a[href]");
        return { body, media, href: anchor ? anchor.getAttribute("href") : null };
      });
      if (!articles.length) {
        articles = Array.from(panel.querySelectorAll("a.mrvll-news-card")).map((a) => ({
          body: a,
          media: a.querySelector(".mrvll-news-card__media"),
          href: a.getAttribute("href")
        }));
      }
      if (!articles.length) return;
      articles.forEach(({ body, media, href }) => {
        const labelCell = document2.createDocumentFragment();
        labelCell.appendChild(document2.createComment(" field:title "));
        labelCell.appendChild(document2.createTextNode(label || `Tab ${i + 1}`));
        const contentCell = document2.createDocumentFragment();
        const img = media ? media.querySelector("img") : null;
        if (img) {
          contentCell.appendChild(document2.createComment(" field:content_image "));
          const p = document2.createElement("p");
          p.appendChild(img);
          contentCell.appendChild(p);
        }
        contentCell.appendChild(document2.createComment(" field:content_richtext "));
        const meta = body.querySelector(".mrvll-news-card__meta p, .mrvll-news-card__meta");
        if (meta) {
          const time = meta.querySelector("time");
          const date = time ? clean(time.textContent) : "";
          const category = clean(time ? meta.textContent.replace(time.textContent, "") : "");
          const parts = [category, date].filter(Boolean);
          const metaText = parts.length ? parts.join(" \xB7 ") : clean(meta.textContent);
          if (metaText) {
            const p = document2.createElement("p");
            p.textContent = metaText;
            contentCell.appendChild(p);
          }
        }
        const title = body.querySelector(".mrvll-news-card__title h3, .mrvll-news-card__title h2, h3, h2");
        if (title && clean(title.textContent)) {
          const h3 = document2.createElement("h3");
          if (href) {
            const a = document2.createElement("a");
            a.href = href;
            a.textContent = clean(title.textContent);
            h3.appendChild(a);
          } else {
            h3.textContent = clean(title.textContent);
          }
          contentCell.appendChild(h3);
        }
        Array.from(body.querySelectorAll(".mrvll-news-card__body p")).filter((p) => clean(p.textContent)).forEach((p) => {
          const np = document2.createElement("p");
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
    if (tabList) tabList.remove();
    const block = WebImporter.Blocks.createBlock(document2, { name: "tabs-news", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/marvell-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        // OneTrust cookie banner + preference center: <div id="onetrust-consent-sdk">
        "#onetrust-consent-sdk",
        // YouTube modal: <div class="container youtube"> > <div class="modal fade hideheader" id="featurenews-video-model">
        "div.container.youtube",
        "#featurenews-video-model",
        // Decorative "Scroll to know" hint inside hero: <p class="mrvll-scroll-hint ...">
        "p.mrvll-scroll-hint"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        // Header: <div class="header aem-GridColumn"> > <header class="mrvll-header ...">
        "div.header.aem-GridColumn",
        "header.mrvll-header",
        // Footer XF: <div class="footer aem-GridColumn"> holds the CTA band
        // ("We move the world's data. Connect with us."), <footer class="mrvll-footer">, and .mrvll-close video
        "div.footer.aem-GridColumn",
        "section.mrvll-cta-band",
        "footer.mrvll-footer",
        "div.mrvll-close",
        // Header/footer experience-fragment wrappers: <div class="experiencefragment aem-GridColumn">
        "div.experiencefragment.aem-GridColumn",
        // Inline CSS include: <div class="addinlinecss aem-GridColumn"> > <link href=".../homepage-refresh.css">
        "div.addinlinecss",
        // Non-authorable leftovers
        "link",
        "iframe",
        "noscript"
      ]);
    }
  }

  // tools/importer/transformers/marvell-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function querySection(root, selectors) {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    for (const sel of list) {
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    if (sections.length < 2) return;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = querySection(element, section.selector);
        if (!sectionEl) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || querySection(element, section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/import-home.js
  var parsers = {
    "hero-dark": parse,
    "carousel-teaser": parse2,
    "tabs-distance": parse3,
    "tabs-portfolio": parse4,
    "cards-stats": parse5,
    "tabs-news": parse6
  };
  var PAGE_TEMPLATE = {
    "name": "home",
    "description": "Marvell homepage: dark hero with teaser carousel, distance explorer, portfolio tabs, AI stats cards, news & insights tabs",
    "urls": [
      "https://www.marvell.com/"
    ],
    "blocks": [
      {
        "name": "hero-dark",
        "instances": [
          "section.mrvll-hero"
        ]
      },
      {
        "name": "carousel-teaser",
        "instances": [
          "section.mrvll-hero-teaser"
        ]
      },
      {
        "name": "tabs-distance",
        "instances": [
          "section.mrvll-distance-explorer .mrvll-distance-explorer__inner"
        ]
      },
      {
        "name": "tabs-portfolio",
        "instances": [
          "section.mrvll-portfolio .mrvll-portfolio__stage"
        ]
      },
      {
        "name": "cards-stats",
        "instances": [
          "section.mrvll-stats article.mrvll-stats-card"
        ]
      },
      {
        "name": "tabs-news",
        "instances": [
          "section.mrvll-news .mrvll-news__panels"
        ]
      }
    ],
    "sections": [
      {
        "id": "1",
        "name": "Hero with overlapping teaser carousel",
        "selector": [
          "div.hero.aem-GridColumn",
          "section.mrvll-hero"
        ],
        "style": "dark",
        "blocks": [
          "hero-dark",
          "carousel-teaser"
        ],
        "defaultContent": []
      },
      {
        "id": "2",
        "name": "Connectivity leader intro",
        "selector": [
          "div.scale-panels.aem-GridColumn",
          "section.mrvll-scale-panels"
        ],
        "style": "light",
        "blocks": [],
        "defaultContent": [
          ".mrvll-scale-panels .mrvll-section-intro",
          ".mrvll-scale-panels__panels img"
        ]
      },
      {
        "id": "3",
        "name": "Distance explorer",
        "selector": [
          "div.distance-explorer.aem-GridColumn",
          "section.mrvll-distance-explorer"
        ],
        "style": "dark",
        "blocks": [
          "tabs-distance"
        ],
        "defaultContent": [
          ".mrvll-distance-explorer__footer"
        ]
      },
      {
        "id": "4",
        "name": "Portfolio tabs",
        "selector": [
          "div.portfolio.aem-GridColumn",
          "section.mrvll-portfolio"
        ],
        "style": "dark",
        "blocks": [
          "tabs-portfolio"
        ],
        "defaultContent": [
          ".mrvll-portfolio__intro"
        ]
      },
      {
        "id": "5",
        "name": "AI revolution stats",
        "selector": [
          "div.stats.aem-GridColumn",
          "section.mrvll-stats"
        ],
        "style": "light-grey",
        "blocks": [
          "cards-stats"
        ],
        "defaultContent": [
          ".mrvll-stats__inner > div:first-child"
        ]
      },
      {
        "id": "6",
        "name": "News and insights",
        "selector": [
          "div.news.aem-GridColumn",
          "section.mrvll-news"
        ],
        "style": "light-grey",
        "blocks": [
          "tabs-news"
        ],
        "defaultContent": [
          ".mrvll-news__intro",
          ".mrvll-news__cta"
        ]
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_home_default = {
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_home_exports);
})();
