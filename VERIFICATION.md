# Synapse Atlas 3.0 verification

Checked on 26 October 2026 against the bundled standalone build.

- **37 pure analysis tests passed**: 14 graph/import, 14 circuit/grouping/deletion and 9 calibrated morphometry tests. Fixtures cover exact large IDs, malformed imports, isolates, pair thresholds, directed neighbourhoods, seeded controls, no mutation, disconnected forests, physical units and exact sphere intersections.
- **66 browser checks passed** in installed Chrome. These exercise new linked anatomy, correct specimen/unit handoffs, source-code legends, physical profiles, invalid profile rejection, induced class/side/neighbourhood selections, worker deletion comparisons/repeatability/cancellation, exports, local and portable settings, malformed settings rejection, and prior import/path/gallery/research/microscopy behaviour.
- All **seven sections** were checked at **390 × 844** with both the viewport and document width remaining 390 pixels; desktop checks used **1500 × 1000**. Linked anatomy, the class matrix, morphology charts and controlled-comparison results were visually reviewed.
- **No uncaught JavaScript errors** were recorded. Direct file opening, offline linked anatomy and an offline Blob-worker deletion experiment passed. No HTTP data requests were made by that standalone session.
- Eight new raw larval SWC hashes and their upstream re-downloads match the captured source records. The normalized derivatives preserve coordinate values and replace only unknown radius sentinel -1 with zero. All eight pass the strict skeleton validator.
- Source rebuild reproduces the standalone HTML byte for byte. Release HTML SHA-256: `f0f1c69b17035c675c2c54de8f2293439b43fa03590642a80a7b1c2967c8e524`.

See `verification.json` for individual checks and browser version, `data/linked-larva/larval-linked-validation.json` for source consistency, and the data-source notes for biological and snapshot limits. These checks establish software and file consistency. They do not establish biological completeness, recorded activity or causal lesion outcomes. Deployment and any checks of the live site are recorded separately.
