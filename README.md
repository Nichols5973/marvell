# Marvell content package

1. `marvell-images.zip` — all 49 page images. Upload the files directly into AEM Assets → Files → marvell
   (so they live at `/content/dam/marvell/<file>`).
2. `marvell-content-1.3.zip` — AEM content package with `/content/marvell/index` (homepage),
   `/content/marvell/nav` and `/content/marvell/footer`. Install via Tools → Deployment → Packages.

Images are uploaded through Assets (not inside the package) so AEM processes them properly.
The footer background video is still linked from marvell.com.
