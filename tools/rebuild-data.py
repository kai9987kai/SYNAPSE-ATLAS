#!/usr/bin/env python3
"""Rebuild the public snapshot assets. Python 3.10+; standard library only.

By default, read the bundled raw-table ZIP and original SWCs. Use --download
to fetch the pinned upstream files instead. Every input must match SHA-256.
This rebuilds data; it does not rebuild index.html or download whole connectomes.
"""
import argparse
import csv
import hashlib
import io
import json
from pathlib import Path
import urllib.request
import zipfile


parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output', type=Path, default=Path('rebuilt-data'))
parser.add_argument('--download', action='store_true')
args = parser.parse_args()
bundle = Path(__file__).resolve().parents[1] / 'data'
manifest = json.loads((bundle / 'provenance.json').read_text(encoding='utf8'))
out = args.output.resolve()
out.mkdir(parents=True, exist_ok=True)
raw_spec = manifest['datasets'][0]['rawFiles']
generations = {'12781': '1777993123308257', '556329': '1777993410878309'}


def checked(raw, expected, name):
    digest = hashlib.sha256(raw).hexdigest()
    if digest != expected:
        raise ValueError(f'{name}: SHA-256 mismatch: {digest}')
    return raw


def get(url):
    with urllib.request.urlopen(url, timeout=90) as response:
        return response.read()


def write(name, value):
    (out / name).write_text(json.dumps(value, separators=(',', ':')),
                            encoding='utf8')


raw = {}
with zipfile.ZipFile(bundle / 'larval-original-tables.zip') as archive:
    for spec in raw_spec:
        name = spec['file']
        data = get(spec['source']) if args.download else archive.read(name)
        raw[name] = checked(data, spec['sha256'], name)
        (out / name).write_bytes(data)

original_nodes = list(csv.DictReader(io.StringIO(raw['larva-nodes.csv'].decode('utf8'))))
original_edges = list(csv.reader(io.StringIO(raw['larva-edges.csv'].decode('utf8'))))
nodes = [{'id': r[''], 'label': r['name'] or r[''], 'side': r['hemisphere'],
          'type': r['simple_group'], 'color': r['color'], 'pair': r['pair']}
         for r in original_nodes]
edges = []
for a, b, weight in original_edges:
    value = float(weight)
    if value <= 0 or value != int(value):
        raise ValueError('Source contains a nonpositive or fractional weight')
    edges.append([a, b, int(value)])
ids = {n['id'] for n in nodes}
assert len(ids) == len(nodes) == 3013
assert len(edges) == 111243 and sum(e[2] for e in edges) == 353859
assert all(a in ids and b in ids for a, b, w in edges)
source = manifest['datasets'][0]
full = {'id': source['id'], 'name': source['title'], 'nodes': nodes,
        'edges': edges, 'edgeColumns': ['From', 'To', 'Synapses'], 'source': source}
write('larva-full.json', full)
datasets = []
for name, groups in [('larva-mb-core', {'MBONs', 'MBINs'}),
                     ('larva-mb-recurrent', {'MBONs', 'MBINs', 'MB-FBNs', 'FFNs'})]:
    selected_nodes = [n for n in nodes if n['type'] in groups]
    selected_ids = {n['id'] for n in selected_nodes}
    selected_edges = [e for e in edges if e[0] in selected_ids and e[1] in selected_ids]
    original = json.loads((bundle / (name + '.json')).read_text(encoding='utf8'))
    item = {'id': name, 'name': original['provenance']['title'],
            'nodes': selected_nodes,
            'edges': [{'From': a, 'To': b, 'Synapses': w,
                       'Neuropil': 'Not provided', 'Neuro Transmitter': ''}
                      for a, b, w in selected_edges],
            'source': original['provenance']}
    assert len(item['nodes']) == item['source']['nodes']
    assert len(item['edges']) == item['source']['directedEdges']
    assert sum(e['Synapses'] for e in item['edges']) == item['source']['summedWeight']
    datasets.append(item)
    write(name + '.json', item)
    with (out / (name + '.csv')).open('w', newline='', encoding='utf8') as stream:
        writer = csv.DictWriter(stream, ['From', 'To', 'Synapses', 'Neuropil',
                                         'Neuro Transmitter'])
        writer.writeheader()
        writer.writerows(item['edges'])

morphologies = []
for identifier, label, side in [('12781', 'DNge104_R', 'right'),
                                ('556329', 'DNge104_L', 'left')]:
    name = 'malecns-' + identifier + '.swc'
    info = next(s for s in manifest['morphologies']
                if s['source'].endswith('/' + identifier + '.swc'))
    url = info['source'] + '?generation=' + generations[identifier]
    data = get(url) if args.download else (bundle / name).read_bytes()
    checked(data, info['sha256'], name)
    (out / name).write_bytes(data)
    points = []
    for line in data.decode('utf8').splitlines():
        if not line.strip() or line.startswith('#'):
            continue
        a = line.split()
        points.append([int(a[0]), int(a[1]), *map(float, a[2:6]), int(a[6])])
    lookup = {p[0]: p for p in points}
    assert len(points) == len(lookup) == info['nodeCount']
    assert all(p[6] == -1 or p[6] in lookup for p in points)
    morphologies.append({'id': identifier, 'label': label, 'side': side,
                         'units': '8 nm', 'nmPerUnit': 8, 'nodes': points,
                         'sourceUrl': info['source'],
                         'source': {**info, 'gcsGeneration': generations[identifier],
                                    'immutableSourceUrl': url}})

write('atlas-datasets.json', {'schemaVersion': 1, 'accessed': '2026-10-26',
                              'datasets': datasets, 'fullGraph': full,
                              'morphologies': morphologies})
write('provenance.json', manifest)
print('Verified and rebuilt 3 larval graph scopes and 2 MaleCNS skeletons in', out)
print('Raw source hashes, graph counts, graph endpoints and SWC parents passed.')
