const test=require('node:test');
const assert=require('node:assert/strict');
const {analyzeMorphology}=require('./morph-core.js');
const cell=(nodes,nmPerUnit=1000)=>({id:'fixture',label:'Measured-coordinate fixture',nmPerUnit,nodes});
const close=(actual,expected,eps=1e-9)=>assert.ok(Math.abs(actual-expected)<=eps,`${actual} != ${expected}`);

test('physical summaries retain source units and a hand-counted branching forest',()=>{
  const result=analyzeMorphology(cell([
    [1,1,0,0,0,1,-1],[2,3,3,0,0,1,1],[3,3,3,4,0,1,2],[4,3,3,-4,0,1,2],
    [5,0,20,0,0,1,-1],[6,0,20,2,0,1,5]
  ]),{shollStepUm:1});
  const s=result.summary;
  assert.equal(s.nodeCount,6);assert.equal(s.segmentCount,4);assert.equal(s.rootCount,2);assert.equal(s.componentCount,2);
  close(s.cableUm,13);assert.equal(s.branchPointCount,1);assert.equal(s.bifurcationCount,1);assert.equal(s.terminalCount,3);close(s.maxRootPathUm,7);
  assert.deepEqual(s.boundsUm,{min:[0,-4,0],max:[20,4,0],extent:[20,8,0]});
  assert.deepEqual(s.edgeLengthsUm,{count:4,mean:3.25,median:3.5,max:4});
  assert.deepEqual(s.branchSegmentsUm,{count:4,total:13,mean:3.25,median:3.5,max:4});
  assert.deepEqual(result.roots.map(r=>[r.id,r.nodeCount,r.cableUm,r.maxRootPathUm]),[[1,4,11,7],[5,2,2,2]]);
  assert.equal(result.profile.rootId,1);assert.equal(result.profile.nodeCount,4);assert.equal(result.profile.cableUm,11);
  assert.deepEqual(result.profile.centerUm,[0,0,0]);assert.equal(result.profile.scope,'selected rooted component');
  assert.equal(result.units.physical,'µm');
});

test('branch segments merge unary chains and retain branch junctions',()=>{
  const s=analyzeMorphology(cell([[1,0,0,0,0,1,-1],[2,0,1,0,0,1,1],[3,0,2,0,0,1,2],[4,0,4,0,0,1,3],[5,0,2,3,0,1,3]]),{shollStepUm:1}).summary;
  assert.deepEqual(s.branchSegmentsUm,{count:3,total:7,mean:7/3,median:2,max:3});
  assert.equal(s.edgeLengthsUm.count,4);close(s.maxRootPathUm,5);
});

test('Sholl uses exact line-sphere intersections including outside-to-outside segments',()=>{
  const p=analyzeMorphology(cell([[1,0,0,0,0,1,-1],[2,0,-2,.5,0,1,1],[3,0,2,.5,0,1,2]]),{shollStepUm:1}).profile;
  assert.deepEqual(p.radiiUm,[1,2]);assert.deepEqual(p.crossings,[3,3]);
});

test('Sholl excludes tangencies and uses the half-open endpoint convention',()=>{
  const tangent=analyzeMorphology(cell([[1,0,0,0,0,1,-1],[2,0,-2,1,0,1,1],[3,0,2,1,0,1,2]]),{shollStepUm:1}).profile;
  assert.equal(tangent.crossings[0],1);
  const chain=analyzeMorphology(cell([[1,0,0,0,0,1,-1],[2,0,1,0,0,1,1],[3,0,2,0,0,1,2]]),{shollStepUm:1}).profile;
  assert.deepEqual(chain.radiiUm,[1,2]);assert.deepEqual(chain.crossings,[1,1]);assert.match(chain.intersectionRule,/t ∈ \(0,1\]/);
});

test('selected root profile excludes disconnected fragments',()=>{
  const input=cell([[1,0,0,0,0,1,-1],[2,0,2,0,0,1,1],[10,0,10,0,0,1,-1],[11,0,15,0,0,1,10]]);
  const p=analyzeMorphology(input,{rootId:'10',shollStepUm:1}).profile;
  assert.equal(p.rootId,10);assert.equal(p.nodeCount,2);assert.equal(p.cableUm,5);assert.deepEqual(p.centerUm,[10,0,0]);assert.deepEqual(p.crossings,[1,1,1,1,1]);
  assert.throws(()=>analyzeMorphology(input,{rootId:11}),/root/i);
});

test('coordinate scaling is physical and inputs remain immutable',()=>{
  const input=cell([[1,1,100,200,300,1,-1],[2,2,103,204,300,1,1]],8);
  const before=JSON.stringify(input);input.nodes.forEach(Object.freeze);Object.freeze(input.nodes);Object.freeze(input);
  const result=analyzeMorphology(input,{shollStepUm:.01});
  close(result.summary.cableUm,.04);assert.deepEqual(result.summary.boundsUm.extent.map(x=>+x.toFixed(6)),[.024,.032,0]);
  assert.equal(result.units.nmPerUnit,8);assert.equal(JSON.stringify(input),before);assert.deepEqual(result.profile.crossings,[1,1,1,1]);
});

test('singleton forests return finite zero metrics and empty profiles',()=>{
  const result=analyzeMorphology(cell([[1,0,1,2,3,0,-1],[2,0,5,6,7,0,-1]]));
  assert.equal(result.summary.cableUm,0);assert.equal(result.summary.terminalCount,2);assert.equal(result.summary.maxRootPathUm,0);
  assert.deepEqual(result.summary.branchSegmentsUm,{count:0,total:0,mean:0,median:0,max:0});assert.deepEqual(result.profile.radiiUm,[]);assert.deepEqual(result.profile.crossings,[]);
});

test('malformed coordinates, units, parents, duplicates and cycles are rejected',()=>{
  const root=[1,0,0,0,0,1,-1];
  assert.throws(()=>analyzeMorphology(cell([])),/node/i);
  assert.throws(()=>analyzeMorphology(cell([root],0)),/unit/i);
  assert.throws(()=>analyzeMorphology(cell([root,[2,0,NaN,0,0,1,1]])),/finite/i);
  assert.throws(()=>analyzeMorphology(cell([root,[2,0,1,0,0,-1,1]])),/radius/i);
  assert.throws(()=>analyzeMorphology(cell([root,[1,0,1,0,0,1,1]])),/duplicate/i);
  assert.throws(()=>analyzeMorphology(cell([root,[2,0,1,0,0,1,99]])),/parent/i);
  assert.throws(()=>analyzeMorphology(cell([root,[2,0,1,0,0,1,3],[3,0,2,0,0,1,2]])),/cycle/i);
  assert.throws(()=>analyzeMorphology(cell([root]),{shollStepUm:0}),/step/i);
  assert.throws(()=>analyzeMorphology(cell([root,[2,0,1000,0,0,1,1]]),{shollStepUm:.001}),/512/i);
});

test('long rooted chains are iterative and preserve total branch cable',()=>{
  const nodes=Array.from({length:20000},(_,i)=>[i+1,0,i,0,0,1,i?i:-1]);
  const result=analyzeMorphology(cell(nodes,8),{shollStepUm:10});
  assert.equal(result.summary.nodeCount,20000);assert.equal(result.summary.branchSegmentsUm.count,1);close(result.summary.cableUm,159.992,1e-7);close(result.summary.maxRootPathUm,159.992,1e-7);
  assert.ok(result.profile.crossings.every(n=>n===1));
});
