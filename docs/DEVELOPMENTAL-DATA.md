# Developmental C. elegans data and comparison scope

Synapse Atlas 4 adds eight measured chemical-connectivity graphs from the official Zhen/Samuel laboratory NemaNode representation of [Witvliet et al., Nature 2021](https://doi.org/10.1038/s41586-021-03778-8). Source bytes are pinned to [NemaNode commit `6b7ca03f6d68c4ea1af3c120d1a47681edc74a90`](https://github.com/zhenlab-ltri/NemaNode/tree/6b7ca03f6d68c4ea1af3c120d1a47681edc74a90), retrieved on **27 October 2026**.

The cells use the common identity namespace **`celegans-name/witvliet2021`**. Exact names permit identity-matched comparisons within this family. They do not establish a correspondence to fly root IDs, neuron types across species or cells with similar-looking names in other data.

| Source specimen | Approximate hours after birth | Source stage | Observed chemical endpoint cells | Directed pairs | Summed weight |
| --- | ---: | --- | ---: | ---: | ---: |
| Dataset1 | 0 | L1 | 187 | 775 | 1,296 |
| Dataset2 | 5 | L1 | 193 | 986 | 1,895 |
| Dataset3 | 8 | L1 | 198 | 1,012 | 2,128 |
| Dataset4 | 16 | L1 | 203 | 1,136 | 2,777 |
| Dataset5 | 23 | L2 | 210 | 1,515 | 4,116 |
| Dataset6 | 27 | L3 | 216 | 1,525 | 4,456 |
| Dataset7 | 50 | Adult | 221 | 2,202 | 7,467 |
| Dataset8 | 50 | Adult | 219 | 2,186 | 7,970 |

Stage and age follow the pinned official metadata. There is one specimen at each listed larval age and two adults at approximately 50 hours. The source's graphical `visualTime` field is not biological age and is not substituted for it. These are eight **different animals**, not longitudinal observations of one individual and not a population estimate at every age.

## What the graph contains

Only `typ == 0` chemical records are retained. Their positive integer `syn` occurrence counts are summed for each exact directed `(pre, post)` pair. Source `typ == 2` electrical observations are excluded: gap-junction annotation was partial. A polyadic source annotation ID can contribute to more than one post-synaptic pair, so graph weight sums are not counts of unique source annotation IDs.

These are reconstructed **brain/head-volume** contacts, not whole-animal 302-neuron connectomes. Muscles and other non-neuronal endpoints occur in the data. Their vertices are called **cells/nodes**, not all neurons. Source type and neurotransmitter codes are retained as metadata; they are not age-specific physiological measurements or edge efficacy.

The declared universe contains observed endpoints of retained chemical records. The global NemaNode cell catalogue supplies metadata only; its unobserved cells are not inserted as measured isolates. This is not a complete reconstructed-cell inventory. Missing names or edges can reflect coverage, filtering or annotation; the app does not equate them with biological absence.

## Three Observatory tools

**Specimen comparison** restricts each pair of sources to their common observed identities before scoring support and weights. It reports exclusive observed node counts and edges excluded by that common scope. Pair-support Jaccard, raw weighted overlap and normalized-weight Jensen–Shannon distance describe different properties and remain separate. The matrix uses the common set for each source pair, which can differ between matrix cells. A high threshold or empty support does not supply positive similarity evidence.

**Bilateral audit** uses reciprocal source pair mappings to compare an edge and its mirrored counterpart. Invalid, contradictory, missing and self-pair metadata are audited and excluded. It measures symmetry of observed wiring under that mapping, without correcting hemisphere coverage, cell number or reconstruction quality. It is not proof of functional symmetry.

**Wiring fingerprints** compare sparse partner-weight vectors using cosine similarity. Incoming and outgoing features occupy separate dimensions; exact partner IDs define those dimensions. Searches remain within one dataset and can be restricted to the source group. Zero vectors supply no matching evidence. Similar wiring patterns do not identify physiology, cell class, homology or function.

All three tools preserve source data and export source identities, thresholds, scope and results. Descriptive differences can combine age, individual variability, annotation and reconstruction. They do not establish causal development, neural dynamics or clinical/behavioural outcomes.

## License, attribution and reproduction

The selected source representation carries **GNU GPL version 3**, as supplied by the pinned NemaNode repository. Preserve the full notice in [`data/witvliet2021/originals/NemaNode-LICENSE.txt`](../data/witvliet2021/originals/NemaNode-LICENSE.txt), corresponding raw JSON, source URL, attribution and independent normalization source. No upstream NemaNode application code is copied into the app. This is not one blanket license for the rest of Synapse Atlas.

Credit Witvliet, Mulcahy, Mitchell and colleagues (2021), with NemaNode and the Zhen/Samuel laboratories. The unrelated Zenodo 5637219 **3D-model** deposit's CC BY 4.0 terms are not claimed for these connectivity tables. The author analysis repository has no root license and is not the redistributable source used here.

Raw originals, SHA-256 manifests, normalized graphs, the detailed dataset README and validation are in [`data/witvliet2021/`](../data/witvliet2021/). The standard-library Python script rebuilds from raw records, verifies captured hashes and can re-download immutable commit URLs:

```powershell
python data/witvliet2021/prepare_datasets.py --output rebuilt-witvliet/new-datasets.json
python data/witvliet2021/prepare_datasets.py --download --output rebuilt-witvliet-online/new-datasets.json
```

The downloaded and offline reconstructions were checked for byte-identical normalized output. These consistency checks are not an independent biological reconstruction audit.
