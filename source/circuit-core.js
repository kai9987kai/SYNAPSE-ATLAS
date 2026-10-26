/* Synapse Atlas circuit selection and structural-deletion comparisons.
 * Browser: load AtlasCore first. CommonJS: keep atlas-core.js beside this file.
 * No network, DOM, biological dynamics or mutable input state.
 */
(function(root,factory){
  if(typeof module==='object'&&module.exports){
    let core;
    try{core=require('./atlas-core.js');}
    catch(error){if(error.code!=='MODULE_NOT_FOUND')throw error;core=require('../site/source/atlas-core.js');}
    module.exports=factory(core);
  }else root.AtlasCircuitCore=factory(root.AtlasCore);
})(typeof globalThis!=='undefined'?globalThis:this,function(AtlasCore){
  'use strict';
  if(!AtlasCore||typeof AtlasCore.analyzeGraph!=='function')throw Error('AtlasCircuitCore requires AtlasCore.analyzeGraph');
  const METRICS=['nodeCount','pairCount','nonSelfPairCount','selfLoopCount','totalWeight','density','reciprocity','weakComponentCount','largestWeakComponent','largestSCC'];
  function identifier(value){if(typeof value!=='string'&&(typeof value!=='number'||!Number.isSafeInteger(value)))throw Error('Neuron identifiers must be strings or safe integers');const id=String(value).trim();if(!id)throw Error('Neuron identifiers must be nonempty strings');return id;}
  function integer(value,name,min,max){if(!Number.isSafeInteger(value)||value<min||value>max)throw Error(`${name} must be an integer from ${min} to ${max}`);return value;}
  function thresholdValue(value){if(!Number.isFinite(value)||value<0)throw Error('Threshold must be finite and non-negative');return value;}
  function groupName(node){return String(node.type||node.group||'Unknown').trim()||'Unknown';}
  function prepare(nodes,rows){
    if(!Array.isArray(nodes)||!Array.isArray(rows))throw Error('Nodes and rows must be arrays');
    const normalizedNodes=[],byId=new Map();
    for(const source of nodes){
      if(!source||typeof source!=='object'||Array.isArray(source))throw Error('Each node must be a metadata object');
      const id=identifier(source.id);if(byId.has(id))throw Error('Duplicate declared neuron ID '+id);
      const node={...source,id};byId.set(id,node);normalizedNodes.push(node);
    }
    const normalizedRows=[];let total=0;
    for(const source of rows){
      if(!source||typeof source!=='object')throw Error('Each connectivity row must be an object or [from,to,weight] array');
      const row=Array.isArray(source)?{From:source[0],To:source[1],Synapses:source[2],Neuropil:'Not provided'}:{...source};
      row.From=identifier(row.From);row.To=identifier(row.To);row.Synapses=Number(row.Synapses);
      if(!Number.isSafeInteger(row.Synapses)||row.Synapses<=0)throw Error('Synapse weights must be positive safe integers');
      total+=row.Synapses;if(!Number.isSafeInteger(total))throw Error('Total synapse weight exceeds safe integer precision');
      normalizedRows.push(row);
      for(const id of [row.From,row.To])if(!byId.has(id)){
        const node={id,label:id,type:'Unknown',side:'',metadataStatus:'Endpoint absent from declared metadata'};
        byId.set(id,node);normalizedNodes.push(node);
      }
    }
    return {nodes:normalizedNodes,rows:normalizedRows,byId};
  }
  function selectCircuit(nodes,rows,options={}){
    const graph=prepare(nodes,rows),group=String(options.group??'').trim(),side=String(options.side??'').trim(),search=String(options.search??'').trim();
    const direction=options.direction??'both',hops=integer(options.hops??1,'Hops',0,3),maxNodes=integer(options.maxNodes??5000,'Maximum selected nodes',1,100000);
    if(!['both','in','out'].includes(direction))throw Error('Direction must be both, in or out');
    if(options.seedIds!==undefined&&!Array.isArray(options.seedIds))throw Error('seedIds must be an array');
    const seedIds=[...new Set((options.seedIds||[]).map(identifier))];
    for(const id of seedIds)if(!graph.byId.has(id))throw Error('Unknown seed neuron '+id);
    const query=search.toLowerCase(),metadataMatches=graph.nodes.filter(node=>(!group||groupName(node)===group)&&(!side||String(node.side||node.hemisphere||'').toLowerCase()===side.toLowerCase())&&(!query||[node.id,node.label,node.name,node.type,node.group,node.side,node.class].some(value=>String(value??'').toLowerCase().includes(query))));
    let neighborhood=null;
    if(seedIds.length){
      const adjacency=new Map();
      function add(from,to){let targets=adjacency.get(from);if(!targets){targets=new Set();adjacency.set(from,targets);}targets.add(to);}
      for(const row of graph.rows){if(direction!=='in')add(row.From,row.To);if(direction!=='out')add(row.To,row.From);}
      neighborhood=new Set(seedIds);let frontier=seedIds;
      for(let depth=0;depth<hops&&frontier.length;depth++){
        const next=[];for(const id of frontier)for(const adjacent of adjacency.get(id)||[])if(!neighborhood.has(adjacent)){neighborhood.add(adjacent);next.push(adjacent);}
        frontier=next;
      }
    }
    const selectedNodes=metadataMatches.filter(node=>!neighborhood||neighborhood.has(node.id));
    if(selectedNodes.length>maxNodes)throw Error(`Selection has ${selectedNodes.length} neurons; narrow filters to the ${maxNodes}-neuron limit`);
    const selected=new Set(selectedNodes.map(node=>node.id)),selectedRows=graph.rows.filter(row=>selected.has(row.From)&&selected.has(row.To));
    return {nodes:selectedNodes,rows:selectedRows,selection:{group,side,search,seedIds,direction,hops,maxNodes,sourceNodeCount:graph.nodes.length,sourceRowCount:graph.rows.length,matchedNodeCount:metadataMatches.length,nodeCount:selectedNodes.length,rowCount:selectedRows.length,truncated:false,semantics:'Metadata filters are combined with AND. Optional seed neighborhoods traverse the full unthresholded graph before intersection with metadata matches. Returned connectivity is induced by the selected nodes.'}};
  }
  function groupConnectivity(nodes,rows,threshold=1){
    threshold=thresholdValue(threshold);const graph=prepare(nodes,rows),analysis=AtlasCore.analyzeGraph(graph.rows,threshold,graph.nodes.map(node=>node.id));
    const groups=[...new Set(graph.nodes.map(groupName))].sort((a,b)=>a==='Unknown'?(b==='Unknown'?0:1):b==='Unknown'?-1:a<b?-1:a>b?1:0),index=new Map(groups.map((name,i)=>[name,i]));
    if(groups.length>256)throw Error('Group connectivity supports at most 256 metadata groups; select a smaller cohort or broader group labels');
    const matrix=groups.map(()=>groups.map(()=>0)),pairMatrix=groups.map(()=>groups.map(()=>0)),groupNodes=groups.map(()=>0);
    for(const node of graph.nodes)groupNodes[index.get(groupName(node))]++;
    for(const pair of analysis.pairs){const i=index.get(groupName(graph.byId.get(pair.from))),j=index.get(groupName(graph.byId.get(pair.to)));matrix[i][j]+=pair.w;pairMatrix[i][j]++;}
    const pairs=[];for(let i=0;i<groups.length;i++)for(let j=0;j<groups.length;j++)if(pairMatrix[i][j])pairs.push({fromGroup:groups[i],toGroup:groups[j],weight:matrix[i][j],pairCount:pairMatrix[i][j]});
    return {groups,matrix,pairMatrix,groupNodes,pairs,threshold,totalWeight:analysis.metrics.totalWeight,pairCount:analysis.metrics.pairCount,semantics:'Rows are grouped only after aggregation and thresholding of directed neuron pairs. Diagonal group values include connections between distinct neurons of the same group and self loops.'};
  }
  function randomGenerator(seed){return function(){seed=(seed+0x6D2B79F5)>>>0;let t=Math.imul(seed^(seed>>>15),1|seed);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296;};}
  function sample(population,count,random){
    const pool=population.slice();
    for(let i=0;i<count;i++){const pick=i+Math.floor(random()*(pool.length-i));[pool[i],pool[pick]]=[pool[pick],pool[i]];}
    return pool.slice(0,count).sort();
  }
  function percentile(sorted,p){if(!sorted.length)return null;const i=(sorted.length-1)*p,lo=Math.floor(i),fraction=i-lo;return sorted[lo]+(sorted[Math.min(lo+1,sorted.length-1)]-sorted[lo])*fraction;}
  function compareDeletion(nodes,rows,options={}){
    const threshold=thresholdValue(options.threshold??1),randomTrials=integer(options.randomTrials??10,'Random trials',0,30),seed=integer(options.seed??42,'Seed',0,4294967295),graph=prepare(nodes,rows);
    if(options.removeIds!==undefined&&!Array.isArray(options.removeIds))throw Error('removeIds must be an array');
    const removedIds=[...new Set((options.removeIds||[]).map(identifier))].sort();
    for(const id of removedIds)if(!graph.byId.has(id))throw Error('Unknown deletion neuron '+id);
    const population=graph.nodes.map(node=>node.id).sort(),baselineMetrics=AtlasCore.analyzeGraph(graph.rows,threshold,population).metrics;
    function measure(ids){
      if(!ids.length)return {...baselineMetrics};
      const removed=new Set(ids),survivors=population.filter(id=>!removed.has(id)),remaining=graph.rows.filter(row=>!removed.has(row.From)&&!removed.has(row.To));
      return AtlasCore.analyzeGraph(remaining,threshold,survivors).metrics;
    }
    const targetedMetrics=measure(removedIds),random=randomGenerator(seed),samples=[];
    for(let trial=0;trial<randomTrials;trial++){const ids=sample(population,removedIds.length,random);samples.push({removedIds:ids,metrics:measure(ids)});}
    const delta={},summary={},targetedPercentile={};
    for(const key of METRICS){
      delta[key]=targetedMetrics[key]-baselineMetrics[key];
      const values=samples.map(sample=>sample.metrics[key]).sort((a,b)=>a-b),count=values.length;
      summary[key]={min:count?values[0]:null,max:count?values[count-1]:null,mean:count?values.reduce((sum,value)=>sum+value,0)/count:null,p05:percentile(values,.05),p50:percentile(values,.5),p95:percentile(values,.95)};
      targetedPercentile[key]=count?100*(values.filter(value=>value<targetedMetrics[key]).length+.5*values.filter(value=>value===targetedMetrics[key]).length)/count:null;
    }
    return {threshold,seed,removedIds,removedCount:removedIds.length,baseline:{metrics:baselineMetrics},targeted:{metrics:targetedMetrics},delta,random:{trials:randomTrials,samples,summary,targetedPercentile,sampling:'Uniform without replacement within each trial; independently repeated trials; same number of removed neurons as targeted selection.',percentileDefinition:'0–100 empirical percentile with half weight for ties; descriptive only, not a p-value.'},interpretation:'This deletes graph nodes and incident edges from a structural snapshot. It does not simulate neural compensation, physiology, causal interventions or behavioural effects. Random controls are matched only on deletion count, not type, degree, side or other biological covariates.'};
  }
  return Object.freeze({selectCircuit,groupConnectivity,compareDeletion});
});
