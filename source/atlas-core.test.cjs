const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const p=path.join(__dirname,'atlas-core.js');
const core=fs.existsSync(p)?require(p):{};
const row=(From,To,Synapses=1,Neuropil='test')=>({From,To,Synapses,Neuropil,'Neuro Transmitter':''});

test('CSV keeps 64-bit identifiers and quoted commas exactly',()=>{
  assert.equal(typeof core.parseConnectivityCSV,'function');
  assert.deepEqual(core.parseConnectivityCSV('\ufeffsource,target,weight,region\r\n720575940639278399,720575940615101747,3,"left, cortex"\r\n'),[row('720575940639278399','720575940615101747',3,'left, cortex')]);
});
test('CSV handles quoted newlines and doubled quote characters',()=>{
  assert.deepEqual(core.parseConnectivityCSV('From,To,Synapses,Neuropil\n"a""b",c,2,"first\nsecond"'),[row('a"b','c',2,'first\nsecond')]);
});
test('CSV rejects malformed quoting, duplicate columns and inconsistent rows',()=>{
  for(const csv of ['From,To,Synapses\n"a,b,2','From,To,Synapses\na"x,b,2','From,To,Synapses\n"a"x,b,2','From,To,Synapses\na,b,2,extra','From,To,To,Synapses\na,b,c,2']) assert.throws(()=>core.parseConnectivityCSV(csv));
});
test('CSV rejects empty identifiers and impossible counts atomically',()=>{
  for(const value of ['-1','0','1.2','Infinity','NaN','','9007199254740992']) assert.throws(()=>core.parseConnectivityCSV('From,To,Synapses\na,b,'+value));
  assert.throws(()=>core.parseConnectivityCSV('From,To,Synapses\n,b,1'));
  assert.throws(()=>core.parseConnectivityCSV('a,b,c\nx,y,1'));
});
test('SWC exposes measured coordinates, roots, segments and bounds',()=>{
  const swc=core.parseSWC('# neuron\n1 1 0 2 3 1 -1\n2 3 1 3 4 .2 1\n3 2 -2 4 5 0 2');
  assert.equal(swc.nodes.length,3); assert.deepEqual(swc.rootIds,[1]); assert.equal(swc.segmentCount,2);
  assert.deepEqual(swc.bounds,{min:[-2,2,3],max:[1,4,5]});
  assert.equal(swc.nodes[1].type,3);
});
test('SWC accepts valid multiple-root forests',()=>{
  assert.deepEqual(core.parseSWC('1 1 0 0 0 1 -1\n2 1 3 0 0 1 -1').rootIds,[1,2]);
});
test('SWC rejects malformed nodes, duplicate IDs, missing parents, cycles and negative radius',()=>{
  const bad=['1 1 0 0 0 1 -1\n1 2 1 1 1 1 1','1 1 0 0 0 1 -1\n2 3 1 1 1 1 9','1 1 0 0 0 -1 -1','1 1 NaN 0 0 1 -1','1.2 1 0 0 0 1 -1','1 1 0 0 0 1 2\n2 1 1 1 1 1 1','1 1 0 0 0 1 -1\n2 1 0 0 0 1 3\n3 1 0 0 0 1 2','1 1 0 0 0 1 -1 9',''];
  for(const text of bad) assert.throws(()=>core.parseSWC(text));
});
test('graph metrics match a hand-counted directed graph with one loop and isolate',()=>{
  const result=core.analyzeGraph([row('A','B',2),row('A','B',3),row('B','A',4),row('B','C',1),row('C','C',7)],1,['Z']);
  assert.deepEqual(result.nodes,['A','B','C','Z']);
  assert.deepEqual(result.metrics,{nodeCount:4,pairCount:4,nonSelfPairCount:3,selfLoopCount:1,totalWeight:17,density:3/12,reciprocity:2/3,weakComponentCount:2,largestWeakComponent:3,largestSCC:2});
  assert.deepEqual(result.pairs.find(x=>x.from==='A'&&x.to==='B'),{from:'A',to:'B',w:5,rows:2});
  assert.deepEqual(result.rankings.find(x=>x.id==='B'),{id:'B',inDegree:1,outDegree:2,inStrength:5,outStrength:5,totalStrength:10});
});
test('threshold applies after directed pair aggregation and preserves node universe',()=>{
  const result=core.analyzeGraph([row('A','B',2),row('A','B',3),row('B','A',4),row('B','C',1)],5);
  assert.equal(result.metrics.nodeCount,3); assert.equal(result.metrics.pairCount,1); assert.equal(result.metrics.totalWeight,5);
  assert.equal(result.metrics.reciprocity,0); assert.equal(result.metrics.largestSCC,1);
});
test('graph keys are collision-free and prototype-like IDs remain safe',()=>{
  const result=core.analyzeGraph([row('a|b','c',1),row('a','b|c',2),row('__proto__','constructor',3)]);
  assert.equal(result.pairs.length,3); assert.equal(result.metrics.totalWeight,6); assert.equal(result.nodes.length,6);
});
test('empty graphs return finite zero metrics and singleton isolates',()=>{
  const empty=core.analyzeGraph([]); assert.equal(empty.metrics.density,0); assert.equal(empty.metrics.reciprocity,0); assert.equal(empty.metrics.largestSCC,0);
  const isolate=core.analyzeGraph([],1,['A']); assert.equal(isolate.metrics.weakComponentCount,1); assert.equal(isolate.metrics.largestSCC,1);
});
test('shortest paths follow direction and threshold',()=>{
  const rows=[row('A','B',3),row('B','C',2),row('A','D',1),row('D','C',1)];
  assert.deepEqual(core.shortestPath(rows,'A','C'),['A','B','C']);
  assert.equal(core.shortestPath(rows,'C','A'),null); assert.equal(core.shortestPath(rows,'A','C',3),null);
  assert.deepEqual(core.shortestPath(rows,'A','A'),['A']); assert.equal(core.shortestPath([],'A','A'),null);
});
test('sparse algorithms handle long chains without recursive stack overflow',()=>{
  const rows=Array.from({length:19999},(_,i)=>row(String(i),String(i+1)));
  const result=core.analyzeGraph(rows); assert.equal(result.metrics.nodeCount,20000); assert.equal(result.metrics.largestSCC,1); assert.equal(result.metrics.weakComponentCount,1);
  assert.equal(core.shortestPath(rows,'0','19999').length,20000);
});
test('SWC validates a long parent chain without recursive stack overflow',()=>{
  const text=Array.from({length:20000},(_,i)=>`${i+1} 3 ${i} 0 0 1 ${i===0?-1:i}`).join('\n');
  assert.equal(core.parseSWC(text).segmentCount,19999);
});
