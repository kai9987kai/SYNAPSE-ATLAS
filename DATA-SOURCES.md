# Data sources and attribution

Snapshot assembled and selected primary sources checked **26 October 2026**. Source datasets describe different animals and reconstruction releases. Their identifiers are not interchangeable.

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
