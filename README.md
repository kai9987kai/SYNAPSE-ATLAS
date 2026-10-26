# Synapse Atlas 3.0

[Open the live app](https://synapse-atlas-research-kai-20261026.kai9987kai.chatgpt.site/) · [Download the complete v3 package](releases/Synapse-Atlas-3.0.zip)

The repository root contains the standalone `index.html`, source, tests, original data, documentation and verification receipts. `dist/` preserves the deployed static build. The release archive includes the captured app, source and source-data notices.

A standalone connectomics workbench linking measured larval neuron geometry to its wiring, with circuit extraction, controlled structural comparisons and physical morphology measurements. Selected primary sources were checked on **26 October 2026**. The library is a curated snapshot and does not refresh automatically.

## Open the app

Open **index.html** in a current desktop browser. The standalone file embeds its measurements, references and application code. No installation, account, server or runtime CDN is required. External source links need an internet connection. For a static website, serve `index.html`; preserve the accompanying data notices when redistributing a package.

## What is new

- **Linked larval anatomy:** eight public VFB L1EM skeletons have original CATMAID IDs that exactly match the included larval connectivity. They contain **43,185 coordinate nodes** in one shared reference frame. View individual cells or all eight, inspect measured counts between displayed neurons and move from anatomy to wiring analysis.
- **Circuit Studio:** combine source-group, hemisphere and name/ID filters, optionally restrict to a seed neighbourhood and choose edge direction and hop count. The result is an induced subgraph: a source row is retained only when both endpoint neurons are selected. Pair thresholding follows row aggregation. Export a circuit receipt or CSV, or open the extracted circuit in Network Lab.
- **Structural deletion comparisons:** remove selected neuron IDs and compare graph changes with seeded, uniformly sampled removals of the same number of neurons. The background calculation can be cancelled. Its export includes every control removal set and the resulting metrics. Controls match removal count, not degree, class or spatial location; ranges are descriptive, not significance tests or biological lesion predictions.
- **Morphology Bench:** inspect full-forest cable length, branches, terminals, source components, longest root-to-node path and segment-length summaries. Choose a source root and radial shell spacing for a root-centred Sholl profile. Export the physical measurements, source and intersection convention as a receipt.
- **Study settings:** save and restore settings in this browser or export/import study JSON. Settings retain source identities, circuit filters, camera, specimen, morphology profile root and shell spacing. They do not persist imported data files or computed experiment results. Portable settings require bundled datasets; imported and extracted graphs remain session-local.

## Anatomy and wiring

The atlas contains **10 measured skeletons with 76,428 coordinate nodes**: eight larval L1EM cells (**43,185**) and two adult MaleCNS descending neurons (**33,243**). Specimen selection keeps their coordinate frames separate. Larval source units are **1 µm** per coordinate unit; native MaleCNS SWCs use **8 nm**.

The eight-cell larval induced circuit has **8 nodes, 17 directed pairs and total synaptic weight 107**. These cells also exist within the larger mushroom-body and full larval graph scopes. Connections to cells outside the selected circuit are excluded from an induced view. The full processed larval graph contains **3,013 neurons, 111,243 directed rows and summed weight 353,859**; these are properties of the pinned analytical representation, not substitutes for the Science paper's 3,016-neuron/~548,000-synapse totals.

Structural guides in the atlas connect geometry centroids using measured neuron-pair counts. Their placement is **schematic**: no spatial synapse coordinates are bundled. Geometry exports dated May 2025 and the archived 2023 edge table refer to the same specimen and original IDs, but are distinct snapshots and may differ in proofreading state. See [linked data notes](docs/LINKED-DATA.md).

Sholl profiles count reconstructed segment–sphere intersections around a selected **source root**. A root is not automatically a soma. Forest summaries include all rooted components, while the radial profile covers the selected component. Tangencies are excluded; the parent-to-child interval `(0,1]` avoids counting a shared endpoint twice under the documented convention. Reconstruction omissions affect these measurements. Unknown larval radius sentinels are normalized only for validation; radius-derived surface or volume claims are unsupported.

## Other workspaces

**Network Lab** retains dataset switching, directed paths, pair thresholds, strength rankings, adjacency matrices and reproducibility receipts. Its readable drawing shows at most 32 neurons; metrics and exports cover the full selected graph. Search and region filters apply to the row table and its CSV; pair exports and receipts use the full thresholded graph.

**Data Explorer** exposes sources, licenses and local CSV/root-ID/SWC imports. IDs remain exact strings. Malformed input is rejected while retaining the previous valid state. Imports are held in memory and are lost on reload. Connectivity weights must be positive safe integers; files are limited to 25 MB. Imported SWC units and biological provenance follow the source file rather than being established by importing it.

**Research Library** includes twelve selected primary papers and official source portals. **EM Laboratory** adjusts a preserved screenshot and explains the reconstruction workflow; it is not a live volume or segmentation service. **Image Gallery** preserves reference imagery from the supplied HTML. Adult fly, larva, dragonfly and octopus procedural views remain labelled anatomical concepts.

Synapse counts, structural routes, morphology and deletion comparisons do not establish neural activity, connection efficacy, causation or behaviour. This is an exploratory research tool, unaffiliated with the cited teams.

## Inspect and reproduce

Read [DATA-SOURCES.md](DATA-SOURCES.md) for the full source and attribution record. New linked originals, per-neuron license/template evidence, hashes and validation are in `data/linked-larva/`; [docs/LINKED-DATA.md](docs/LINKED-DATA.md) explains their identity mapping and export dates.

Rebuild the standalone app offline using Python 3.10 or later and its standard library:

```powershell
python tools/build-standalone.py
```

To inspect a build without replacing the current app:

```powershell
python tools/build-standalone.py --output rebuilt/index.html
```

The source folder contains the preserved original HTML, the graph/import core, circuit and morphology analysis cores, the versioned studio interface and normalized public-data/research JSON. Source-manifest and build receipts identify the captured state. Change a public dataset and its embedded manifest together before rebuilding.

The original data rebuilder retains the earlier larval graph and MaleCNS inputs:

```powershell
python tools/rebuild-data.py --output rebuilt-data
python tools/rebuild-data.py --download --output rebuilt-online
```

It does not replace the new linked VFB snapshot automatically. Its raw files can be fetched separately, with captured SHA-256 checks:

```powershell
python data/linked-larva/download_linked_originals.py --output rebuilt-linked-originals
```

Run the pure analysis tests with Node.js 18 or later:

```powershell
node --test source/atlas-core.test.cjs source/circuit-core.test.cjs source/morph-core.test.cjs
```

Browser interaction checks are separate from the mathematical core tests. See the release verification receipt for the tests run against a given build.

## Licenses

The eight selected VFB skeletons and MaleCNS data use **CC BY 4.0**, with their own attribution and source records. The processed larval graph uses MIT at its pinned research commit, whose notice is in `data/larva-LICENSE.txt`. Supplied FlyWire-labelled exports retain their claimed **CC BY-NC 4.0** terms; their original export provenance was not attached for independent verification. Reference images retain their original rights. These notices do not assign one blanket license to the whole package.
