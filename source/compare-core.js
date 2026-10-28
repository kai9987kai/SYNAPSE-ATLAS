/* Synapse Atlas comparison tools: measured graphs, explicit identity scope.
 * Load AtlasCore first in a browser. No DOM, network, dynamics or input mutation.
 */
(function(root,factory){
  if(typeof module==='object'&&module.exports){
    let core;
    try{core=require('./atlas-core.js');}
    catch(error){if(error.code!=='MODULE_NOT_FOUND')throw error;core=require('../site/source/atlas-core.js');}
    module.exports=factory(core);
  }else root.AtlasCompareCore=factory(root.AtlasCore);
})(typeof globalThis!=='undefined'?globalThis:this,function(AtlasCore){
  'use strict';
  if(!AtlasCore||typeof AtlasCore.analyzeGraph!=='function')throw Error('AtlasCompareCore requires AtlasCore.analyzeGraph');
  const lexical=(a,b)=>a<b?-1:a>b?1:0;
  const pairKey=(a,b)=>JSON.stringify([a,b]);
  function identifier(value){
    if(typeof value!=='string'&&(typeof value!=='number'||!Number.isSafeInteger(value)))throw Error('Identifiers must be exact strings or safe integers');
    const id=String(value).trim();if(!id)throw Error('Identifiers must not be empty');return id;
  }
  function thresholdValue(options){
    const value=options.threshold??options.minThreshold??1;
    if(options.threshold!==undefined&&options.minThreshold!==undefined&&options.threshold!==options.minThreshold)throw Error('Specify one matching threshold value');
    if(typeof value!=='number'||!Number.isFinite(value)||value<0)throw Error('Threshold must be finite and non-negative');
    return value;
  }
  function integer(value,name,min,max){if(!Number.isSafeInteger(value)||value<min||value>max)throw Error(`${name} must be an integer from ${min} to ${max}`);return value;}
  function groupOf(node){return String(node.type||node.group||'Unknown').trim()||'Unknown';}
  function prepare(nodes,rows){
    if(!Array.isArray(nodes)||!Array.isArray(rows))throw Error('Nodes and connectivity rows must be arrays');
    const normalizedNodes=[],byId=new Map(),undeclaredEndpointIds=new Set(),normalizedRows=[];let total=0;
    for(const source of nodes){
      if(!source||typeof source!=='object'||Array.isArray(source))throw Error('Each neuron must be a metadata object');
      const id=identifier(source.id);if(byId.has(id))throw Error('Duplicate neuron ID '+id);
      const node={...source,id};byId.set(id,node);normalizedNodes.push(node);
    }
    for(const source of rows){
      if(!source||typeof source!=='object')throw Error('Each row must be an object or compact array');
      const row=Array.isArray(source)?{From:source[0],To:source[1],Synapses:source[2]}:{...source};
      row.From=identifier(row.From);row.To=identifier(row.To);row.Synapses=Number(row.Synapses);
      if(!Number.isSafeInteger(row.Synapses)||row.Synapses<=0)throw Error('Synapse counts must be positive safe integers');
      total+=row.Synapses;if(!Number.isSafeInteger(total))throw Error('Total synapse count exceeds safe integer precision');
      normalizedRows.push(row);
      for(const id of [row.From,row.To])if(!byId.has(id)){
        const node={id,label:id,type:'Unknown',side:'',metadataStatus:'Endpoint absent from declared metadata'};
        byId.set(id,node);normalizedNodes.push(node);undeclaredEndpointIds.add(id);
      }
    }
    return {nodes:normalizedNodes,byId,rows:normalizedRows,undeclaredEndpointIds:[...undeclaredEndpointIds].sort(lexical)};
  }
  function analyzed(graph,threshold){return AtlasCore.analyzeGraph(graph.rows,threshold,graph.nodes.map(n=>n.id));}
  function dataset(value){if(!value||typeof value!=='object')throw Error('Expected a dataset object');return prepare(value.nodes,value.edges??value.rows);}
  function sharedScope(graph,analysis,common){
    const retained=analysis.pairs.filter(p=>common.has(p.from)&&common.has(p.to));
    let sharedWeight=0;for(const p of retained)sharedWeight+=p.w;
    return {retained,report:{inputNodeCount:graph.nodes.length,inputRowCount:graph.rows.length,retainedPairCount:analysis.pairs.length,sharedPairCount:retained.length,excludedPairCount:analysis.pairs.length-retained.length,sharedWeight,excludedWeight:analysis.metrics.totalWeight-sharedWeight,undeclaredEndpointIds:graph.undeclaredEndpointIds.slice()}};
  }
  function compareGraphs(datasetA,datasetB,options={}){
    const threshold=thresholdValue(options),a=dataset(datasetA),b=dataset(datasetB),setA=new Set(a.byId.keys()),setB=new Set(b.byId.keys());
    const common=[...setA].filter(id=>setB.has(id)).sort(lexical),onlyA=[...setA].filter(id=>!setB.has(id)).sort(lexical),onlyB=[...setB].filter(id=>!setA.has(id)).sort(lexical),commonSet=new Set(common);
    const aa=analyzed(a,threshold),bb=analyzed(b,threshold),scopeA=sharedScope(a,aa,commonSet),scopeB=sharedScope(b,bb,commonSet);
    const pairsA=new Map(scopeA.retained.map(p=>[pairKey(p.from,p.to),p])),pairsB=new Map(scopeB.retained.map(p=>[pairKey(p.from,p.to),p])),keys=new Set([...pairsA.keys(),...pairsB.keys()]);
    const totalA=scopeA.report.sharedWeight,totalB=scopeB.report.sharedWeight,scale=Math.max(totalA,totalB,1),changedEdges=[];
    let retained=0,gained=0,lost=0,minScaled=0,maxScaled=0,js=0;
    for(const key of keys){
      const pa=pairsA.get(key),pb=pairsB.get(key),weightA=pa?.w||0,weightB=pb?.w||0;
      const from=pa?.from??pb.from,to=pa?.to??pb.to,shareA=totalA?weightA/totalA:0,shareB=totalB?weightB/totalB:0,middle=(shareA+shareB)/2;
      const status=weightA&&weightB?'retained':weightB?'gained':'lost';
      if(status==='retained')retained++;else if(status==='gained')gained++;else lost++;
      minScaled+=Math.min(weightA,weightB)/scale;maxScaled+=Math.max(weightA,weightB)/scale;
      if(shareA)js+=.5*shareA*Math.log2(shareA/middle);
      if(shareB)js+=.5*shareB*Math.log2(shareB/middle);
      if(weightA!==weightB||shareA!==shareB)changedEdges.push({from,to,weightA,weightB,delta:weightB-weightA,shareA,shareB,shareDelta:shareB-shareA,status});
    }
    changedEdges.sort((x,y)=>Math.abs(y.shareDelta)-Math.abs(x.shareDelta)||Math.abs(y.delta)-Math.abs(x.delta)||lexical(x.from,y.from)||lexical(x.to,y.to));
    const distance=totalA&&totalB?Math.sqrt(Math.max(0,Math.min(1,js))):totalA||totalB?1:0;
    return {
      threshold,
      nodeScope:{common,onlyA,onlyB,commonCount:common.length,onlyACount:onlyA.length,onlyBCount:onlyB.length},
      scopeA:scopeA.report,scopeB:scopeB.report,
      edgeCounts:{retained,gained,lost,union:keys.size},
      metrics:{presenceJaccard:keys.size?retained/keys.size:1,weightedJaccard:maxScaled?minScaled/maxScaled:1,normalizedWeightJSDistance:distance},
      changedEdges,
      status:!common.length?'no_shared_nodes':!keys.size?'no_retained_shared_edges':'ok',
      identityPolicy:'Only exact string IDs are aligned. The caller must establish that their biological identity namespace is comparable; IDs are never inferred from labels or coordinates.',
      distanceConvention:'Square-root Jensen-Shannon divergence with base-2 logs after normalizing each shared-node weight distribution. Both empty distributions have distance 0; exactly one empty distribution has distance 1. Empty support Jaccards are 1 and must be interpreted with status.',
      semantics:'All comparison metrics use the induced graph on exact shared node IDs, including self loops. Directed rows are pair-aggregated before thresholding. Excluded endpoints and their retained weights are reported separately. Gained and lost mean B-only and A-only observed support, not longitudinal changes in one animal or proof of maturation.'
    };
  }
  function sideOf(node){const s=String(node.side||node.hemisphere||'').toLowerCase();return s==='l'||s==='left'?'L':s==='r'||s==='right'?'R':null;}
  function bilateralAudit(nodes,rows,options={}){
    const threshold=thresholdValue(options),graph=prepare(nodes,rows),analysis=analyzed(graph,threshold),partners=new Map(),unpairedIds=[],missingTargets=[],invalidPairs=[];
    const rawPartners=new Map();
    for(const n of graph.nodes){
      if(n.pair===undefined||n.pair===null||String(n.pair).trim()===''){unpairedIds.push(n.id);continue;}
      try{rawPartners.set(n.id,identifier(n.pair));}catch{invalidPairs.push({id:n.id,pairId:null,reason:'Unsafe or malformed partner identifier'});}
    }
    for(const n of graph.nodes){
      if(!rawPartners.has(n.id))continue;
      const p=rawPartners.get(n.id),other=graph.byId.get(p);
      if(!other){missingTargets.push({id:n.id,pairId:p});continue;}
      if(p===n.id){invalidPairs.push({id:n.id,pairId:p,reason:'Self-pair metadata is not a bilateral correspondence'});continue;}
      if(rawPartners.get(p)!==n.id){invalidPairs.push({id:n.id,pairId:p,reason:'Partner metadata is not reciprocal'});continue;}
      if(sideOf(n)&&sideOf(other)&&sideOf(n)===sideOf(other)){invalidPairs.push({id:n.id,pairId:p,reason:'Paired neurons have incompatible same-side labels'});continue;}
      partners.set(n.id,p);
    }
    const active=new Map(analysis.pairs.map(p=>[pairKey(p.from,p.to),p])),visited=new Set(),orbits=[];
    let eligiblePairCount=0,eligibleWeight=0;
    for(const p of analysis.pairs){
      if(!partners.has(p.from)||!partners.has(p.to))continue;
      eligiblePairCount++;eligibleWeight+=p.w;
      const key=pairKey(p.from,p.to),mf=partners.get(p.from),mt=partners.get(p.to),mirrorKey=pairKey(mf,mt);
      if(visited.has(key)||visited.has(mirrorKey))continue;visited.add(key);visited.add(mirrorKey);
      let from=p.from,to=p.to,mirrorFrom=mf,mirrorTo=mt,orientation='canonical';
      const sourceSide=sideOf(graph.byId.get(from)),mirrorSourceSide=sideOf(graph.byId.get(mirrorFrom)),targetSide=sideOf(graph.byId.get(to)),mirrorTargetSide=sideOf(graph.byId.get(mirrorTo));
      let swap=false;
      if(sourceSide&&mirrorSourceSide&&sourceSide!==mirrorSourceSide){orientation='source-left';swap=sourceSide==='R';}
      else if(targetSide&&mirrorTargetSide&&targetSide!==mirrorTargetSide){orientation='target-left';swap=targetSide==='R';}
      else swap=lexical(key,mirrorKey)>0;
      if(swap){[from,mirrorFrom]=[mirrorFrom,from];[to,mirrorTo]=[mirrorTo,to];}
      const leftWeight=active.get(pairKey(from,to))?.w||0,rightWeight=active.get(pairKey(mirrorFrom,mirrorTo))?.w||0,totalWeight=leftWeight+rightWeight,absoluteDifference=Math.abs(leftWeight-rightWeight);
      const sFrom=sideOf(graph.byId.get(from)),sTo=sideOf(graph.byId.get(to));
      const connectionType=from===to?'self-loop':partners.get(from)===to?'homolog-contralateral':sFrom&&sTo?(sFrom===sTo?'ipsilateral':'contralateral'):'side-unclassified';
      orbits.push({from,to,mirrorFrom,mirrorTo,leftWeight,rightWeight,asymmetry:totalWeight?(leftWeight-rightWeight)/totalWeight:0,absoluteDifference,totalWeight,connectionType,orientation});
    }
    orbits.sort((x,y)=>y.absoluteDifference-x.absoluteDifference||y.totalWeight-x.totalWeight||lexical(x.from,y.from)||lexical(x.to,y.to));
    let totalWeight=0,difference=0,matchedOrbitCount=0,oneSidedOrbitCount=0;
    for(const o of orbits){totalWeight+=o.totalWeight;difference+=o.absoluteDifference;if(o.leftWeight&&o.rightWeight)matchedOrbitCount++;else oneSidedOrbitCount++;}
    return {
      threshold,
      metadata:{pairedNodeCount:partners.size,pairCount:partners.size/2,unpairedIds:unpairedIds.sort(lexical),missingTargets:missingTargets.sort((a,b)=>lexical(a.id,b.id)),invalidPairs:invalidPairs.sort((a,b)=>lexical(a.id,b.id))},
      scope:{inputNodeCount:graph.nodes.length,retainedPairCount:analysis.pairs.length,eligiblePairCount,eligibleWeight,excludedPairCount:analysis.pairs.length-eligiblePairCount,excludedWeight:analysis.metrics.totalWeight-eligibleWeight,undeclaredEndpointIds:graph.undeclaredEndpointIds.slice()},
      orbits,
      summary:{orbitCount:orbits.length,matchedOrbitCount,oneSidedOrbitCount,totalWeight,weightedAsymmetry:totalWeight?difference/totalWeight:0},
      semantics:'Only distinct reciprocal source pair IDs qualify; known same-side pair conflicts are excluded. Each directed edge/mirror orbit is counted once, including self-loop and contralateral orbits. Signed asymmetry is (leftWeight-rightWeight)/(leftWeight+rightWeight); weighted summary is sum absolute differences / sum weights. Left is the source-left orientation when available, then target-left, otherwise a stable lexicographic canonical orientation. Counts are raw source observations after neuron-pair thresholding, not completeness-adjusted or causal evidence.'
    };
  }
  function fingerprintNeighbors(nodes,rows,nodeId,options={}){
    const threshold=thresholdValue(options),direction=options.direction??'both',limit=integer(options.limit??10,'Limit',0,1000),sameGroup=options.sameGroup??false;
    if(!['both','in','out'].includes(direction))throw Error('Direction must be both, in or out');
    if(typeof sameGroup!=='boolean')throw Error('sameGroup must be a boolean');
    const graph=prepare(nodes,rows),id=identifier(nodeId),queryNode=graph.byId.get(id);if(!queryNode)throw Error('Unknown query neuron '+id);
    const analysis=analyzed(graph,threshold),vectors=new Map(graph.nodes.map(n=>[n.id,new Map()]));
    for(const p of analysis.pairs){
      if(direction!=='in')vectors.get(p.from).set(pairKey('out',p.to),p.w);
      if(direction!=='out')vectors.get(p.to).set(pairKey('in',p.from),p.w);
    }
    const norms=new Map();for(const [key,vector] of vectors){let squared=0;for(const w of vector.values())squared+=w*w;norms.set(key,Math.sqrt(squared));}
    const queryVector=vectors.get(id),queryNorm=norms.get(id),group=groupOf(queryNode),neighbors=[];
    for(const n of graph.nodes){
      if(n.id===id||(sameGroup&&groupOf(n)!==group))continue;
      const vector=vectors.get(n.id),norm=norms.get(n.id);let dot=0,sharedFeatureCount=0;
      const small=queryVector.size<=vector.size?queryVector:vector,other=small===queryVector?vector:queryVector;
      for(const [key,w] of small){const v=other.get(key);if(v!==undefined){dot+=w*v;sharedFeatureCount++;}}
      const similarity=queryNorm&&norm?Math.max(0,Math.min(1,dot/(queryNorm*norm))):0;
      neighbors.push({id:n.id,label:String(n.label||n.name||n.id),group:groupOf(n),similarity,sharedFeatureCount,featureCount:vector.size,norm});
    }
    neighbors.sort((a,b)=>b.similarity-a.similarity||lexical(a.id,b.id));
    return {
      query:{id,label:String(queryNode.label||queryNode.name||id),group,featureCount:queryVector.size,norm:queryNorm},threshold,direction,sameGroup,candidateCount:neighbors.length,neighbors:neighbors.slice(0,limit),
      status:queryNorm?'ok':'query_has_no_retained_connections',
      semantics:'Sparse weighted cosine compares exact partner IDs. Incoming and outgoing features occupy separate dimensions; self loops are retained. Rows aggregate before pair thresholding. The query neuron is excluded; optional group restriction uses source metadata. Zero vectors have similarity 0. Ties use exact ID order. Similarity describes retained wiring fingerprints and does not establish cell-type identity, homology, activity or causal function.'
    };
  }
  return Object.freeze({compareGraphs,bilateralAudit,fingerprintNeighbors});
});
