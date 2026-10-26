#!/usr/bin/env python3
"""Fetch eight public VFB source SWCs, checking captured SHA-256 values.

Usage: python download_linked_originals.py --output downloaded-originals
Place larval-linked-provenance.json beside this script or pass --manifest.
Uses only Python's standard library. Existing matching outputs are retained.
"""
import argparse,hashlib,json,pathlib,urllib.request
parser=argparse.ArgumentParser()
parser.add_argument('--manifest',type=pathlib.Path,default=pathlib.Path(__file__).resolve().with_name('larval-linked-provenance.json'))
parser.add_argument('--output',type=pathlib.Path,default=pathlib.Path('downloaded-originals'))
args=parser.parse_args();data=json.loads(args.manifest.read_text(encoding='utf-8-sig'))
args.output.mkdir(parents=True,exist_ok=True)
for entry in data['sourceFiles']:
    target=args.output/entry['localFile']
    if target.exists() and hashlib.sha256(target.read_bytes()).hexdigest()==entry['sha256']:
        print('Verified existing',target.name);continue
    req=urllib.request.Request(entry['sourceUrl'],headers={'User-Agent':'Mozilla/5.0 SynapseAtlas/3.0 research data reproducibility'})
    with urllib.request.urlopen(req,timeout=60) as response: raw=response.read()
    actual=hashlib.sha256(raw).hexdigest()
    if actual!=entry['sha256']:raise ValueError('Upstream snapshot changed: '+entry['localFile']+' expected '+entry['sha256']+' got '+actual)
    target.write_bytes(raw)
    print('Downloaded and verified',target.name,len(raw))
