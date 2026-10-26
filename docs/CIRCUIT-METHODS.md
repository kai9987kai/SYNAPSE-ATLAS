# Circuit core integration

Load `atlas-core.js` before `circuit-core.js`. Browser global: `AtlasCircuitCore`; CommonJS: `require('./circuit-core.js')` with `atlas-core.js` beside it. The development copy also resolves `../site/source/atlas-core.js`.

All three methods accept node metadata objects with string `id`, optional `label`, `type` (or fallback `group`), and `side` (or fallback `hemisphere`). Rows may be normalized `{From,To,Synapses,...}` objects or compact `[from,to,weight]` arrays. Input objects are not mutated. Exact large IDs must be strings; unsafe numeric IDs are rejected. Endpoints missing from metadata become explicitly labeled Unknown nodes instead of disappearing.

## Selection

`selectCircuit(nodes, rows, {group:'', side:'', search:'', seedIds:[], direction:'both', hops:1, maxNodes:5000})`

Returns `{nodes,rows,selection}`. Group matching is exact. Side and substring search are case-insensitive. Group, side and search filters combine with AND. With seed IDs, breadth-first neighborhoods traverse the full **unthresholded** input graph for 0–3 hops, following `in`, `out` or `both`, then intersect the metadata matches. Returned rows form the induced subgraph. A seed outside a metadata filter may lead to matching neighbors without appearing itself. No seeds means metadata-only selection.

`selection` includes the normalized options, source and selected node/row counts, `matchedNodeCount` before neighborhood intersection, `truncated:false`, and a semantic description. Unknown seeds and node-limit overflow throw; nothing is silently truncated. `maxNodes` is an integer 1–100,000.

## Group matrix

`groupConnectivity(nodes, rows, threshold=1)`

Returns `{groups,matrix,pairMatrix,groupNodes,pairs,threshold,totalWeight,pairCount,semantics}`. Groups sort by code point, with Unknown last. `matrix[fromGroupIndex][toGroupIndex]` sums synaptic counts. `pairMatrix` counts directed neuron pairs, and `groupNodes` is the declared group size including isolates. `pairs` lists nonzero group cells as `{fromGroup,toGroup,weight,pairCount}`.

Neuron pairs are aggregated and thresholded **before** group aggregation. A group diagonal includes both distinct same-type neurons and self loops. More than 256 groups throws to avoid unbounded quadratic matrix allocation.

## Structural deletion

`compareDeletion(nodes, rows, {removeIds:[], threshold:1, randomTrials:10, seed:42})`

Returns `{threshold,seed,removedIds,removedCount,baseline:{metrics},targeted:{metrics},delta,random,interpretation}`. Metrics use the existing AtlasCore graph definitions. Deleted nodes and their incident rows are removed; every remaining declared isolate stays in the universe. Delta is targeted minus baseline for each metric.

`random` contains `trials`, `samples:[{removedIds,metrics}]`, `summary`, and `targetedPercentile`. Each metric summary contains `{min,max,mean,p05,p50,p95}`; quantiles linearly interpolate sorted samples. Empirical percentiles range from 0 to 100 and give ties half weight. They are descriptive, **not p-values**. With zero trials summary/percentile entries are null. With zero deleted nodes all controls equal baseline and tied percentiles are 50.

Controls sample uniformly without replacement within each trial using a seeded PRNG and canonical sorted node IDs. Separate trials may repeat a set. Seed is a uint32 integer and trial count is 0–30. Controls match deletion count only; they do not match degree, cell type, hemisphere or biological covariates. This tool removes graph records; it does not model neural compensation, physiology, causal interventions or behaviour. Run larger comparisons in a Web Worker to keep the interface responsive.

## Verification

`node --test work/v3/circuit-core.test.cjs` passes 14 tests, including hand-counted group/deletion fixtures, quote-independent string identifiers, validation, immutable inputs, seed repeatability, empty/all-deleted graphs, and a 12,000-node sparse chain.

Measured local benchmark on the bundled 3,013-node / 111,243-row processed larval graph: group matrix has 18 groups; group analysis took about 356 ms, and baseline + targeted + ten random deletion comparisons took about 2.17 seconds in Node. Browser timing will differ.
