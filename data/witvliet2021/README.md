# Eight measured C. elegans developmental brain graphs

These are eight separate isogenic hermaphrodite specimens from Witvliet, Mulcahy, Mitchell et al., **Connectomes across development reveal principles of brain maturation**, Nature 596, 257–261 (2021), [doi:10.1038/s41586-021-03778-8](https://doi.org/10.1038/s41586-021-03778-8). The [paper](https://www.nature.com/articles/s41586-021-03778-8) identifies the data portal [NemaNode](https://www.nemanode.org/), which is developed by the Zhen and Samuel laboratories.

The selected factual connection and metadata records come from the official laboratory [NemaNode repository](https://github.com/zhenlab-ltri/NemaNode/tree/6b7ca03f6d68c4ea1af3c120d1a47681edc74a90), pinned to commit `6b7ca03f6d68c4ea1af3c120d1a47681edc74a90`. Original bytes, the source license and hashes are included. No upstream application code is copied into the viewer.

## Exact normalized scopes

| Specimen | Approximate age after birth | Source stage | Observed chemical endpoint cells | Directed chemical pairs | Summed chemical weight |
| --- | ---: | --- | ---: | ---: | ---: |
| Dataset1 | 0 h | L1 | 187 | 775 | 1,296 |
| Dataset2 | 5 h | L1 | 193 | 986 | 1,895 |
| Dataset3 | 8 h | L1 | 198 | 1,012 | 2,128 |
| Dataset4 | 16 h | L1 | 203 | 1,136 | 2,777 |
| Dataset5 | 23 h | L2 | 210 | 1,515 | 4,116 |
| Dataset6 | 27 h | L3 | 216 | 1,525 | 4,456 |
| Dataset7 | 50 h | Adult | 221 | 2,202 | 7,467 |
| Dataset8 | 50 h | Adult | 219 | 2,186 | 7,970 |

Ages/stages follow the pinned official `datasets.json` and agree with the author's analysis `dataset_info.py`. Source identifiers retain `witvliet_2020_*`, while the final Nature paper was published in 2021. Four specimens are labelled L1, one L2, one L3, and two adult in these source metadata. The `visualTime` field is a graphical layout choice and is not used as biological age.

The reconstructed region is the **brain/head volume**, including nerve ring, ventral ganglion and anterior reconstructed neuropil. These files are **not full 302-neuron whole-animal connectomes**. The source includes chemical contacts to muscles and other non-neuronal cells. Report their vertices as **cells or nodes**, not exclusively neurons.

## Transformation and identity

Only records with source `typ == 0` are retained. `typ == 2` gap-junction observations are excluded; their annotation was partial and the paper excluded them from its main analyses. Within each chemical record, sum the positive integer values in `syn`; aggregate by the exact directed pair `(pre, post)`. Polyadic source annotation IDs can occur for several post-synaptic partners. Summed graph weights are therefore not counts of unique source annotation IDs.

The node universe is the set of **observed endpoints of retained chemical records**. The global 447-cell NemaNode catalogue is used only for metadata. A catalogue cell that has no retained observation in a specimen is not inserted as a measured isolate. This representation does not supply a complete reconstructed-cell inventory. An absent name or edge must not be interpreted as proof of birth, death or biological absence.

Cell names are retained exactly as IDs and labels, with identity namespace `celegans-name/witvliet2021`. The primary paper states that cells were identified across specimens using anatomical features and neighbourhood. It supports comparisons of matched names **within this dataset family**. The names are not fly IDs, generic cross-species homologues or a source of cross-species edges.

Cell type and neurotransmitter codes are metadata from `neurons.json`; the latter are retained as source codes rather than reinterpreted as measurements of synaptic efficacy. `type` expands source codes to readable classes, including Muscle and Other / unclassified. Side and paired-name metadata are conservative name-based L/R derivations only where the counterpart is present among that graph's chemical endpoints; unpaired cells retain an empty pair string.

These are **cross-sectional individuals**, not repeated imaging of one animal. Descriptive pairwise differences combine age, individual variability and reconstruction/annotation effects. The eight specimens do not independently estimate a population distribution at each age. Their graphs do not establish recorded activity, causal maturation, synaptic efficacy, or lesion outcomes.

## License and attribution

The pinned NemaNode source repository carries **GNU GPL version 3**. Preserve `originals/NemaNode-LICENSE.txt`, the upstream source URL, all raw records, the transformation source and this attribution when redistributing this selected source representation or its normalized tables. The full original corresponding JSON records and independent transformation code are included for inspection. This notice is **not one blanket license across all Synapse Atlas assets**.

The author Nature-analysis repository has no root license, so its source files are not used as the distributable connectivity source. The [Zenodo 5637219](https://zenodo.org/records/5637219) deposit has a CC BY 4.0 license for deposited 3D model archives. That separate license is **not claimed for these NemaNode connectivity records**. The Nature article's access status is also not used to infer terms for the app or unrelated assets.

## Reproduce

Use Python 3.10 or later, standard library only:

```powershell
python prepare_datasets.py --output rebuilt/new-datasets.json
python prepare_datasets.py --download --output rebuilt-online/new-datasets.json
```

Every original file is checked against its captured SHA-256. `--download` fetches the immutable Git commit URLs before verifying them. Source hashes are in `source-files.json`; `provenance.json` records identity, scope, attribution and source files; `validation.json` records each graph's structural counts. The script normalizes data from original JSON rather than reading precomputed graph edges from the application.

The metadata and raw record checks establish file consistency, not independent biological reconstruction validation.
