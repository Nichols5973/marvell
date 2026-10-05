/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Marvell site-wide cleanup.
 * All selectors verified in migration-work/cleaned.html (https://www.marvell.com/).
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    WebImporter.DOMUtils.remove(element, [
      // OneTrust cookie banner + preference center: <div id="onetrust-consent-sdk">
      '#onetrust-consent-sdk',
      // YouTube modal: <div class="container youtube"> > <div class="modal fade hideheader" id="featurenews-video-model">
      'div.container.youtube',
      '#featurenews-video-model',
      // Decorative "Scroll to know" hint inside hero: <p class="mrvll-scroll-hint ...">
      'p.mrvll-scroll-hint',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    WebImporter.DOMUtils.remove(element, [
      // Header: <div class="header aem-GridColumn"> > <header class="mrvll-header ...">
      'div.header.aem-GridColumn',
      'header.mrvll-header',
      // Footer XF: <div class="footer aem-GridColumn"> holds the CTA band
      // ("We move the world's data. Connect with us."), <footer class="mrvll-footer">, and .mrvll-close video
      'div.footer.aem-GridColumn',
      'section.mrvll-cta-band',
      'footer.mrvll-footer',
      'div.mrvll-close',
      // Header/footer experience-fragment wrappers: <div class="experiencefragment aem-GridColumn">
      'div.experiencefragment.aem-GridColumn',
      // Inline CSS include: <div class="addinlinecss aem-GridColumn"> > <link href=".../homepage-refresh.css">
      'div.addinlinecss',
      // Non-authorable leftovers
      'link',
      'iframe',
      'noscript',
    ]);
  }
}
