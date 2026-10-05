# Marvell content package

`marvell-content-1.1.zip` is an AEM content package for the Marvell site (`/content/marvell`).

It installs:
- `/content/marvell/index` (homepage), `/content/marvell/nav`, `/content/marvell/footer`
- all page images (45) under `/content/dam/marvell/images` — marvell.com blocks hotlinking, so nothing is linked from there except the footer video

Install via AEM author → Tools → Deployment → Packages → Upload Package → Install.
Installing replaces any existing index/nav/footer pages created by the site template.
