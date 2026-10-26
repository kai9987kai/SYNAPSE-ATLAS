const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const file=path.join(__dirname,'circuit-core.js');
const core=fs.existsSync(file)?require(file):{};
const row=(From,To,Synapses=1)=>({From,To,Synapses,Neuropil:'test'});
const nodes=[
  {id:'A',label:'Alpha',type:'input',side:'left'},
  {id:'B',label:'Beta',type:'local',side:'left'},
  {id:'C',label:'Gamma',type:'output',side:'right'},
  {id:'D',label:'Delta',type:'output',side:'right'},
  {id:'Z',label:'Isolate',type:'',side:''}
];
const rows=[row('A','B',2),row('A','B',3),row('B','A',4),row('B','C',1),row('C','C',7),row('C','D',2)];

test('metadata filters combine and retain original string IDs',()=>{
  assert.equal(typeof core.selectCircuit,'function');
  const selected=core.selectCircuit(nodes,rows,{group:'output',side:'right',search:'Gamma'});
  assert.deepEqual(selected.nodes.map(n=>n.id),['C']);
  assert.deepEqual(selected.rows,[row('C','C',7)]);
  assert.equal(selected.selection.matchedNodeCount,1);
  const big='720575940639278399';
  assert.deepEqual(core.selectCircuit([{id:big,label:'big'}],[],{}).nodes.map(n=>n.id),[big]);
});

test('seed neighborhood follows requested direction and hop distance',()=>{
  assert.deepEqual(core.selectCircuit(nodes,rows,{seedIds:['B'],hops:1,direction:'out'}).nodes.map(n=>n.id),['A','B','C']);
  assert.deepEqual(core.selectCircuit(nodes,rows,{seedIds:['C'],hops:1,direction:'in'}).nodes.map(n=>n.id),['B','C']);
  assert.deepEqual(core.selectCircuit(nodes,rows,{seedIds:['A'],hops:0}).nodes.map(n=>n.id),['A']);
  assert.deepEqual(core.selectCircuit(nodes,rows,{seedIds:['A'],hops:2,direction:'out',group:'output'}).nodes.map(n=>n.id),['C']);
});

test('induced rows exclude outside endpoints, while isolates are preserved',()=>{
  const selected=core.selectCircuit(nodes,rows,{side:'right'});
  assert.deepEqual(selected.nodes.map(n=>n.id),['C','D']);
  assert.deepEqual(selected.rows,[row('C','C',7),row('C','D',2)]);
  assert.equal(core.selectCircuit(nodes,rows,{}).nodes.length,5);
});

test('selection rejects invalid seeds and bounds instead of silently truncating',()=>{
  for(const options of [{maxNodes:2},{hops:4},{hops:-1},{direction:'backward'},{seedIds:['missing']},{maxNodes:0}])assert.throws(()=>core.selectCircuit(nodes,rows,options));
  assert.throws(()=>core.selectCircuit([{id:'A'},{id:'A'}],[],{}));
  assert.throws(()=>core.selectCircuit([{id:720575940639278399}],[],{}));
});

test('missing metadata endpoints become explicit Unknown nodes',()=>{
  const selected=core.selectCircuit([{id:'A',type:'input'}],[row('A','missing')]);
  assert.deepEqual(selected.nodes.map(n=>n.id),['A','missing']);
  const grouped=core.groupConnectivity([{id:'A',type:'input'}],[row('A','missing')]);
  assert.deepEqual(grouped.groups,['input','Unknown']);
  assert.equal(grouped.matrix[0][1],1);
});

test('group matrix uses neuron-pair thresholding and counts pairs independently',()=>{
  const grouped=core.groupConnectivity(nodes,rows,5);
  assert.deepEqual(grouped.groups,['input','local','output','Unknown']);
  assert.deepEqual(grouped.groupNodes,[1,1,2,1]);
  assert.equal(grouped.matrix[0][1],5);
  assert.equal(grouped.matrix[2][2],7);
  assert.equal(grouped.pairMatrix[2][2],1);
  assert.equal(grouped.totalWeight,12);
  assert.equal(grouped.pairCount,2);
  assert.deepEqual(grouped.pairs,[{fromGroup:'input',toGroup:'local',weight:5,pairCount:1},{fromGroup:'output',toGroup:'output',weight:7,pairCount:1}]);
});

test('group labels like prototype keys are safe and compact row arrays work',()=>{
  const grouped=core.groupConnectivity([{id:'a',type:'__proto__'},{id:'b',group:'constructor'}],[['a','b',2]]);
  assert.deepEqual(grouped.groups,['__proto__','constructor']);
  assert.equal(grouped.matrix[0][1],2);
  assert.throws(()=>core.groupConnectivity(Array.from({length:257},(_,i)=>({id:String(i),type:'g'+i})),[]));
});

test('targeted deletion removes node and incident rows, preserving other isolates',()=>{
  const result=core.compareDeletion(nodes,rows,{removeIds:['B'],randomTrials:0});
  assert.equal(result.baseline.metrics.nodeCount,5);
  assert.equal(result.baseline.metrics.totalWeight,19);
  assert.equal(result.targeted.metrics.nodeCount,4);
  assert.equal(result.targeted.metrics.totalWeight,9);
  assert.equal(result.targeted.metrics.pairCount,2);
  assert.equal(result.targeted.metrics.weakComponentCount,3);
  assert.equal(result.delta.totalWeight,-10);
  assert.equal(result.random.trials,0);
  assert.equal(result.random.summary.totalWeight.mean,null);
});

test('uniform same-size controls are reproducible and seed dependent',()=>{
  const options={removeIds:['A','B'],seed:42,randomTrials:12};
  const first=core.compareDeletion(nodes,rows,options);
  assert.deepEqual(core.compareDeletion(nodes,rows,options),first);
  assert.notDeepEqual(core.compareDeletion(nodes,rows,{...options,seed:43}).random.samples,first.random.samples);
  assert.ok(first.random.samples.every(s=>s.removedIds.length===2&&new Set(s.removedIds).size===2&&s.metrics.nodeCount===3));
  assert.ok(first.random.targetedPercentile.totalWeight>=0&&first.random.targetedPercentile.totalWeight<=100);
  assert.ok(first.random.summary.totalWeight.min<=first.random.summary.totalWeight.mean);
  assert.ok(first.random.summary.totalWeight.max>=first.random.summary.totalWeight.mean);
});

test('no deletion controls give identical graphs and tie-midpoint percentile',()=>{
  const result=core.compareDeletion(nodes,rows,{removeIds:[],seed:0,randomTrials:3});
  assert.deepEqual(result.targeted.metrics,result.baseline.metrics);
  assert.equal(result.random.targetedPercentile.totalWeight,50);
  assert.equal(result.delta.largestSCC,0);
});

test('deleting all nodes yields finite empty graph metrics',()=>{
  const result=core.compareDeletion(nodes,rows,{removeIds:nodes.map(n=>n.id),randomTrials:1});
  assert.equal(result.targeted.metrics.nodeCount,0);
  assert.equal(result.targeted.metrics.totalWeight,0);
  assert.equal(result.targeted.metrics.density,0);
  assert.equal(result.random.samples[0].metrics.nodeCount,0);
});

test('deletion validation rejects unknown IDs, unsafe counts and out-of-bounds controls',()=>{
  for(const options of [{removeIds:['missing']},{randomTrials:31},{randomTrials:-1},{randomTrials:1.2},{seed:-1},{seed:4294967296},{threshold:-1}])assert.throws(()=>core.compareDeletion(nodes,rows,options));
  assert.throws(()=>core.compareDeletion(nodes,[row('A','B',9007199254740991),row('A','B',1)],{}));
});

test('analysis does not mutate input nodes, rows, filters or removal IDs',()=>{
  const nn=JSON.parse(JSON.stringify(nodes)),rr=JSON.parse(JSON.stringify(rows));
  const options={group:'output',seedIds:['A'],hops:3},deletion={removeIds:['B'],randomTrials:2};
  const snapshot=JSON.stringify({nn,rr,options,deletion});
  core.selectCircuit(nn,rr,options);core.groupConnectivity(nn,rr,2);core.compareDeletion(nn,rr,deletion);
  assert.equal(JSON.stringify({nn,rr,options,deletion}),snapshot);
});

test('sparse chain selection and deletion avoid recursive traversal',()=>{
  const count=12000,nn=Array.from({length:count},(_,i)=>({id:String(i),type:'chain'})),rr=nn.slice(1).map((n,i)=>row(String(i),n.id));
  assert.deepEqual(core.selectCircuit(nn,rr,{seedIds:['6000'],hops:3,direction:'both'}).nodes.map(n=>n.id),['5997','5998','5999','6000','6001','6002','6003']);
  const result=core.compareDeletion(nn,rr,{removeIds:['6000'],randomTrials:1});
  assert.equal(result.targeted.metrics.nodeCount,count-1);
  assert.equal(result.targeted.metrics.weakComponentCount,2);
});
