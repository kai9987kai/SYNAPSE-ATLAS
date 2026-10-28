# Synapse Atlas 4.0

[Open the live app](https://synapse-atlas-research-kai-20261026.kai9987kai.chatgpt.site/) · [Download the complete v4 package](releases/Synapse-Atlas-4.0.zip)

A standalone research workbench for comparing observed connectomes, inspecting reconstructed fly neurons and measuring native serial electron-microscopy pixels. Selected primary papers, clearly labelled preprints and source portals were checked on **27 October 2026**. The curated library contains **17 research entries and 10 portals**; it does not update automatically.

## Open the app

Open **index.html** in a current desktop browser. The file embeds its public data snapshots, images and application code. No installation, account, server or runtime CDN is required. External source links need internet access. For static hosting, serve `index.html`; preserve accompanying attribution/data notices when redistributing a package.

## New in version 4

- **Connectome Observatory:** compare measured specimens using verified identity namespaces and common observed-cell scopes. Inspect pair-support overlap, weighted overlap, normalized-weight Jensen–Shannon distance, an overlap matrix, coverage ledger and the largest observed pair changes. Raw counts and normalized weight fractions remain separate.
- **Bilateral wiring audit:** compare observed mirror wiring against reciprocal source pair mappings. Invalid, missing, contradictory and self-pair metadata are reported rather than silently treated as biological correspondences. Export the full audit and scope.
- **Wiring fingerprints:** search for cells with similar incoming/outgoing partner-weight profiles inside one dataset. Exact partner IDs define weighted-cosine features; zero vectors supply no similarity evidence. Similarity is not a cell-type or functional assignment.
- **Eight developmental C. elegans sources:** four L1, one L2, one L3 and two adult brain/head reconstructions add cross-sectional comparisons. Their chemical graphs contain **187–221 observed endpoint cells**, including muscles and other non-neuronal cells. Exact IDs, ages, counts and license notices stay with the records.
- **Serial EM Laboratory:** inspect **eight consecutive native L1 CNS JPEG tiles**. Step through or play sections, pan/zoom, draw an in-plane ruler and select an intensity ROI. Inspect decoded-pixel statistics/histograms and a fixed-XY ROI profile through all eight planes. Export original tiles or a source-backed observation receipt with coordinates, calibration, settings and notes.
- **Expanded studies and catalogue:** portable v4 settings retain Observatory and EM selections; legacy v3 settings remain supported under their own schema. Source identities/hashes accompany saved selections. Search/filter catalogue cards by species, source type, license or cell name.

Background comparisons and controlled structural experiments can be cancelled. They preserve source records and export their settings and measurement scope.

## Measured sources and boundaries

### Developmental C. elegans

The eight Witvliet/NemaNode graphs use identity namespace **`celegans-name/witvliet2021`**. Ages from the pinned laboratory metadata are approximately **0, 5, 8, 16, 23, 27, 50 and 50 hours after birth**. There is one individual at each listed larval age and two adults at approximately 50 hours. These are different animals, not repeated imaging of one individual or population estimates at every age.

The declared universe contains **observed endpoints of retained chemical contacts**. The global cell catalogue supplies metadata only; unobserved catalogue cells are not inserted as measured isolates. These are brain/head-volume graphs, not whole-animal 302-neuron connectomes. Partial electrical annotations are excluded. Polyadic annotation IDs can contribute to several postsynaptic pairs, so graph weight sums are not counts of unique annotation IDs.

Comparisons use a pair's common observed cell set. Matrix cells can have different scopes. Differences can combine age, individual variability, coverage and annotation effects. Missing nodes/edges do not prove biological absence. See [developmental data notes](docs/DEVELOPMENTAL-DATA.md) and `data/witvliet2021/`.

### Fly anatomy and wiring

The existing **10 measured skeletons and 76,428 coordinate nodes** remain: eight larval L1EM cells (**43,185 nodes**) and two adult MaleCNS descending neurons (**33,243 nodes**). Specimen selection keeps their frames separate. Larval SWC units are **1 µm** per coordinate unit; native MaleCNS units are **8 nm**.

Exact larval CATMAID IDs link eight reconstructed cells to their pinned graph. Their induced circuit has **8 cells, 17 directed pairs and total weight 107**. The larger processed larval network has **3,013 cells, 111,243 directed rows and summed weight 353,859**, distinct from the Science paper's published whole-dataset totals.

Larval geometry exports dated May 2025 and archived 2023 connectivity describe the same specimen through different snapshots. Structural guides join geometry centroids using measured pair counts; guide positions are **schematic**, without spatial synapse coordinates. Unknown larval SWC radius sentinels are normalized only for validation. See [linked anatomy notes](docs/LINKED-DATA.md).

### Native serial EM pixels

The new patch is fixed native XY through eight consecutive source planes. Each plane has **512 × 512 decoded pixels**, **3.8 nm XY sampling** and **50 nm plane spacing**, giving a **1.9456 × 1.9456 µm** field. First and last planes are **350 nm (0.35 µm)** apart. Calibration includes the native stack's documented translation.

These are aligned/compressed JPEG microscopy tiles. Decoded 8-bit statistics are not calibrated detector intensities and remain independent of brightness/contrast display settings. A fixed ROI follows image coordinates, not a tracked or segmented cell. The app supplies no identified synapses, segmentation or asserted registration between native tiles and exported SWCs. Original bytes, license evidence and calibration/hashes are in `data/serial-em/`.

## Tools retained

**Circuit Studio** extracts induced cohorts using source group, hemisphere, text and directed seed neighbourhoods. A row remains only when both endpoints are selected. Pair thresholds follow aggregation. Class matrices, cell rankings, CSV exports, receipts and Network Lab handoff retain that scope.

**Structural deletion comparisons** compare selected node removals with seeded uniform removals of the same count. Controls match removal count, not degree, class or spatial position. Exports include every control removal set. Descriptive ranges do not establish significance or biological lesion outcomes.

**Morphology Bench** reports full-forest cable length, branching, terminals, components, longest root path and segment summaries. Its root-centred Sholl profile uses the selected rooted component; a source root is not automatically a soma. Tangencies are excluded, with the parent-to-child interval `(0,1]` following the documented endpoint convention. Radius-derived surface/volume claims are unsupported.

**Network Lab** retains paths, thresholds, rankings, matrices and receipts. Its drawing shows at most 32 selected cells; calculations and exports cover the full selected source. Search/region filters affect the row table and its CSV. Pair exports cover the full thresholded graph.

**Data Explorer** exposes sources/licenses and local CSV, root-ID and SWC imports. IDs remain exact strings. Malformed files are rejected; imports remain session-local and are lost on reload. Weights must be positive safe integers; files are limited to 25 MB. Importing does not establish biological provenance or coordinate units.

**Study settings** save browser-local selections or transfer them as JSON. They retain source identities, filters, camera and measurement/display selections, not raw imported files or computed experiment results. Portable settings require available bundled snapshots; imported/extracted graphs remain session-local. Legacy v3 settings keep their own schema/source set rather than silently acquiring v4 fields.

**Research Library** distinguishes primary papers, labelled preprints and official portals. **Image Gallery** preserves earlier references. Adult fly, larva, dragonfly and octopus procedural views remain labelled anatomical concepts; new measurements do not turn these concepts into measured whole-animal reconstructions.

Tools report source records or explicitly derived observations. They do not establish neural dynamics, efficacy, causal development, physiology, behaviour or biological completeness. The app is unaffiliated with the cited teams.

## Inspect and reproduce

Read [DATA-SOURCES.md](DATA-SOURCES.md) for versions, attribution and license boundaries. Standard-library Python 3.10 or later rebuilds the complete offline app:

```powershell
python tools/build-standalone.py
python tools/build-standalone.py --output rebuilt/index.html
```

The builder prints SHA-256 and whether it matches the captured release. Update a public snapshot and its embedded manifest together before rebuilding. The source folder contains the preserved base HTML, analysis cores, versioned interfaces, normalized data/research JSON and build configuration.

The earlier fly data rebuilder remains available:

```powershell
python tools/rebuild-data.py --output rebuilt-data
python tools/rebuild-data.py --download --output rebuilt-online
```

Rebuild worm tables from captured originals, or re-fetch immutable source URLs and verify their hashes:

```powershell
python data/witvliet2021/prepare_datasets.py --output rebuilt-witvliet/new-datasets.json
python data/witvliet2021/prepare_datasets.py --download --output rebuilt-witvliet-online/new-datasets.json
```

Linked fly skeletons and serial EM folders include their own source download/hash-verification scripts. Rebuilding assets does not automatically replace embedded snapshots.

Run available pure-analysis tests with Node.js 18 or later. For PowerShell:

```powershell
$atlasTests = Get-ChildItem source -Filter '*.test.cjs'
node --test $atlasTests.FullName
```

Browser interaction, offline and responsive checks are separate. See the release verification receipt for checks against that build.

GitHub Actions runs the pure-analysis tests, offline source-integrity checks and standalone rebuild on pushes to `main` and pull requests. It verifies captured data hashes, embedded image bytes, physical image calibration and exact VFB record-version strings. Run the same source check locally:

```powershell
python tools/verify-source-data.py
python tools/verify-source-data.py --built-html rebuilt/index.html
```

The second command compares the generated HTML with the captured release hash when that hash has been set. These checks do not download source data or replace browser interaction checks.

## Licenses

Application code follows the repository’s MIT license (`LICENSE`). Third-party source data, images and notices retain the separate terms recorded below.

The selected NemaNode representation carries **GPL-3.0**, with raw JSON, corresponding notice and independent transformation source under `data/witvliet2021/`. Selected VFB skeletons, native EM template/tile sources and MaleCNS data retain documented **CC BY 4.0** notices. The processed fly graph uses MIT at its pinned commit. Supplied FlyWire-labelled exports retain claimed **CC BY-NC 4.0** terms; their original export provenance was not supplied for independent verification. Reference images retain their original rights.

Preserve each source's attribution, hashes and notices. These terms do not assign one blanket license to every app/package item.
