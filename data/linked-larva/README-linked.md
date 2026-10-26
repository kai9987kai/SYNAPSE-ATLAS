# Eight larval neurons with identity-linked anatomy and wiring

Downloaded and checked 26 October 2026. The eight measured skeletons are Virtual Fly Brain exports from the L1EM specimen. Their original CATMAID skeleton identifiers exactly match nodes in the app's pinned Pedigo `elife-v5` graph and mushroom-body core.

| VFB label | Original graph ID | Pedigo annotation | Side |
| --- | --- | --- | --- |
| MBIN-e1 | 14541927 | AVM011f left | L |
| MBIN-e1 | 4235139 | AVM011f right | R |
| MBON-a1 | 10163418 | MBE7a right | R |
| MBON-a1 | 8877158 | MBE7a left | L |
| MBON-b3 | 16883909 | MBE33 left | L |
| MBON-b3 | 4234009 | MBE33 right | R |
| CN-59 / MBON-c1 | 16223537 | MBE18 left | L |
| CN-59 / MBON-c1 | 8980589 | MBE18 right | R |

There are **43,185 source skeleton nodes**. The induced connectivity graph retains all pinned rows whose two endpoints are these eight IDs: **17 directed pairs, summed synaptic weight 107**. Connections to the other larval neurons are outside this small induced circuit. The app's full larval graph still supplies those additional partners.

## Sources and licenses

The original SWC URLs, SHA-256 hashes, source metadata, VFB IDs, export dates and per-neuron license records are in `larval-linked-provenance.json`. `vfb-neuron-records.json` preserves the authoritative VFB Solr response, including each neuron's Winding/Pedigo2023 dataset membership and **CC BY 4.0** license. Each selected neuron has that verified license; this is not inferred from VFB's general website terms.

Original reconstructions: [Eichler et al. 2017](https://doi.org/10.1038/nature23455), [Eschbach et al. 2020](https://doi.org/10.1038/s41593-020-0607-9), [Winding et al. 2023](https://doi.org/10.1126/science.add9330). Integration: [Court et al. 2023, Virtual Fly Brain](https://doi.org/10.3389/fphys.2023.1076533). The connectivity representation remains the [Pedigo research snapshot](https://github.com/neurodata/bilateral-connectome/tree/4482b9022f27d361011c9c7442e32ca51d607d08) and retains its existing source/license notices.

Preserve attribution, source links and the [CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/) with redistributed skeletons and derived views. The normalized representation changes only unspecified radius values as described below; coordinates are unchanged.

## Coordinate space and changes

- Every SWC's `# Meta` explicitly states `units: 1.0 micrometer` and its original numeric neuron ID.
- VFB term records place all eight files in **VFB_00050000**, the shared **L1 larval CNS ssTEM — Cardona/Janelia** reference coordinate frame. The app may display them together within that frame. They must not be merged in one common-space scene with adult MaleCNS coordinates.
- Source exports are dated May 2025; the connectivity table is the archived 2023 processed graph. IDs identify the same specimen/cells, but these are distinct export snapshots and may differ in proofreading state.
- The compact derivative replaces the source's unknown-radius sentinel `-1` with `0` so strict SWC validators can represent it without negative radii. It does not change node IDs, parent IDs, geometry or labels. Original files retain the exact source bytes. Derived radius-based volume/surface metrics would be unsupported.
- SWC labels here mean `0 = undefined`, `1 = soma`, `5 = fork point`, `6 = end point`, as explicitly stated in source headers. They do not classify axons/dendrites or neurotransmitters.

`larval-linked-morphology.json` bundles compact morphology objects, the eight-ID induced graph, provenance and structural validation. Each morphology has `nmPerUnit: 1000`, `graphNodeId`, `graphDatasetId`, `linkedDatasetIds`, `spaceId` and `specimenId` for explicit linking.

The graph edges supply synaptic counts between identified cells. They provide **no spatial synapse locations**. Drawing an arrow between two rendered cells is a schematic relationship, not a reconstruction of a synapse position. Neither geometry, adjacency nor an intersection of neurites establishes recorded activity or functional causality.

## Check and reproduce

`larval-linked-validation.json` records unique nodes, finite coordinates, valid parent references, acyclicity, explicit units, template and license checks. Every original ID was checked against the pinned full and MB-core graphs. These are file/identity checks, not an independent reconstruction audit.

Use `download_linked_originals.py` to fetch original SWCs and reject any source whose bytes no longer match this captured snapshot. The source URLs are public stable paths rather than immutable object versions; the saved originals and SHA-256 records define this bundle. The captured VFB metadata response is retained as evidence rather than silently replaced by later metadata.
