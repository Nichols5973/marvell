/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroDarkParser from './parsers/hero-dark.js';
import carouselTeaserParser from './parsers/carousel-teaser.js';
import tabsDistanceParser from './parsers/tabs-distance.js';
import tabsPortfolioParser from './parsers/tabs-portfolio.js';
import cardsStatsParser from './parsers/cards-stats.js';
import tabsNewsParser from './parsers/tabs-news.js';

// TRANSFORMER IMPORTS
import marvellCleanupTransformer from './transformers/marvell-cleanup.js';
import marvellSectionsTransformer from './transformers/marvell-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-dark': heroDarkParser,
  'carousel-teaser': carouselTeaserParser,
  'tabs-distance': tabsDistanceParser,
  'tabs-portfolio': tabsPortfolioParser,
  'cards-stats': cardsStatsParser,
  'tabs-news': tabsNewsParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
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

// TRANSFORMER REGISTRY - section transformer runs after cleanup
const transformers = [
  marvellCleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [marvellSectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Array of block instances found on the page
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;

    const main = document.body;

    // 1. Initial cleanup + section break markers
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page using embedded template
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block (skip elements already replaced/removed by an earlier parser)
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. Final cleanup + section metadata
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path (root URL maps to /index)
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
