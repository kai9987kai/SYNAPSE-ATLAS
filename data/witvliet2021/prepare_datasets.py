"""Normalize pinned NemaNode factual chemical-connectivity records; no upstream code copied."""
from __future__ import annotations
import json,pathlib,hashlib,collections,re,argparse,urllib.request
ROOT=pathlib.Path(__file__).resolve().parent
COMMIT='6b7ca03f6d68c4ea1af3c120d1a47681edc74a90'
REPO='https://github.com/zhenlab-ltri/NemaNode'
NAMESPACE='celegans-name/witvliet2021'
ACCESSED='2026-10-27'

def load(name):return json.loads((ROOT/'originals'/name).read_text(encoding='utf-8-sig'))
def side(name):
    m=re.fullmatch(r'BWM-[DV]([LR])\d+',name)
    return m.group(1) if m else name[-1] if name.endswith(('L','R')) else ''
def partner(name,all_ids):
    if name.endswith(('L','R')):candidate=name[:-1]+{'L':'R','R':'L'}[name[-1]]
    elif re.fullmatch(r'BWM-[DV][LR]\d+',name):candidate=name[:5]+{'L':'R','R':'L'}[name[5]]+name[6:]
    else:return ''
    return candidate if candidate in all_ids else ''
def node_type(codes):
    names={'s':'Sensory','i':'Interneuron','m':'Motor','n':'Modulatory','b':'Muscle'}
    return ' + '.join(names[c] for c in codes if c in names) or 'Other / unclassified'

def build():
    cells={n['name']:n for n in load('neurons.json')}
    specs={d['id']:d for d in load('datasets.json')}
    receipts=load('../source-files.json')['files']
    byfile={r['file'].split('/')[-1]:r for r in receipts}
    graphs=[];validation=[]
    for i in range(1,9):
        key=f'witvliet_2020_{i}';raw=load(key+'.json');spec=specs[key]
        chem=[r for r in raw if r['typ']==0]
        pairs=collections.defaultdict(int);unique_sites=set();observations=0
        for r in chem:
            assert isinstance(r['pre'],str) and r['pre'] and isinstance(r['post'],str) and r['post']
            assert isinstance(r['syn'],list) and r['syn'] and all(isinstance(w,int) and w>0 for w in r['syn'])
            weight=sum(r['syn']);pairs[(r['pre'],r['post'])]+=weight
            observations+=weight;unique_sites.update(r.get('ids',[]))
        ids=sorted({n for edge in pairs for n in edge})
        nodes=[]
        for id in ids:
            n=cells.get(id,{})
            nodes.append({'id':id,'label':id,'type':node_type(n.get('typ','')),'side':side(id),'pair':partner(id,set(ids)),'cellClass':n.get('classes',''),'sourceTypeCode':n.get('typ',''),'sourceNeurotransmitterCode':n.get('nt',''),'isEmbryonic':bool(n['emb']) if 'emb'in n else None,'identityNamespace':NAMESPACE})
        edges=[[a,b,w] for (a,b),w in sorted(pairs.items())]
        stage=re.search(r'\(([^)]+)\)',spec['name']).group(1)
        count_neuronal=sum(bool(cells.get(id,{}).get('typ','')) and 'b' not in cells[id]['typ'] for id in ids)
        source={'title':f'Witvliet et al. developmental brain, specimen {i}',
          'release':'NemaNode pinned source '+COMMIT[:12], 'commit':COMMIT,'url':REPO+'/tree/'+COMMIT,
          'publication':'https://doi.org/10.1038/s41586-021-03778-8','portal':'https://www.nemanode.org/',
          'license':'NemaNode source representation: GPL-3.0; preserve source notice and attribution',
          'licenseUrl':REPO+'/blob/'+COMMIT+'/LICENSE','licenseFile':'originals/NemaNode-LICENSE.txt',
          'attribution':'Witvliet, Mulcahy, Mitchell et al., Nature 596, 257–261 (2021); NemaNode, Zhen and Samuel laboratories',
          'species':'Caenorhabditis elegans','sex':'hermaphrodite','specimen':f'Dataset{i}','specimenId':key,
          'ageHours':spec['time'],'stage':stage,'region':'head / brain: nerve ring, ventral ganglion and reconstructed anterior neuropil',
          'identityNamespace':NAMESPACE,'comparisonGroup':'witvliet2021-chemical-head','edgeType':'chemical','nodeKind':'cells','includesNonNeuronal':count_neuronal<len(ids),
          'nodeUniversePolicy':'Observed endpoints of retained chemical connections only; this is not a complete reconstructed-cell inventory and does not declare unobserved catalog cells as isolates.',
          'weightDefinition':'Sum of source chemical synapse occurrence counts for each directed pre/post pair. A source annotation ID can contribute to several post-synaptic pairs; summed edge weights are not counts of unique source annotation IDs.',
          'limits':'Cross-sectional specimens, not longitudinal imaging of one animal. Four L1 specimens, one L2, one L3 and two adults; approximate ages from source metadata. Absent/unobserved cells and edges are not proven biological absence. Chemical contacts include muscles and other non-neuronal cells. Partial gap-junction annotations are excluded. No neural activity, efficacy, causal development or whole-302-neuron coverage is established.',
          'rawFiles':[byfile[key+'.json'],byfile['neurons.json'],byfile['datasets.json']],
          'accessed':ACCESSED,'uniqueSourceAnnotationIds':len(unique_sites),'excludedGapJunctionRows':len(raw)-len(chem)}
        graph={'id':'celegans-witvliet-'+str(i),'name':f'C. elegans · specimen {i} · {stage} / ~{spec["time"]} h','identityNamespace':NAMESPACE,'nodes':nodes,'edges':edges,'source':source}
        graphs.append(graph)
        validation.append({'id':graph['id'],'stage':stage,'ageHours':spec['time'],'nodeCount':len(nodes),'neuronalEndpointCount':count_neuronal,'nonNeuronalOrUnclassifiedEndpointCount':len(nodes)-count_neuronal,'directedPairCount':len(edges),'totalWeight':sum(r[2] for r in edges),'uniqueSourceAnnotationIds':len(unique_sites),'chemicalRawRows':len(chem),'excludedElectricalRawRows':len(raw)-len(chem),'invalidEndpoints':0,'nonpositiveWeights':0,'duplicateDirectedPairs':0,'selfLoops':sum(a==b for a,b,w in edges)})
    manifest={'schema':'synapse-atlas.witvliet-sources.v1','accessed':ACCESSED,'repository':REPO,'commit':COMMIT,'license':'GPL-3.0 source representation','licenseScope':'This notice applies to the selected NemaNode source records and their transformed factual table representation. No upstream application code is copied. It is not a blanket license for other Synapse Atlas assets.','identityNamespace':NAMESPACE,'files':receipts,'publication':'https://doi.org/10.1038/s41586-021-03778-8','authorAnalysisRepository':'https://github.com/dwitvliet/nature2021/tree/0646af9d25896ae660f97d462eab2d67282f5625','specimens':validation,'notes':['Four L1 specimens (0,5,8,16h), one L2(23h), one L3(27h), two adults(~50h) according to pinned author/lab metadata.','The Zenodo 5637219 CC BY 4.0 license concerns deposited 3D models and is not claimed for these connectivity tables.','Original analysis repository has no root license; chosen raw data representation is the official lab NemaNode repository carrying GPL-3.0.','Node universes contain observed chemical endpoints, including non-neuronal cells. Presence in one graph and absence in another need not mean the cell was born/lost.','Different ages are different individuals. Descriptive differences combine age, individual variation, reconstruction and annotation differences.']}
    return {'schemaVersion':1,'accessed':ACCESSED,'graphs':graphs,'manifest':manifest,'validation':validation}

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--output',type=pathlib.Path,default=ROOT/'new-datasets.json');parser.add_argument('--download',action='store_true');args=parser.parse_args()
    manifest=load('../source-files.json')
    for r in manifest['files']:
        p=ROOT/r['file'];p.parent.mkdir(parents=True,exist_ok=True)
        if args.download:p.write_bytes(urllib.request.urlopen(urllib.request.Request(r['url'],headers={'User-Agent':'SynapseAtlas-research'}),timeout=45).read())
        assert p.exists() and hashlib.sha256(p.read_bytes()).hexdigest()==r['sha256'],'Source checksum mismatch: '+r['file']
    result=build();args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    (ROOT/'provenance.json').write_text(json.dumps(result['manifest'],ensure_ascii=False,indent=2),encoding='utf-8')
    (ROOT/'validation.json').write_text(json.dumps(result['validation'],indent=2),encoding='utf-8')
    print(json.dumps({'output':str(args.output),'bytes':args.output.stat().st_size,'validation':result['validation']}))
if __name__=='__main__':main()
