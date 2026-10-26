# Synapse Atlas 2.0

A standalone connectomics workbench for measured neuron anatomy, directed wiring graphs and research references. Selected primary sources were checked on **26 October 2026**; the library does not update automatically.

## Open the app

Open **index.html** in a current desktop browser. No installation, account, server or runtime CDN is required. The public measurements and original reference images are embedded in that file. External research links require an internet connection.

The accompanying `data/` and source files support inspection and rebuilding; opening the app requires only `index.html`. To host it as a static website, serve `index.html`. Keep this documentation and data notices with any redistributed package.

## Explore

- **3D Atlas:** rotate two real MaleCNS descending-neuron skeletons separately or together in their shared source coordinate frame. Change colour assignment, depth clipping and camera; inspect calibrated geometry and export a PNG. The adult fly, larva, dragonfly and octopus procedural models remain explicitly labeled anatomical concepts.
- **Network Lab:** switch between public larval graph scopes and the supplied ExR1 subset. Inspect pair-aggregated synaptic weights, threshold sensitivity, neuron strength rankings, directed hop paths, connected components and reciprocity. Download filtered region rows, aggregated pairs or a JSON analysis receipt.
- **Data Explorer:** inspect sources and licenses; import connectivity CSVs, root IDs and SWC skeletons locally. Malformed CSV/SWC data are rejected while retaining the previous valid state. Imports are held in memory and are lost when the page reloads.
- **EM Laboratory:** adjust the supplied reference screenshot and inspect the reconstruction workflow. This section illustrates microscopy; it does not reconstruct an EM volume.
- **Research Library:** search selected primary papers and source portals, with specimen and study limits.
- **Image Gallery:** inspect the reference images preserved from the supplied HTML.

The network drawing shows at most 32 selected neurons for readability; the metrics cover the entire selected graph and declared node universe. Search/region filters affect the row table and its CSV export. The pair export and receipt cover the full graph at the active threshold. See the labels in the app for current scope.

## Import formats

Connectivity CSV requires `From`, `To`, `Synapses`; `Neuropil` and `Neuro Transmitter` are optional. Keep large neuron IDs as text, particularly when preparing files in a spreadsheet. Weights must be positive safe integers. File size is limited to 25 MB.

SWC requires seven whitespace-separated fields: `ID type X Y Z radius parent`. Coordinates must be finite, IDs unique and parents valid; cycles are rejected. Multiple rooted components are allowed. Imported coordinate units follow the source file and are not independently established by importing it.

## Data and scientific scope

The bundled larval research graph contains **3,013 nodes, 111,243 directed weighted rows and 353,859 summed weight**. Its mushroom-body input/output subset contains **76 nodes, 773 edges and 4,403 summed weight**; the recurrent subset contains **238 nodes, 4,851 edges and 20,847 summed weight**. These are exact properties of the archived processed tables, not the 548,000-synapse total of the original Science publication.

The two MaleCNS skeletons contain **15,945** and **17,298** source nodes. They provide geometry only. Neither synaptic edges between them nor recorded neural activity are bundled. Larval wiring, adult male anatomy and the supplied adult female FlyWire data are separate specimens with separate identifiers.

Synapse counts and structural paths do not establish connection efficacy, signal timing, causation or behaviour. Colours, graph layout and clipping are display choices. This app is an exploratory research tool and is not affiliated with the cited teams.

## Inspect and reproduce

Read **DATA-SOURCES.md** for direct sources, exact scope, licenses and attribution. `data/provenance.json` records source hashes; `data/validation.json` records structural checks. Original SWCs and the compact graphs are included; `data/larval-original-tables.zip` preserves the raw research tables and their license.

Rebuild the public asset objects offline with Python 3.10 or later, using only its standard library:

```powershell
python tools/rebuild-data.py --output rebuilt-data
```

To fetch the immutable upstream inputs and verify their hashes instead:

```powershell
python tools/rebuild-data.py --download --output rebuilt-online
```

This script rebuilds public data assets. Rebuilding data does not automatically replace the snapshots embedded in `index.html`. The `accessed` field identifies the original bundle date.

To rebuild the complete standalone app offline, use the bundled `source/` files:

```powershell
python tools/build-standalone.py
```

This replaces `index.html` and `source-manifest.json` with the assembled source. To inspect a build without replacing the app:

```powershell
python tools/build-standalone.py --output rebuilt/index.html
```

The script prints the output SHA-256 and whether it matches the captured release byte for byte. It uses Python 3.10 or later and its standard library. Its fixed line-ending setting makes the release reproducible across operating systems. The source folder contains the preserved original HTML (`base.html`), the validated graph/import core, the compiled upgrade JavaScript and CSS, and the normalized public-data and research JSON. The upgrade source includes the final reviewed fixes; no additional patch script is needed. To replace a public snapshot, edit `source/public-data.json` and its embedded manifest together before rebuilding.

Run the core validation tests with Node.js 18 or later:

```powershell
node --test source/atlas-core.test.cjs
```

These 14 tests check graph calculations, directed paths, CSV/SWC rejection cases, exact string identifiers and large sparse chains. Browser interaction checks are separate from these core tests.

## Licenses

The public larval processed files use the MIT license at the pinned research commit; its notice is in `data/larva-LICENSE.txt`. MaleCNS data use CC BY 4.0. The supplied HTML's FlyWire-labeled data retain their claimed CC BY-NC 4.0 terms; original export provenance was not supplied for independent verification. Reference images retain their original rights. These separate notices do not grant one blanket license over every item in the package.
