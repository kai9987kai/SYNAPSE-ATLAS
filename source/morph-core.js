/* Synapse Atlas physical skeleton measurements. Pure, sparse, iterative; no DOM or network. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.AtlasMorphCore=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const MAX_NODES=200000,MAX_SHELLS=512;
  const RULE='Non-tangent line–sphere intersections; parent→child segment t ∈ (0,1]. Exact-vertex events use this half-open convention; tangencies are excluded.';
  function identifier(value,label){
    if(typeof value==='number'&&(!Number.isSafeInteger(value)||value<=0))throw Error(label+' must be a positive integer identifier');
    const key=String(value);
    if(!/^[1-9]\d*$/.test(key))throw Error(label+' must be a positive integer identifier');
    return key;
  }
  function stats(values){
    if(!values.length)return {count:0,total:0,mean:0,median:0,max:0};
    const sorted=values.slice().sort((a,b)=>a-b);let total=0;
    for(const v of sorted)total+=v;
    const mid=Math.floor(sorted.length/2),median=sorted.length%2?sorted[mid]:(sorted[mid-1]+sorted[mid])/2;
    return {count:sorted.length,total,mean:total/sorted.length,median,max:sorted[sorted.length-1]};
  }
  function analyzeMorphology(cell,options={}){
    if(!cell||!Array.isArray(cell.nodes)||!cell.nodes.length)throw Error('A nonempty node array is required');
    if(cell.nodes.length>MAX_NODES)throw Error('Skeleton exceeds the '+MAX_NODES+' node measurement limit');
    const nmPerUnit=Number(cell.nmPerUnit);
    if(!Number.isFinite(nmPerUnit)||nmPerUnit<=0)throw Error('A finite positive nmPerUnit coordinate unit is required');
    const stepUm=options.shollStepUm===undefined?10:Number(options.shollStepUm);
    if(!Number.isFinite(stepUm)||stepUm<=0)throw Error('Sholl step must be finite and positive');
    const factor=nmPerUnit/1000,n=cell.nodes.length,map=new Map(),nodes=[],children=Array.from({length:n},()=>[]),parent=new Int32Array(n);parent.fill(-1);
    const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
    for(let i=0;i<n;i++){
      const a=cell.nodes[i];if(!Array.isArray(a)||a.length!==7)throw Error('Node '+(i+1)+' requires seven SWC fields');
      const key=identifier(a[0],'Node ID');if(map.has(key))throw Error('Duplicate node ID '+key);
      if(!Number.isSafeInteger(a[1])||a[1]<0)throw Error('SWC type must be a nonnegative integer');
      if(a.slice(2,6).some(v=>typeof v!=='number'||!Number.isFinite(v)))throw Error('Coordinates and radius must be finite numbers');
      if(a[5]<0)throw Error('SWC radius must be nonnegative');
      const xyz=a.slice(2,5).map(v=>v*factor);
      if(xyz.some(v=>!Number.isFinite(v)))throw Error('Physical coordinates must be finite');
      for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],xyz[k]);hi[k]=Math.max(hi[k],xyz[k]);}
      nodes.push({id:a[0],key,parentKey:String(a[6]),xyz});map.set(key,i);
    }
    const roots=[];
    for(let i=0;i<n;i++){
      const node=nodes[i];
      if(node.parentKey==='-1'){roots.push(i);continue;}
      const p=map.get(node.parentKey);if(p===undefined)throw Error('Missing parent '+node.parentKey+' for node '+node.key);
      if(i===p)throw Error('Skeleton contains a parent cycle');parent[i]=p;children[p].push(i);
    }
    const component=new Int32Array(n);component.fill(-1);const distance=new Float64Array(n),edgeLength=new Float64Array(n),queue=roots.slice();
    const rootStats=roots.map((i,k)=>{component[i]=k;return {id:nodes[i].id,nodeCount:0,cableUm:0,maxRootPathUm:0};});
    let cursor=0,cableUm=0,maxPath=0,branchPointCount=0,bifurcationCount=0,terminalCount=0;
    const edgeLengths=[];
    while(cursor<queue.length){
      const i=queue[cursor++],c=component[i],r=rootStats[c];r.nodeCount++;r.cableUm+=edgeLength[i];r.maxRootPathUm=Math.max(r.maxRootPathUm,distance[i]);
      maxPath=Math.max(maxPath,distance[i]);
      if(children[i].length>=2)branchPointCount++;if(children[i].length===2)bifurcationCount++;if(children[i].length===0)terminalCount++;
      for(const child of children[i]){
        const a=nodes[i].xyz,b=nodes[child].xyz,length=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]);
        if(!Number.isFinite(length)||!Number.isFinite(cableUm+length))throw Error('Physical cable lengths must be finite');
        edgeLength[child]=length;edgeLengths.push(length);cableUm+=length;distance[child]=distance[i]+length;component[child]=c;queue.push(child);
      }
    }
    if(cursor!==n)throw Error('Skeleton contains a parent cycle or an unrooted component');
    const branchLengths=[];
    for(let start=0;start<n;start++){
      if(parent[start]!==-1&&children[start].length===1)continue;
      for(let next of children[start]){
        let length=edgeLength[next];
        while(children[next].length===1){next=children[next][0];length+=edgeLength[next];}
        branchLengths.push(length);
      }
    }
    const selectedKey=options.rootId===undefined?nodes[roots[0]].key:String(options.rootId),selectedIndex=map.get(selectedKey);
    if(selectedIndex===undefined||parent[selectedIndex]!==-1)throw Error('Sholl rootId must identify a source root node');
    const selectedComponent=component[selectedIndex],origin=nodes[selectedIndex].xyz;
    let maxRadius=0;
    for(let i=0;i<n;i++)if(component[i]===selectedComponent){const p=nodes[i].xyz;maxRadius=Math.max(maxRadius,Math.hypot(p[0]-origin[0],p[1]-origin[1],p[2]-origin[2]));}
    const shellCount=Math.floor(maxRadius/stepUm+1e-10);
    if(shellCount>MAX_SHELLS)throw Error('Sholl profile exceeds '+MAX_SHELLS+' shells; increase the physical shell step');
    const radiiUm=Array.from({length:shellCount},(_,i)=>(i+1)*stepUm),crossings=new Array(shellCount).fill(0);
    // A positive discriminant is required. A zero discriminant is a tangent contact,
    // not a crossing. Stable quadratic roots avoid cancellation on long segments.
    for(let i=0;i<n;i++){
      const p=parent[i];if(p===-1||component[i]!==selectedComponent||edgeLength[i]===0)continue;
      const a=nodes[p].xyz,b=nodes[i].xyz,ax=a[0]-origin[0],ay=a[1]-origin[1],az=a[2]-origin[2],dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2];
      const A=dx*dx+dy*dy+dz*dz,B=2*(ax*dx+ay*dy+az*dz),offset=ax*ax+ay*ay+az*az;
      for(let j=0;j<radiiUm.length;j++){
        const radius=radiiUm[j],C=offset-radius*radius,discriminant=B*B-4*A*C;
        const tolerance=64*Number.EPSILON*(Math.abs(B*B)+Math.abs(4*A*C)+Number.MIN_VALUE);
        if(discriminant<=tolerance)continue;
        const sqrt=Math.sqrt(discriminant),q=-.5*(B+(B>=0?sqrt:-sqrt));
        const t1=q/A,t2=q===0?(-B+sqrt)/(2*A):C/q;
        // Root error grows when a short segment is far from the reference root.
        // Scale the endpoint tolerance by that conditioning, so an exact shared
        // vertex is assigned to its incoming edge even on long sampled chains.
        const endpointTolerance=Math.min(1e-6,128*Number.EPSILON*Math.max(1,(Math.sqrt(offset)+Math.hypot(b[0]-origin[0],b[1]-origin[1],b[2]-origin[2])+radius)/Math.sqrt(A)));
        if(t1>endpointTolerance&&t1<=1+endpointTolerance)crossings[j]++;
        if(t2>endpointTolerance&&t2<=1+endpointTolerance)crossings[j]++;
      }
    }
    const edgeStats=stats(edgeLengths),branchStats=stats(branchLengths),selected=rootStats[selectedComponent];
    return {
      summary:{nodeCount:n,segmentCount:n-roots.length,rootCount:roots.length,componentCount:roots.length,cableUm,branchPointCount,bifurcationCount,terminalCount,maxRootPathUm:maxPath,
        boundsUm:{min:lo,max:hi,extent:hi.map((v,k)=>v-lo[k])},
        edgeLengthsUm:{count:edgeStats.count,mean:edgeStats.mean,median:edgeStats.median,max:edgeStats.max},
        branchSegmentsUm:{count:branchStats.count,total:branchStats.total,mean:branchStats.mean,median:branchStats.median,max:branchStats.max}},
      roots:rootStats,
      profile:{rootId:nodes[selectedIndex].id,centerUm:origin.slice(),radiiUm,crossings,scope:'selected rooted component',stepUm,nodeCount:selected.nodeCount,cableUm:selected.cableUm,intersectionRule:RULE},
      units:{coordinateUnitNm:nmPerUnit,nmPerUnit,physical:'µm'}
    };
  }
  return Object.freeze({analyzeMorphology});
});
