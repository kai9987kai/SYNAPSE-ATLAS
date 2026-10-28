# Data sources and attribution

Version 4 sources were assembled and selected research/portals checked **27 October 2026**. The library contains **17 research entries, including clearly labelled preprints, and 10 portals**. It is not an exhaustive or automatically updating review. Source datasets describe different animals and reconstruction releases; their identifiers are not interchangeable.

## Version 4: eight independent developmental brain graphs

Primary research: [Witvliet, Mulcahy, Mitchell et al., *Connectomes across development reveal principles of brain maturation*, Nature (2021)](https://doi.org/10.1038/s41586-021-03778-8). The paper identifies [NemaNode](https://www.nemanode.org/) as its connectivity portal. This release uses the official laboratory's factual raw records at [NemaNode commit `6b7ca03f6d68c4ea1af3c120d1a47681edc74a90`](https://github.com/zhenlab-ltri/NemaNode/tree/6b7ca03f6d68c4ea1af3c120d1a47681edc74a90).

The source metadata label four L1 specimens at approximately **0, 5, 8 and 16 hours**, one L2 at **23 hours**, one L3 at **27 hours**, and two adults at approximately **50 hours** after birth. Each larval age is represented by one individual, with two adults at the same listed age. These are cross-sectional hermaphrodites, not repeated measurements of one animal. Source `visualTime` values are graphical layout positions and are not used as biological ages.

Across these eight graphs, observed chemical endpoint counts range **187–221 cells**, directed chemical pairs **775–2,202**, and summed weights **1,296–7,970**. The exact eight-row scope table is in [DEVELOPMENTAL-DATA.md](docs/DEVELOPMENTAL-DATA.md) and the dataset README. Names have common identity namespace **`celegans-name/witvliet2021`** within this dataset family. There are **183 common observed names across all eight** and **223 names in the union** of these endpoint universes.

The declared universe is observed endpoints of retained chemical records, not the global 447-cell catalogue or a complete reconstructed-cell inventory. It includes muscles and other non-neuronal cells. These are brain/head-volume contacts, not full 302-neuron whole-animal connectomes. Absent names/edges do not prove biological absence. Catalogue type/transmitter metadata are retained as source annotations rather than age-specific physiological measurements.

Only source **`typ == 0` chemical** records are retained. Their positive integer `syn` occurrences are summed per exact directed `(pre, post)` pair. **`typ == 2` electrical** observations are excluded because gap-junction annotation was partial. Polyadic annotation IDs can contribute counts to several postsynaptic pairs. Graph weight sums are not counts of unique source annotation IDs. Source Dataset7 retains eleven self-loop pairs; no loops were invented or removed by the normalization.

**License and attribution:** the selected NemaNode source representation carries **GNU GPL version 3**. Preserve its original notice, all corresponding JSON records, the source URL, attribution and transformation source under [`data/witvliet2021/`](data/witvliet2021/). No upstream NemaNode application code is copied into this app. Credit Witvliet and colleagues together with NemaNode and the Zhen/Samuel laboratories. This notice does not assign one blanket license to other Synapse Atlas assets. The CC BY 4.0 license on the separate [Zenodo 5637219 3D-model deposit](https://zenodo.org/records/5637219) is not claimed for these connectivity tables; the author analysis repository has no root license and was not used as the distributable raw source.

Source URLs, SHA-256 hashes, normalization source, original bytes and validation are included. Both offline rebuilds and actual downloads from immutable Git commit URLs reproduced the normalized data byte for byte. These checks establish consistency, not biological completeness. See [DEVELOPMENTAL-DATA.md](docs/DEVELOPMENTAL-DATA.md) for identity, coverage and comparison limits.

### Observatory measurement scope

Specimen comparisons use verified shared identity namespaces and each source pair's **common observed cell set**. Each overlap-matrix cell can therefore have a different common scope. Counts and normalized fractions are separate; excluded nodes and pairs are reported. Scores describe observations and do not isolate developmental effects from animal-to-animal or reconstruction differences.

Bilateral audits require reciprocal source pair mappings, exclude/report invalid mappings and compare observed edges with their mirrored counterparts. They do not correct for asymmetric coverage or establish functional symmetry. Wiring-fingerprint similarity uses exact partner IDs in separate incoming/outgoing vector dimensions within one source. It does not establish cell class, function or cross-species homology.

## Version 4: native calibrated serial electron microscopy

The EM Laboratory now embeds **eight consecutive 512 × 512 JPEG source tiles** from the [L1 CNS ssTEM stack hosted by Virtual Fly Brain](https://www.virtualflybrain.org/hosted/l1em-catmaid/). The authoritative [CATMAID stack metadata](https://l1em.catmaid.virtualflybrain.org/1/stack/1/info) records **3.8 × 3.8 × 50 nm** voxel sampling, with native Z translation **6,050 nm**.

The bundled fixed-XY patch covers source planes **1001–1008**, at native project Z positions **56.10–56.45 µm**. Its field is **1.9456 × 1.9456 µm**; first-to-last plane separation is **350 nm**, rather than a claim that eight image planes define a segmented tissue volume. Coordinates use the documented native stack/project calibration. No registration overlay between these tiles and exported VFB SWCs is asserted.

**License and attribution:** captured live VFB template record **VFB_00050000** links the hosted L1EM template to **CC BY 4.0**. This evidence, stack metadata, tile URLs, originals and SHA-256 receipts are preserved under [`data/serial-em/`](data/serial-em/). Credit the original L1 CNS acquisition/reconstruction teams, including Albert Cardona and collaborators at HHMI Janelia and associated original publications, with Virtual Fly Brain hosting/integration. Consult the detailed EM README for those source records and citation links. Source URLs can change; captured bytes and their hashes define this app's snapshot.

Rulers measure native image-plane distances. ROI statistics and serial profiles use **JPEG-decoded 8-bit pixel values**, not calibrated detector intensities; display contrast/brightness changes do not redefine the statistics. A fixed XY ROI through sections does not track a cell. User notes remain observations rather than validated annotations. These images do not supply segmentation, named neurons, identified synapses or detector calibration. The earlier reference screenshot remains separately labelled and is not substituted for native data.

## Retained version 3 fly sources

The ten measured fly skeletons and **76,428 coordinate nodes** are unchanged. Their source notices and scope are retained below; the new worm graphs do not create cross-species identity mappings or share a coordinate frame with these geometries.

## Version 3: identity-linked larval anatomy

Eight **Virtual Fly Brain L1EM** skeletons now share exact original CATMAID identifiers with the bundled larval graph. They contribute **43,185 coordinate nodes**, bringing the measured geometry total to **10 neurons and 76,428 coordinate nodes** when the two adult MaleCNS cells (**33,243 nodes**) are counted separately. Adult and larval geometries remain in different specimen/reference frames.

The selected larval identities are `14541927`, `4235139` (VFB MBIN-e1), `10163418`, `8877158` (VFB MBON-a1), `16883909`, `4234009` (VFB MBON-b3), and `16223537`, `8980589` (**VFB CN-59**, associated with MBON-c1/MBE18 annotations). Source labels and the archived graph's alternative names are both retained; the app does not overwrite CN-59 with a forced class label.

The induced eight-cell wiring graph retains **17 directed pairs, total synaptic weight 107**. Its rows come from the same pinned Pedigo table described below. It excludes connections to neurons outside the selected eight; the larger graph scopes retain those other partners. Identity matching uses the original IDs, not similarity of names or shapes.

The VFB skeletons are source exports dated **May 2025**, while the pinned analytical connectivity is the archived **2023** research snapshot. These are separate exports of the same specimen, not one synchronized geometry-plus-synapse release. Current IDs establish the intended cell association; changes in proofreading coverage between exports remain a limitation.

All eight source SWCs explicitly declare **1.0 micrometre** units. Captured VFB per-neuron records verify shared template **VFB_00050000**, L1 larval CNS ssTEM—Cardona/Janelia, and the **CC BY 4.0** licenses of their associated reconstruction datasets. Coordinates are retained as exported in that common VFB reference frame; Synapse Atlas performs no further registration. This does not make them directly comparable in one coordinate space with adult MaleCNS data.

The compact derivative only replaces the original unknown-radius sentinel `-1` with zero so strict validators can retain those nodes. Source coordinate values, node IDs, parents and labels remain unchanged. Raw SWCs preserve the exact original bytes. Radius-derived surface or volume measurements are unsupported. The source SWC label codes are **0 undefined, 1 soma, 5 fork point and 6 end point**; these are not axon/dendrite or neurotransmitter labels.

**Structural guides are schematic.** They join geometry centroids using measured neuron-pair counts. No spatial synapse coordinates are bundled, and a rendered guide is not a reconstructed synapse location. Neurite intersections also do not establish synapses.

The originals, source URLs, hashes, compact data, per-neuron metadata/license evidence, validation and download reproducer are in [`data/linked-larva/`](data/linked-larva/). The detailed cell mapping and limits are in [LINKED-DATA.md](docs/LINKED-DATA.md). The public SWC URLs are stable source paths rather than immutable storage generations; saved originals and captured SHA-256 values define this bundle, and the reproducer rejects upstream byte changes.

Credit the original reconstruction teams listed in the per-neuron records, including [Eichler et al. 2017](https://www.nature.com/articles/nature23455), [Eschbach et al. 2020](https://www.nature.com/articles/s41593-020-0607-9), and [Winding et al. 2023](https://doi.org/10.1126/science.add9330), together with [Virtual Fly Brain / Court et al. 2023](https://doi.org/10.3389/fphys.2023.1076533). Preserve the [CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/), attribution and modification description. The pre-existing processed connectivity retains its own MIT notice and Pedigo citation below.

### New analysis scope

Circuit Studio extracts induced cohorts from measured records and reports source-class aggregates after neuron-pair thresholding. Structural deletion comparisons remove selected nodes without modifying the source and compare against seeded uniform removals of the same count. Their control does not match node degree, class or spatial position, and descriptive ranges are not significance tests or biological lesion predictions.

Morphology Bench derives physical cable/branch summaries from source segments. Its Sholl profile is centred on a chosen **source root** and restricted to that root's component; a source root is not assumed to be a soma. Forest summaries still include the other components. Tangencies are excluded and a half-open parent-to-child interval `(0,1]` defines endpoint counting. Missing reconstruction branches, coarse geometry and source coverage affect every result.

Study JSON preserves validated source/settings identities so analyses can be recomputed. It does not persist imported files or computed experiment results. Portable study settings select bundled snapshots, avoiding an implied identity for later user imports.

## Larval Drosophila connectivity

Primary research: Winding et al., *The connectome of an insect brain*, Science (2023), [doi:10.1126/science.add9330](https://doi.org/10.1126/science.add9330).

Bundled representation: the processed network accompanying Pedigo et al., *Generative network modeling reveals quantitative definitions of bilateral symmetry exhibited by a whole insect brain connectome*, eLife (2023), [doi:10.7554/eLife.83739](https://doi.org/10.7554/eLife.83739). Repository: [neurodata/bilateral-connectome, archived elife-v5 commit](https://github.com/neurodata/bilateral-connectome/tree/4482b9022f27d361011c9c7442e32ca51d607d08), archived as [Zenodo 10.5281/zenodo.7733481](https://doi.org/10.5281/zenodo.7733481).

Exact pinned commit: `4482b9022f27d361011c9c7442e32ca51d607d08`.

Raw files are `data/processed-elife/unmatched_full_nodes.csv` and `data/processed-elife/unmatched_full_edgelist.csv` in that commit. Original bytes are preserved in `data/larval-original-tables.zip`; source URLs and SHA-256 hashes are recorded in `data/provenance.json`.

| Representation | Declared nodes | Directed rows/pairs | Summed weight |
| --- | ---: | ---: | ---: |
| Archived processed full graph | 3,013 | 111,243 | 353,859 |
| Mushroom-body core | 76 | 773 | 4,403 |
| Mushroom-body recurrent subset | 238 | 4,851 | 20,847 |

The core selects source `simple_group` values `MBONs` and `MBINs`. The recurrent subset additionally selects `MB-FBNs` and `FFNs`. Each is an induced subgraph: retain every source row whose two endpoints are among the selected neurons. Names, hemisphere, class and colour metadata are taken from the published table. Regions and neurotransmitter identities are not supplied and are not inferred.

All source weights and directed rows are retained, including 537 self-loops in the processed full graph. These tables are a research-processed representation; their 3,013 nodes and 353,859 total weight must not be substituted for the original Science publication's 3,016 neurons and approximately 548,000 synapses. The supplied app computes its own metrics on the selected records. It excludes self-loops from nonself density and reciprocity.

**License:** the exact archived repository commit carries MIT, Copyright 2021 NeuroData Lab at Johns Hopkins University, Benjamin D. Pedigo. Preserve `data/larva-LICENSE.txt` when redistributing these processed files. The repository's later HEAD changed license; this package uses the identified archived commit. Cite both the originating Winding study and the Pedigo processed representation. The Science article itself states CC BY 4.0; that statement is not used here to assume a blanket license over unspecified supplementary files.

## Adult male MaleCNS morphology

Official source: [MaleCNS download documentation](https://male-cns.janelia.org/download/). This documents the two example neurons, SWC coordinate units, raw bucket and CC BY license.

| Neuron | Body ID | Source nodes | Root components | Derived cable length |
| --- | --- | ---: | ---: | ---: |
| DNge104_R | `12781` | 15,945 | 3 | 12,469.385 µm |
| DNge104_L | `556329` | 17,298 | 3 | 13,521.220 µm |

The bundled SWCs are coarse centerline skeletons from MaleCNS **v1.0** in the original MaleCNS EM frame. Source coordinates and radii are in **8 nm units**. Cable length is derived by summing parent-child Euclidean segment lengths and multiplying by 0.008 µm per unit. Root components have no parent segment. This is a skeleton measurement, not a claim of full neurite-surface coverage.

Original files:

- [12781.swc, storage generation 1777993123308257](https://storage.googleapis.com/flyem-male-cns/v1.0/segmentation/skeletons-malecns/skeletons-swc/12781.swc?generation=1777993123308257)
- [556329.swc, storage generation 1777993410878309](https://storage.googleapis.com/flyem-male-cns/v1.0/segmentation/skeletons-malecns/skeletons-swc/556329.swc?generation=1777993410878309)

The app fits these coordinates to its orthographic viewer and inverts the display Y axis. Colouring, depth clipping and camera motion are visualization choices. Raw SWCs preserve the source coordinates. No smoothing, registration between specimens, neurotransmitter identity or synaptic connectivity is inferred. Viewing both cells together does not establish that they form a connected pair.

**License and attribution:** [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Credit the Male CNS project: HHMI Janelia FlyEM, University of Cambridge, MRC Laboratory of Molecular Biology and Google Research. Include the [official project source](https://male-cns.janelia.org/) and the paper citation listed there when publishing work based on these data. State that Synapse Atlas parses the source skeletons for display and derives segment geometry metrics. Preserve source attribution and license links when redistributing.

## Supplied FAFB ExR1 and ocellar material

The input HTML contains three ExR1 annotation records, 48 region-specific edge rows totaling 138 synapses, and 336 identifiers labeled as an ocellar query. Original export files and their checksums were not attached, so the upgraded app preserves those embedded values as **supplied exports with unverified provenance**. They are not independently authenticated by this work.

The source file labels them FAFB v783. [FlyWire guidance](https://flywire.ai/guidelines) and [Codex](https://codex.flywire.ai/) describe source use and access; the claimed FlyWire data terms are **CC BY-NC 4.0**. Check those terms and the actual export provenance before reuse, especially for commercial distribution. An ID list is not a reconstructed circuit. BANC and MaleCNS are separate specimens and do not supply replacement ocellar anatomy.

## Reference images and conceptual anatomy

Images were preserved from the supplied HTML. Their original creators, export provenance and redistribution rights have not all been established. No new ownership or blanket license is asserted over them. The EM panel changes a reference screenshot's appearance; it does not load a live EM volume, perform segmentation or infer synapses.

The procedural dragonfly, octopus, larval and adult-fly scenes are anatomical concepts. Neither electrophysiological target-detection papers nor arm anatomy studies provide a whole dragonfly or octopus synapse-resolution connectome for this app. They support the annotated research context, not the geometry of those concepts.

## Validation and reproducibility

`data/validation.json` records zero unknown graph endpoints, nonpositive weights or duplicate directed pairs. Both public SWCs have unique node IDs, valid parent references and no cycles; multiple rooted components are retained. These checks establish file and graph consistency, not biological completeness or an independent reconstruction audit.

`tools/rebuild-data.py` verifies SHA-256 inputs and recreates public graph scopes and parsed morphology objects using Python's standard library. The default reads the bundled originals; `--download` fetches the pinned Git commit and immutable storage generations. App analysis receipts identify the active source, threshold, node universe, metrics and a canonical input-graph hash when the browser provides SHA-256.
