/* Synapse Atlas sparse graph and validated import core. No DOM or network access. */
(function(root,factory){
  if(typeof module==='object'&&module.exports) module.exports=factory();
  else root.AtlasCore=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const MAX_TEXT=25*1024*1024,MAX_ROWS=150000,MAX_SWC_NODES=100000;
  function inputText(text){
    if(typeof text!=='string') throw Error('Expected text input');
    if(text.length>MAX_TEXT) throw Error('Input exceeds the 25 MB text limit');
    return text.replace(/^\uFEFF/,'');
  }
  function csvRecords(text){
    text=inputText(text);
    const records=[]; let row=[],cell='',mode='plain',atStart=true;
    function finishCell(){row.push(cell);cell='';mode='plain';atStart=true;}
    function finishRow(){finishCell();if(row.some(value=>value.trim()!=='')){records.push(row);if(records.length>MAX_ROWS+1)throw Error('CSV exceeds the 150,000-row limit');}row=[];}
    for(let i=0;i<text.length;i++){
      const c=text[i];
      if(mode==='quoted'){
        if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else mode='closed';}
        else cell+=c;
        continue;
      }
      if(c===','){finishCell();continue;}
      if(c==='\r'||c==='\n'){if(c==='\r'&&text[i+1]==='\n')i++;finishRow();continue;}
      if(mode==='closed'){
        if(c===' '||c==='\t')continue;
        throw Error('Unexpected character after a closing CSV quote');
      }
      if(c==='"'){
        if(!atStart)throw Error('CSV quote must begin a field');
        mode='quoted';atStart=false;continue;
      }
      cell+=c;atStart=false;
    }
    if(mode==='quoted')throw Error('Unclosed CSV quote');
    if(cell!==''||row.length||mode==='closed')finishRow();
    return records;
  }
  function parseConnectivityCSV(text){
    const records=csvRecords(text);
    if(records.length<2)throw Error('CSV requires a header and at least one connectivity row');
    const names=records.shift().map(value=>value.trim());
    const normalized=names.map(value=>value.toLowerCase().replace(/[^a-z0-9]/g,''));
    if(new Set(normalized).size!==normalized.length)throw Error('Duplicate CSV column names');
    const column=aliases=>normalized.findIndex(name=>aliases.includes(name));
    const from=column(['from','source','prerootid','preid','presynapticid']),to=column(['to','target','postrootid','postid','postsynapticid']),weight=column(['synapses','synapsecount','syncount','weight','count']),region=column(['neuropil','region']),nt=column(['neurotransmitter','nttype','nt']);
    if(from<0||to<0||weight<0)throw Error('Missing From / To / Synapses (or source / target / weight) columns');
    return records.map((values,index)=>{
      if(values.length!==names.length)throw Error(`CSV row ${index+2} has ${values.length} fields; expected ${names.length}`);
      const From=values[from].trim(),To=values[to].trim(),rawWeight=values[weight].trim(),Synapses=Number(rawWeight);
      if(!From||!To)throw Error(`CSV row ${index+2} has an empty neuron identifier`);
      if(!rawWeight||!Number.isSafeInteger(Synapses)||Synapses<=0)throw Error(`CSV row ${index+2} requires a positive safe integer synapse count`);
      return {From,To,Neuropil:region<0?'unspecified':values[region].trim()||'unspecified',Synapses,'Neuro Transmitter':nt<0?'':values[nt].trim()};
    });
  }
  function parseSWC(text){
    const lines=inputText(text).split(/\r?\n/),nodes=[],byId=new Map();
    const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
    for(let index=0;index<lines.length;index++){
      const line=lines[index].split('#',1)[0].trim();
      if(!line)continue;
      const values=line.split(/\s+/).map(Number);
      if(values.length!==7||!values.every(Number.isFinite))throw Error(`SWC line ${index+1} requires exactly seven finite numeric fields`);
      const [id,type,x,y,z,r,parent]=values;
      if(!Number.isSafeInteger(id)||id<=0||!Number.isSafeInteger(type)||type<0||!Number.isSafeInteger(parent)||(parent!==-1&&parent<=0))throw Error(`Invalid SWC node, type or parent ID on line ${index+1}`);
      if(r<0)throw Error(`Negative SWC radius on line ${index+1}`);
      if(byId.has(id))throw Error(`Duplicate SWC node ID ${id}`);
      const node={id,type,x,y,z,r,parent};nodes.push(node);byId.set(id,node);
      [x,y,z].forEach((value,axis)=>{min[axis]=Math.min(min[axis],value);max[axis]=Math.max(max[axis],value);});
      if(nodes.length>MAX_SWC_NODES)throw Error('SWC exceeds the 100,000-node limit');
    }
    if(!nodes.length)throw Error('SWC contains no nodes');
    const rootIds=nodes.filter(node=>node.parent===-1).map(node=>node.id);
    if(!rootIds.length)throw Error('SWC requires at least one root with parent -1');
    for(const node of nodes)if(node.parent!==-1&&!byId.has(node.parent))throw Error(`SWC node ${node.id} refers to missing parent ${node.parent}`);
    // Every SWC node has at most one parent. Iterative parent walking is linear.
    const finished=new Set();
    for(const node of nodes){
      if(finished.has(node.id))continue;
      const chain=[],visiting=new Set();let current=node;
      while(current&&!finished.has(current.id)){
        if(visiting.has(current.id))throw Error(`SWC contains a parent cycle at node ${current.id}`);
        visiting.add(current.id);chain.push(current.id);
        current=current.parent===-1?null:byId.get(current.parent);
      }
      for(const id of chain)finished.add(id);
    }
    return {nodes,rootIds,segmentCount:nodes.length-rootIds.length,bounds:{min,max}};
  }
  function graphData(rows,threshold,includeNodes){
    if(!Number.isFinite(threshold)||threshold<0)throw Error('Graph threshold must be finite and non-negative');
    const nodeSet=new Set(),bySource=new Map();
    for(const row of rows){
      const from=String(row.From??'').trim(),to=String(row.To??'').trim(),w=Number(row.Synapses);
      if(!from||!to||!Number.isSafeInteger(w)||w<=0)throw Error('Graph rows require nonempty IDs and positive safe integer synapse counts');
      nodeSet.add(from);nodeSet.add(to);
      let targets=bySource.get(from);if(!targets){targets=new Map();bySource.set(from,targets);}
      let pair=targets.get(to);if(!pair){pair={from,to,w:0,rows:0};targets.set(to,pair);}
      pair.w+=w;pair.rows++;
      if(!Number.isSafeInteger(pair.w))throw Error('Aggregated synapse count exceeds safe integer precision');
    }
    for(const id of includeNodes||[])if(String(id).trim())nodeSet.add(String(id).trim());
    const nodes=[...nodeSet],pairs=[];
    for(const targets of bySource.values())for(const pair of targets.values())if(pair.w>=threshold)pairs.push(pair);
    return {nodes,pairs};
  }
  function analyzeGraph(rows,threshold=1,includeNodes=[]){
    const {nodes,pairs}=graphData(rows,threshold,includeNodes),index=new Map(nodes.map((id,i)=>[id,i])),n=nodes.length;
    const outgoing=Array.from({length:n},()=>[]),incoming=Array.from({length:n},()=>[]),undirected=Array.from({length:n},()=>[]);
    const rankings=nodes.map(id=>({id,inDegree:0,outDegree:0,inStrength:0,outStrength:0,totalStrength:0}));
    const activePairs=new Map();let totalWeight=0,nonSelfPairCount=0,selfLoopCount=0;
    for(const pair of pairs){
      const a=index.get(pair.from),b=index.get(pair.to);
      outgoing[a].push(b);incoming[b].push(a);undirected[a].push(b);if(a!==b)undirected[b].push(a);
      rankings[a].outDegree++;rankings[a].outStrength+=pair.w;rankings[b].inDegree++;rankings[b].inStrength+=pair.w;totalWeight+=pair.w;
      if(!Number.isSafeInteger(totalWeight))throw Error('Total synapse count exceeds safe integer precision');
      if(a===b)selfLoopCount++;else nonSelfPairCount++;
      let targets=activePairs.get(a);if(!targets){targets=new Set();activePairs.set(a,targets);}targets.add(b);
    }
    let reciprocal=0;for(const pair of pairs){const a=index.get(pair.from),b=index.get(pair.to);if(a!==b&&activePairs.get(b)?.has(a))reciprocal++;}
    for(const ranking of rankings)ranking.totalStrength=ranking.inStrength+ranking.outStrength;
    rankings.sort((a,b)=>b.totalStrength-a.totalStrength||a.id.localeCompare(b.id));
    const weakComponents=[],weakVisited=new Uint8Array(n);
    for(let start=0;start<n;start++){
      if(weakVisited[start])continue;
      const component=[],stack=[start];weakVisited[start]=1;
      while(stack.length){const current=stack.pop();component.push(nodes[current]);for(const next of undirected[current])if(!weakVisited[next]){weakVisited[next]=1;stack.push(next);}}
      weakComponents.push(component);
    }
    // Kosaraju with explicit stacks avoids recursion overflow on large skeleton-like graphs.
    const seen=new Uint8Array(n),order=[];
    for(let start=0;start<n;start++){
      if(seen[start])continue;
      const stack=[[start,0]];seen[start]=1;
      while(stack.length){const frame=stack[stack.length-1],current=frame[0];if(frame[1]<outgoing[current].length){const next=outgoing[current][frame[1]++];if(!seen[next]){seen[next]=1;stack.push([next,0]);}}else{order.push(current);stack.pop();}}
    }
    const strongComponents=[],assigned=new Uint8Array(n);
    for(let k=order.length-1;k>=0;k--){
      const start=order[k];if(assigned[start])continue;
      const component=[],stack=[start];assigned[start]=1;
      while(stack.length){const current=stack.pop();component.push(nodes[current]);for(const next of incoming[current])if(!assigned[next]){assigned[next]=1;stack.push(next);}}
      strongComponents.push(component);
    }
    let largestWeakComponent=0,largestSCC=0;
    for(const c of weakComponents)largestWeakComponent=Math.max(largestWeakComponent,c.length);
    for(const c of strongComponents)largestSCC=Math.max(largestSCC,c.length);
    return {nodes,pairs,metrics:{nodeCount:n,pairCount:pairs.length,nonSelfPairCount,selfLoopCount,totalWeight,density:n>1?nonSelfPairCount/(n*(n-1)):0,reciprocity:nonSelfPairCount?reciprocal/nonSelfPairCount:0,weakComponentCount:weakComponents.length,largestWeakComponent,largestSCC},rankings,weakComponents,strongComponents};
  }
  function shortestPath(rows,source,target,threshold=1){
    const {nodes,pairs}=graphData(rows,threshold,[]),nodeSet=new Set(nodes);source=String(source);target=String(target);
    if(!nodeSet.has(source)||!nodeSet.has(target))return null;
    if(source===target)return[source];
    const adjacency=new Map();for(const pair of pairs){let targets=adjacency.get(pair.from);if(!targets){targets=[];adjacency.set(pair.from,targets);}targets.push(pair.to);}
    const queue=[source],parent=new Map([[source,null]]);let cursor=0;
    while(cursor<queue.length){const current=queue[cursor++];for(const next of adjacency.get(current)||[]){if(parent.has(next))continue;parent.set(next,current);if(next===target){const path=[target];let step=current;while(step!==null){path.push(step);step=parent.get(step);}return path.reverse();}queue.push(next);}}
    return null;
  }
  return Object.freeze({parseConnectivityCSV,parseSWC,analyzeGraph,shortestPath});
});
