# Calibrated L1EM serial image patch

Captured and checked **27 October 2026**. These are actual published electron-microscopy image tiles, not a screenshot, illustration or segmentation prediction.

Eight adjacent serial sections are provided from the same native L1 CNS stack and the same tile address. Original JPEG bytes are retained in `tiles/`; `em-assets.json` adds equivalent embedded data URLs for offline use. `em-manifest.json` records source addresses, calibration, response headers and SHA-256 hashes.

| Property | Captured value |
| --- | --- |
| Specimen | First-instar Drosophila CNS, L1EM / Seymour / Cardona–Janelia |
| Native CATMAID project / stack | 1 / 1, L1 CNS 0-tilt |
| Native sampling | 3.8 × 3.8 × 50 nm |
| Orientation | XY, CATMAID orientation0 |
| Tile address | Row35, column28, zoom0 |
| Dimensions per tile | 512 × 512 pixels, grayscale JPEG |
| Field of view | 1.9456 × 1.9456 µm |
| Serial sections | Native stack z indices1001–1008 inclusive |
| Source project z coordinates | 56.10–56.45 µm |
| First-to-last plane separation | 0.35 µm; eight planes spaced50nm apart |
| Native tile-origin x/y | 54.4768 / 68.096 µm |
| Original tile bytes | 601,944 total |

## Source and calibration

The [official VFB L1EM CATMAID resource](https://www.virtualflybrain.org/hosted/l1em-catmaid/) identifies the dataset and its original publications. The [live stack metadata endpoint](https://l1em.catmaid.virtualflybrain.org/1/stack/1/info) supplies native dimensions, resolution, orientation, translation and mirrors. Its captured response is included as `stack-info.json`.

CATMAID tile-source type4 uses the documented path convention `image_base/z/zoom/row_col.jpg`; [official tile-source documentation](https://catmaid.readthedocs.io/en/stable/tile_sources.html) defines zoom0 as native scale. The selected mirror is `https://virtualflybrain.org/data/EM/L1EM/0111-8/`. The source pixels were not resized, cropped, enhanced, regenerated or relabelled in this bundle.

For a native pixel location, project nanometres are `translation + stackPixel × resolution`. The stack translation is `[0,0,6050]nm`; therefore section1001 is at `6050+1001×50=56100nm`. X/Y origins use tile row/column times512 pixels and3.8nm/pixel. The eight planes' coordinate separation is350nm; that is distinct from assigning an inclusive physical thickness to all eight sections.

The dataset is the same L1EM specimen as the app's larval reconstructions, but these native stack coordinates are not asserted to be a directly registered overlay of the exported VFB SWCs. No neuron, organelle or synapse identities are assigned to the pixels. A small patch does not establish its named brain region.

## License and attribution

The live official VFB record for **VFB_00050000, L1 larval CNS ssTEM — Cardona/Janelia**, records **CC BY4.0** for the associated L1EM template. `template-record-live.json` preserves the exact authoritative Solr response and its recorded Ohyama2015/Schlegel2016 dataset-license links. The license basis is this template record, not an assumption inherited from the separate neuron-skeleton licenses. See the [VFB template](https://www.virtualflybrain.org/blog/2022/01/01/l1-larval-cns-sstem-cardona/janelia-vfb_00050000/) and [CC BY4.0](https://creativecommons.org/licenses/by/4.0/).

Credit the original L1 CNS ssTEM acquisition by Albert Cardona and collaborators at HHMI Janelia; relevant original L1EM publications include [Ohyama et al.2015](https://doi.org/10.1038/nature14297) and [Winding et al.2023](https://doi.org/10.1126/science.add9330). Credit Virtual Fly Brain for preservation and hosting ([Court et al.2023](https://doi.org/10.3389/fphys.2023.1076533)) and CATMAID for the source platform ([Saalfeld et al.2009](https://doi.org/10.1093/bioinformatics/btp266)). Preserve source URLs, license links and capture hashes when redistributing these files or derived displays.

Source paths are stable addresses rather than immutable object versions. Their captured `Last-Modified` values date the served tiles to2017; they do not mean a new2026 acquisition. Saved originals and SHA-256 records freeze this bundle's identity. The reproducer rejects changed bytes.

## Measurement limits

These tiles were aligned, tiled and JPEG-compressed by the source pipeline. They are original source-tile bytes, not raw detector output. Pixel-intensity statistics describe decoded JPEG grayscale values and display contrast; they do not quantify neurotransmitters, synaptic efficacy, molecular concentrations or ultrastructural identity. Display brightness/contrast changes must remain distinguishable from calculations on unmodified decoded pixels.

The stack is anisotropic: a section step is50nm while XY pixels are3.8nm. A planar ruler or rectangular ROI area can use the recorded XY calibration. A path across displayed sections must use the separate z spacing. No segmentation, synapse detection, proofreading completion or 3D reconstruction is performed by bundling this patch.

## Reproduce and validate

With Python3.10 or later and only its standard library:

```powershell
python download_em_originals.py --verify-only
python download_em_originals.py --output fetched-originals --embed-output rebuilt-em-assets.json
```

The first command validates bundled original bytes and JPEG dimensions. The second retrieves the exact eight URLs, rejects any hash or dimension drift and can rebuild embedded data URLs. `em-validation.json` records the checks performed for this capture. All selected z indices are absent from the source stack's captured broken-slice list; this is not an independent image-quality or reconstruction audit.
