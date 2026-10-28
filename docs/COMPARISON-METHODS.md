# Comparison core

`compare-core.js` is a pure UMD module. Load `AtlasCore` before it in the browser; CommonJS uses a peer `atlas-core.js`. It exposes `AtlasCompareCore.compareGraphs`, `bilateralAudit` and `fingerprintNeighbors`. No DOM, network or neural activity model is involved. Inputs remain unchanged.

## Inputs

Datasets have `nodes: [{id,label,type,side,pair}]` and either `edges` or `rows`. Rows are `[from,to,weight]` or `{From,To,Synapses}`. IDs must be exact strings or safe integers; counts must be positive safe integers. Empty metadata is permitted; missing edge endpoint records become explicit Unknown nodes and are listed in `undeclaredEndpointIds`. Duplicate node IDs reject.

All tools aggregate directed neuron pairs before applying a finite non-negative `threshold` (default1). `minThreshold` is an alias; conflicting aliases reject. Self loops are retained. All exported support counts and weights describe the selected source observations, not completeness-adjusted estimates.

## `compareGraphs(A,B,{threshold:1})`

Returns:

- `nodeScope: {common,onlyA,onlyB,commonCount,onlyACount,onlyBCount}` with exact sorted IDs.
- `scopeA/scopeB: {inputNodeCount,inputRowCount,retainedPairCount,sharedPairCount,excludedPairCount,sharedWeight,excludedWeight,undeclaredEndpointIds}`. Retained counts are after thresholding. Shared counts include only pairs whose two endpoints belong to the exact common ID set.
- `edgeCounts: {retained,gained,lost,union}`. Gained/lost mean B-only/A-only support and do not imply a longitudinal observation.
- `metrics: {presenceJaccard,weightedJaccard,normalizedWeightJSDistance}`. Presence Jaccard is support intersection/union. Weighted Jaccard is sum of per-pair minimum raw weights divided by sum of per-pair maxima. JSDistance is the square root of base2 Jensen–Shannon divergence after each shared weight distribution is normalized separately.
- `changedEdges: [{from,to,weightA,weightB,delta,shareA,shareB,shareDelta,status}]`, sorted by absolute share difference, then absolute raw difference and stable ID order. Edges with unchanged raw weight but changed normalized share are included.
- `status` is `ok`, `no_shared_nodes` or `no_retained_shared_edges`; `identityPolicy`, `distanceConvention` and `semantics` describe interpretation.

The caller must verify a common biological identity namespace before comparing different specimens. This module never guesses correspondence from labels, coordinates or side. Across different animals, developmental differences are cross-sectional observations and can reflect specimen variability or reconstruction coverage.

Empty support Jaccards are conventionally1; both empty weight distributions have distance0, exactly one empty distribution has distance1. Always inspect `status`: matching empty supports or no shared nodes are not affirmative evidence of anatomical similarity.

## `bilateralAudit(nodes,rows,{threshold:1})`

Only distinct reciprocal `.pair` identifiers qualify. Known contradictory same-side labels are excluded. Missing, unsafe, self and nonreciprocal partner assignments are reported rather than inferred or repaired.

Returns `metadata: {pairedNodeCount,pairCount,unpairedIds,missingTargets,invalidPairs}`, `scope: {inputNodeCount,retainedPairCount,eligiblePairCount,eligibleWeight,excludedPairCount,excludedWeight,undeclaredEndpointIds}`, `orbits` and `summary`.

Each orbit is `{from,to,mirrorFrom,mirrorTo,leftWeight,rightWeight,asymmetry,absoluteDifference,totalWeight,connectionType,orientation}`. Directed edge `(a,b)` and mirror `(pair(a),pair(b))` are counted once. Missing mirror support is assigned zero after thresholding. `connectionType` distinguishes self loops, homolog contralateral, other ipsilateral/contralateral and unclassified side patterns.

`orientation` is `source-left` when complementary source sides are available, `target-left` as a fallback, otherwise `canonical` lexicographic edge ordering. In a canonical orbit the fields `leftWeight/rightWeight` are stable display sides, not a claim of measured hemisphere.

Signed asymmetry is `(leftWeight-rightWeight)/(leftWeight+rightWeight)`. Summary `weightedAsymmetry` is `sum(abs(leftWeight-rightWeight))/sum(totalWeight)` across orbits. The summary also reports `orbitCount`, `matchedOrbitCount`, `oneSidedOrbitCount` and `totalWeight`. These are raw count contrasts; no developmental, functional or causal equality is inferred.

## `fingerprintNeighbors(nodes,rows,id,options)`

Options: `threshold:1`, `limit:10` (0–1000), `direction:'both'|'in'|'out'`, `sameGroup:false`.

Returns `{query:{id,label,group,featureCount,norm},threshold,direction,sameGroup,candidateCount,neighbors,status,semantics}`. Neighbors have `{id,label,group,similarity,sharedFeatureCount,featureCount,norm}`.

The sparse vector uses actual partner IDs, with incoming/outgoing features in separate dimensions. Similarity is weighted cosine, clamped to[0,1]; zero vectors have similarity0 and an empty query is explicitly flagged. Self loops remain in their incoming/outgoing dimensions. The query cell is excluded; group restriction uses the source `type` or `group`. Ties sort by exact ID. Similar wiring fingerprints do not establish cell type, homology or biological function.
