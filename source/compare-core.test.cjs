const test=require('node:test');
const assert=require('node:assert/strict');
const Core=require('./compare-core.js');
const node=(id,extra={})=>({id,label:id,...extra});
const data=(ids,rows)=>({nodes:ids.map(id=>node(id)),edges:rows});
const near=(a,b,tol=1e-12)=>assert.ok(Math.abs(a-b)<=tol,`${a} != ${b}`);

test('shared-node scope excludes unmatched endpoints and counts supports exactly',()=>{
  const a=data(['a','b','onlyA'],[['a','b',2],['b','a',1],['a','onlyA',50]]);
  const b=data(['a','b','onlyB'],[['a','b',4],['a','a',1],['onlyB','a',70]]);
  const r=Core.compareGraphs(a,b);
  assert.deepEqual(r.nodeScope.common,['a','b']);
  assert.deepEqual(r.nodeScope.onlyA,['onlyA']);assert.deepEqual(r.nodeScope.onlyB,['onlyB']);
  assert.deepEqual(r.edgeCounts,{retained:1,gained:1,lost:1,union:3});
  assert.equal(r.scopeA.sharedWeight,3);assert.equal(r.scopeA.excludedWeight,50);
  assert.equal(r.scopeB.sharedWeight,5);assert.equal(r.scopeB.excludedWeight,70);
  near(r.metrics.presenceJaccard,1/3);near(r.metrics.weightedJaccard,2/6);
  const changed=r.changedEdges.find(e=>e.from==='a'&&e.to==='b');
  assert.equal(changed.delta,2);near(changed.shareDelta,4/5-2/3);
});
test('threshold is applied after directed row aggregation',()=>{
  const a={nodes:[node('x'),node('y')],rows:[{From:'x',To:'y',Synapses:2},{From:'x',To:'y',Synapses:3}]};
  const r=Core.compareGraphs(a,data(['x','y'],[['x','y',4]]),{threshold:5});
  assert.equal(r.scopeA.sharedWeight,5);assert.equal(r.scopeB.sharedWeight,0);
  assert.equal(r.edgeCounts.lost,1);assert.equal(r.metrics.normalizedWeightJSDistance,1);
});
test('normalized weight distributions distinguish scaling from raw count differences',()=>{
  const a=data(['a','b'],[['a','b',1],['b','a',3]]),b=data(['a','b'],[['a','b',2],['b','a',6]]);
  const r=Core.compareGraphs(a,b);assert.equal(r.metrics.presenceJaccard,1);
  near(r.metrics.weightedJaccard,.5);near(r.metrics.normalizedWeightJSDistance,0);
  assert.ok(r.changedEdges.every(e=>Math.abs(e.shareDelta)<1e-12));
});
test('changed edge rankings include relative-share changes with unchanged raw counts',()=>{
  const r=Core.compareGraphs(data(['a','b'],[['a','b',1],['b','a',1]]),data(['a','b'],[['a','b',1],['b','a',3]]));
  const edge=r.changedEdges.find(e=>e.from==='a'&&e.to==='b');assert.ok(edge);
  assert.equal(edge.delta,0);near(edge.shareDelta,-.25);assert.equal(edge.status,'retained');
});
test('Jensen-Shannon distance is symmetric, finite, and reaches one for disjoint support',()=>{
  const a=data(['a','b'],[['a','b',2]]),b=data(['a','b'],[['b','a',7]]);
  const ab=Core.compareGraphs(a,b),ba=Core.compareGraphs(b,a);
  near(ab.metrics.normalizedWeightJSDistance,1);near(ba.metrics.normalizedWeightJSDistance,1);
  assert.equal(ab.metrics.weightedJaccard,0);assert.equal(ab.metrics.presenceJaccard,0);
});
test('empty supports have explicit conventions and no shared nodes are flagged',()=>{
  const same=Core.compareGraphs(data(['a'],[]),data(['a'],[]));
  assert.equal(same.metrics.normalizedWeightJSDistance,0);assert.equal(same.metrics.weightedJaccard,1);
  const none=Core.compareGraphs(data(['a'],[]),data(['b'],[]));
  assert.equal(none.status,'no_shared_nodes');assert.equal(none.nodeScope.commonCount,0);
  for(const x of Object.values(none.metrics))assert.ok(Number.isFinite(x));
});
test('64-bit and prototype-like IDs retain exact identity without key collisions',()=>{
  const id='720575940639278399',ids=[id,'__proto__','a|b','b'];
  const d=data(ids,[[id,'__proto__',2],['a|b','b',4]]),r=Core.compareGraphs(d,d);
  assert.ok(r.nodeScope.common.includes(id));assert.equal(r.edgeCounts.retained,2);
  assert.equal(r.metrics.weightedJaccard,1);assert.equal(r.changedEdges.length,0);
});
test('comparison rejects malformed data and invalid thresholds',()=>{
  assert.throws(()=>Core.compareGraphs(data(['a'],[['a','a',-1]]),data(['a'],[])),/positive|count/i);
  assert.throws(()=>Core.compareGraphs({nodes:[node('a'),node('a')],edges:[]},data([],[])),/duplicate/i);
  assert.throws(()=>Core.compareGraphs(data(['a'],[]),data(['a'],[]),{threshold:NaN}),/threshold/i);
  assert.throws(()=>Core.compareGraphs({nodes:[node(720575940639278399)],edges:[]},data([],[])),/safe|string/i);
});
test('undeclared endpoints are explicit and a conflicting threshold alias rejects',()=>{
  const a={nodes:[node('a')],rows:[{From:'a',To:'endpoint',Synapses:1}]};
  const r=Core.compareGraphs(a,data(['a','endpoint'],[['a','endpoint',1]]));
  assert.deepEqual(r.scopeA.undeclaredEndpointIds,['endpoint']);assert.equal(r.nodeScope.commonCount,2);
  assert.throws(()=>Core.compareGraphs(a,a,{threshold:2,minThreshold:3}),/matching threshold/i);
  assert.equal(Core.compareGraphs(a,a,{minThreshold:2}).scopeA.sharedPairCount,0);
});
const pairedNodes=[node('AL',{side:'L',pair:'AR'}),node('AR',{side:'R',pair:'AL'}),node('BL',{side:'left',pair:'BR'}),node('BR',{side:'right',pair:'BL'}),node('unpaired')];
test('bilateral edge orbits use reciprocal metadata once and preserve asymmetry direction',()=>{
  const r=Core.bilateralAudit(pairedNodes,[['AL','BL',8],['AR','BR',2],['AL','BR',3],['AR','BL',3]]);
  assert.equal(r.metadata.pairCount,2);assert.equal(r.metadata.pairedNodeCount,4);
  assert.deepEqual(r.metadata.unpairedIds,['unpaired']);assert.equal(r.orbits.length,2);
  const ipsi=r.orbits.find(o=>o.from==='AL'&&o.to==='BL');
  assert.equal(ipsi.leftWeight,8);assert.equal(ipsi.rightWeight,2);near(ipsi.asymmetry,.6);
  assert.equal(r.summary.matchedOrbitCount,2);near(r.summary.weightedAsymmetry,6/16);
});
test('bilateral audit retains self-loop and homolog-contralateral edge distinctions',()=>{
  const r=Core.bilateralAudit(pairedNodes,[['AL','AL',4],['AR','AR',4],['AL','AR',5]]);
  assert.equal(r.orbits.length,2);assert.ok(r.orbits.some(o=>o.connectionType==='self-loop'));
  const crossing=r.orbits.find(o=>o.connectionType==='homolog-contralateral');
  assert.equal(crossing.leftWeight,5);assert.equal(crossing.rightWeight,0);assert.equal(crossing.asymmetry,1);
  assert.equal(r.summary.oneSidedOrbitCount,1);assert.equal(r.scope.eligiblePairCount,3);
});
test('bilateral audit reports missing/nonreciprocal/self metadata and excludes those endpoints',()=>{
  const nodes=[...pairedNodes,node('bad',{pair:'missing'}),node('one',{pair:'AL'}),node('self',{pair:'self'})];
  const r=Core.bilateralAudit(nodes,[['bad','AL',8],['AL','BL',1],['AR','BR',1]]);
  assert.ok(r.metadata.missingTargets.some(p=>p.id==='bad'));
  assert.ok(r.metadata.invalidPairs.some(p=>p.id==='one'));
  assert.ok(r.metadata.invalidPairs.some(p=>p.id==='self'));
  assert.equal(r.scope.excludedPairCount,1);assert.equal(r.orbits.length,1);
});
test('bilateral canonical orientation remains deterministic without side labels',()=>{
  const nodes=[node('x',{pair:'y'}),node('y',{pair:'x'})],rows=[['y','y',3],['x','x',1]];
  const r=Core.bilateralAudit(nodes,rows);assert.equal(r.orbits.length,1);
  assert.equal(r.orbits[0].from,'x');assert.equal(r.orbits[0].orientation,'canonical');
});
test('bilateral threshold aggregates rows and reports only observed eligible supports',()=>{
  const r=Core.bilateralAudit(pairedNodes,[['AL','BL',2],['AL','BL',3],['AR','BR',4],['unpaired','AL',20]],{threshold:5});
  assert.equal(r.orbits.length,1);assert.equal(r.orbits[0].leftWeight,5);assert.equal(r.orbits[0].rightWeight,0);
  assert.equal(r.scope.eligiblePairCount,1);assert.equal(r.scope.excludedPairCount,1);assert.equal(r.scope.excludedWeight,20);
});
test('bilateral same-side conflicts and unsafe numeric partner IDs are reported',()=>{
  const nodes=[node('a',{side:'L',pair:'b'}),node('b',{side:'L',pair:'a'}),node('c',{pair:720575940639278399})];
  const r=Core.bilateralAudit(nodes,[['a','b',1]]);assert.equal(r.metadata.pairedNodeCount,0);
  assert.equal(r.metadata.invalidPairs.length,3);assert.equal(r.scope.excludedPairCount,1);assert.equal(r.orbits.length,0);
});
test('fingerprint cosine uses actual partner identity and keeps incoming/outgoing features distinct',()=>{
  const nodes=['q','same','reverse','p1','p2'].map(id=>node(id));
  const rows=[['q','p1',1],['q','p2',2],['same','p1',2],['same','p2',4],['p1','reverse',2],['p2','reverse',4]];
  const r=Core.fingerprintNeighbors(nodes,rows,'q',{direction:'both'});
  assert.equal(r.neighbors[0].id,'same');near(r.neighbors[0].similarity,1);
  assert.equal(r.neighbors.find(n=>n.id==='reverse').similarity,0);
  assert.equal(r.query.featureCount,2);assert.equal(r.neighbors[0].sharedFeatureCount,2);
});
test('fingerprint thresholding, same-group restriction and stable ties are explicit',()=>{
  const nodes=[node('q',{type:'A'}),node('z',{type:'A'}),node('a',{type:'A'}),node('other',{type:'B'}),node('partner',{type:'B'})];
  const rows=[['q','partner',1],['q','partner',2],['z','partner',3],['a','partner',3],['other','partner',3]];
  const r=Core.fingerprintNeighbors(nodes,rows,'q',{threshold:3,sameGroup:true,limit:1,direction:'out'});
  assert.equal(r.candidateCount,2);assert.equal(r.neighbors.length,1);assert.equal(r.neighbors[0].id,'a');
  assert.equal(r.query.featureCount,1);near(r.neighbors[0].similarity,1);
});
test('zero fingerprint vectors are finite and unknown queries or invalid options reject',()=>{
  const nodes=[node('a'),node('b')];const r=Core.fingerprintNeighbors(nodes,[],'a');
  assert.equal(r.query.norm,0);assert.equal(r.neighbors[0].similarity,0);assert.equal(r.status,'query_has_no_retained_connections');
  assert.throws(()=>Core.fingerprintNeighbors(nodes,[],'missing'),/unknown/i);
  assert.throws(()=>Core.fingerprintNeighbors(nodes,[],'a',{direction:'wrong'}),/direction/i);
  assert.throws(()=>Core.fingerprintNeighbors(nodes,[],'a',{limit:-1}),/limit/i);
});
test('incoming fingerprints follow source partners and preserve self-loop dimensions',()=>{
  const nodes=['q','same','p1','p2'].map(id=>node(id));
  const rows=[['p1','q',2],['p2','q',3],['p1','same',4],['p2','same',6],['q','q',1]];
  const r=Core.fingerprintNeighbors(nodes,rows,'q',{direction:'in'}),match=r.neighbors.find(n=>n.id==='same');
  assert.equal(r.query.featureCount,3);assert.equal(match.sharedFeatureCount,2);
  near(match.similarity,26/Math.sqrt(14*52));
  assert.equal(Core.fingerprintNeighbors(nodes,rows,'q',{limit:0}).neighbors.length,0);
});
test('all analyses preserve input objects and arrays',()=>{
  const a={nodes:pairedNodes,edges:[['AL','BL',2],['AR','BR',3]]},before=JSON.stringify(a);
  Core.compareGraphs(a,a);Core.bilateralAudit(a.nodes,a.edges);Core.fingerprintNeighbors(a.nodes,a.edges,'AL');
  assert.equal(JSON.stringify(a),before);
});
test('sparse full-chain comparison and fingerprints avoid recursive traversal',()=>{
  const nodes=Array.from({length:20000},(_,i)=>node(String(i))),rows=nodes.slice(1).map((_,i)=>[String(i),String(i+1),1]);
  const r=Core.compareGraphs({nodes,edges:rows},{nodes,edges:rows});assert.equal(r.edgeCounts.retained,19999);
  const f=Core.fingerprintNeighbors(nodes,rows,'1000',{limit:3});assert.equal(f.neighbors.length,3);
});
