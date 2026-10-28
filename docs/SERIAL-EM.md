# Serial EM Laboratory

The eight bundled planes are real L1 CNS ssTEM tissue tiles from the same native XY address. They contain **512 ×512 decoded grayscale pixels**, sampled at **3.8 nm/pixel**. Consecutive planes are **50 nm apart**. The field is **1.9456 ×1.9456 µm**, and the first-to-last plane separation is **0.35 µm**.

Use the section slider or previous/next buttons to inspect planes1001–1008. Display zoom, pan, contrast and brightness affect appearance. A two-point ruler measures image-plane distance; its receipt retains pixel points, physical coordinates and calibration. The ROI tool selects a pixel rectangle. Its histogram, mean, population deviation and range use the unfiltered JPEG-decoded grayscale values. The ROI's pixel footprint uses floor(min)/ceil(max) bounds, clamped to the source image, with right/bottom boundaries exclusive.

“Profile this ROI across all sections” compares the same native XY pixel rectangle through the eight source planes. That selection does not track a cell. The observation JSON includes source URLs/hashes, calibration, selected ruler/ROI results, serial profile, display settings and the user's note. User notes are observations, not validated annotations. “Original JPEG” saves the captured source bytes.

## Calibration and source

[Official VFB L1EM resource](https://www.virtualflybrain.org/hosted/l1em-catmaid/) · [native stack metadata](https://l1em.catmaid.virtualflybrain.org/1/stack/1/info).

This capture uses project1, stack1, row35, column28, zoom0, XY orientation. Native project coordinates follow `translation + stackPixel × resolution`. The captured translation is `[0,0,6050]nm`; tile origin X/Y is **54.4768 /68.096 µm**, and source plane Z ranges from **56.10 to56.45 µm**. Source paths are mutable; saved originals and SHA-256 hashes identify this exact snapshot. The tiles were last modified in2017 and captured on27 October2026; the capture date is not a new acquisition date.

## Attribution and license

The captured authoritative VFB **VFB_00050000** template record records **CC BY4.0**, with Ohyama2015/Schlegel2016 source links. The license basis is the template record, separate from neuron-skeleton terms. Credit Albert Cardona and collaborators at HHMI Janelia for original L1 CNS ssTEM acquisition, and Virtual Fly Brain for preservation and hosting. Cite [Ohyama et al.2015](https://doi.org/10.1038/nature14297), [Winding et al.2023](https://doi.org/10.1126/science.add9330), [Court et al.2023](https://doi.org/10.3389/fphys.2023.1076533) and the [CATMAID platform](https://doi.org/10.1093/bioinformatics/btp266) as appropriate. Preserve [CC BY4.0](https://creativecommons.org/licenses/by/4.0/), source links and hashes with redistributed images or derived views.

`data/serial-em/` contains original JPEGs, embedded assets, source metadata, license evidence, hashes, validation and a standard-library Python reproducer:

```powershell
python data/serial-em/download_em_originals.py --verify-only
python data/serial-em/download_em_originals.py --output fetched-originals --embed-output rebuilt-em-assets.json
```

## Interpretation

These are aligned, tiled, JPEG-compressed source images, not raw detector counts. Their pixel intensities do not measure neurotransmitters, synaptic efficacy, molecular concentration or synapse density. The patch has no assigned named region, cell or synapse identities. Bundling it performs no segmentation, proofreading or volume reconstruction. Native CATMAID calibration does not establish registration to the app's exported VFB skeletons.
